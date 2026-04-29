import { createRng } from '../../lib/rng'
import type { Difficulty } from '../../types'

const GRID_SIZE = 5
const SCRAMBLE_MOVES: Record<Difficulty, number> = { easy: 8, medium: 15, hard: 24 }

function toggle(grid: number[][], row: number, col: number): void {
  const neighbors: [number, number][] = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]
  for (const [r, c] of neighbors) {
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      grid[r][c] ^= 1
    }
  }
}

export interface LightsOutData {
  grid: number[][]
  size: number
}

export function generateLightsOut(seed: number, difficulty: Difficulty): LightsOutData {
  const rng = createRng(seed)
  // Start from solved state (all off) and make random moves — always solvable
  const grid: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  const moves = SCRAMBLE_MOVES[difficulty]

  for (let i = 0; i < moves; i++) {
    const r = Math.floor(rng() * GRID_SIZE)
    const c = Math.floor(rng() * GRID_SIZE)
    toggle(grid, r, c)
  }

  return { grid, size: GRID_SIZE }
}

export { toggle }
