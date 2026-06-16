import axios from 'axios'
import { normalizeSabreCookie } from '../utils/sabreCookie'
import { PURCHASE_IS_DEVELOPMENT } from '../utils/purchaseBodyBuilders'

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || ''
const REQUEST_TIMEOUT = 120000

const PURCHASE_PATHS = {
  exchange: '/api/exchange/purchase',
  booking: '/api/booking/purchase',
}

const purchaseUrl = (mode) => {
  const base = BFF_BASE_URL.replace(/\/$/, '')
  const path = PURCHASE_PATHS[mode] || PURCHASE_PATHS.exchange
  return `${base}${path}`
}

const serializeSabreCookie = (cookieObj) => {
  if (!cookieObj) return null
  const normalized = normalizeSabreCookie(cookieObj)
  if (!normalized || !Array.isArray(normalized.sabreCookies)) return null
  return normalized.sabreCookies
    .map((c) => `${c.key}=${c.value}`)
    .join('; ')
}

/**
 * BFF contract:
 *   POST {VITE_BFF_URL}/api/exchange/purchase  |  /api/booking/purchase
 *   Body: { accessToken, purchase, isDevelopment }
 */
/**
 * UPDATED FUNCTION
 */
export const postCardPurchase = async ({ mode = 'exchange', accessToken, purchase, signal }) => {
  if (!BFF_BASE_URL) {
    throw new Error('VITE_BFF_URL is not configured.')
  }
  if (!accessToken) {
    throw new Error('Missing access token for card payment.')
  }

  const cookieStr = serializeSabreCookie(purchase?.cookieSabreDataRequest)

  const { data } = await axios.post(
    purchaseUrl(mode),
    purchase,
    {
      signal,
      timeout: REQUEST_TIMEOUT,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, 
        'Accept': 'application/json',
        'isDevelopment': true,
        'RiskifiedSessionId': '61f44cbd-1d53-4482-aa80-89245a46ca10',
        ...(cookieStr ? { 'x-sabre-cookie': cookieStr } : {}),
      },
    },
  )

  return data
}

export const extractRedirectInfo = (response) => {
  const redirectInfo = response?.redirectInfo ?? response?.data?.redirectInfo ?? null
  if (!redirectInfo) return null

  return {
    transactionId: redirectInfo.transactionId ?? null,
    html: redirectInfo.payerAuthenticationRequestForm ?? null,
  }
}

export const extractUpdatedCookie = (response) =>
  normalizeSabreCookie(
    response?.cookieSabreDataRequest ??
      response?.cookie ??
      response?.data?.cookieSabreDataRequest ??
      response?.data?.cookie,
  )

export const extractRiskifiedOrderId = (response) =>
  response?.riskifiedOrderId ?? response?.data?.riskifiedOrderId ?? null

export const isCardPurchaseSuccess = (response, mode = 'exchange') => {
  if (response?.statusAPI === 'SUCCESS' && response?.pnr?.reloc) return true

  const msg = String(response?.messageAPI ?? response?.message ?? '').toLowerCase()
  if (msg.includes('ok') && response?.pnr?.reloc) return true

  if (mode === 'exchange') {
    return msg.includes('success') || msg.includes('exchanged')
  }

  return Boolean(response?.pnr?.reloc) || (msg.includes('ok') && !response?.redirectInfo)
}

export const extractConfirmedPnr = (response) =>
  response?.pnr?.reloc ?? response?.pnr ?? null

export const parsePaymentCallbackParams = (params = {}) => ({
  status: params.status || null,
  paymentRef:
    params.paymentRef ||
    params.paymentref ||
    params.PaymentRef ||
    params.merchantReference ||
    params.merchantreference ||
    null,
  resultCode: params.resultCode || params.resultcode || params.ResultCode || null,
  responseCode: params.responseCode || params.responsecode || params.ResponseCode || null,
  merchantId: params.merchantId || params.merchantid || params.MerchantId || 'ET',
  mac: params.mac || params.MAC || null,
  supplierId: params.supplierId || params.supplierid || 'ADYEN',
})

/** Parse query params from a redirect URL (same-origin callback or readable iframe URL). */
export const parsePaymentRedirectUrl = (href = '') => {
  try {
    const url = new URL(href)
    return parsePaymentCallbackParams({
      ...Object.fromEntries(url.searchParams.entries()),
      status: /declined/i.test(href)
        ? 'declined'
        : /cancel/i.test(href)
          ? 'cancel'
          : /error/i.test(href)
            ? 'error'
            : /approved/i.test(href)
              ? 'approved'
              : url.searchParams.get('status'),
    })
  } catch {
    return parsePaymentCallbackParams({})
  }
}

export const isApprovedRedirectUrl = (href = '') =>
  /LandingPage\/Approved/i.test(href) ||
  /[?&]status=approved/i.test(href) ||
  /\/payment\/callback\.html\?.*status=approved/i.test(href)

export const isDeclinedRedirectUrl = (href = '') =>
  /LandingPage\/Declined/i.test(href) ||
  /[?&]status=declined/i.test(href)
