import { Minus, Plus, Users } from 'lucide-react'
import {
  INITIAL_PASSENGER_COUNTS,
  PASSENGER_TYPES,
  normalizePassengerCounts,
} from '../../utils/passengers'

function CounterRow({ typeKey, label, sublabel, value, min, max, onChange, disabled }) {
  const atMin = value <= min
  const atMax = value >= max

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-[10px] text-[var(--text-secondary)]">{sublabel}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || atMin}
          onClick={() => onChange(typeKey, value - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-primary)] transition hover:border-[var(--accent)]/40 disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center font-mono text-sm font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || atMax}
          onClick={() => onChange(typeKey, value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-primary)] transition hover:border-[var(--accent)]/40 disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function PassengerSelector({ counts, onChange, error, disabled }) {
  const c = normalizePassengerCounts(counts)
  const total = c.ADT + c.CHLD + c.INF

  const handleChange = (key, next) => {
    const type = PASSENGER_TYPES.find((t) => t.key === key)
    const clamped = Math.min(type.max, Math.max(type.min, next))

    let nextCounts = { ...c, [key]: clamped }

    if (nextCounts.INF > nextCounts.ADT) {
      nextCounts = { ...nextCounts, INF: nextCounts.ADT }
    }

    const nextTotal = nextCounts.ADT + nextCounts.CHLD + nextCounts.INF
    if (nextTotal > 9) return

    onChange(nextCounts)
  }

  const infMax = Math.min(PASSENGER_TYPES.find((t) => t.key === 'INF').max, c.ADT)

  return (
    <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
          <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
          Passengers
        </div>
        <span className="font-mono text-[10px] text-[var(--accent)]">
          ADT:{c.ADT} · CHLD:{c.CHLD} · INF:{c.INF}
        </span>
      </div>

      {PASSENGER_TYPES.map((type) => (
        <CounterRow
          key={type.key}
          typeKey={type.key}
          label={type.label}
          sublabel={type.sublabel}
          value={c[type.key]}
          min={type.min}
          max={type.key === 'INF' ? infMax : type.max}
          onChange={handleChange}
          disabled={disabled}
        />
      ))}

      <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
        {total} traveler{total !== 1 ? 's' : ''} selected · max 9
      </p>

      {error && <p className="mt-2 text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

export { INITIAL_PASSENGER_COUNTS }
