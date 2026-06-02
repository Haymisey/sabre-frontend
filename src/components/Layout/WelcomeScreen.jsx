import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Calendar, Luggage, Ticket, ArrowLeft, Search } from 'lucide-react'
import PassengerSelector, { INITIAL_PASSENGER_COUNTS } from '../UIComponents/PassengerSelector'
import { validatePassengerCounts, formatPassengerCountsLabel } from '../../utils/passengers'

const QUICK_ACTIONS = [
  { id: 'book', label: 'Book a Flight', icon: Plane },
  { id: 'status', label: 'Check Flight Status', message: 'Check flight status for Ethiopian Airlines', icon: Calendar },
  { id: 'manage', label: 'Manage Booking', message: 'I need to manage my booking', icon: Ticket },
  { id: 'baggage', label: 'Baggage Info', message: 'Tell me about baggage allowance', icon: Luggage },
]

export default function WelcomeScreen({ onQuickAction, onStartBooking }) {
  const [bookStep, setBookStep] = useState(null)
  const [passengerCounts, setPassengerCounts] = useState(INITIAL_PASSENGER_COUNTS)
  const [error, setError] = useState(null)

  const handleContinueToSearch = () => {
    const err = validatePassengerCounts(passengerCounts)
    if (err) {
      setError(err)
      return
    }
    onStartBooking?.(passengerCounts)
  }

  if (bookStep === 'travelers') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8"
      >
        <button
          type="button"
          onClick={() => {
            setBookStep(null)
            setError(null)
          }}
          className="mb-4 flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <h2 className="font-heading mb-1 text-xl font-bold text-[var(--text-primary)]">
          How many travelers?
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Set this <strong>before</strong> we search for flights. Sabre locks this count for the
          whole booking — you cannot add more passengers later without a new search.
        </p>

        <PassengerSelector
          counts={passengerCounts}
          onChange={(next) => {
            setPassengerCounts(next)
            setError(null)
          }}
          error={error}
        />

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleContinueToSearch}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-[var(--bg-dark)]"
        >
          <Search className="h-4 w-4" />
          Continue — then tell us where to fly
        </motion.button>

        <p className="mt-3 text-center text-[10px] text-[var(--text-secondary)]">
          Next: {formatPassengerCountsLabel(passengerCounts)} · enter route & dates in chat
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col items-center justify-center px-4 py-8"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] shadow-xl shadow-[var(--primary)]/30"
      >
        <Plane className="h-10 w-10 text-[var(--accent)]" />
      </motion.div>

      <motion.h2
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-heading mb-2 text-center text-2xl font-bold text-[var(--text-primary)] md:text-3xl"
      >
        Welcome to Ethiopian Airlines
      </motion.h2>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mb-10 max-w-md text-center text-sm text-[var(--text-secondary)] md:text-base"
      >
        Book flights, check status, manage your booking — your personal AI assistant is ready
        to help.
      </motion.p>

      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              whileHover={{ scale: 1.02, backgroundColor: 'var(--bg-card-hover)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (action.id === 'book') {
                  setBookStep('travelers')
                  setError(null)
                } else {
                  onQuickAction(action.message)
                }
              }}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/40">
                <Icon className="h-5 w-5 text-[var(--accent)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {action.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
