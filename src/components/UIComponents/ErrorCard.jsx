import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function ErrorCard({ data }) {
  const message =
    typeof data === 'string'
      ? data
      : data?.message || 'Something went wrong. Please try again.'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4"
    >
      <AlertCircle className="h-6 w-6 shrink-0 text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-400">Unable to complete request</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Try rephrasing your request, or ask to search flights, check status, or manage a
          booking.
        </p>
      </div>
    </motion.div>
  )
}
