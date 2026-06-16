import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPassengerCountsLabel } from '../../utils/passengers'

const MAX_ROWS = 5
const LINE_HEIGHT = 22 // px — matches text-sm (~14px) with comfortable leading

export default function InputBar({
  onSend,
  disabled,
  inputLockedByPayment = false,
  searchPassengerCounts,
  gatewayFlow,
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  /** Auto-resize: grow up to MAX_ROWS lines, then scroll */
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = LINE_HEIGHT * MAX_ROWS + 24 // +24 accounts for py-3 (top+bottom)
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    resize()
  }, [text, resize])

  const handleChange = (e) => {
    setText(e.target.value)
  }

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift); Shift+Enter inserts a newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!text.trim() || disabled) return
      onSend(text.trim())
      setText('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  const placeholder = inputLockedByPayment
    ? 'Complete your payment choice above — chat input paused'
    : searchPassengerCounts
      ? `Where to fly? (${formatPassengerCountsLabel(searchPassengerCounts)} locked) e.g. ADD to DXB on 30 Sep 2026`
      : 'Ask about flights, bookings, status...'

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="p-3 md:p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            style={{ scrollbarWidth: 'none' }} /* Firefox invisible scrollbar */
            className="
              flex-1 resize-none rounded-xl border border-[var(--border)]
              bg-[var(--bg-dark)] px-4 py-3 text-sm leading-[22px]
              text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
              outline-none transition overflow-y-auto
              focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30
              disabled:opacity-50
              [&::-webkit-scrollbar]:hidden
            "
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
    </div>
  )
}
