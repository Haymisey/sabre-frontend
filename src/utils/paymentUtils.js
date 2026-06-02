export const PAYMENT_CODE_LABELS = {
  VI: 'Visa',
  CA: 'Master Card',
  MA: 'Maestro',
  AX: 'American Express',
  DC: 'Diners Club',
  DS: 'Discover',
  TP: 'UATP',
  IK: 'Credit Card',
  BA: 'POLi',
  BA_remote: 'Bank transfer (remote)',
  BPC: 'Remote payment',
  FLYGATE: 'Mobile & bank apps',
  AFOP: 'Alternative payment',
  BNPL_6Hrs: 'Hold for 6 hours',
  BNPL_24Hrs: 'Hold for 24 hours',
}

export const normalizePaymentUiData = (raw) => {
  let data = raw
  if (Array.isArray(data)) {
    data = data[0]?.ui_data ?? data[0]
  }
  if (data?.ui_data) data = data.ui_data
  return data || {}
}

/** Assistant text asking hold vs pay — backend sometimes omits ui_component. */
export const messageSuggestsPaymentChoice = (text = '') => {
  const m = String(text).toLowerCase()
  if (!m) return false

  const holdAndPay =
    /\bhold\b/.test(m) &&
    (/\bpay\b/.test(m) || /\bpayment\b/.test(m) || /\bimmediately\b/.test(m))

  return (
    holdAndPay ||
    /hold it now/.test(m) ||
    /hold this booking/.test(m) ||
    /pay for it immediately/.test(m) ||
    /prefer to pay/.test(m) ||
    /would you like to hold/.test(m)
  )
}

export const hasPaymentOptionsData = (uiData) =>
  Array.isArray(uiData?.options) && uiData.options.length > 0

export const findRecentPaymentUiData = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg?.ui_component === 'payment_options' && hasPaymentOptionsData(msg.ui_data)) {
      return msg.ui_data
    }
  }
  return null
}

/** Build payment_options ui_data from API body, prior message, or minimal hold fallback. */
export const buildPaymentUiDataFallback = ({ apiData = {}, messages = [], cookie = null } = {}) => {
  const fromUiData = normalizePaymentUiData(apiData.ui_data ?? apiData)
  if (hasPaymentOptionsData(fromUiData)) {
    return {
      ...fromUiData,
      cookie: fromUiData.cookie ?? cookie,
      canHold: fromUiData.canHold !== false,
    }
  }

  const fromRoot = Array.isArray(apiData.options) ? apiData : null
  if (fromRoot && hasPaymentOptionsData(fromRoot)) {
    return {
      success: true,
      canHold: apiData.canHold !== false,
      holdOptionId: apiData.holdOptionId,
      options: apiData.options,
      cookie: apiData.cookie ?? cookie,
    }
  }

  const cached = findRecentPaymentUiData(messages)
  if (cached) {
    return {
      ...cached,
      cookie: cached.cookie ?? cookie,
    }
  }

  return {
    success: true,
    canHold: true,
    holdOptionId: null,
    options: [],
    cookie,
  }
}

const methodKey = (opt, afop) =>
  afop
    ? `${opt.paymentType}:${opt.paymentCode}:${afop.fopSubCode}:${afop.fopCode}`
    : `${opt.paymentType}:${opt.paymentCode}`

/**
 * Flatten nested options + afopDetails into selectable payment rows.
 */
export const flattenPaymentMethods = (options = []) => {
  const methods = []
  const seen = new Set()

  for (const opt of options) {
    if (!opt || opt.paymentType === 'BNPL') continue
    if (opt.paymentType === 'AWARD' && !opt.amount?.amount) continue

    const baseAmount = opt.amount
    const baseSurcharge = opt.surcharge
    const afops = Array.isArray(opt.afopDetails) ? opt.afopDetails : []

    if (afops.length > 0) {
      for (const afop of afops) {
        const key = methodKey(opt, afop)
        if (seen.has(key)) continue
        seen.add(key)

        methods.push({
          id: key,
          paymentName: afop.paymentName || PAYMENT_CODE_LABELS[afop.fopCode] || afop.fopCode,
          logoURI: afop.logoURI,
          paymentType: opt.paymentType,
          paymentCode: opt.paymentCode,
          fopCode: afop.fopCode,
          fopSubCode: afop.fopSubCode,
          fopSubQQCode: afop.fopSubQQCode,
          afopQQCode: afop.afopQQCode,
          amount: baseAmount,
          surcharge: baseSurcharge,
          order: Number(afop.order) || 0,
          group: opt.paymentType === 'CREDIT_CARD' ? 'cards' : 'mobile',
        })
      }
      continue
    }

    if (
      opt.paymentType === 'CREDIT_CARD' ||
      opt.paymentType === 'POLI' ||
      opt.paymentType === 'REMOTE' ||
      opt.paymentType === 'FLYGATE' ||
      opt.paymentType === 'AFOP'
    ) {
      const key = methodKey(opt, null)
      if (seen.has(key)) continue
      seen.add(key)

      const label =
        PAYMENT_CODE_LABELS[opt.paymentCode] ||
        opt.paymentCode?.replace(/_/g, ' ') ||
        opt.paymentType

      methods.push({
        id: key,
        paymentName: label,
        logoURI: null,
        paymentType: opt.paymentType,
        paymentCode: opt.paymentCode,
        fopCode: opt.paymentCode,
        fopSubCode: opt.paymentCode,
        fopSubQQCode: null,
        afopQQCode: null,
        amount: baseAmount,
        surcharge: baseSurcharge,
        order: 0,
        group:
          opt.paymentType === 'CREDIT_CARD'
            ? 'cards'
            : opt.paymentType === 'FLYGATE' || opt.paymentType === 'AFOP'
              ? 'mobile'
              : 'other',
      })
    }
  }

  return methods.sort((a, b) => (b.order || 0) - (a.order || 0))
}

export const groupPaymentMethods = (methods) => ({
  cards: methods.filter((m) => m.group === 'cards'),
  mobile: methods.filter((m) => m.group === 'mobile'),
  other: methods.filter((m) => m.group === 'other'),
})

export const getPaymentTotal = (options = []) => {
  const withAmount = options.find((o) => o?.amount?.amount != null)
  return withAmount?.amount ?? null
}

const toMoney = (amount, currency = 'ETB') => {
  const n = Number(amount)
  if (!Number.isFinite(n)) return null
  return { amount: n, currency: currency || 'ETB' }
}

export const findRecentBookingPrice = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg?.ui_component === 'booking_price' && msg?.ui_data?.price) {
      const p = msg.ui_data.price
      return {
        total: p.total,
        currency: p.currency,
        breakdown: p.breakdown,
      }
    }
    const price = msg?.ui_data?.price
    if (price && (price.total != null || price.breakdown?.length)) {
      return price
    }
    if (msg?.ui_component === 'booking_price_confirm' && msg?.ui_data?.total) {
      return {
        total: msg.ui_data.total?.amount ?? msg.ui_data.total,
        currency: msg.ui_data.total?.currency || 'ETB',
        breakdown: msg.ui_data.breakdown,
      }
    }
  }
  return null
}

const bnplOptionFromData = (data) =>
  Array.isArray(data?.options) ? data.options.find((o) => o?.paymentType === 'BNPL') : null

/** Hold label from assistant message or holdOptionId (e.g. BNPL_24Hrs), not a hardcoded 6h default. */
export const getHoldDurationLabel = (data, promptMessage = '') => {
  const msgMatch = String(promptMessage).match(/(\d+)\s*hours?/i)
  if (msgMatch) return `Reserve ${msgMatch[1]} hours`

  const hours = data?.holdHours ?? data?.holdDurationHours ?? data?.holdDuration
  if (hours != null && hours !== '') return `Reserve ${hours} hours`

  const bnpl = bnplOptionFromData(data)
  const id =
    data?.holdOptionId || data?.holdOption?.paymentCode || bnpl?.paymentCode || ''
  const idMatch = String(id).match(/(\d+)\s*Hrs?/i)
  if (idMatch) return `Reserve ${idMatch[1]} hours`

  return 'Hold without payment now'
}

const sumSeatCharges = (data) => {
  const direct = data?.seatCharges ?? data?.seatsTotal ?? data?.seatTotal
  if (direct != null) {
    if (typeof direct === 'object') return direct.amount ?? direct.total
    return direct
  }

  const seats = data?.selectedSeats
  if (!Array.isArray(seats)) return null

  let sum = 0
  let found = false
  for (const s of seats) {
    const p = Number(s?.price ?? s?.amount ?? s?.total?.alternatives?.[0]?.[0]?.amount)
    if (Number.isFinite(p) && p > 0) {
      sum += p
      found = true
    }
  }
  return found ? sum : null
}

const sumAncillaryCharges = (data) => {
  const direct = data?.ancillaryCharges ?? data?.ancillaryTotal
  if (direct != null) {
    if (typeof direct === 'object') return direct.amount ?? direct.total
    return direct
  }

  const items = data?.ancillarySelections ?? data?.ancillaries ?? data?.ancillaryItems
  if (!Array.isArray(items)) return null

  let sum = 0
  let found = false
  for (const item of items) {
    const p = Number(item?.price ?? item?.amount ?? item?.total)
    if (Number.isFinite(p) && p > 0) {
      sum += p
      found = true
    }
  }
  return found ? sum : null
}

const collectTaxLines = (data, currency) => {
  const lines = []
  const seen = new Set()

  const addTax = (label, amount, curr = currency) => {
    const money = toMoney(amount, curr)
    if (!money || money.amount <= 0) return
    const key = `${label}-${money.amount}`
    if (seen.has(key)) return
    seen.add(key)
    lines.push({ label, ...money })
  }

  const sources = [
    data?.taxDetails,
    data?.taxBreakdown,
    data?.taxesList,
    data?.taxItems,
    data?.price?.taxDetails,
    data?.price?.taxBreakdown,
    data?.pricing?.taxes,
  ]

  for (const source of sources) {
    if (!Array.isArray(source)) continue
    source.forEach((t) => {
      const label =
        t?.name ||
        t?.description ||
        t?.code ||
        t?.type ||
        t?.taxCode ||
        'Tax'
      addTax(label, t?.amount ?? t?.value ?? t?.total, t?.currency || currency)
    })
  }

  if (typeof data?.taxes === 'object' && !Array.isArray(data.taxes) && data.taxes?.amount != null) {
    addTax(data.taxes.label || 'Taxes & fees', data.taxes.amount, data.taxes.currency)
  }

  if (lines.length === 0 && data?.taxes != null && typeof data.taxes !== 'object') {
    addTax('Taxes & fees', data.taxes, currency)
  }

  if (lines.length === 0 && data?.price?.taxes != null && typeof data.price.taxes !== 'object') {
    addTax('Taxes & fees', data.price.taxes, currency)
  }

  return lines
}

/**
 * Line items for payment card: base, per-tax, seats, ancillaries, total.
 */
export const buildPaymentPriceSummary = (data, promptMessage = '', context = {}) => {
  const { messages = [], bookingContext = null } = context
  const bookingPrice = findRecentBookingPrice(messages)
  const currency =
    data?.currency ||
    data?.price?.currency ||
    bookingPrice?.currency ||
    getPaymentTotal(data?.options)?.currency ||
    'ETB'

  const totalFromOptions = getPaymentTotal(data?.options)
  const totalRaw =
    totalFromOptions?.amount ??
    data?.total?.amount ??
    data?.total ??
    data?.totalPrice?.amount ??
    data?.totalPrice ??
    data?.price?.total ??
    bookingPrice?.total ??
    null

  const total = toMoney(totalRaw, currency)

  const rows = []

  let baseAmount =
    data?.baseFare ??
    data?.base ??
    data?.fare?.base ??
    data?.price?.baseFare ??
    data?.price?.base ??
    data?.pricing?.base

  if (baseAmount == null && bookingPrice?.breakdown?.length) {
    baseAmount = bookingPrice.breakdown.reduce(
      (sum, row) => sum + (Number(row.baseFare) || 0),
      0,
    )
  }

  const base = toMoney(baseAmount, currency)
  if (base && base.amount > 0) {
    rows.push({ key: 'base', label: 'Base fare', ...base })
  }

  let taxLines = collectTaxLines(data, currency)

  if (taxLines.length === 0 && bookingPrice?.breakdown?.length) {
    const taxSum = bookingPrice.breakdown.reduce(
      (sum, row) => sum + (Number(row.taxes) || 0),
      0,
    )
    if (taxSum > 0) {
      taxLines = [{ label: 'Taxes & fees', amount: taxSum, currency }]
    }
  }

  taxLines.forEach((t, i) => {
    rows.push({ key: `tax-${i}`, label: t.label, amount: t.amount, currency: t.currency })
  })

  const seatSum = sumSeatCharges(data) ?? sumSeatCharges(bookingContext)
  const seats = toMoney(seatSum, currency)
  if (seats && seats.amount > 0) {
    rows.push({ key: 'seats', label: 'Seat selection', ...seats })
  }

  const ancSum = sumAncillaryCharges(data) ?? sumAncillaryCharges(bookingContext)
  const ancillaries = toMoney(ancSum, currency)
  if (ancillaries && ancillaries.amount > 0) {
    rows.push({ key: 'ancillaries', label: 'Extras & ancillaries', ...ancillaries })
  }

  return {
    currency,
    total,
    rows,
    hasBreakdown: rows.length > 0,
  }
}

export const buildHoldPayload = (data) => {
  const bnpl = bnplOptionFromData(data)
  const holdOptionId =
    data.holdOptionId ||
    data.holdOption?.paymentCode ||
    bnpl?.paymentCode ||
    'BNPL_24Hrs'

  return {
    action: 'holdNow',
    holdOptionId,
    paymentCode: holdOptionId,
    paymentType: 'BNPL',
    cookie: data.cookie ?? null,
  }
}

export const buildPaymentSelectPayload = (method, data) => ({
  action: 'selectPayment',
  paymentType: method.paymentType,
  paymentCode: method.paymentCode,
  fopCode: method.fopCode,
  fopSubCode: method.fopSubCode,
  fopSubQQCode: method.fopSubQQCode ?? null,
  afopQQCode: method.afopQQCode ?? null,
  paymentName: method.paymentName,
  amount: method.amount ?? null,
  cookie: data.cookie ?? null,
})