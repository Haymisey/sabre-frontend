import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plane, Search, User, Baby, Users, Minus, Plus } from 'lucide-react'
import { validatePassengerCounts } from '../../utils/passengers'

const DEFAULT_CABINS = [
  { value: 1, label: 'Economy' },
  { value: 2, label: 'Business' },
  { value: 3, label: 'First Class' },
]

function CounterRow({ icon: Icon, label, sublabel, value, min, max, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/50">
          <Icon className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">{sublabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange(value - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] transition hover:border-[var(--accent)]/40 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center font-mono text-lg font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] transition hover:border-[var(--accent)]/40 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function PassengerPicker({ data, handlers }) {
  const defaults = data?.defaultPassengers || {}
  const [ADT, setADT] = useState(defaults.ADT ?? 1)
  const [CHD, setCHD] = useState(defaults.CHD ?? defaults.CHLD ?? 0)
  const [INF, setINF] = useState(defaults.INF ?? 0)
  const [cabinClass, setCabinClass] = useState(data?.cabinClass ?? 1)
  const [error, setError] = useState(null)

  const cabins = data?.cabinOptions?.length ? data.cabinOptions : DEFAULT_CABINS
  const origin = data?.origin
  const destination = data?.destination
  const date = data?.date
  const tripType = data?.tripType

  const total = ADT + CHD + INF
  const infMax = ADT

  const adjust = (key, next) => {
    const clamped = Math.max(0, next)
    if (key === 'ADT') {
      const newAdt = Math.max(1, Math.min(9, clamped))
      setADT(newAdt)
      if (INF > newAdt) setINF(newAdt)
      if (ADT + CHD + INF > 9) return
    }
    if (key === 'CHD') {
      if (ADT + Math.min(8, clamped) + INF > 9) return
      setCHD(Math.min(8, clamped))
    }
    if (key === 'INF') {
      setINF(Math.min(infMax, clamped))
    }
    setError(null)
  }

  const handleConfirm = () => {
    const passengers = { ADT, CHD, INF }
    const err = validatePassengerCounts({ ADT, CHLD: CHD, INF })
    if (err) {
      setError(err)
      return
    }
    handlers?.onPassengerConfirm?.(passengers, cabinClass, {
      origin,
      destination,
      date,
      tripType,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-card)]"
    >
      {(origin || destination || date) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-dark)]/40 px-4 py-3">
          <Plane className="h-4 w-4 text-[var(--accent)]" />
          {origin && destination && (
            <span className="font-mono text-lg font-bold text-[var(--text-primary)]">
              {origin}{' '}
              <span className="text-[var(--accent)]">→</span> {destination}
            </span>
          )}
          {date && (
            <span className="rounded-lg bg-[var(--primary)]/40 px-2.5 py-1 text-xs text-[var(--accent-light)]">
              {date}
            </span>
          )}
          {tripType != null && (
            <span className="text-[10px] text-[var(--text-secondary)]">
              {tripType === 1 ? 'Round trip' : 'One way'}
            </span>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Step 1 — Confirm travelers & cabin before we search (count is locked for this booking).
        </p>

        <div className="divide-y divide-[var(--border)]">
          <CounterRow
            icon={User}
            label="Adults"
            sublabel="12+ years"
            value={ADT}
            min={1}
            max={9}
            onChange={(v) => adjust('ADT', v)}
            disabled={handlers?.isLoading}
          />
          <CounterRow
            icon={Users}
            label="Children"
            sublabel="2–11 years"
            value={CHD}
            min={0}
            max={8}
            onChange={(v) => adjust('CHD', v)}
            disabled={handlers?.isLoading}
          />
          <CounterRow
            icon={Baby}
            label="Infants"
            sublabel="Under 2 · max 1 per adult"
            value={INF}
            min={0}
            max={infMax}
            onChange={(v) => adjust('INF', v)}
            disabled={handlers?.isLoading}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Cabin class
          </label>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(Number(e.target.value))}
            disabled={handlers?.isLoading}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
          >
            {cabins.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-2 text-center text-[10px] text-[var(--text-secondary)]">
          {total} traveler{total !== 1 ? 's' : ''} · max 9
        </p>

        {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={handlers?.isLoading}
          onClick={handleConfirm}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--bg-dark)] transition hover:bg-[var(--accent-light)] disabled:opacity-40"
        >
          <Search className="h-4 w-4" />
          Search flights
        </motion.button>
      </div>
    </motion.div>
  )
}
