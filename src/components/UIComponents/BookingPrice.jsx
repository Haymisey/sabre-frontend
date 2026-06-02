import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/formatters'
import CopyPnrButton from './CopyPnrButton'

export default function BookingPrice({ data }) {
  if (!data?.price) return null
  const { price, pnr } = data

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        Step 5 — Full price for all travelers
      </p>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-sm text-[var(--accent)]">PNR {pnr}</p>
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
              <td className="py-2">{formatPrice(row.baseFare, row.currency)}</td>
              <td className="py-2">{formatPrice(row.taxes, row.currency)}</td>
              <td className="py-2 text-right font-medium">
                {formatPrice(row.total, row.currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-3 text-right font-medium text-[var(--text-secondary)]">
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
