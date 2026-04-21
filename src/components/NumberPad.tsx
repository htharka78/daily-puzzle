interface Props {
  onNumber: (n: number) => void
  onErase: () => void
  disabled: boolean
}

export default function NumberPad({ onNumber, onErase, disabled }: Props) {
  return (
    <div className="number-pad" aria-label="Number input pad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          className="pad-btn"
          onClick={() => onNumber(n)}
          disabled={disabled}
          aria-label={`Enter ${n}`}
        >
          {n}
        </button>
      ))}
      <button
        className="pad-btn pad-erase"
        onClick={onErase}
        disabled={disabled}
        aria-label="Erase cell"
      >
        ⌫
      </button>
    </div>
  )
}
