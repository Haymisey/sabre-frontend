import axios from 'axios'

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || ''
const REQUEST_TIMEOUT = 120000

/**
 * Confirm a refund with OTP.
 *
 * @param {{ accessToken: string, cookie: object, otp: string, email: string, signal?: AbortSignal }} params
 */
export const confirmRefund = async ({ accessToken, cookie, otp, email, signal }) => {
  if (!BFF_BASE_URL) {
    throw new Error('VITE_BFF_URL is not configured.')
  }
  if (!accessToken) {
    throw new Error('Missing access token for refund confirmation.')
  }

  const { data } = await axios.post(
    `${BFF_BASE_URL}/api/refund/confirm`,
    {
      confirm: true,
      otp: otp,
      email: email,
      cookieSabreDataRequest: cookie,
    },
    {
      signal,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        IsDevelopment: 'true', // capital D required
      },
    },
  )

  return data
}
