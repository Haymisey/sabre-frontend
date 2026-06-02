import { useState } from 'react'
import { Send, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPassengerCountsLabel } from '../../utils/passengers'

export default function InputBar({
  onSend,
  disabled,
  inputLockedByPayment = false,
  searchPassengerCounts,
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[var(--border)] bg-[var(--bg-card)]/90 p-3 backdrop-blur-md md:p-4"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={
            inputLockedByPayment
              ? 'Complete your payment choice above — chat input paused'
              : searchPassengerCounts
                ? `Where to fly? (${formatPassengerCountsLabel(searchPassengerCounts)} locked) e.g. ADD to DXB on 30 Sep 2026`
                : 'Ask about flights, bookings, status...'
          }
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50"
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:text-[var(--accent)] disabled:opacity-40"
          aria-label="Voice input"
        >
          <Mic className="h-5 w-5" />
        </motion.button>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={disabled || !text.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--bg-dark)] transition hover:bg-[var(--accent-light)] disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>
    </form>
  )
}
