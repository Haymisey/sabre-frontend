import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/formatters'

export default function PriceConfirm({ data, handlers }) {
  if (!data) return null

  const total = data.total || { amount: data.totalPrice, currency: 'ETB' }
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
    : 'Step 6 of 6 — Hold your booking at this final price.';

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-card)] p-5"
    >
      <p className="mb-1 text-center text-xs text-[var(--text-secondary)]">{subtitle}</p>
      <p className="mb-1 text-center text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mb-4 text-center text-3xl font-bold text-[var(--accent)]">
        {formatPrice(total.amount, total.currency)}
      </p>

      {data.flightSummary && (
        <p className="mb-3 text-center text-xs text-[var(--text-secondary)]">{data.flightSummary}</p>
      )}

      {data.breakdown?.length > 0 && (
        <div className="mb-4 space-y-1 text-xs text-[var(--text-secondary)]">
          {data.breakdown.map((row, i) => (
            <div key={i} className="flex justify-between">
              <span>{row.passengerType || row.label}</span>
              <span>{formatPrice(row.total || row.amount, row.currency)}</span>
            </div>
          ))}
        </div>
      )}

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
