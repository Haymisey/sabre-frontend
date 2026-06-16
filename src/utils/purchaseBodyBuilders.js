import { normalizeSabreCookie } from './sabreCookie'

/** Sent on every Purchase request (booking + exchange). */
export const PURCHASE_IS_DEVELOPMENT = true

const withDevelopmentFlag = (body) => ({
  ...body,
  isDevelopment: PURCHASE_IS_DEVELOPMENT,
})

const ETH_REDIRECT_BASE =
  'https://m.ethiopianairlines.com/redirect-paymentapi/api/LandingPage'

export const buildBrowserDetails = () => {
  if (typeof window === 'undefined') {
    return {
      browserJavaEnabled: true,
      browserJavascriptEnabled: true,
      browserScreenColorDepth: 24,
      browserScreenHeight: 700,
      browserScreenWidth: 900,
      browserTimeZoneOffset: -300,
      challengeWindowSize: 1,
      browserLanguageCode: 'en-US',
    }
  }

  return {
    browserJavaEnabled: true,
    browserJavascriptEnabled: true,
    browserScreenColorDepth: window.screen?.colorDepth ?? 24,
    browserScreenHeight: window.screen?.height ?? 700,
    browserScreenWidth: window.screen?.width ?? 900,
    browserTimeZoneOffset: new Date().getTimezoneOffset(),
    challengeWindowSize: 1,
    browserLanguageCode: navigator.language || 'en-US',
  }
}

/** Sabre / Ethiopian redirect landing pages after 3DS. */
export const buildRedirectUrlData = () => ({
  defaultURL: `${ETH_REDIRECT_BASE}/Default`,
  pendingURL: `${ETH_REDIRECT_BASE}/Pending`,
  approvedURL: `${ETH_REDIRECT_BASE}/Approved`,
  declinedURL: `${ETH_REDIRECT_BASE}/Declined`,
  errorURL: `${ETH_REDIRECT_BASE}/Error`,
  cancelURL: `${ETH_REDIRECT_BASE}/Cancel`,
  challengeURL: `${ETH_REDIRECT_BASE}/Challenge`,
})

const installmentBlock = () => ({
  installmentId: null,
  bankName: null,
  months: null,
})

const basePaymentFields = () => ({
  pin: null,
  installment: installmentBlock(),
  selectedDCCOffer: null,
  redirectUrlData: null,
  afopClientDetail: null,
  fopCode: null,
  fopSubcode: null,
  cancelURL: null,
  successURL: null,
  payerId: null,
  token: null,
  status: null,
  paymentCode: null,
})

const buildCreditCardPayment = ({
  paymentId = '1',
  amount,
  currency = 'ETB',
  cardNumber,
  cvc,
  holderName,
  expirationDate,
  cardCode,
  received3rdPartyData = null,
  includeRedirect = true,
}) => ({
  '@type': 'CREDIT_CARD',
  '@id': String(paymentId),
  amount: { amount: Number(amount), currency },
  ...(cardNumber != null ? { number: cardNumber } : {}),
  ...(cvc != null ? { cvc } : {}),
  holderName: holderName ?? null,
  expirationDate: expirationDate ?? null,
  cardCode: cardCode ?? 'VI',
  received3rdPartyData,
  ...basePaymentFields(),
  redirectData: includeRedirect
    ? {
        redirectUrlData: buildRedirectUrlData(),
        browserDetails: buildBrowserDetails(),
        paRes: null,
        verificationResult: null,
        transactionId: null,
      }
    : null,
})

/** Exchange — initiate (Step 1). */
export const buildExchangeInitiateBody = ({
  fareDifference,
  currency = 'ETB',
  paymentId = '1',
  cardNumber,
  cvc,
  holderName,
  expirationDate,
  cardCode,
  cookie,
}) =>
  withDevelopmentFlag({
    paymentRequired: true,
    payment: [
      buildCreditCardPayment({
        paymentId,
        amount: fareDifference,
        currency,
        cardNumber,
        cvc,
        holderName,
        expirationDate,
        cardCode,
        received3rdPartyData: null,
      }),
    ],
    cookieSabreDataRequest: normalizeSabreCookie(cookie),
  })

/** Exchange — commit (Step 2). */
export const buildExchangeCommitBody = ({
  fareDifference,
  currency = 'ETB',
  paymentId = '1',
  cardNumber,
  cvc,
  holderName,
  expirationDate,
  cardCode,
  transactionId,
  redirectParams = {},
  cookie,
}) =>
  withDevelopmentFlag({
    paymentRequired: true,
    payment: [
      buildCreditCardPayment({
        paymentId,
        amount: fareDifference,
        currency,
        cardNumber,
        cvc,
        holderName,
        expirationDate,
        cardCode,
        received3rdPartyData: {
          supplierId: redirectParams.supplierId || 'ADYEN',
          resultCode: redirectParams.resultCode || 'SUCCESS',
          responseCode: redirectParams.responseCode || 'APPROVED',
          paymentRef: redirectParams.paymentRef || transactionId,
          merchantId: redirectParams.merchantId || 'ET',
          mac: redirectParams.mac || redirectParams.MAC || '',
        },
        includeRedirect: true,
      }),
    ],
    cookieSabreDataRequest: normalizeSabreCookie(cookie),
  })

/** Booking — initiate or commit (full Sabre purchase body). */
export const buildBookingPurchaseBody = ({
  totalAmount,
  currency = 'ETB',
  paymentId = '1',
  cardNumber,
  cvc,
  holderName,
  expirationDate,
  cardCode,
  cookie,
  billingData,
  email,
  departureDate,
  deviceId,
  riskifiedOrderId = null,
  received3rdPartyData = null,
  includeRedirect = true,
}) => {
  const billing = billingData || {
    street1: 'N/A',
    street2: null,
    city: 'Addis Ababa',
    province: null,
    zipCode: '1000',
    country: 'ET',
    phone: null,
    email: email || '',
  }

  const resolvedEmail = email || billing.email || ''

  return withDevelopmentFlag({
    paymentRequired: true,
    payment: [
      buildCreditCardPayment({
        paymentId,
        amount: totalAmount,
        currency,
        cardNumber,
        cvc,
        holderName,
        expirationDate,
        cardCode,
        received3rdPartyData,
        includeRedirect,
      }),
    ],
    billingData: billing,
    languageForBooking: null,
    fraudNetData: null,
    remarksAndSSRs: null,
    profileInput: null,
    queuePlacementData: null,
    holdOptionId: null,
    TinNumber: null,
    CompanyName: null,
    Email: resolvedEmail,
    IsVoucherRequired: false,
    IsAutomatedCheckInRequired: false,
    Remark: '',
    IsNotificationOn: false,
    Language: 'en',
    DepartureDate: departureDate,
    Platform: 1,
    DeviceId: deviceId,
    IsUrbanAirShip: false,
    PurchaseType: 0,
    IsConsentOn: false,
    PayInEthiopianBirr: false,
    MemberProfile: {
      MemberId: null,
      IsEmailVerified: false,
      CreatedAt: null,
      Email: resolvedEmail,
      FirstName: null,
      LasstName: null,
      City: null,
      Phone: null,
      Country: null,
      CountryCode: null,
      Province: null,
      Address1: null,
      Zip: null,
      CurrentTierLevel: null,
    },
    RiskifiedOrderId: riskifiedOrderId,
    cookieSabreDataRequest: normalizeSabreCookie(cookie),
  })
}
