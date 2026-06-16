/** Map PAN prefix to Sabre card codes. */
export const detectCardCode = (number = '') => {
  const digits = String(number).replace(/\D/g, '')
  if (!digits) return null
  if (/^4/.test(digits)) return 'VI'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'CA'
  if (/^3[47]/.test(digits)) return 'AX'
  if (/^6(?:011|5)/.test(digits)) return 'DS'
  if (/^3(?:0[0-5]|[68])/.test(digits)) return 'DC'
  return 'VI'
}

/** MM/YY or MM/YYYY user input → Sabre `YYYY-MM`. */
export const formatExpiryForApi = (raw = '') => {
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length < 4) return null

  const month = digits.slice(0, 2)
  const yearPart = digits.slice(2)
  const monthNum = Number(month)
  if (monthNum < 1 || monthNum > 12) return null

  let year = yearPart
  if (year.length === 2) year = `20${year}`
  if (year.length !== 4) return null

  return `${year}-${month}`
}

export const formatExpiryInput = (raw = '') => {
  const digits = String(raw).replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export const formatCardNumberInput = (raw = '') => {
  const digits = String(raw).replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export const digitsOnly = (value = '') => String(value).replace(/\D/g, '')
