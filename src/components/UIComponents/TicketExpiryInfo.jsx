import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import {
  formatSabreDateTime,
  formatTimeToTicketRemaining,
  timeToTicketToMs,
} from '../../utils/formatters'

/**
 * Hold / ticketing expiry from booking_itinerary ui_data.
 * - timeToTicket: live countdown snapshot from Sabre (ticket before hold drops)
 * - expireDate: deadline string (usually MM/DD/YYYY, aligns with arrival when ticketed)
 */
export default function TicketExpiryInfo({ expireDate, timeToTicket }) {
  const deadlineMs = useMemo(() => timeToTicketToMs(timeToTicket), [timeToTicket])
  const [remainingMs, setRemainingMs] = useState(deadlineMs)

  useEffect(() => {
    if (deadlineMs == null) return undefined
    const endsAt = Date.now() + deadlineMs
    setRemainingMs(Math.max(0, endsAt - Date.now()))

    const id = setInterval(() => {
      const left = endsAt - Date.now()
      setRemainingMs(left > 0 ? left : 0)
    }, 1000)

    return () => clearInterval(id)
  }, [deadlineMs])

  const formattedDeadline = formatSabreDateTime(expireDate)
  const hasCountdown = deadlineMs != null
  const hasDeadline = Boolean(expireDate)

  if (!hasCountdown && !hasDeadline) return null

  const isUrgent = hasCountdown && remainingMs > 0 && remainingMs < 24 * 3600 * 1000

  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border px-2.5 py-2 sm:items-end ${
        isUrgent
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-transparent bg-transparent'
      }`}
    >
      {hasCountdown && (
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span className="text-[var(--text-secondary)]">
            Ticket within:{' '}
            <span
              className={`font-mono font-semibold ${
                remainingMs <= 0 ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-[var(--text-primary)]'
              }`}
            >
              {formatTimeToTicketRemaining(remainingMs)}
            </span>
          </span>
        </div>
      )}

      {hasDeadline && (
        <p className="text-[10px] leading-snug text-[var(--text-secondary)] sm:text-right">
          {hasCountdown ? 'Deadline' : 'Expires'}:{' '}
          <span className="font-medium text-[var(--text-primary)]">{formattedDeadline}</span>
        </p>
      )}
    </div>
  )
}
