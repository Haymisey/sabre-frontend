import { normalizePassengerCounts } from './passengers'

export const NAME_PREFIXES = {
  ADT: ['MR', 'MRS', 'MS', 'DR'],
  CHLD: ['MSTR', 'MISS'],
  INF: ['MSTR', 'MISS'],
}

export const GENDERS = ['MALE', 'FEMALE']

export const COUNTRY_CODES = [
  { code: '251', label: 'Ethiopia (+251)' },
  { code: '1', label: 'USA/Canada (+1)' },
  { code: '44', label: 'UK (+44)' },
  { code: '971', label: 'UAE (+971)' },
]

export const TYPE_LABELS = {
  ADT: 'Adult',
  CHLD: 'Child',
  INF: 'Infant',
}

const NAME_RE = /^[a-zA-Z\s'-]{2,40}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** API expects plain digits/strings — no +, spaces, or symbols in phone/countryCode */
export const sanitizeDigitsOnly = (value) => String(value ?? '').replace(/\D/g, '')

export const sanitizeCountryCode = (value) => {
  const digits = sanitizeDigitsOnly(value)
  return digits || '251'
}

export const sanitizePhoneNumber = (value) => sanitizeDigitsOnly(value)

export const sanitizeEmail = (value) => String(value ?? '').trim().toLowerCase()

export const createEmptyPassengerForm = (passengerIndex, type) => ({
  passengerIndex,
  type,
  prefix: type === 'ADT' ? 'MR' : 'MSTR',
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  gender: 'MALE',
  email: '',
})

export const createEmptyContactForm = () => ({
  countryCode: '251',
  number: '',
  email: '',
})

export const createFormsFromCounts = (counts) => {
  const c = normalizePassengerCounts(counts)
  const forms = []
  let index = 1
  for (let i = 0; i < c.ADT; i++) forms.push(createEmptyPassengerForm(index++, 'ADT'))
  for (let i = 0; i < c.CHLD; i++) forms.push(createEmptyPassengerForm(index++, 'CHLD'))
  for (let i = 0; i < c.INF; i++) forms.push(createEmptyPassengerForm(index++, 'INF'))
  return forms
}

const ageOnDate = (dob, refDate = new Date()) => {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  let age = refDate.getFullYear() - birth.getFullYear()
  const m = refDate.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) age--
  return age
}

export const validatePassengerForm = (form) => {
  const errors = {}
  const label = TYPE_LABELS[form.type] || 'Passenger'

  if (!form.prefix) errors.prefix = 'Select a title.'
  if (!form.firstName?.trim()) errors.firstName = 'First name is required.'
  else if (!NAME_RE.test(form.firstName.trim())) errors.firstName = 'Use letters only (2–40 characters).'

  if (!form.lastName?.trim()) errors.lastName = 'Last name is required.'
  else if (!NAME_RE.test(form.lastName.trim())) errors.lastName = 'Use letters only (2–40 characters).'

  if (form.middleName?.trim() && !NAME_RE.test(form.middleName.trim())) {
    errors.middleName = 'Invalid middle name.'
  }

  if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.'
  else {
    const age = ageOnDate(form.dateOfBirth)
    if (age == null) errors.dateOfBirth = 'Invalid date.'
    else if (form.type === 'ADT' && age < 12) errors.dateOfBirth = `${label} must be 12 years or older.`
    else if (form.type === 'CHLD' && (age < 2 || age >= 12)) {
      errors.dateOfBirth = 'Child must be between 2 and 11 years old.'
    } else if (form.type === 'INF' && age >= 2) {
      errors.dateOfBirth = 'Infant must be under 2 years old.'
    }
  }

  if (!form.gender) errors.gender = 'Select gender.'
  if (!form.email?.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.'

  return errors
}

export const validateContactForm = (contact) => {
  const errors = {}
  const countryCode = sanitizeCountryCode(contact.countryCode)
  const number = sanitizePhoneNumber(contact.number)
  const email = sanitizeEmail(contact.email)

  if (!countryCode) errors.countryCode = 'Select country code.'
  if (!/^\d{6,12}$/.test(number)) {
    errors.number = 'Phone number must be 6–12 digits (no + or spaces).'
  }
  if (!email) errors.email = 'Booking contact email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  return errors
}

export const validateAllBookingForms = (passengerForms, contactForm) => {
  const passengerErrors = passengerForms.map((f) => validatePassengerForm(f))
  const contactErrors = validateContactForm(contactForm)
  const hasPassengerErrors = passengerErrors.some((e) => Object.keys(e).length > 0)
  const hasContactErrors = Object.keys(contactErrors).length > 0
  return {
    valid: !hasPassengerErrors && !hasContactErrors,
    passengerErrors,
    contactErrors,
  }
}

export const apiTypeFromForm = (type) => (type === 'CHLD' ? 'CHD' : type)

export const buildApiPassenger = (form) => ({
  '@id': String(form.passengerIndex),
  passengerIndex: form.passengerIndex,
  passengerDetails: {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    prefix: form.prefix,
    middleName: form.middleName?.trim() || null,
    maidenName: null,
    suffix: null,
  },
  passengerInfo: {
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    redressNumber: null,
    knownTravelerNumber: null,
    type: apiTypeFromForm(form.type),
    emails: [sanitizeEmail(form.email)],
    phones: [],
    address: null,
  },
  preferences: {
    specialPreferences: {
      mealPreference: null,
      seatPreference: null,
      specialRequests: [],
    },
    frequentFlyer: null,
  },
  documentInfo: null,
  visaInfo: null,
})

export const buildApiContact = (contactForm) => {
  const email = sanitizeEmail(contactForm?.email)
  const countryCode = sanitizeCountryCode(contactForm?.countryCode)
  const number = sanitizePhoneNumber(contactForm?.number)

  return {
    emails: email ? [email] : [],
    phones: number
      ? [
          {
            type: 'MOBILE',
            countryCode,
            areaCode: null,
            number,
            extension: null,
          },
        ]
      : [],
  }
}

/** Normalize contact — strips + from countryCode; digits-only phone; plain email */
export const sanitizeApiContact = (contact) => {
  if (!contact || typeof contact !== 'object') {
    return buildApiContact({ countryCode: '251', number: '', email: '' })
  }

  if (Array.isArray(contact.phones) && contact.phones.length > 0) {
    return {
      emails: (contact.emails || []).map(sanitizeEmail).filter(Boolean),
      phones: contact.phones.map((p) => ({
        type: p.type || 'MOBILE',
        countryCode: sanitizeCountryCode(p.countryCode),
        areaCode: null,
        number: sanitizePhoneNumber(p.number),
        extension: null,
      })),
    }
  }

  return buildApiContact({
    email: contact.email,
    countryCode: contact.countryCode,
    number: contact.number ?? contact.phone ?? contact.mobile,
  })
}

export const buildApiPassengers = (passengerForms) => passengerForms.map(buildApiPassenger)

/** Plain-text summary so the n8n AI agent sees every passenger, not just the lead name */
export const buildPassengerSubmissionMessage = (apiPassengers, apiContact, travelerLabel) => {
  const lines = apiPassengers.map((p, i) => {
    const d = p.passengerDetails
    const info = p.passengerInfo
    return (
      `Passenger ${i + 1} (${info.type}): ${d.prefix} ${d.firstName} ${d.lastName}, ` +
      `DOB ${info.dateOfBirth}, ${info.gender}, email ${info.emails[0]}`
    )
  })
  const phone = apiContact.phones?.[0]
  const phoneStr = phone ? `${phone.countryCode} ${phone.number}` : 'not provided'
  const emailStr = apiContact.emails?.[0] || 'not provided'
  return (
    `Passenger details for ${travelerLabel}:\n${lines.join('\n')}\n` +
    `Contact phone: ${phoneStr}, contact email: ${emailStr}`
  )
}

export const isPassengerFormComplete = (form) =>
  Object.keys(validatePassengerForm(form)).length === 0
