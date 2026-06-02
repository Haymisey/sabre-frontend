import { motion } from 'framer-motion'
import { CheckCircle2, Armchair, Plane, User } from 'lucide-react'
import { formatDate, formatTime } from '../../utils/formatters'

function SeatRow({ item }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-dark)]/40 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Armchair className="h-4 w-4 text-[var(--accent)]" />
        <span className="font-mono font-bold text-[var(--text-primary)]">{item.seatCode}</span>
      </div>
      <div className="text-right text-xs text-[var(--text-secondary)]">
        {item.origin && item.destination && (
          <p>
            {item.origin} → {item.destination}
          </p>
        )}
        {item.departure && (
          <p>
            {formatDate(item.departure)} · {formatTime(item.departure)}
          </p>
        )}
        {item.passengerIndex != null && <p>Passenger {item.passengerIndex}</p>}
      </div>
    </div>
  )
}

export default function SeatSelected({ data }) {
  if (!data) return null

  const selectedSeats = Array.isArray(data.selectedSeats)
    ? data.selectedSeats
    : data.seatCode || data.seat
      ? [
          {
            seatCode: data.seatCode || data.seat?.seatCode,
            origin: data.origin,
            destination: data.destination,
            departure: data.departure,
            passengerIndex: data.passengerIndex,
            successful: data.success ?? true,
          },
        ]
      : []

  const primary = selectedSeats[0]
  const flight = data?.flightInfo || data?.flight
  const allSuccessful = selectedSeats.every((s) => s.successful !== false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-green-500/30 bg-gradient-to-b from-green-500/10 to-[var(--bg-card)] p-5"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 className="h-7 w-7 text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-400">
            {allSuccessful ? 'Seat reserved' : 'Seat update'}
          </p>
          <p className="font-heading text-2xl font-bold text-[var(--text-primary)]">
            {primary?.seatCode || '—'}
          </p>
          {selectedSeats.length > 1 && (
            <p className="text-xs text-[var(--text-secondary)]">
              +{selectedSeats.length - 1} more seat{selectedSeats.length > 2 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {flight && !primary?.origin && (
        <p className="mb-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Plane className="h-4 w-4 text-[var(--accent)]" />
          {flight.flightNumber && <span className="font-mono text-[var(--accent)]">{flight.flightNumber}</span>}
          {flight.from && flight.to && (
            <span>
              · {flight.from} → {flight.to}
            </span>
          )}
        </p>
      )}

      {primary && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          {primary.origin && primary.destination && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-dark)]/30 px-3 py-2">
              <p className="text-[var(--text-secondary)]">Route</p>
              <p className="font-mono font-semibold text-[var(--text-primary)]">
                {primary.origin} → {primary.destination}
              </p>
            </div>
          )}
          {primary.departure && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-dark)]/30 px-3 py-2">
              <p className="text-[var(--text-secondary)]">Departure</p>
              <p className="font-semibold text-[var(--text-primary)]">
                {formatDate(primary.departure)}
              </p>
              <p className="text-[var(--accent)]">{formatTime(primary.departure)}</p>
            </div>
          )}
          {primary.passengerIndex != null && (
            <div className="col-span-2 rounded-lg border border-[var(--border)] bg-[var(--bg-dark)]/30 px-3 py-2">
              <p className="flex items-center gap-1 text-[var(--text-secondary)]">
                <User className="h-3.5 w-3.5" />
                Passenger
              </p>
              <p className="font-semibold text-[var(--text-primary)]">{primary.passengerIndex}</p>
            </div>
          )}
        </div>
      )}

      {selectedSeats.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            All reserved seats
          </p>
          {selectedSeats.map((item, i) => (
            <SeatRow key={`${item.seatCode}-${i}`} item={item} />
          ))}
        </div>
      )}

      {data?.passenger && (
        <p className="mt-3 text-xs text-[var(--text-secondary)]">{data.passenger}</p>
      )}
    </motion.div>
  )
}
