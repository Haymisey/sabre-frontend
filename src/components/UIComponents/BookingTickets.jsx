import { motion } from 'framer-motion'
import {
  Ticket,
  Check,
  X,
  Clock,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  User,
  AlertTriangle,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import CopyPnrButton from './CopyPnrButton'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount, currency = 'ETB') {
  if (amount == null) return null
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

function CountdownPill({ days, hours, minutes, seconds }) {
  const isUrgent = days === 0 && hours < 6
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
        isUrgent
          ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
          : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25'
      }`}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>
        {days > 0 && `${days}d `}
        {hours}h {minutes}m {seconds != null ? `${seconds}s` : ''} remaining
      </span>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

/* ─── main component ───────────────────────────────────────────────────────── */

export default function BookingTickets({ data, handlers }) {
  if (!data) return null

  const {
    pnr,
    isTicketed,
    expireDate,
    timeToTicket,
    passengers = [],
    // from ai_summary (merged)
    route,
    first_departure,
    total_price,
    currency = 'ETB',
    base_fare,
    taxes,
    contact_email,
    contact_phone,
    available_actions = [],
    change_fee,
    cancellation_fee,
  } = data

  const canPay =
    !isTicketed &&
    (available_actions.includes('PURCHASE_ON_HOLD_BOOKING') || available_actions.length === 0)

  const handlePayNow = () => {
    handlers?.onSendMessage?.(`I want to pay for my booking ${pnr}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-[var(--accent)]" />
          <p className="font-mono text-base font-bold tracking-widest text-[var(--accent)]">
            {pnr}
          </p>
          <CopyPnrButton pnr={pnr} />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isTicketed
              ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
              : 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
          }`}
        >
          {isTicketed ? (
            <Check className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {isTicketed ? 'Ticketed' : 'Not Ticketed — Hold'}
        </span>
      </div>

      {/* ── Expiry Countdown ── */}
      {!isTicketed && timeToTicket && (
        <div className="flex flex-col gap-1">
          <CountdownPill
            days={timeToTicket.days}
            hours={timeToTicket.hours}
            minutes={timeToTicket.minutes}
            seconds={timeToTicket.seconds}
          />
          {expireDate && (
            <p className="ml-1 text-[11px] text-[var(--text-secondary)]">
              Expires: {expireDate}
            </p>
          )}
        </div>
      )}

      {/* ── Flight Info ── */}
      {(route || first_departure) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3 space-y-2">
          {route && (
            <div className="flex items-center gap-2 font-mono font-semibold text-sm">
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
              {route.split('→').map((r, i, arr) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span>{r.trim()}</span>
                  {i < arr.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  )}
                </span>
              ))}
            </div>
          )}
          {first_departure && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Calendar className="h-3.5 w-3.5" />
              <span>Departure: {formatDate(first_departure)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Passengers ── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Passengers
        </p>
        <div className="space-y-2">
          {passengers.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <User className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--text-secondary)]">{p.type}</span>
                    {p.seatCode && (
                      <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent)]">
                        Seat {p.seatCode}
                      </span>
                    )}
                    {p.ticketNumber && (
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                        #{p.ticketNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`ml-2 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  p.issued
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {p.issued ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {p.issued ? 'Issued' : 'Not Issued'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Price Breakdown ── */}
      {total_price != null && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Price Breakdown
          </p>
          {base_fare != null && (
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Base Fare</span>
              <span>{formatCurrency(base_fare, currency)}</span>
            </div>
          )}
          {taxes != null && (
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Taxes &amp; Fees</span>
              <span>{formatCurrency(taxes, currency)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-1.5 text-sm font-bold">
            <span>Total</span>
            <span className="text-[var(--accent)]">
              {formatCurrency(total_price, currency)}
            </span>
          </div>
        </div>
      )}

      {/* ── Contact Info ── */}
      {(contact_email || contact_phone) && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Contact
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={contact_email} />
            <InfoRow icon={Phone} label="Phone" value={contact_phone} />
          </div>
        </div>
      )}

      {/* ── Fee Info ── */}
      {(change_fee || cancellation_fee) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/30 px-3 py-2.5 text-xs text-[var(--text-secondary)] space-y-1">
          {change_fee && (
            <div className="flex justify-between">
              <span>Change Fee</span>
              <span className="font-medium">{change_fee}</span>
            </div>
          )}
          {cancellation_fee && (
            <div className="flex justify-between">
              <span>Cancellation Fee</span>
              <span className="font-medium">{cancellation_fee}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Pay Now CTA ── */}
      {canPay && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePayNow}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[var(--accent)]/20 transition hover:brightness-110"
        >
          <CreditCard className="h-4 w-4" />
          Pay Now to Confirm Booking
        </motion.button>
      )}
    </motion.div>
  )
}
