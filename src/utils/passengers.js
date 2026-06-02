export const INITIAL_PASSENGER_COUNTS = { ADT: 1, CHLD: 0, INF: 0 }

const readInt = (match) => (match ? parseInt(match[1], 10) : 0)

/** Parse "2 adults", "1 child", "solo", etc. from chat text */
export const parsePassengerCountsFromText = (text = '') => {
  const m = text.toLowerCase()
  const result = { ADT: 0, CHLD: 0, INF: 0 }

  if (/\b(just me|solo|alone|by myself|one person|1 person)\b/.test(m)) {
    return { ADT: 1, CHLD: 0, INF: 0 }
  }

  result.ADT = readInt(m.match(/(\d+)\s*adults?/)) || readInt(m.match(/(\d+)\s*adt\b/))
  result.CHLD =
    readInt(m.match(/(\d+)\s*children?/)) ||
    readInt(m.match(/(\d+)\s*child\b/)) ||
    readInt(m.match(/(\d+)\s*chd\b/))
  result.INF = readInt(m.match(/(\d+)\s*infants?/)) || readInt(m.match(/(\d+)\s*inf\b/))

  if (result.ADT + result.CHLD + result.INF === 0) return null

  if (result.ADT < 1) {
    if (result.CHLD > 0 || result.INF > 0) result.ADT = 1
    else return null
  }

  const normalized = normalizePassengerCounts(result)
  return validatePassengerCounts(normalized) ? null : normalized
}

/** Parse "for 2 adults" from assistant replies */
export const parsePassengerCountsFromAssistant = (text = '') => {
  const fromText = parsePassengerCountsFromText(text)
  if (fromText) return fromText

  const m = text.toLowerCase()
  const forPax = m.match(/for\s+(\d+)\s+(adults?|children?|child|infants?)/)
  if (forPax) {
    const n = parseInt(forPax[1], 10)
    const type = forPax[2]
    if (type.startsWith('adult')) return normalizePassengerCounts({ ADT: n, CHLD: 0, INF: 0 })
    if (type.startsWith('child')) return normalizePassengerCounts({ ADT: 1, CHLD: n, INF: 0 })
    if (type.startsWith('infant')) return normalizePassengerCounts({ ADT: n, CHLD: 0, INF: n })
  }
  return null
}

/** Extract counts from API body or ui_data */
export const extractPassengersFromResponse = (data, uiData) => {
  const raw = data?.passengers ?? uiData?.passengers ?? uiData?.passengerCounts ?? null
  if (!raw || typeof raw !== 'object') return null
  const normalized = normalizePassengerCounts(raw)
  if (normalized.ADT < 1 && normalized.CHLD + normalized.INF === 0) return null
  return validatePassengerCounts(normalized) ? null : normalized
}

export const PASSENGER_TYPES = [
  { key: 'ADT', label: 'Adults', sublabel: '12+ years', min: 1, max: 9 },
  { key: 'CHLD', label: 'Children', sublabel: '2–11 years', min: 0, max: 8 },
  { key: 'INF', label: 'Infants', sublabel: 'Under 2', min: 0, max: 9 },
]

export const buildPassengersFromCounts = (counts) => {
  const passengers = []
  const adt = Math.max(0, Number(counts?.ADT) || 0)
  const chld = Math.max(0, Number(counts?.CHLD) || 0)
  const inf = Math.max(0, Number(counts?.INF) || 0)

  for (let i = 0; i < adt; i++) passengers.push({ type: 'ADT' })
  for (let i = 0; i < chld; i++) passengers.push({ type: 'CHLD' })
  for (let i = 0; i < inf; i++) passengers.push({ type: 'INF' })

  return passengers
}

export const normalizePassengerCounts = (counts) => ({
  ADT: Math.max(0, Number(counts?.ADT) || 0),
  CHLD: Math.max(0, Number(counts?.CHLD ?? counts?.CHD) || 0),
  INF: Math.max(0, Number(counts?.INF) || 0),
})

export const validatePassengerCounts = (counts) => {
  const c = normalizePassengerCounts(counts)

  if (c.ADT < 1) return 'At least 1 adult is required.'
  const total = c.ADT + c.CHLD + c.INF
  if (total > 9) return 'Maximum 9 passengers per booking.'
  if (c.INF > c.ADT) return 'Each infant must travel with an adult (infants ≤ adults).'

  return null
}

export const formatPassengerCountsLabel = (counts) => {
  const c = normalizePassengerCounts(counts)
  const parts = []
  if (c.ADT) parts.push(`${c.ADT} Adult${c.ADT !== 1 ? 's' : ''}`)
  if (c.CHLD) parts.push(`${c.CHLD} Child${c.CHLD !== 1 ? 'ren' : ''}`)
  if (c.INF) parts.push(`${c.INF} Infant${c.INF !== 1 ? 's' : ''}`)
  return parts.join(', ') || '1 Adult'
}

export const formatPassengerCountsShort = (counts) => {
  const c = normalizePassengerCounts(counts)
  return `ADT:${c.ADT}, CHLD:${c.CHLD}, INF:${c.INF}`
}

/** Sabre search session format — locks ADT/CHD/INF for entire booking */
export const formatPassengersForSearch = (counts) => {
  const c = normalizePassengerCounts(counts)
  return { ADT: c.ADT, CHD: c.CHLD, INF: c.INF }
}

export const CABIN_CLASS_LABELS = ['', 'Economy', 'Business', 'First Class']

export const buildPassengerSearchMessage = (passengers, cabinClass, flightDetails = {}) => {
  const c = normalizePassengerCounts(passengers)
  const parts = []
  if (c.ADT) parts.push(`${c.ADT} adult${c.ADT !== 1 ? 's' : ''}`)
  if (c.CHLD) parts.push(`${c.CHLD} child${c.CHLD !== 1 ? 'ren' : ''}`)
  if (c.INF) parts.push(`${c.INF} infant${c.INF !== 1 ? 's' : ''}`)
  const paxDesc = parts.join(', ')
  const cabinLabel = CABIN_CLASS_LABELS[cabinClass] || 'Economy'
  const { origin, destination, date } = flightDetails

  if (origin && destination) {
    return `Search ${cabinLabel} flights from ${origin} to ${destination}${date ? ` on ${date}` : ''} for ${paxDesc}`
  }
  return `Search flights for ${paxDesc} in ${cabinLabel}`
}

export const countPassengersByType = (apiPassengers) => {
  const got = { ADT: 0, CHLD: 0, INF: 0 }
  apiPassengers?.forEach((p) => {
    const t = p.passengerInfo?.type
    if (t === 'CHD' || t === 'CHLD') got.CHLD++
    else if (t === 'INF') got.INF++
    else if (t === 'ADT') got.ADT++
  })
  return got
}

export const validatePassengersMatchSearch = (apiPassengers, searchCounts) => {
  const expected = normalizePassengerCounts(searchCounts)
  const got = countPassengersByType(apiPassengers)
  if (
    got.ADT !== expected.ADT ||
    got.CHLD !== expected.CHLD ||
    got.INF !== expected.INF
  ) {
    return (
      `This search was for ${formatPassengerCountsLabel(expected)} only. ` +
      `You cannot add ${formatPassengerCountsLabel(got)}. Start a new search to change traveler counts.`
    )
  }
  return null
}
