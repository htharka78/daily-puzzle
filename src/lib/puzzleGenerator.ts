import { createRng, shuffle } from './rng'
import type { Difficulty } from '../types'

export type { Difficulty }
export { dateToSeed } from './rng'

export interface PuzzleResult {
  puzzle: number[][]
  solution: number[][]
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  if (board[row].includes(num)) return false
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false
  return true
}

function fillBoard(board: number[][], rng: () => number): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num
            if (fillBoard(board, rng)) return true
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

const CELLS_TO_REMOVE: Record<Difficulty, number> = { easy: 30, medium: 45, hard: 55 }

export function generateSudoku(seed: number, difficulty: Difficulty): PuzzleResult {
  const rng = createRng(seed)
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillBoard(board, rng)
  const solution = board.map((row) => [...row])
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
    rng,
  )
  const puzzle = board.map((row) => [...row])
  for (const [r, c] of positions.slice(0, CELLS_TO_REMOVE[difficulty])) puzzle[r][c] = 0
  return { puzzle, solution }
}
