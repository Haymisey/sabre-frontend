import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, Paperclip, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPassengerCountsLabel } from '../../utils/passengers'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import WaveformBars from './WaveformBars'

const MAX_ROWS = 5
const LINE_HEIGHT = 22 // px — matches text-sm (~14px) with comfortable leading

export default function InputBar({
  onSend,
  disabled,
  inputLockedByPayment = false,
  searchPassengerCounts,
  gatewayFlow,
  // OCR image props
  images = [],
  onAddImages,
  onRemoveImage,
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const [voiceError, setVoiceError] = useState('')

  // True while at least one image is still being OCR-processed
  const isOcrPending = images.some((img) => img.status === 'pending')

  // Voice recorder hook
  const { status, analyserRef, toggle: toggleRecording, cancel: cancelRecording } = useVoiceRecorder({
    onTranscript: (txt) => {
      // Append transcribed text to existing textarea content
      setText((prev) => (prev ? prev + ' ' : '') + txt)
    },
    onError: (msg) => {
      setVoiceError(msg)
    },
  })

  const isRecording = status === 'recording'
  const isTranscribing = status === 'transcribing'

  // Auto‑clear toast after 3s
  useEffect(() => {
    if (voiceError) {
      const timer = setTimeout(() => setVoiceError(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [voiceError])

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

  const handleSend = () => {
    const hasText = text.trim()
    const hasImages = images.length > 0
    if ((!hasText && !hasImages) || disabled || isOcrPending) return

    // Build combined message: user text + all extracted OCR texts
    const ocrTexts = images
      .filter((img) => img.text)
      .map((img) => `[Image text: ${img.text}]`)
      .join('\n')

    const combined = [hasText ? text.trim() : null, ocrTexts || null]
      .filter(Boolean)
      .join('\n')

    onSend(combined)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSend()
  }

  const handleFileChange = (e) => {
    if (e.target.files?.length && onAddImages) {
      onAddImages(e.target.files)
    }
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const placeholder = inputLockedByPayment
    ? 'Complete your payment choice above — chat input paused'
    : searchPassengerCounts
      ? `Where to fly? (${formatPassengerCountsLabel(searchPassengerCounts)} locked) e.g. ADD to DXB on 30 Sep 2026`
      : 'Ask about flights, bookings, status...'

  // Whether the send button should be active
  const canSend =
    !disabled &&
    !inputLockedByPayment &&
    !isOcrPending &&
    !isRecording &&
    !isTranscribing &&
    (text.trim().length > 0 || images.length > 0)

  return (
    <div className="relative border-t border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md">
      {/* Voice Error Toast */}
      <AnimatePresence>
        {voiceError && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-4 right-4 z-50 rounded-xl bg-red-500/90 text-white px-4 py-3 text-xs font-medium shadow-lg backdrop-blur-sm flex items-center justify-between gap-2 border border-red-400/20"
          >
            <span>{voiceError}</span>
            <button
              type="button"
              onClick={() => setVoiceError('')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input — images only */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image thumbnail strip — only shown when images are attached */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            key="strip"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-auto max-w-3xl px-3 pt-3 md:px-4"
          >
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--border)]"
                >
                  <img
                    src={img.preview}
                    alt="attachment"
                    className="h-full w-full object-cover"
                  />

                  {/* OCR pending spinner overlay */}
                  {img.status === 'pending' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}

                  {/* No readable text warning */}
                  {img.status === 'no_text' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/70">
                      <span className="text-center text-[9px] font-medium leading-tight text-red-200">
                        No text
                      </span>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => onRemoveImage?.(idx)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    aria-label="Remove image"
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-3 md:p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          {/* Paperclip / attach button */}
          {onAddImages && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={disabled || inputLockedByPayment || isRecording || isTranscribing}
              onClick={openFilePicker}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:text-[var(--accent)] disabled:opacity-40"
              aria-label="Attach image"
            >
              <Paperclip className="h-5 w-5" />
            </motion.button>
          )}

          {isRecording ? (
            <div className="relative flex-1 min-h-[44px] flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-medium text-red-400">Recording...</span>
              </div>
              <div className="flex-1 flex justify-center">
                <WaveformBars analyserRef={analyserRef} active={isRecording} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled || inputLockedByPayment || isTranscribing}
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
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={disabled || inputLockedByPayment || isTranscribing}
            onClick={() => !disabled && !inputLockedByPayment && !isTranscribing && toggleRecording()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:text-[var(--accent)] disabled:opacity-40"
            aria-label={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice input'}
          >
            {isRecording ? (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute h-3 w-3 rounded-sm bg-red-500 animate-pulse" />
              </span>
            ) : isTranscribing ? (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </motion.button>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={!canSend}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--bg-dark)] transition hover:bg-[var(--accent-light)] disabled:opacity-40"
            aria-label="Send message"
          >
            {isOcrPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </form>
    </div>
  )
}
