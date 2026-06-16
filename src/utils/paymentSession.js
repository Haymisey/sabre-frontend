import { normalizeSabreCookie } from './sabreCookie'
import { sanitizeEmail } from './passengerForm'

const DEVICE_ID_KEY = 'sabre_device_id'

/** Bearer token from webhook root or ui_data (getOptions / card handoff). */
export const extractAccessToken = (data = {}) => {
  if (!data || typeof data !== 'object') return null
  const ui = data.ui_data
  return (
    data.access_token ??
    data.accessToken ??
    (ui && typeof ui === 'object' && !Array.isArray(ui) ? ui.access_token ?? ui.accessToken : null) ??
    null
  )
}

export const getOrCreateDeviceId = () => {
  if (typeof window === 'undefined') return crypto.randomUUID()
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export const firstDepartureDate = (uiData = {}, bookingContext = null) => {
  if (uiData.departureDate) return uiData.departureDate
  if (uiData.DepartureDate) return uiData.DepartureDate

  const ctxSeg = bookingContext?.option?.segments?.[0]
  if (ctxSeg?.departure) return ctxSeg.departure

  const parts = uiData.itineraryParts ?? bookingContext?.itineraryParts
  if (Array.isArray(parts) && parts[0]?.segments?.[0]?.departure) {
    return parts[0].segments[0].departure
  }

  return null
}

export const resolveBookingEmail = (uiData = {}, bookingContext = null) => {
  const direct = uiData.email ?? uiData.Email
  if (direct) return sanitizeEmail(direct)

  const contactEmail = bookingContext?.contact?.emails?.[0]
  if (contactEmail) return sanitizeEmail(contactEmail)

  const passengerEmail = bookingContext?.passengers?.[0]?.passengerInfo?.emails?.[0]
  if (passengerEmail) return sanitizeEmail(passengerEmail)

  return uiData.billingData?.email ? sanitizeEmail(uiData.billingData.email) : null
}

export const resolvePaymentAmount = (uiData = {}, mode = 'exchange', bookingContext = null) => {
  if (mode === 'booking') {
    const n =
      uiData.totalAmount ??
      uiData.total_amount ??
      uiData.amount ??
      uiData.total?.amount ??
      uiData.price?.total ??
      bookingContext?.fareOption?.total
    return n != null ? Number(n) : null
  }
  const n =
    uiData.fareDifference ??
    uiData.fare_difference ??
    uiData.amount ??
    uiData.totalAmount
  return n != null ? Number(n) : null
}

export const resolvePaymentMethodFields = (uiData = {}) => ({
  paymentId: uiData.paymentId ?? uiData.payment_id ?? '1',
  paymentType: uiData.paymentType ?? uiData.payment_type ?? 'CREDIT_CARD',
  paymentCode: uiData.paymentCode ?? uiData.payment_code ?? uiData.fopCode ?? null,
  fopCode: uiData.fopCode ?? uiData.fop_code ?? uiData.paymentCode ?? null,
  fopSubCode: uiData.fopSubCode ?? uiData.fop_sub_code ?? null,
  fopSubQQCode: uiData.fopSubQQCode ?? uiData.fop_sub_qq_code ?? null,
  afopQQCode: uiData.afopQQCode ?? uiData.afop_qq_code ?? null,
  name: uiData.name ?? uiData.paymentName ?? null,
})

/** Merge getOptions / handoff payload with stored session + booking context. */
export const enrichCardHandoffUiData = (
  uiData = {},
  { paymentSession = null, bookingContext = null, rootData = null } = {},
) => {
  const base = uiData && typeof uiData === 'object' && !Array.isArray(uiData) ? { ...uiData } : {}
  const session = paymentSession && typeof paymentSession === 'object' ? paymentSession : {}
  const token =
    extractAccessToken({ ui_data: base, ...rootData }) ?? session.access_token ?? null

  const cookie =
    normalizeSabreCookie(base.cookie ?? session.cookie ?? bookingContext?.cookie) ?? null

  const mode =
    base.paymentMode ??
    (base.pnr && !bookingContext?.outboundHashCode ? 'exchange' : session.flow) ??
    (bookingContext?.outboundHashCode ? 'booking' : 'exchange')

  const email = resolveBookingEmail(base, bookingContext)
  const departureDate = firstDepartureDate(base, bookingContext)
  const resolvedMode = mode === 'booking' ? 'booking' : 'exchange'

  return {
    ...base,
    paymentMode: resolvedMode,
    access_token: token,
    cookie,
    email: email ?? base.email,
    departureDate: departureDate ?? base.departureDate,
    deviceId: base.deviceId ?? session.deviceId ?? getOrCreateDeviceId(),
    itineraryParts: base.itineraryParts ?? bookingContext?.itineraryParts ?? null,
    passengers: base.passengers ?? bookingContext?.passengers ?? null,
    billingData: base.billingData ?? buildBillingDataFallback(base, bookingContext, email),
    totalAmount: resolvePaymentAmount(base, 'booking', bookingContext),
    fareDifference: resolvePaymentAmount(base, 'exchange', bookingContext),
    currency:
      base.currency ??
      bookingContext?.fareOption?.currency ??
      base.total?.currency ??
      'ETB',
    ...resolvePaymentMethodFields(base),
  }
}

const buildBillingDataFallback = (uiData, bookingContext, email) => {
  if (uiData.billingData) return uiData.billingData

  const contact = bookingContext?.contact
  const phone = contact?.phones?.[0]

  if (!email && !phone) return null

  return {
    street1: uiData.street1 ?? 'N/A',
    street2: null,
    city: uiData.city ?? 'Addis Ababa',
    province: null,
    zipCode: uiData.zipCode ?? '1000',
    country: uiData.country ?? 'ET',
    phone: phone
      ? {
          type: phone.type || 'MOBILE',
          countryCode: phone.countryCode || '251',
          areaCode: phone.countryCode || '251',
          number: phone.number,
        }
      : null,
    email: email || '',
  }
}

export const capturePaymentSessionFromResponse = (
  prev = {},
  {
    data = {},
    uiData = null,
    cookie = null,
    activeFlow = null,
    hasBookingContext = false,
  } = {},
) => {
  const token = extractAccessToken({ ...data, ui_data: uiData })
  const next = { ...prev }

  if (token) next.access_token = token

  const normalizedCookie = normalizeSabreCookie(
    cookie ?? uiData?.cookie ?? data?.cookie ?? data?.ui_data?.cookie,
  )
  if (normalizedCookie) next.cookie = normalizedCookie

  if (activeFlow === 'manage') {
    next.flow = 'exchange'
  } else if (hasBookingContext || activeFlow === 'booking' || uiData?.paymentMode === 'booking') {
    next.flow = 'booking'
  } else if (prev.flow) {
    next.flow = prev.flow
  }

  if (!next.deviceId) next.deviceId = getOrCreateDeviceId()

  return next
}

export const buildCardPaymentSuccessPayload = (uiData = {}, extras = {}) => {
  const method = resolvePaymentMethodFields(uiData)
  return {
    ...method,
    pnr: extras.pnr ?? uiData.pnr ?? null,
    fareDifference: extras.fareDifference ?? uiData.fareDifference ?? null,
    totalAmount: extras.totalAmount ?? uiData.totalAmount ?? null,
    currency: extras.currency ?? uiData.currency ?? 'ETB',
    success: true,
    cookie: extras.cookie ?? uiData.cookie ?? null,
  }
}
