import { CircleCheck, PlaneTakeoff, X } from 'lucide-react'
import { formatDate, formatPrice } from '../../utils/formatters'

export function buildReservationSummary(data) {
  if (!data) return null

  const passengers = data.passengers || []
  const segments = data.segments || []
  const firstSeg = segments[0]
  const firstPassenger = passengers[0]

  const passengerName =
    firstPassenger?.name ||
    [firstPassenger?.firstName, firstPassenger?.lastName].filter(Boolean).join(' ') ||
    data.passengerName ||
    null

  const flightNumber = firstSeg?.flightNumber || data.flightNumber
  const from = firstSeg?.from || data.from
  const to = firstSeg?.to || data.to
  const route =
    from && to ? `${from} → ${to}` : data.route || null

  const departure = firstSeg?.departure || data.departureDate || data.date

  const totalRaw =
    data.total_price ??
    data.total?.amount ??
    data.total ??
    data.price?.total

  return {
    pnr: data.pnr,
    passengerName,
    flightNumber,
    route,
    departure,
    seat:
      data.seat ||
      firstSeg?.seat ||
      firstPassenger?.seat ||
      firstPassenger?.seatCode ||
      null,
    bags: data.bags ?? data.baggage ?? data.bagCount ?? null,
    cabin: firstSeg?.cabinClass || data.cabinClass || data.cabin,
    isTicketed: data.isTicketed ?? data.ticketed,
    holdExpiry: data.holdExpiry,
    total: totalRaw,
    currency: data.currency || data.total?.currency || 'ETB',
  }
}

export default function ReservationQuickActions({
  pnr,
  flightNumber,
  handlers,
  disabled = false,
  className = '',
}) {
  const busy = disabled || handlers?.isLoading

  const send = (text) => {
    if (busy || !handlers?.sendMessage) return
    handlers.sendMessage(text)
  }

  const onCheckIn = () => {
    send(
      pnr
        ? `Check in for my booking with PNR ${pnr}`
        : 'Check in for my booking',
    )
  }

  const onFlightStatus = () => {
    if (flightNumber) {
      send(`What is the flight status of ${flightNumber}?`)
      return
    }
    send(
      pnr
        ? `What is the flight status for my booking PNR ${pnr}?`
        : 'Check flight status for my booking',
    )
  }

  const onCancel = () => {
    send(
      pnr
        ? `Cancel my booking with PNR ${pnr}`
        : 'Cancel my booking',
    )
  }

  return (
    <div
      className={`grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 ${className}`}
    >
      <button
        type="button"
        disabled={busy}
        onClick={onCheckIn}
        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/50 px-2 py-2.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
      >
        <CircleCheck className="h-4 w-4" />
        Check in
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onFlightStatus}
        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/50 px-2 py-2.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
      >
        <PlaneTakeoff className="h-4 w-4" />
        Flight status
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onCancel}
        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 px-2 py-2.5 text-xs font-medium text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
        Cancel
      </button>
    </div>
  )
}

export function ReservationSummaryCard({ data, handlers, showActions = true }) {
  const summary = buildReservationSummary(data)
  if (!summary?.pnr) return null

  const {
    pnr,
    passengerName,
    flightNumber,
    route,
    departure,
    seat,
    bags,
    cabin,
    isTicketed,
    holdExpiry,
    total,
    currency,
  } = summary

  const flightLine = [flightNumber, route, departure ? formatDate(departure) : null]
    .filter(Boolean)
    .join(' · ')

  const statusLabel = holdExpiry != null && !isTicketed
    ? 'On hold'
    : isTicketed
      ? 'Ticketed'
      : 'Confirmed'

  const statusPrice =
    total != null ? formatPrice(total, currency) : null

  return (
    <div className="text-left">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
            <CircleCheck className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Reservation
          </p>
        </div>
        <span className="rounded-full bg-[var(--accent)] px-3 py-1 font-mono text-xs font-bold text-[var(--bg-dark)]">
          {pnr}
        </span>
      </div>

      {passengerName && (
        <p className="mb-1 font-heading text-lg font-bold uppercase tracking-wide text-[var(--text-primary)]">
          {passengerName}
        </p>
      )}

      {flightLine && (
        <p className="mb-3 text-sm text-[var(--text-secondary)]">{flightLine}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-dark)]/60 px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
          Seat: {seat || 'Not assigned'}
        </span>
        {bags != null && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-dark)]/60 px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
            Bags: {bags}
          </span>
        )}
        {cabin && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-dark)]/60 px-2.5 py-1 text-[10px] text-[var(--text-secondary)]">
            {cabin}
          </span>
        )}
      </div>

      {(statusLabel || statusPrice) && (
        <span className="inline-flex rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400">
          {statusLabel}
          {statusPrice ? ` · ${statusPrice}` : ''}
        </span>
      )}

      {showActions && (
        <ReservationQuickActions
          pnr={pnr}
          flightNumber={flightNumber}
          handlers={handlers}
          className="mt-4"
        />
      )}
    </div>
  )
}
