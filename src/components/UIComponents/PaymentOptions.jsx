import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Search,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import {
  buildHoldPayload,
  buildPaymentPriceSummary,
  buildPaymentSelectPayload,
  flattenPaymentMethods,
  getHoldDurationLabel,
  getPaymentTotal,
  groupPaymentMethods,
  normalizePaymentUiData,
} from '../../utils/paymentUtils'

function PaymentPriceSummary({ summary }) {
  if (!summary?.total?.amount) return null

  return (
    <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/60 px-4 py-3">
      {summary.hasBreakdown ? (
        <div className="space-y-1.5 text-xs">
          {summary.rows.map((row) => (
            <div key={row.key} className="flex justify-between gap-3 text-[var(--text-secondary)]">
              <span className="min-w-0 truncate">{row.label}</span>
              <span className="shrink-0 font-medium text-[var(--text-primary)]">
                {formatPrice(row.amount, row.currency)}
              </span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2">
            <span className="font-semibold text-[var(--text-primary)]">Total due</span>
            <span className="font-heading text-lg font-bold text-[var(--accent)]">
              {formatPrice(summary.total.amount, summary.total.currency)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
            Total due
          </p>
          <p className="font-heading text-2xl font-bold text-[var(--accent)]">
            {formatPrice(summary.total.amount, summary.total.currency)}
          </p>
        </div>
      )}
    </div>
  )
}

function PaymentLogo({ uri, name }) {
  const [failed, setFailed] = useState(false)

  if (uri && !failed) {
    return (
      <img
        src={uri}
        alt=""
        className="h-9 w-9 rounded-lg border border-[var(--border)] bg-white object-contain p-0.5"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-dark)]">
      <span className="text-[10px] font-bold uppercase text-[var(--accent)]">
        {name?.slice(0, 2) || '—'}
      </span>
    </div>
  )
}

function MethodRow({ method, total, onSelect, disabled }) {
  const price = method.amount || total

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(method)}
      className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/50 px-3 py-2.5 text-left transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <PaymentLogo uri={method.logoURI} name={method.paymentName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {method.paymentName}
        </p>
        {method.surcharge?.amount > 0 && (
          <p className="text-[10px] text-[var(--text-secondary)]">
            +{formatPrice(method.surcharge.amount, method.surcharge.currency)} fee
          </p>
        )}
      </div>
      {price?.amount != null && (
        <p className="shrink-0 text-xs font-semibold text-[var(--accent)]">
          {formatPrice(price.amount, price.currency)}
        </p>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
    </button>
  )
}

function MethodGroup({ title, icon: Icon, methods, total, onSelect, disabled }) {
  if (!methods.length) return null

  return (
    <div>
      <p className="mb-2 flex items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
        <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
        {title}
      </p>
      <div className="space-y-2">
        {methods.map((method) => (
          <MethodRow
            key={method.id}
            method={method}
            total={total}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}

export default function PaymentOptions({ data: rawData, handlers, promptMessage }) {
  const data = useMemo(() => normalizePaymentUiData(rawData), [rawData])
  const methods = useMemo(() => flattenPaymentMethods(data.options), [data.options])
  const grouped = useMemo(() => groupPaymentMethods(methods), [methods])
  const total = useMemo(() => getPaymentTotal(data.options), [data.options])

  const priceSummary = useMemo(
    () =>
      buildPaymentPriceSummary(data, promptMessage, {
        messages: handlers?.allMessages || [],
        bookingContext: handlers?.bookingContext,
      }),
    [data, promptMessage, handlers?.allMessages, handlers?.bookingContext],
  )

  const holdLabel = useMemo(
    () => getHoldDurationLabel(data, promptMessage),
    [data, promptMessage],
  )

  const [step, setStep] = useState('choice')
  const [filter, setFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const busy = submitting || handlers?.isLoading
  const canHold = data.canHold !== false

  const filteredMethods = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return methods
    return methods.filter((m) => m.paymentName?.toLowerCase().includes(q))
  }, [methods, filter])

  const filteredGrouped = useMemo(() => groupPaymentMethods(filteredMethods), [filteredMethods])

  const handleHold = () => {
    if (busy) return
    setSubmitting(true)
    const payload = buildHoldPayload(data)
    handlers?.handlePaymentHold?.(payload, data)
    setSubmitting(false)
  }

  const handleSelectMethod = (method) => {
    if (busy) return
    setSubmitting(true)
    const payload = buildPaymentSelectPayload(method, data)
    handlers?.handlePaymentSelect?.(payload, method, data)
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-b from-[var(--primary)]/20 to-[var(--bg-card)] shadow-lg"
    >
      <AnimatePresence mode="wait">
        {step === 'choice' ? (
          <motion.div
            key="choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5"
          >
            {promptMessage && (
              <p className="mb-4 text-sm leading-relaxed text-[var(--text-primary)]">
                {promptMessage}
              </p>
            )}

            <PaymentPriceSummary summary={priceSummary.total ? priceSummary : { total }} />

            <div className="grid grid-cols-2 gap-3">
              {canHold && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleHold}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-dark)]/40 px-3 py-3 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)] disabled:opacity-50"
                >
                  <Clock className="h-5 w-5 text-[var(--text-secondary)]" />
                  <span className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
                    HOLD
                  </span>
                  <span className="text-center text-[10px] leading-tight text-[var(--text-secondary)]">
                    {holdLabel}
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={busy || methods.length === 0}
                onClick={() => setStep('methods')}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] px-3 py-3 text-[var(--bg-dark)] shadow-md transition hover:brightness-110 disabled:opacity-50 ${
                  !canHold ? 'col-span-2' : ''
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-bold tracking-wide">PAY NOW</span>
                <span className="text-center text-[10px] leading-tight opacity-80">
                  {methods.length} payment methods
                </span>
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] text-[var(--text-secondary)]">
              Choose an option above — free-text chat is paused until you decide.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="methods"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex max-h-[min(520px,70vh)] flex-col"
          >
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setStep('choice')
                    setFilter('')
                  }}
                  className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <p className="flex-1 text-center text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                  Here are your options
                </p>
                {total?.amount != null && (
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    {formatPrice(total.amount, total.currency)}
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search payment methods…"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-dark)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50"
                />
              </div>
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-3">
              {filteredMethods.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
                  No methods match &ldquo;{filter}&rdquo;
                </p>
              ) : (
                <div className="space-y-4">
                  <MethodGroup
                    title="Cards"
                    icon={CreditCard}
                    methods={filteredGrouped.cards}
                    total={total}
                    onSelect={handleSelectMethod}
                    disabled={busy}
                  />
                  <MethodGroup
                    title="Mobile & banks"
                    icon={Smartphone}
                    methods={filteredGrouped.mobile}
                    total={total}
                    onSelect={handleSelectMethod}
                    disabled={busy}
                  />
                  <MethodGroup
                    title="Other"
                    icon={Wallet}
                    methods={filteredGrouped.other}
                    total={total}
                    onSelect={handleSelectMethod}
                    disabled={busy}
                  />
                </div>
              )}
            </div>

            <p className="shrink-0 border-t border-[var(--border)] px-4 py-2 text-center text-[10px] text-[var(--text-secondary)]">
              Tap a method to continue · {filteredMethods.length} shown
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
