import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/formatters'
import CopyPnrButton from './CopyPnrButton'

const summaryBreakdownRow = ({
  label = 'All Passengers',
  baseFare,
  taxes,
  total,
  currency,
  taxDetails,
}) => ({
  passengerType: label,
  baseFare: baseFare ?? null,
  taxes: taxes ?? null,
  total: total ?? null,
  currency,
  taxDetails: Array.isArray(taxDetails) && taxDetails.length ? taxDetails : null,
})

/**
 * Normalise the various price shapes the backend can send:
 *
 * Shape A (original):  data.price = { total, currency, breakdown: [{ passengerType, baseFare, taxes, total, currency }] }
 * Shape A2 (aggregate): data.price = { total, currency, baseFare, taxes, taxDetails } — no breakdown array
 * Shape B (ai_summary merged): data.total_price, data.base_fare, data.taxes, data.currency, data.passengers
 */
function resolvePrice(data) {
  if (!data) return null

  // Shape A – backend sent a nested `price` object
  if (data.price?.total != null) {
    const { price } = data
    const currency = price.currency || data.currency || 'ETB'
    let breakdown =
      Array.isArray(price.breakdown) && price.breakdown.length ? price.breakdown : null

    if (!breakdown && (price.baseFare != null || price.taxes != null)) {
      breakdown = [
        summaryBreakdownRow({
          baseFare: price.baseFare,
          taxes: price.taxes,
          total: price.total,
          currency,
          taxDetails: price.taxDetails,
        }),
      ]
    }

    return {
      total: price.total,
      currency,
      breakdown,
    }
  }

  // Shape B – flat fields from ai_summary merge
  if (data.total_price != null || data.base_fare != null) {
    const currency = data.currency || 'ETB'
    const passengers = Array.isArray(data.passengers) ? data.passengers : []

    let breakdown = null
    if (passengers.length && (data.base_fare != null || data.taxes != null)) {
      const count = passengers.length || 1
      breakdown = passengers.map((p) =>
        summaryBreakdownRow({
          label: p.name || p.type || 'Passenger',
          baseFare:
            data.base_fare != null ? Math.round(data.base_fare / count) : null,
          taxes: data.taxes != null ? Math.round(data.taxes / count) : null,
          total:
            data.total_price != null ? Math.round(data.total_price / count) : null,
          currency,
          taxDetails: data.taxDetails,
        }),
      )
    } else if (data.base_fare != null || data.taxes != null) {
      breakdown = [
        summaryBreakdownRow({
          baseFare: data.base_fare,
          taxes: data.taxes,
          total: data.total_price,
          currency,
          taxDetails: data.taxDetails,
        }),
      ]
    }

    return {
      total: data.total_price,
      currency,
      breakdown,
    }
  }

  return null
}

export default function BookingPrice({ data }) {
  const price = resolvePrice(data)

  // Nothing to render
  if (!price) return null

  const { pnr } = data || {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        Full price for all travelers
      </p>
      <div className="mb-4 flex items-center justify-between">
        {pnr && (
          <p className="font-mono text-sm text-[var(--accent)]">PNR {pnr}</p>
        )}
        {pnr && <CopyPnrButton pnr={pnr} />}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
            <th className="pb-2 font-medium">Passenger</th>
            <th className="pb-2 font-medium">Base</th>
            <th className="pb-2 font-medium">Taxes</th>
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {price.breakdown?.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)]/50">
              <td className="py-2">{row.passengerType}</td>
              <td className="py-2">
                {row.baseFare != null
                  ? formatPrice(row.baseFare, row.currency || price.currency)
                  : '—'}
              </td>
              <td className="py-2">
                {row.taxes != null
                  ? formatPrice(row.taxes, row.currency || price.currency)
                  : '—'}
                {row.taxDetails?.map((tax, j) => (
                  <div
                    key={`${tax.label}-${j}`}
                    className="mt-0.5 flex justify-between gap-2 text-[10px] text-[var(--text-secondary)]"
                  >
                    <span>{tax.label}</span>
                    <span>
                      {formatPrice(tax.amount, tax.currency || row.currency || price.currency)}
                    </span>
                  </div>
                ))}
              </td>
              <td className="py-2 text-right font-medium">
                {row.total != null
                  ? formatPrice(row.total, row.currency || price.currency)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={3}
              className="pt-3 text-right font-medium text-[var(--text-secondary)]"
            >
              Grand Total
            </td>
            <td className="pt-3 text-right text-lg font-bold text-[var(--accent)]">
              {formatPrice(price.total, price.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </motion.div>
  )
}
