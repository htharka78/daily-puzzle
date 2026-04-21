import { useState, useEffect, useCallback, useReducer } from 'react'
import SudokuBoard from './components/SudokuBoard'
import NumberPad from './components/NumberPad'
import { useDailyPuzzle, type Difficulty, type PuzzleData } from './hooks/useDailyPuzzle'

// ── Progress persistence ─────────────────────────────────────────────────────

function progressKey(date: string, difficulty: Difficulty) {
  return `progress:${date}:${difficulty}`
}

function saveProgress(date: string, difficulty: Difficulty, board: number[][], status: string) {
  try {
    localStorage.setItem(progressKey(date, difficulty), JSON.stringify({ board, status }))
  } catch { /* storage full — ignore */ }
}

function loadProgress(date: string, difficulty: Difficulty): { board: number[][]; status: string } | null {
  try {
    const raw = localStorage.getItem(progressKey(date, difficulty))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── Game State ───────────────────────────────────────────────────────────────

interface GameState {
  board: number[][]
  given: boolean[][]
  errors: boolean[][]
  selected: [number, number] | null
  status: 'playing' | 'won'
  checkRequested: boolean
}

type Action =
  | { type: 'INIT'; puzzle: PuzzleData }
  | { type: 'SELECT'; row: number; col: number }
  | { type: 'INPUT'; value: number }
  | { type: 'ERASE' }
  | { type: 'CHECK'; solution: number[][] }
  | { type: 'RESET'; puzzle: PuzzleData }
  | { type: 'MOVE'; dr: number; dc: number }

function initState(puzzle: PuzzleData): GameState {
  const given = puzzle.puzzle.map((row) => row.map((v) => v !== 0))
  const saved = loadProgress(puzzle.date, puzzle.difficulty)
  const board = saved?.board ?? puzzle.puzzle.map((row) => [...row])
  const status = (saved?.status === 'won' ? 'won' : 'playing') as 'playing' | 'won'
  const errors = Array.from({ length: 9 }, () => Array(9).fill(false))
  return { board, given, errors, selected: null, status, checkRequested: false }
}

function computeErrors(board: number[][], solution: number[][], given: boolean[][]): boolean[][] {
  return board.map((row, r) =>
    row.map((v, c) => !given[r][c] && v !== 0 && v !== solution[r][c]),
  )
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT':
      return initState(action.puzzle)
    case 'RESET':
      return initState(action.puzzle)
    case 'SELECT':
      return { ...state, selected: [action.row, action.col] }
    case 'MOVE': {
      if (!state.selected) return state
      const [r, c] = state.selected
      return {
        ...state,
        selected: [
          Math.min(8, Math.max(0, r + action.dr)),
          Math.min(8, Math.max(0, c + action.dc)),
        ],
      }
    }
    case 'INPUT': {
      if (!state.selected || state.status === 'won') return state
      const [r, c] = state.selected
      if (state.given[r][c]) return state
      const board = state.board.map((row) => [...row])
      board[r][c] = action.value
      return { ...state, board, errors: Array.from({ length: 9 }, () => Array(9).fill(false)) }
    }
    case 'ERASE': {
      if (!state.selected || state.status === 'won') return state
      const [r, c] = state.selected
      if (state.given[r][c]) return state
      const board = state.board.map((row) => [...row])
      board[r][c] = 0
      return { ...state, board }
    }
    case 'CHECK': {
      const errors = computeErrors(state.board, action.solution, state.given)
      const hasErrors = errors.some((row) => row.some(Boolean))
      const complete = state.board.every((row) => row.every((v) => v !== 0))
      if (!hasErrors && complete) {
        return { ...state, errors, status: 'won', checkRequested: true }
      }
      return { ...state, errors, checkRequested: true }
    }
    default:
      return state
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const { puzzle } = useDailyPuzzle(difficulty)
  const [state, dispatch] = useReducer(reducer, puzzle, initState)

  // Re-init when puzzle changes (difficulty switch or new day)
  useEffect(() => {
    dispatch({ type: 'INIT', puzzle })
  }, [puzzle])

  // Persist progress whenever board changes
  useEffect(() => {
    saveProgress(puzzle.date, puzzle.difficulty, state.board, state.status)
  }, [puzzle.date, puzzle.difficulty, state.board, state.status])

  // Keyboard input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key >= '1' && e.key <= '9') {
        dispatch({ type: 'INPUT', value: parseInt(e.key) })
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        dispatch({ type: 'ERASE' })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); dispatch({ type: 'MOVE', dr: -1, dc: 0 })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault(); dispatch({ type: 'MOVE', dr: 1, dc: 0 })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault(); dispatch({ type: 'MOVE', dr: 0, dc: -1 })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault(); dispatch({ type: 'MOVE', dr: 0, dc: 1 })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleCheck = useCallback(() => {
    dispatch({ type: 'CHECK', solution: puzzle.solution })
  }, [puzzle.solution])

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET', puzzle })
  }, [puzzle])

  const hasErrors = state.errors.some((row) => row.some(Boolean))
  const isComplete = state.board.every((row) => row.every((v) => v !== 0))

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">⬛</div>
        <div className="header-title">Daily Puzzle</div>
        <div className="header-date">{formatDate(puzzle.date)}</div>
      </header>

      <div className="difficulty-tabs" role="tablist" aria-label="Difficulty">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={difficulty === d}
            className={`diff-tab ${difficulty === d ? 'diff-tab-active' : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <main className="main">
        <SudokuBoard
          board={state.board}
          given={state.given}
          errors={state.errors}
          selected={state.selected}
          onSelect={(r, c) => dispatch({ type: 'SELECT', row: r, col: c })}
        />

        <NumberPad
          onNumber={(n) => dispatch({ type: 'INPUT', value: n })}
          onErase={() => dispatch({ type: 'ERASE' })}
          disabled={state.status === 'won'}
        />

        <div className="action-bar">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCheck}
            disabled={!isComplete || state.status === 'won'}
          >
            Check
          </button>
        </div>

        {state.checkRequested && hasErrors && (
          <p className="feedback feedback-error">Some cells are incorrect — keep going!</p>
        )}
      </main>

      {state.status === 'won' && (
        <div className="win-overlay" role="dialog" aria-modal="true" aria-label="Puzzle solved">
          <div className="win-card">
            <div className="win-icon">🎉</div>
            <h2 className="win-title">Puzzle Solved!</h2>
            <p className="win-sub">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · {formatDate(puzzle.date)}
            </p>
            <p className="win-message">Come back tomorrow for a new challenge.</p>
            <button className="btn btn-primary" onClick={handleReset}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
