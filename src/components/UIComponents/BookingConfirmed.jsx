import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import CopyPnrButton from './CopyPnrButton'
import ReservationQuickActions, { ReservationSummaryCard } from './ReservationQuickActions'

export default function BookingConfirmed({ data, handlers }) {
  if (!data) return null

  const hasRichSummary = Boolean(data.pnr && (data.passengers?.length || data.segments?.length))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-b from-green-500/10 to-[var(--bg-card)] p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 className="h-7 w-7 text-green-400" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-green-400">Booking confirmed</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Your ticket has been issued successfully.
          </p>
        </div>
      </div>

      {hasRichSummary ? (
        <>
          <ReservationSummaryCard data={data} handlers={handlers} />
          {data.eticket && (
            <EticketBadge eticket={data.eticket} className="mt-3" />
          )}
        </>
      ) : (
        <>
          <p className="mb-1 text-xs text-[var(--text-secondary)]">Your PNR</p>
          <p className="font-mono mb-3 text-4xl font-bold tracking-[0.2em] text-[var(--accent)]">
            {data.pnr}
          </p>
          {data.eticket && <EticketBadge eticket={data.eticket} className="mb-3" />}
          <CopyPnrButton pnr={data.pnr} className="mb-4" />
          <ReservationQuickActions
            pnr={data.pnr}
            flightNumber={data.flightNumber || data.segments?.[0]?.flightNumber}
            handlers={handlers}
          />
        </>
      )}

      {data.holdExpiry !== undefined && !data.isTicketed && (
        <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          Your booking is held. Complete payment to secure your seat.
        </p>
      )}
    </motion.div>
  )
}

function EticketBadge({ eticket, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 ${className}`}
    >
      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
        E-Ticket Number
      </p>
      <p className="font-mono text-base font-bold tracking-widest text-green-400">
        {eticket}
      </p>
    </div>
  )
}
