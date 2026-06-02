import { motion } from 'framer-motion'
import { Plane, Clock, Ticket, Mail, DollarSign } from 'lucide-react'
import { formatTime, formatDate, getStatusBg, formatPrice } from '../../utils/formatters'
import CopyPnrButton from './CopyPnrButton'
import ReservationQuickActions from './ReservationQuickActions'

export default function BookingItinerary({ data, handlers }) {
  if (!data) return null
  const summary = data.ai_summary || null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      {(data.isTicketed != null || summary) && (
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Ticket className="h-4 w-4 text-[var(--accent)]" />
              <span>
                Ticketed:{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {data.isTicketed != null ? (data.isTicketed ? 'Yes' : 'No') : summary?.isTicketed ? 'Yes' : 'No'}
                </span>
              </span>
            </div>
            {data.expireDate || summary?.expireDate ? (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Clock className="h-4 w-4 text-[var(--accent)]" />
                <span>
                  Expires:{' '}
                  <span className="font-medium text-[var(--text-primary)]">
                    {data.expireDate || summary?.expireDate}
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          {data.total_price || summary?.total_price ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
              <DollarSign className="h-4 w-4 text-[var(--accent)]" />
              <span>
                Total:{' '}
                <span className="font-medium text-[var(--accent)]">
                  {formatPrice(data.total_price || summary.total_price, data.currency || summary.currency || 'ETB')}
                </span>
              </span>
            </div>
          ) : null}

          {data.contact_email || summary?.contact_email ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Mail className="h-4 w-4 text-[var(--accent)]" />
              <span>
                Contact:{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {data.contact_email || summary.contact_email}
                </span>
              </span>
            </div>
          ) : null}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Booking Reference</p>
          <p className="font-mono text-3xl font-bold tracking-widest text-[var(--accent)]">
            {data.pnr}
          </p>
        </div>
        <CopyPnrButton pnr={data.pnr} />
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase text-[var(--text-secondary)]">
          Passengers
        </p>
        <ul className="space-y-1">
          {data.passengers?.map((p, i) => (
            <li key={i} className="text-sm">
              {p.name}{' '}
              <span className="text-[var(--text-secondary)]">({p.type})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-0">
        {data.segments?.map((seg, i) => (
          <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
            {i < data.segments.length - 1 && (
              <div className="absolute left-[11px] top-8 h-[calc(100%-16px)] w-px bg-[var(--border)]" />
            )}
            <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
              <Plane className="h-3 w-3 text-[var(--accent)]" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-[var(--accent)]">
                  {seg.flightNumber}
                </span>
                {seg.status && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${getStatusBg(seg.status)}`}
                  >
                    {seg.status}
                  </span>
                )}
              </div>
              <p className="text-sm">
                {seg.from} ({seg.fromCity}) → {seg.to} ({seg.toCity})
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatDate(seg.departure)} · {formatTime(seg.departure)} –{' '}
                {formatTime(seg.arrival)}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">{seg.cabinClass}</p>
            </div>
          </div>
        ))}
      </div>

      {data.pnr && (
        <ReservationQuickActions
          pnr={data.pnr}
          flightNumber={data.segments?.[0]?.flightNumber}
          handlers={handlers}
          className="mt-4"
        />
      )}
    </motion.div>
  )
}
