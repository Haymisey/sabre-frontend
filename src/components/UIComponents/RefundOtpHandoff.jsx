import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, KeyRound, Loader2, RefreshCcw, X } from 'lucide-react'
import { confirmRefund } from '../../services/refundService'
import { formatPrice } from '../../utils/formatters'

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Walk the message history (allMessages) to find the most-recent
 * `refund_calculation` bubble and extract the email + cookie from its ui_data.
 */
function extractRefundCalcData(allMessages = []) {
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i]
    if (msg?.ui_component !== 'refund_calculation') continue

    const ud = msg.ui_data ?? {}

    // Email: prefer contact.emails, fall back to passenger emails
    const email =
      ud?.pnr?.contact?.emails?.[0] ??
      ud?.pnr?.passengers?.[0]?.passengerInfo?.emails?.[0] ??
      null

    // Cookie: stored under cookieSabreDataRequest in the refund_calculation payload
    const cookie = ud?.cookieSabreDataRequest ?? msg.cookie ?? null

    return { email: email ? email.toLowerCase() : null, cookie }
  }
  return { email: null, cookie: null }
}

const STEPS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

// ─── component ───────────────────────────────────────────────────────────────

export default function RefundOtpHandoff({ data: rawData, handlers }) {
  const ud = (Array.isArray(rawData) ? rawData[0] : rawData) ?? {}

  const accessToken = ud.access_token ?? ud.accessToken ?? null
  const originalAmount = ud.originalAmount ?? null
  const refundAmount = ud.refundAmount ?? null
  const currency = ud.currency ?? 'ETB'

  // Pull email + cookie from the refund_calculation message
  const { email, cookie: calcCookie } = extractRefundCalcData(handlers?.allMessages ?? [])
  // Cookie priority: otp_handoff ui_data → refund_calculation ui_data → message cookie
  const cookie = ud.cookieSabreDataRequest ?? calcCookie ?? null

  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(STEPS.IDLE)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const canSubmit = otp.trim().length >= 4 && step === STEPS.IDLE

  const handleConfirm = async () => {
    if (!canSubmit) return

    setStep(STEPS.LOADING)
    setError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await confirmRefund({
        accessToken,
        cookie,
        otp: otp.trim(),
        email,
        signal: controller.signal,
      })

      setStep(STEPS.SUCCESS)

      // Notify the chat so the AI can respond with the outcome
      handlers?.handleRefundConfirmSuccess?.(result)
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Refund confirmation failed.'
      setError(msg)
      setStep(STEPS.ERROR)
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    handlers?.handleRefundCancel?.()
    // Let the AI know the user cancelled
    handlers?.sendMessage?.('Cancel the refund.')
  }

  const handleRetry = () => {
    setError(null)
    setStep(STEPS.IDLE)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-md"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <KeyRound className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Refund OTP Verification
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Amount summary chips */}
        {(originalAmount != null || refundAmount != null) && (
          <div className="flex gap-2">
            {originalAmount != null && (
              <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/60 px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">
                  Original
                </p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {formatPrice(originalAmount, currency)}
                </p>
              </div>
            )}
            {refundAmount != null && (
              <div className="flex-1 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wide text-[var(--text-secondary)]">
                  Refund
                </p>
                <p className="text-sm font-bold text-[var(--accent)]">
                  {formatPrice(refundAmount, currency)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Email badge */}
        {email && (
          <p className="text-[11px] text-[var(--text-secondary)]">
            OTP sent to{' '}
            <span className="font-medium text-[var(--text-primary)]">{email}</span>
          </p>
        )}

        <AnimatePresence mode="wait">
          {/* ── IDLE / input ── */}
          {step === STEPS.IDLE && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2.5 text-center font-mono text-lg tracking-[0.35em] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/30"
              />

              <div className="flex gap-2">
                {/* Cancel — ghost */}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:border-red-400/40 hover:text-red-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>

                {/* Confirm — primary */}
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={handleConfirm}
                  className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] px-3 py-2.5 text-sm font-semibold text-[var(--bg-dark)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm Refund
                </button>
              </div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {step === STEPS.LOADING && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-6"
            >
              <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
              <p className="text-sm text-[var(--text-secondary)]">Processing refund…</p>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {step === STEPS.SUCCESS && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <CheckCircle2 className="h-8 w-8 text-[var(--accent)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Refund confirmed successfully!
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Your refund is being processed.
              </p>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {step === STEPS.ERROR && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition hover:border-[var(--accent)]/40"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
