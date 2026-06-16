import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import CopyPnrButton from './CopyPnrButton'
import {
  detectCardCode,
  digitsOnly,
  formatCardNumberInput,
  formatExpiryForApi,
  formatExpiryInput,
} from '../../utils/cardUtils'
import {
  postCardPurchase,
  extractRedirectInfo,
  extractUpdatedCookie,
  extractRiskifiedOrderId,
  isCardPurchaseSuccess,
  extractConfirmedPnr,
  parsePaymentCallbackParams,
  parsePaymentRedirectUrl,
  isApprovedRedirectUrl,
  isDeclinedRedirectUrl,
} from '../../services/cardPurchase'
import {
  buildBookingPurchaseBody,
  buildExchangeCommitBody,
  buildExchangeInitiateBody,
} from '../../utils/purchaseBodyBuilders'
import {
  enrichCardHandoffUiData,
  resolvePaymentAmount,
  resolvePaymentMethodFields,
} from '../../utils/paymentSession'

const STEPS = {
  FORM: 'form',
  INITIATING: 'initiating',
  CHALLENGE: 'challenge',
  COMMITTING: 'committing',
  SUCCESS: 'success',
  ERROR: 'error',
}

/** Wait for iframe navigation to settle before Step 2 commit. */
const COMMIT_SETTLE_MS = 1200
/** Avoid committing on the first cross-origin hop into the 3DS provider. */
const MIN_CHALLENGE_MS = 4000

function normalizeHandoffData(raw, handlers, ui_component) {
  let base =
    !raw || Array.isArray(raw)
      ? Array.isArray(raw)
        ? raw[0]?.ui_data ?? raw[0] ?? {}
        : {}
      : raw.ui_data
        ? raw.ui_data
        : raw

  if (typeof base !== 'object' || base === null || Array.isArray(base)) {
    base = {}
  }

  // Derive mode from the component name first, then fall back to whatever the
  // payload says. This guarantees booking_card_handoff always hits the booking
  // API even when the n8n payload omits paymentMode.
  const mode =
    ui_component === 'booking_card_handoff' || base.paymentMode === 'booking'
      ? 'booking'
      : 'exchange'

  return enrichCardHandoffUiData(
    // Inject the resolved mode so enrichCardHandoffUiData doesn't have to
    // re-derive it and risk falling back to 'exchange' via its own heuristics.
    { ...base, paymentMode: mode },
    {
      paymentSession: handlers?.paymentSession,
      bookingContext: handlers?.bookingContext,
    },
  )
}

export default function SecureCardPayment({ data: rawData, handlers, promptMessage, ui_component }) {
  const data = useMemo(
    () => normalizeHandoffData(rawData, handlers, ui_component),
    [rawData, handlers, ui_component],
  )

  const mode = data.paymentMode === 'booking' ? 'booking' : 'exchange'
  const isBooking = mode === 'booking'

  const amount = useMemo(() => resolvePaymentAmount(data, mode), [data, mode])
  const currency = data.currency || 'ETB'
  const accessToken = data.access_token
  const methodFields = useMemo(() => resolvePaymentMethodFields(data), [data])

  const resolvedCardCode =
    methodFields.fopCode || methodFields.paymentCode || null

  const [step, setStep] = useState(STEPS.FORM)
  const [error, setError] = useState(null)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [holderName, setHolderName] = useState('')

  const [transactionId, setTransactionId] = useState(null)
  const [riskifiedOrderId, setRiskifiedOrderId] = useState(null)
  const [challengeHtml, setChallengeHtml] = useState(null)
  const [sessionCookie, setSessionCookie] = useState(data.cookie)

  const iframeRef = useRef(null)
  const abortRef = useRef(null)
  const commitTriggeredRef = useRef(false)
  const challengeStartedRef = useRef(0)
  const settleCommitTimerRef = useRef(null)
  const crossOriginLoadCountRef = useRef(0)

  const detectedCardCode = useMemo(() => detectCardCode(cardNumber), [cardNumber])
  const cardCode = resolvedCardCode || detectedCardCode || 'VI'
  const expirationDate = useMemo(() => formatExpiryForApi(expiry), [expiry])

  const cardSnapshot = useMemo(
    () => ({
      cardNumber: digitsOnly(cardNumber),
      cvc: cvc.trim(),
      holderName: holderName.trim(),
      expirationDate,
      cardCode,
    }),
    [cardNumber, cvc, holderName, expirationDate, cardCode],
  )

  const formValid =
    cardSnapshot.cardNumber.length >= 13 &&
    cardSnapshot.expirationDate &&
    cardSnapshot.cvc.length >= 3 &&
    cardSnapshot.holderName.length >= 2 &&
    amount != null &&
    accessToken



  const onSuccess = useCallback(
    (response) => {
      setStep(STEPS.SUCCESS)
      const payload = {
        pnr: extractConfirmedPnr(response) || data.pnr,
        fareDifference: isBooking ? null : amount,
        totalAmount: isBooking ? amount : null,
        currency,
        response,
        cookie: extractUpdatedCookie(response) ?? sessionCookie,
        ...methodFields,
        ...data,
      }

      if (isBooking) {
        handlers?.handleBookingPaymentSuccess?.(payload)
      } else {
        handlers?.handleExchangePaymentSuccess?.(payload)
      }
    },
    [amount, currency, data, handlers, isBooking, methodFields, sessionCookie],
  )

  const buildPurchaseBody = useCallback(
    (phase, redirectParams = null) => {
      const common = {
        paymentId: methodFields.paymentId,
        cookie: sessionCookie,
        cardNumber: cardSnapshot.cardNumber,
        cvc: cardSnapshot.cvc,
        holderName: cardSnapshot.holderName,
        expirationDate: cardSnapshot.expirationDate,
        cardCode: cardSnapshot.cardCode,
      }

      if (isBooking) {
        return buildBookingPurchaseBody({
          totalAmount: amount,
          currency,
          ...common,
          billingData: data.billingData,
          email: data.email,
          departureDate: data.departureDate,
          deviceId: data.deviceId,
          riskifiedOrderId: phase === 'commit' ? riskifiedOrderId : null,
          received3rdPartyData:
            phase === 'commit'
              ? {
                  supplierId: redirectParams?.supplierId || 'ADYEN',
                  resultCode: redirectParams?.resultCode || 'SUCCESS',
                  responseCode: redirectParams?.responseCode || 'APPROVED',
                  paymentRef: redirectParams?.paymentRef || transactionId,
                  merchantId: redirectParams?.merchantId || 'ET',
                  mac: redirectParams?.mac || redirectParams?.MAC || '',
                }
              : null,
        })
      }

      if (phase === 'commit') {
        return buildExchangeCommitBody({
          fareDifference: amount,
          currency,
          transactionId,
          redirectParams: redirectParams || {},
          ...common,
        })
      }

      return buildExchangeInitiateBody({
        fareDifference: amount,
        currency,
        ...common,
      })
    },
    [
      amount,
      cardSnapshot,
      currency,
      data.billingData,
      data.departureDate,
      data.deviceId,
      data.email,
      isBooking,
      methodFields.paymentId,
      riskifiedOrderId,
      sessionCookie,
      transactionId,
    ],
  )

  const runCommit = useCallback(
    async (redirectParams) => {
      setStep(STEPS.COMMITTING)
      setError(null)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const purchase = buildPurchaseBody('commit', redirectParams)
        const response = await postCardPurchase({
          mode,
          accessToken,
          purchase,
          signal: controller.signal,
        })

        const nextCookie = extractUpdatedCookie(response)
        if (nextCookie) setSessionCookie(nextCookie)

        if (!isCardPurchaseSuccess(response, mode)) {
          throw new Error(
            response?.messageAPI ||
              response?.message ||
              'Payment was not confirmed. Please try again.',
          )
        }

        onSuccess(response)
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        commitTriggeredRef.current = false
        setError(err?.response?.data?.message || err?.message || 'Payment failed.')
        setStep(STEPS.ERROR)
      }
    },
    [accessToken, buildPurchaseBody, mode, onSuccess],
  )

  const triggerCommit = useCallback(
    (redirectParams = {}) => {
      if (commitTriggeredRef.current) return
      commitTriggeredRef.current = true
      clearTimeout(settleCommitTimerRef.current)
      runCommit({
        status: 'approved',
        paymentRef: redirectParams.paymentRef || transactionId,
        resultCode: redirectParams.resultCode || 'SUCCESS',
        responseCode: redirectParams.responseCode || 'APPROVED',
        merchantId: redirectParams.merchantId || 'ET',
        mac: redirectParams.mac || '',
        supplierId: redirectParams.supplierId || 'ADYEN',
        ...redirectParams,
      })
    },
    [runCommit, transactionId],
  )

  const handleIframeLoad = useCallback(() => {
    if (step !== STEPS.CHALLENGE || commitTriggeredRef.current) return

    try {
      const href = iframeRef.current?.contentWindow?.location?.href ?? ''

      if (isDeclinedRedirectUrl(href)) {
        commitTriggeredRef.current = true
        setError('Your bank declined the payment.')
        setStep(STEPS.ERROR)
        return
      }

      if (isApprovedRedirectUrl(href)) {
        triggerCommit(parsePaymentRedirectUrl(href))
        return
      }
    } catch {
      // Do NOT auto-trigger commit on cross-origin load events.
      // The 3DS challenge can trigger multiple redirects (ACS pages, startMethod URLs)
      // before the user gets to enter their password, which causes premature commits.
      // Instead, we let the user manually click the fallback button once they see
      // the "Payment Approved" screen in the iframe.
    }
  }, [step, triggerCommit])

  const handlePay = async (e) => {
    e.preventDefault()
    if (!formValid || step !== STEPS.FORM) return

    setStep(STEPS.INITIATING)
    setError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const purchase = buildPurchaseBody('initiate')
      const response = await postCardPurchase({
        mode,
        accessToken,
        purchase,
        signal: controller.signal,
      })

      const nextCookie = extractUpdatedCookie(response)
      if (nextCookie) setSessionCookie(nextCookie)

      const riskId = extractRiskifiedOrderId(response)
      if (riskId) setRiskifiedOrderId(riskId)

      const redirect = extractRedirectInfo(response)
      if (!redirect?.html) {
        if (isCardPurchaseSuccess(response, mode)) {
          onSuccess(response)
          return
        }
        throw new Error('Bank verification form was not returned. Please try again.')
      }

      setTransactionId(redirect.transactionId)
      setChallengeHtml(redirect.html)
      commitTriggeredRef.current = false
      challengeStartedRef.current = Date.now()
      crossOriginLoadCountRef.current = 0
      setStep(STEPS.CHALLENGE)
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
      setError(err?.response?.data?.message || err?.message || 'Could not start payment.')
      setStep(STEPS.ERROR)
    }
  }



  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'exchange-payment-callback') return

      const params = parsePaymentCallbackParams(event.data)
      if (params.status === 'approved') {
        triggerCommit(params)
        return
      }
      if (params.status === 'declined') {
        commitTriggeredRef.current = true
        setError('Your bank declined the payment.')
        setStep(STEPS.ERROR)
        return
      }
      if (params.status === 'cancel') {
        setError('Payment was cancelled.')
        setStep(STEPS.FORM)
        commitTriggeredRef.current = false
        return
      }
      if (params.status === 'error') {
        commitTriggeredRef.current = true
        setError('A payment error occurred during bank verification.')
        setStep(STEPS.ERROR)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [triggerCommit])

  useEffect(
    () => () => {
      abortRef.current?.abort()
      clearTimeout(settleCommitTimerRef.current)
    },
    [],
  )

  const busy = [STEPS.INITIATING, STEPS.COMMITTING].includes(step)
  const title = isBooking ? 'Secure booking payment' : 'Secure exchange payment'
  const amountLabel = isBooking ? 'Total due' : 'Fare difference due'
  const successText = isBooking
    ? 'Payment successful — issuing your ticket…'
    : 'Payment successful — finalizing your ticket exchange…'
  const committingText = isBooking ? 'Confirming your booking…' : 'Confirming your exchange…'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-b from-[var(--primary)]/20 to-[var(--bg-card)] shadow-lg"
    >
      <div className="border-b border-[var(--border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {title}
          </p>
        </div>
        {data.pnr && (
          <div className="mt-2 flex items-center justify-between">
            <p className="font-mono text-sm text-[var(--accent)]">PNR {data.pnr}</p>
            <CopyPnrButton pnr={data.pnr} />
          </div>
        )}
      </div>

      <div className="p-5">
        {promptMessage && step === STEPS.FORM && (
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            {promptMessage}
          </p>
        )}

        {amount != null && (
          <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/60 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
              {amountLabel}
            </p>
            <p className="font-heading text-2xl font-bold text-[var(--accent)]">
              {formatPrice(amount, currency)}
            </p>
            {methodFields.name && (
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                {methodFields.name}
              </p>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === STEPS.FORM && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handlePay}
              className="space-y-3"
            >
              {!accessToken && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  Session token missing — payment cannot start. Return to payment options and
                  select your card again.
                </p>
              )}

              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  <CreditCard className="h-3 w-3" />
                  Card number
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                  placeholder="5454 5454 5454 5454"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                    Expiry
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                    CVC
                  </span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
                    placeholder="•••"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                  Cardholder name
                </span>
                <input
                  type="text"
                  autoComplete="cc-name"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="As printed on card"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
                />
              </label>

              <button
                type="submit"
                disabled={!formValid || busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--bg-dark)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                Pay {amount != null ? formatPrice(amount, currency) : 'now'}
              </button>

              <p className="text-center text-[10px] text-[var(--text-secondary)]">
                Card details are sent only to the secure payment service — never logged.
              </p>
            </motion.form>
          )}

          {step === STEPS.CHALLENGE && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-3 text-sm text-[var(--text-secondary)]">
                Complete verification with your bank below.
              </p>
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                <iframe
                  ref={iframeRef}
                  title="Bank verification"
                  srcDoc={challengeHtml || undefined}
                  onLoad={handleIframeLoad}
                  className="h-[min(420px,55vh)] w-full border-0"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
                />
              </div>
              <button
                type="button"
                disabled={busy || commitTriggeredRef.current}
                onClick={() =>
                  triggerCommit({
                    paymentRef: transactionId,
                    resultCode: 'SUCCESS',
                    responseCode: 'APPROVED',
                  })
                }
                className="mt-3 w-full rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-dark)]/60 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                I see &ldquo;Payment Approved&rdquo; — complete my booking
              </button>
            </motion.div>
          )}

          {(step === STEPS.INITIATING || step === STEPS.COMMITTING) && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-10"
            >
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                {step === STEPS.INITIATING ? 'Connecting to payment service…' : committingText}
              </p>
            </motion.div>
          )}

          {step === STEPS.SUCCESS && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 py-8 text-center"
            >
              <ShieldCheck className="h-10 w-10 text-[var(--accent)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">{successText}</p>
            </motion.div>
          )}

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
                onClick={() => {
                  setError(null)
                  commitTriggeredRef.current = false
                  clearTimeout(settleCommitTimerRef.current)
                  setStep(STEPS.FORM)
                  setChallengeHtml(null)
                }}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-primary)] hover:border-[var(--accent)]/40"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
