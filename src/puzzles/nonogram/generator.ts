import { createRng } from '../../lib/rng'
import type { Difficulty } from '../../types'

const GRID_SIZE: Record<Difficulty, number> = { easy: 5, medium: 8, hard: 10 }
const FILL_RATE: Record<Difficulty, number> = { easy: 0.55, medium: 0.5, hard: 0.45 }

function computeClues(line: number[]): number[] {
  const clues: number[] = []
  let run = 0
  for (const v of line) {
    if (v === 1) {
      run++
    } else if (run > 0) {
      clues.push(run)
      run = 0
    }
  }
  if (run > 0) clues.push(run)
  return clues.length > 0 ? clues : [0]
}

export interface NonogramData {
  solution: number[][]
  rowClues: number[][]
  colClues: number[][]
  size: number
}

export function generateNonogram(seed: number, difficulty: Difficulty): NonogramData {
  const rng = createRng(seed)
  const size = GRID_SIZE[difficulty]
  const fillRate = FILL_RATE[difficulty]

  const solution: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (rng() < fillRate ? 1 : 0)),
  )

  const rowClues = solution.map((row) => computeClues(row))
  const colClues = Array.from({ length: size }, (_, c) =>
    computeClues(solution.map((row) => row[c])),
  )

  return { solution, rowClues, colClues, size }
}

export function checkNonogramWin(
  grid: number[][],
  rowClues: number[][],
  colClues: number[][],
): boolean {
  for (let r = 0; r < grid.length; r++) {
    if (!cluesMatch(grid[r], rowClues[r])) return false
  }
  for (let c = 0; c < grid[0].length; c++) {
    if (!cluesMatch(grid.map((row) => row[c]), colClues[c])) return false
  }
  return true
}

function cluesMatch(line: number[], expected: number[]): boolean {
  return (
    JSON.stringify(computeClues(line.map((v) => (v === 1 ? 1 : 0)))) ===
    JSON.stringify(expected)
  )
}
