import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Receipt } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import { normalizePriceConfirmBreakdown } from '../../utils/priceBreakdownUtils'

function PriceBreakdownCard({ breakdown, total }) {
  const [taxesOpen, setTaxesOpen] = useState(true)

  if (!breakdown?.hasBreakdown) return null

  if (breakdown.mode === 'passengers') {
    return (
      <div className="mb-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/50">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
          <Receipt className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            Price by traveler
          </span>
        </div>
        <div className="space-y-0 divide-y divide-[var(--border)]/60 px-4 py-2">
          {breakdown.passengers.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-x-4 gap-y-1 py-2.5 text-xs sm:grid-cols-4">
              <span className="font-medium text-[var(--text-primary)]">
                {row.passengerType || row.label || `Traveler ${i + 1}`}
              </span>
              <span className="text-[var(--text-secondary)]">
                Base {formatPrice(row.baseFare, row.currency)}
              </span>
              <span className="text-[var(--text-secondary)]">
                Tax {formatPrice(row.taxes, row.currency)}
              </span>
              <span className="text-right font-medium text-[var(--accent)]">
                {formatPrice(row.total || row.amount, row.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasTaxDetails = breakdown.taxDetails?.length > 0

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-[var(--accent)]/20 bg-gradient-to-b from-[var(--bg-dark)]/80 to-[var(--bg-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <Receipt className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Fare breakdown
        </span>
      </div>

      <div className="space-y-0 px-4 py-3">
        {breakdown.lines.map((line) => {
          const isTaxesRow = line.label === 'Taxes & fees' && hasTaxDetails

          if (isTaxesRow) {
            return (
              <div key={line.label} className="border-b border-[var(--border)]/50 py-2 last:border-0">
                <button
                  type="button"
                  onClick={() => setTaxesOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-sm text-[var(--text-primary)]">
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--accent)] transition-transform ${
                        taxesOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <span className="truncate">{line.label}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--text-primary)]">
                    {formatPrice(line.amount, line.currency)}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {taxesOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 space-y-1.5 overflow-hidden border-l-2 border-[var(--accent)]/30 pl-3"
                    >
                      {breakdown.taxDetails.map((tax, i) => (
                        <li
                          key={`${tax.label}-${i}`}
                          className="flex justify-between gap-2 text-[11px] leading-snug text-[var(--text-secondary)]"
                        >
                          <span className="min-w-0 flex-1">{tax.label}</span>
                          <span className="shrink-0 font-medium text-[var(--text-primary)]">
                            {formatPrice(tax.amount, tax.currency)}
                          </span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          return (
            <div
              key={line.label}
              className="flex justify-between gap-3 border-b border-[var(--border)]/50 py-2.5 text-sm last:border-0"
            >
              <span className="text-[var(--text-primary)]">{line.label}</span>
              <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                {formatPrice(line.amount, line.currency)}
              </span>
            </div>
          )
        })}

        {total?.amount != null && (
          <div className="mt-2 flex justify-between border-t border-[var(--accent)]/30 pt-3">
            <span className="font-heading text-sm font-semibold text-[var(--text-primary)]">
              Total
            </span>
            <span className="font-heading text-xl font-bold text-[var(--accent)]">
              {formatPrice(total.amount, total.currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PriceConfirm({ data, handlers }) {
  if (!data) return null

  const total = data.total || { amount: data.totalPrice, currency: 'ETB' }
  const breakdown = useMemo(() => normalizePriceConfirmBreakdown(data), [data])
  const step = data.step || handlers?.bookingContext?.step || 'hold'
  const isFlightStep = step === 'flight'

  if (data.skipConfirm && isFlightStep) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 p-4 text-center"
      >
        <p className="text-sm text-[var(--text-primary)]">
          Fare selected — {formatPrice(total.amount, total.currency)}
        </p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Enter every traveler in the form below before submitting.
        </p>
      </motion.div>
    )
  }

  const title = isFlightStep
    ? 'Confirm this flight & fare'
    : 'Confirm total price & hold booking'

  const subtitle = isFlightStep
    ? 'Step 3 of 6 — Review the selected fare before entering passenger details.'
    : 'Step 6 of 6 — Hold your booking at this final price.'

  const onConfirm = () => {
    if (isFlightStep) {
      handlers?.onConfirmFlightSelection?.()
    } else {
      handlers?.onConfirmHoldBooking?.()
    }
  }

  const onCancel = () => {
    handlers?.sendMessage?.(
      isFlightStep ? 'No, choose a different flight' : 'No, cancel the booking',
    )
  }

  const showHeroTotal = !breakdown.hasBreakdown || breakdown.mode === 'passengers'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-b from-[var(--primary)]/10 to-[var(--bg-card)] p-5 shadow-lg"
    >
      <p className="mb-1 text-center text-xs text-[var(--text-secondary)]">{subtitle}</p>
      <p className="mb-3 text-center text-sm font-medium text-[var(--text-primary)]">{title}</p>

      {showHeroTotal && (
        <p className="mb-4 text-center font-heading text-3xl font-bold text-[var(--accent)]">
          {formatPrice(total.amount, total.currency)}
        </p>
      )}

      {data.flightSummary && (
        <p className="mb-3 text-center text-xs text-[var(--text-secondary)]">{data.flightSummary}</p>
      )}

      <PriceBreakdownCard breakdown={breakdown} total={total} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)]"
        >
          {isFlightStep ? 'Change flight' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={handlers?.isLoading}
          className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--bg-dark)] transition hover:bg-[var(--accent-light)] disabled:opacity-40"
        >
          {isFlightStep ? 'Yes, confirm flight' : 'Yes, hold booking'}
        </button>
      </div>
    </motion.div>
  )
}
