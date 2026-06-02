import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatTime, formatDate, getStatusBg } from '../../utils/formatters'

function FlightRow({ flight }) {
  const dep = flight.departure
  const arr = flight.arrival

  const showDelay = (point) => {
    if (!point?.actual || !point?.scheduled) return false
    return new Date(point.actual) > new Date(point.scheduled)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-lg font-bold text-[var(--accent)]">
          {flight.flightNumber}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBg(flight.overallStatus)}`}
        >
          {flight.overallStatus}
        </span>
      </div>
      <p className="mb-4 text-xs text-[var(--text-secondary)]">{formatDate(flight.date)}</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Departure
          </p>
          <p className="font-mono text-xl font-bold">{dep?.airport}</p>
          <p className="text-xs text-[var(--text-secondary)]">{dep?.city}</p>
          <p className="mt-2 text-lg font-semibold">
            {formatTime(dep?.actual || dep?.estimated || dep?.scheduled)}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            Sched. {formatTime(dep?.scheduled)}
          </p>
          {showDelay(dep) && (
            <p className="text-[10px] text-amber-400">Delayed</p>
          )}
          <div className="mt-2 flex gap-2 text-[10px] text-[var(--text-secondary)]">
            {dep?.terminal && <span>T{dep.terminal}</span>}
            {dep?.gate && <span>Gate {dep.gate}</span>}
          </div>
          <span
            className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] ${getStatusBg(dep?.status)}`}
          >
            {dep?.status}
          </span>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Arrival
          </p>
          <p className="font-mono text-xl font-bold">{arr?.airport}</p>
          <p className="text-xs text-[var(--text-secondary)]">{arr?.city}</p>
          <p className="mt-2 text-lg font-semibold">
            {formatTime(arr?.actual || arr?.estimated || arr?.scheduled)}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            Sched. {formatTime(arr?.scheduled)}
          </p>
          {showDelay(arr) && (
            <p className="text-[10px] text-amber-400">Delayed</p>
          )}
          <div className="mt-2 flex justify-end gap-2 text-[10px] text-[var(--text-secondary)]">
            {arr?.terminal && <span>T{arr.terminal}</span>}
            {arr?.gate && <span>Gate {arr.gate}</span>}
          </div>
          <span
            className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] ${getStatusBg(arr?.status)}`}
          >
            {arr?.status}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

const PERIOD_LABELS = { yesterday: 'Yesterday', today: 'Today', tomorrow: 'Tomorrow' }

export default function FlightStatusCard({ data }) {
  const periods = Array.isArray(data) ? data : []
  const [activePeriod, setActivePeriod] = useState(
    () => periods.findIndex((p) => p.period === 'today') ?? 0,
  )

  const current = periods[activePeriod] || periods[0]

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        {periods.map((p, i) => (
          <button
            key={p.period}
            type="button"
            onClick={() => setActivePeriod(i)}
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              activePeriod === i
                ? 'bg-[var(--primary)] text-[var(--accent-light)]'
                : 'border border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            {PERIOD_LABELS[p.period] || p.period}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {current?.flights?.map((f, i) => (
          <FlightRow key={`${f.flightNumber}-${i}`} flight={f} />
        ))}
      </div>
    </div>
  )
}
