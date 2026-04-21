import { useMemo } from 'react'
import { generateSudoku, dateToSeed, type Difficulty, type PuzzleResult } from '../lib/puzzleGenerator'

export type { Difficulty }

export interface PuzzleData extends PuzzleResult {
  date: string
  difficulty: Difficulty
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function useDailyPuzzle(difficulty: Difficulty): {
  puzzle: PuzzleData
  loading: false
  error: null
} {
  const date = todayString()

  const puzzle = useMemo<PuzzleData>(() => {
    const seed = dateToSeed(date)
    const { puzzle, solution } = generateSudoku(seed, difficulty)
    return { date, difficulty, puzzle, solution }
  }, [date, difficulty])

  return { puzzle, loading: false, error: null }
}
