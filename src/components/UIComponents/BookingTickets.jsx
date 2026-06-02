import { motion } from 'framer-motion'
import { Ticket, Check, X } from 'lucide-react'
import CopyPnrButton from './CopyPnrButton'

export default function BookingTickets({ data }) {
  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-sm text-[var(--accent)]">PNR {data.pnr}</p>
        <CopyPnrButton pnr={data.pnr} />
      </div>

      <div className="space-y-3">
        {data.passengers?.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-3"
          >
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  {p.ticketNumber || 'Not issued'}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
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
    </motion.div>
  )
}
