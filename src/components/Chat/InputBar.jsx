import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Send, Mic, Paperclip, X, Loader2, FileText, Eye } from 'lucide-react'
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
  const [previewedFileIndex, setPreviewedFileIndex] = useState(null)

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

  const handleRemoveImage = (idx) => {
    onRemoveImage?.(idx)
    setPreviewedFileIndex(null)
  }

  const handleSend = () => {
    const hasText = text.trim()
    const hasImages = images.length > 0
    if ((!hasText && !hasImages) || disabled || isOcrPending) return

    // Build combined message: user text + all extracted OCR/PDF texts
    const ocrTexts = images
      .filter((img) => img.text)
      .map((img) => {
        const isPdf = img.file.type === 'application/pdf';
        const label = isPdf ? 'PDF text' : 'Image text';
        return `[${label}: ${img.text}]`;
      })
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

      {/* File Preview Modal */}
      {createPortal(
        <AnimatePresence>
          {previewedFileIndex !== null && images[previewedFileIndex] && (() => {
            const fileObj = images[previewedFileIndex];
            const isPdf = fileObj.file.type === 'application/pdf';
            return (
              <motion.div
                key="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                onClick={() => setPreviewedFileIndex(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="relative flex flex-col md:flex-row w-full max-w-4xl h-[80vh] md:h-[65vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header close button */}
                  <button
                    type="button"
                    onClick={() => setPreviewedFileIndex(null)}
                    className="absolute right-4 top-4 z-50 p-2 rounded-full bg-[var(--bg-dark)]/85 text-[var(--text-secondary)] hover:text-white transition-colors border border-[var(--border)]"
                    aria-label="Close preview"
                  >
                    <X size={18} />
                  </button>

                  {/* Left Side: Visual Preview */}
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--bg-dark)] border-b md:border-b-0 md:border-r border-[var(--border)] min-h-[250px] md:min-h-0">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center text-center max-w-xs">
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
                          <FileText className="h-16 w-16 text-red-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate w-full px-4">
                          {fileObj.file.name}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          PDF Document • {(fileObj.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={fileObj.preview}
                          alt="Preview"
                          className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Side: Extracted Content View */}
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-6 bg-[var(--bg-card)]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] px-2 py-1 rounded bg-[var(--accent)]/10">
                        Extracted Text
                      </span>
                      {fileObj.status === 'pending' && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                          Extracting...
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-xl bg-[var(--bg-dark)]/50 border border-[var(--border)] p-4 text-sm font-mono text-[var(--text-secondary)] leading-relaxed select-text min-h-[150px]">
                      {fileObj.status === 'pending' ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-xs text-[var(--text-secondary)] gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                          <p>Extracting text from document...</p>
                        </div>
                      ) : fileObj.status === 'no_text' || !fileObj.text ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-xs text-[var(--text-secondary)]">
                          <p>No readable text could be found or extracted.</p>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-primary)]">
                          {fileObj.text}
                        </pre>
                      )}
                    </div>

                    {fileObj.text && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(fileObj.text);
                          }}
                          className="text-xs font-semibold text-[var(--accent)] hover:underline"
                        >
                          Copy text to clipboard
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

      {/* Hidden file input — images and PDFs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* File thumbnail strip — only shown when files are attached */}
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
              {images.map((img, idx) => {
                const isPdf = img.file.type === 'application/pdf';
                return (
                  <motion.div
                    key={img.id || idx}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={() => setPreviewedFileIndex(idx)}
                    className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] cursor-pointer flex items-center justify-center hover:border-[var(--accent)]/50 transition-colors"
                  >
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center h-full w-full bg-red-500/5 border border-red-500/10 rounded-xl">
                        <FileText className="h-6 w-6 text-red-500" />
                        <span className="mt-1 text-[8px] font-semibold text-red-400 truncate w-full max-w-[48px]">
                          PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={img.preview}
                        alt="attachment"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    )}

                    {/* Eye / Preview icon overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Eye className="h-4 w-4 text-white" />
                    </div>

                    {/* OCR pending spinner overlay */}
                    {img.status === 'pending' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}

                    {/* No readable text warning */}
                    {img.status === 'no_text' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900/70 z-10">
                        <span className="text-center text-[9px] font-medium leading-tight text-red-200">
                          No text
                        </span>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute right-1 top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={8} />
                    </button>
                  </motion.div>
                );
              })}
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
              aria-label="Attach file"
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
