interface Props {
  board: number[][]
  given: boolean[][]
  errors: boolean[][]
  selected: [number, number] | null
  onSelect: (row: number, col: number) => void
}

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function isHighlighted(
  row: number,
  col: number,
  selected: [number, number] | null,
): boolean {
  if (!selected) return false
  const [sr, sc] = selected
  return (
    row === sr ||
    col === sc ||
    (Math.floor(row / 3) === Math.floor(sr / 3) &&
      Math.floor(col / 3) === Math.floor(sc / 3))
  )
}

function isSameValue(
  row: number,
  col: number,
  board: number[][],
  selected: [number, number] | null,
): boolean {
  if (!selected) return false
  const [sr, sc] = selected
  const val = board[sr][sc]
  return val !== 0 && board[row][col] === val
}

export default function SudokuBoard({ board, given, errors, selected, onSelect }: Props) {
  return (
    <div className="sudoku-grid" role="grid" aria-label="Sudoku board">
      {board.map((row, r) =>
        row.map((val, c) => {
          const isSelected = selected?.[0] === r && selected?.[1] === c
          const isGiven = given[r][c]
          const hasError = errors[r][c]
          const highlighted = isHighlighted(r, c, selected)
          const sameVal = isSameValue(r, c, board, selected)

          const cellClass = classNames(
            'sudoku-cell',
            isSelected && 'cell-selected',
            !isSelected && sameVal && 'cell-same-value',
            !isSelected && highlighted && 'cell-highlighted',
            isGiven && 'cell-given',
            hasError && 'cell-error',
            // Box borders
            c % 3 === 0 && c !== 0 && 'border-left-bold',
            r % 3 === 0 && r !== 0 && 'border-top-bold',
          )

          return (
            <button
              key={`${r}-${c}`}
              className={cellClass}
              onClick={() => onSelect(r, c)}
              aria-label={`Row ${r + 1}, Column ${c + 1}${val ? `, value ${val}` : ', empty'}${isGiven ? ', given' : ''}`}
              aria-selected={isSelected}
              role="gridcell"
            >
              {val !== 0 ? val : ''}
            </button>
          )
        }),
      )}
    </div>
  )
}
