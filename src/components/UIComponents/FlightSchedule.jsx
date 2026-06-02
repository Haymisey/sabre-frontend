import { motion } from 'framer-motion'
import { Plane } from 'lucide-react'
import { formatTime, formatDate, formatDuration } from '../../utils/formatters'

export default function FlightSchedule({ data }) {
  const schedules = Array.isArray(data) ? data : []

  return (
    <div className="w-full space-y-2">
      {schedules.map((item) => (
        <motion.div
          key={item.schedule_id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold">
                {item.from} → {item.to}
              </span>
              {(item.stops === 0 || !item.isConnection) && (
                <span className="rounded-full bg-[var(--primary)]/50 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                  DIRECT
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold">{formatTime(item.departure)}</span>
              <Plane className="h-3 w-3 rotate-90 text-[var(--accent)]" />
              <span className="font-bold">{formatTime(item.arrival)}</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {item.fromCity} → {item.toCity} · {formatDate(item.departure)}
          </p>
          {item.segments?.[0] && (
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              {item.segments.map((s) => s.flightNumber).join(' · ')} ·{' '}
              {formatDuration(
                item.segments.reduce((_, s) => s.duration, '') ||
                  item.totalDuration,
              )}
            </p>
          )}
          {item.operatingDays && (
            <p className="mt-2 text-[10px] text-[var(--accent)]">
              Operates: {item.operatingDays}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}
