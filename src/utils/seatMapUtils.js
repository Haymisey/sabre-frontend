import {
  buildPassengersFromCounts,
  normalizePassengerCounts,
} from './passengers'
import { TYPE_LABELS } from './passengerForm'

export const PAX_PALETTE = [
  {
    id: 1,
    chip: 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/50',
    seat: 'bg-[var(--accent)]/45 border-[var(--accent)] ring-[var(--accent)]/60',
    dot: 'bg-[var(--accent)]',
  },
  {
    id: 2,
    chip: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    seat: 'bg-blue-500/45 border-blue-400 ring-blue-400/60',
    dot: 'bg-blue-400',
  },
  {
    id: 3,
    chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    seat: 'bg-emerald-500/45 border-emerald-400 ring-emerald-400/60',
    dot: 'bg-emerald-400',
  },
  {
    id: 4,
    chip: 'bg-violet-500/20 text-violet-300 border-violet-500/50',
    seat: 'bg-violet-500/45 border-violet-400 ring-violet-400/60',
    dot: 'bg-violet-400',
  },
  {
    id: 5,
    chip: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    seat: 'bg-rose-500/45 border-rose-400 ring-rose-400/60',
    dot: 'bg-rose-400',
  },
  {
    id: 6,
    chip: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    seat: 'bg-amber-500/45 border-amber-400 ring-amber-400/60',
    dot: 'bg-amber-400',
  },
  {
    id: 7,
    chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    seat: 'bg-cyan-500/45 border-cyan-400 ring-cyan-400/60',
    dot: 'bg-cyan-400',
  },
  {
    id: 8,
    chip: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    seat: 'bg-orange-500/45 border-orange-400 ring-orange-400/60',
    dot: 'bg-orange-400',
  },
  {
    id: 9,
    chip: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
    seat: 'bg-pink-500/45 border-pink-400 ring-pink-400/60',
    dot: 'bg-pink-400',
  },
]

export const getSeatCode = (seat) =>
  seat?.seatCode || seat?.code || seat?.number || null

const extractSabrePrice = (seat) => {
  const entry =
    seat?.total?.alternatives?.[0]?.[0] ??
    seat?.prices?.alternatives?.[0]?.[0] ??
    null
  if (!entry?.amount && entry?.amount !== 0) return { price: null, currency: 'ETB' }
  const amount = Number(entry.amount)
  if (seat?.freeOfCharge && amount === 0) return { price: null, currency: entry.currency || 'ETB' }
  return {
    price: Number.isFinite(amount) && amount > 0 ? amount : null,
    currency: entry.currency || 'ETB',
  }
}

const SABRE_CHAR_LABELS = {
  W: 'Window',
  A: 'Aisle',
  CH: 'Premium / chargeable',
  E: 'Exit row',
  L: 'Extra legroom',
}

const SABRE_DESIGNATION_LABELS = {
  FRONT_OF_CABIN: 'Front of cabin',
  EXIT_ROW: 'Exit row',
}

/** Map one Sabre seat slot to our internal seat object */
const normalizeSabreSeatSlot = (slot) => {
  if (!slot || slot.storefrontSlotCode !== 'SEAT' || !slot.code) return null

  const { price, currency } = extractSabrePrice(slot)
  const chars = (slot.seatCharacteristics || [])
    .map((c) => SABRE_CHAR_LABELS[c] || c)
    .filter(Boolean)
  const designations = (slot.designations || [])
    .map((d) => SABRE_DESIGNATION_LABELS[d] || d.replace(/_/g, ' ').toLowerCase())
    .filter(Boolean)

  return {
    seatCode: slot.code,
    code: slot.code,
    column: String(slot.code).replace(/^\d+/, '').toUpperCase(),
    available: slot.available === true,
    isAvailable: slot.available === true,
    entitled: slot.entitled,
    freeOfCharge: slot.freeOfCharge,
    price,
    currency,
    storefrontSlotCode: slot.storefrontSlotCode,
    seatCharacteristics: slot.seatCharacteristics,
    designations: slot.designations,
    description: [...designations, ...chars].join(' · ') || null,
    characteristics: chars,
  }
}

export const getSeatColumn = (seat) => {
  if (!seat) return ''
  if (seat.column) return String(seat.column).toUpperCase()
  if (seat.seatColumn) return String(seat.seatColumn).toUpperCase()
  const code = getSeatCode(seat)
  return code ? code.replace(/^\d+/, '').toUpperCase() : ''
}

export const isSeatCell = (cell) => {
  if (!cell || typeof cell !== 'object') return false
  if (cell.spacer || cell.isAisle || cell.type === 'AISLE' || cell.type === 'EMPTY') {
    return false
  }
  if (
    cell.storefrontSlotCode &&
    cell.storefrontSlotCode !== 'SEAT'
  ) {
    return false
  }
  return Boolean(getSeatCode(cell))
}

export const isSeatAvailable = (seat) => {
  if (!isSeatCell(seat)) return false
  if (seat.entitled === false) return false
  if (seat.isAvailable === false) return false
  if (seat.available === false) return false
  const status = String(seat.status || seat.seatStatus || '').toUpperCase()
  if (['OCCUPIED', 'BLOCKED', 'UNAVAILABLE', 'RESERVED', 'TAKEN'].includes(status)) {
    return false
  }
  if (['AVAILABLE', 'FREE', 'OPEN', 'F', 'A'].includes(status)) return true
  if (seat.isAvailable === true || seat.available === true) return true
  return status === '' || status === 'UNKNOWN'
}

export const getSeatPrice = (seat) => {
  const fromSabre = extractSabrePrice(seat)
  if (fromSabre.price != null) return fromSabre.price

  const raw =
    seat?.price ??
    seat?.amount ??
    seat?.totalPrice ??
    seat?.fare ??
    seat?.seatPrice ??
    seat?.offerPrice
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export const getSeatCurrency = (seat, fallback = 'ETB') => {
  const fromSabre = extractSabrePrice(seat)
  if (fromSabre.currency) return fromSabre.currency
  return seat?.currency || seat?.priceCurrency || fallback
}

export const getSeatType = (seat) =>
  seat?.type || seat?.seatType || seat?.category || seat?.seatCategory || null

export const getSeatDescription = (seat) => {
  if (!seat) return null
  if (seat.description) return seat.description
  if (seat.seatDescription) return seat.seatDescription
  if (seat.longDescription) return seat.longDescription

  const sabreParts = []
  if (Array.isArray(seat.designations)) {
    seat.designations.forEach((d) => {
      sabreParts.push(SABRE_DESIGNATION_LABELS[d] || d.replace(/_/g, ' ').toLowerCase())
    })
  }
  if (Array.isArray(seat.seatCharacteristics)) {
    seat.seatCharacteristics.forEach((c) => {
      sabreParts.push(SABRE_CHAR_LABELS[c] || c)
    })
  }
  if (sabreParts.length) return sabreParts.join(' · ')

  if (Array.isArray(seat.characteristics) && seat.characteristics.length) {
    return seat.characteristics.join(' · ')
  }
  if (seat.characteristics && typeof seat.characteristics === 'string') {
    return seat.characteristics
  }
  const parts = []
  if (seat.isExitRow || seat.exitRow) parts.push('Exit row')
  if (seat.isExtraLegroom || seat.extraLegroom) parts.push('Extra legroom')
  if (seat.isWindow) parts.push('Window')
  if (seat.isAisle) parts.push('Aisle')
  return parts.length ? parts.join(' · ') : null
}

const buildSabreColumnGroups = (seatColumns = [], seats = []) => {
  const groups = []
  let current = []

  seatColumns.forEach((col, i) => {
    if (col === 'AISLE' || col === 'LEFT_SIDE' || col === 'RIGHT_SIDE') {
      if (current.length) {
        groups.push(current)
        current = []
      }
      return
    }

    const slot = seats[i]
    const normalized = normalizeSabreSeatSlot(slot)
    if (normalized) {
      current.push(normalized)
    } else {
      current.push({ spacer: true, column: col })
    }
  })

  if (current.length) groups.push(current)
  return groups
}

const normalizeSabreCabinRows = (cabin) => {
  const seatColumns = cabin?.seatColumns || []
  const seatRows = cabin?.seatRows || []

  const seatLayoutRows = seatRows.filter(
    (row) =>
      Array.isArray(row.seatCodes) &&
      row.seatCodes.includes('SEAT') &&
      Array.isArray(row.seats) &&
      row.seats.some((s) => s?.storefrontSlotCode === 'SEAT' && s?.code),
  )

  return seatLayoutRows.map((row) => {
    const columnGroups = buildSabreColumnGroups(seatColumns, row.seats)
    const flatSeats = columnGroups.flat().filter(isSeatCell)
    return {
      rowNumber: row.rowNumber,
      columnGroups,
      seats: flatSeats,
    }
  })
}

const normalizeSabreCabin = (cabin, segment) => ({
  cabinClass: segment?.cabinClass || cabin?.deck || 'Economy',
  firstRow: cabin?.firstRow ?? cabin?.startRow,
  lastRow: cabin?.lastRow ?? cabin?.endRow,
  aircraft: cabin?.aircraft || segment?.equipment,
  rows: normalizeSabreCabinRows(cabin),
})

const buildFlightInfoFromSegment = (segment, seatMap) => {
  if (!segment) return null
  const fn = segment.flight?.flightNumber
  return {
    flightNumber: fn ? `ET${fn}` : null,
    from: segment.origin,
    to: segment.destination,
    departure: segment.departure,
    arrival: segment.arrival,
    aircraft: segment.equipment || seatMap?.aircraft,
    cabinClass: segment.cabinClass,
  }
}

const extractSabreSegmentBundle = (data) => {
  const segmentMaps =
    data?.raw?.segmentSeatMaps ??
    data?.segmentSeatMaps ??
    data?.raw?.seatMaps ??
    []

  if (!segmentMaps.length) return null

  const bundle = segmentMaps[0]
  const segment = bundle?.segment
  const seatMap =
    bundle?.seatMap ??
    bundle?.passengerSeatMaps?.[0]?.seatMap ??
    null

  const apiPassengers = (bundle?.passengerSeatMaps || [])
    .map((psm) => psm?.passenger)
    .filter(Boolean)

  return { segment, seatMap, apiPassengers }
}

const parseRowNumber = (row, seats) => {
  if (row?.rowNumber != null) return row.rowNumber
  if (row?.number != null) return row.number
  const code = getSeatCode(seats?.find?.(isSeatCell))
  if (code) {
    const m = String(code).match(/^(\d+)/)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

const buildGroupsFromColumnGroups = (seats, columnGroups) => {
  if (!Array.isArray(columnGroups) || columnGroups.length === 0) {
    return inferColumnGroups(seats)
  }

  const first = columnGroups[0]
  if (Array.isArray(first) && typeof first[0] === 'string') {
    return columnGroups.map((letters) =>
      letters.map((letter) => {
        const found = seats.find((s) => getSeatColumn(s) === String(letter).toUpperCase())
        return found || { spacer: true, column: letter }
      }),
    )
  }

  if (Array.isArray(first) && typeof first[0] === 'number') {
    return columnGroups.map((indices) =>
      indices
        .map((i) => seats[i])
        .map((cell) => cell || { spacer: true }),
    )
  }

  return inferColumnGroups(seats)
}

export const inferColumnGroups = (seats) => {
  if (!Array.isArray(seats) || seats.length === 0) return []

  const groups = []
  let chunk = []

  for (const cell of seats) {
    if (isSeatCell(cell)) {
      chunk.push(cell)
    } else {
      if (chunk.length) {
        groups.push(chunk)
        chunk = []
      }
    }
  }
  if (chunk.length) groups.push(chunk)

  if (groups.length === 1) {
    const n = groups[0].length
    if (n === 9) {
      return [groups[0].slice(0, 3), groups[0].slice(3, 6), groups[0].slice(6, 9)]
    }
    if (n === 10) {
      return [groups[0].slice(0, 3), groups[0].slice(3, 7), groups[0].slice(7, 10)]
    }
    if (n === 8) {
      return [groups[0].slice(0, 2), groups[0].slice(2, 6), groups[0].slice(6, 8)]
    }
    if (n === 7) {
      return [groups[0].slice(0, 3), groups[0].slice(3, 4), groups[0].slice(4, 7)]
    }
    if (n === 6) {
      return [groups[0].slice(0, 3), groups[0].slice(3, 6)]
    }
  }

  return groups.length ? groups : [seats.filter(isSeatCell)]
}

const normalizeCabinRows = (cabin) => {
  const rows = cabin?.rows || cabin?.row || []
  const cabinColumnGroups = cabin?.columnGroups || cabin?.columns

  return rows.map((row) => {
    const seats = row.seats || row.columns || row.items || []
    const columnGroups = row.columnGroups
      ? buildGroupsFromColumnGroups(seats, row.columnGroups)
      : buildGroupsFromColumnGroups(seats, cabinColumnGroups)

    return {
      rowNumber: parseRowNumber(row, seats),
      columnGroups,
      seats,
    }
  })
}

/** Unwrap n8n / nested seat_map ui_data */
export const normalizeSeatMapUiData = (raw) => {
  let data = raw

  if (Array.isArray(data)) {
    const first = data[0]
    data = first?.ui_data ?? first?.seatMap ?? first
  }

  if (data?.ui_data) data = data.ui_data
  if (data?.seatMap && typeof data.seatMap === 'object' && !data?.raw?.segmentSeatMaps) {
    data = { ...data, ...data.seatMap }
  }

  const sabreBundle = extractSabreSegmentBundle(data)
  let cabins = []
  let flightInfo = data?.flightInfo || data?.flight || null
  let apiPassengers = sabreBundle?.apiPassengers || data?.passengers || null

  if (sabreBundle?.seatMap?.cabins?.length) {
    cabins = sabreBundle.seatMap.cabins.map((cabin) =>
      normalizeSabreCabin(cabin, sabreBundle.segment),
    )
    flightInfo =
      buildFlightInfoFromSegment(sabreBundle.segment, sabreBundle.seatMap) ||
      flightInfo
  } else {
    let cabinSource = data?.cabins
    if (!cabinSource?.length && data?.rows) {
      cabinSource = [data]
    }
    if (!cabinSource?.length && data?.cabin) {
      cabinSource = [data.cabin]
    }

    cabins = (cabinSource || []).map((cabin) => ({
      cabinClass: cabin.cabinClass || cabin.class || cabin.name || 'Cabin',
      firstRow: cabin.firstRow ?? cabin.startRow,
      lastRow: cabin.lastRow ?? cabin.endRow,
      rows: normalizeCabinRows(cabin),
    }))
    flightInfo = flightInfo || data?.segment || null
  }

  return {
    cabins,
    flightInfo,
    cookie: data?.cookie ?? data?.raw?.cookieSabreDataRequest ?? null,
    passengers: apiPassengers,
    passengerCounts: data?.passengerCounts || null,
    departure: flightInfo?.departure || data?.departure || null,
    origin: flightInfo?.from || null,
    destination: flightInfo?.to || null,
  }
}

const typeOrdinal = (type, indexAmongType) => {
  const label = TYPE_LABELS[type] || 'Passenger'
  return indexAmongType > 0 ? `${label} ${indexAmongType + 1}` : label
}

/** Travelers who need their own seat (infants are lap — no seat picker). */
export const buildSeatablePassengers = (handlers, data) => {
  const ctx = handlers?.bookingContext
  const apiPassengers =
    (Array.isArray(data?.passengers) && data.passengers.length > 0
      ? data.passengers
      : null) || ctx?.passengers

  if (Array.isArray(apiPassengers) && apiPassengers.length > 0) {
    const withNames = apiPassengers
      .map((p, i) => {
        const type = p.passengerInfo?.type || 'ADT'
        const first = p.passengerDetails?.firstName || ''
        const last = p.passengerDetails?.lastName || ''
        const name = [first, last].filter(Boolean).join(' ').trim()
        return {
          passengerIndex: p.passengerIndex ?? i + 1,
          type,
          label: name || null,
        }
      })
      .filter((p) => p.type !== 'INF' && p.type !== 'INFANT')

    const tallies = { ADT: 0, CHLD: 0 }
    return withNames.map((p) => {
      const ord = tallies[p.type] ?? 0
      tallies[p.type] = ord + 1
      return {
        ...p,
        label: p.label || typeOrdinal(p.type === 'CHD' ? 'CHLD' : p.type, ord),
        color: PAX_PALETTE[(p.passengerIndex - 1) % PAX_PALETTE.length],
      }
    })
  }

  const counts = normalizePassengerCounts(
    handlers?.searchPassengerCounts ||
      ctx?.passengerCounts ||
      data?.passengerCounts ||
      { ADT: 1, CHLD: 0, INF: 0 },
  )

  const slots = buildPassengersFromCounts(counts).filter((p) => p.type !== 'INF')
  const tallies = { ADT: 0, CHLD: 0 }

  return slots.map((p, i) => {
    const ord = tallies[p.type] ?? 0
    tallies[p.type] = ord + 1
    const passengerIndex = i + 1
    return {
      passengerIndex,
      type: p.type,
      label: typeOrdinal(p.type, ord),
      color: PAX_PALETTE[i % PAX_PALETTE.length],
    }
  })
}

export const collectSeatCatalog = (cabins) => {
  const types = new Map()
  const priceTiers = new Map()

  for (const cabin of cabins || []) {
    for (const row of cabin.rows || []) {
      for (const seat of row.seats || []) {
        if (!isSeatCell(seat)) continue
        const type = getSeatType(seat) || 'Standard'
        types.set(type, (types.get(type) || 0) + 1)

        const price = getSeatPrice(seat)
        if (price != null) {
          const key = `${getSeatCurrency(seat)}-${price}`
          if (!priceTiers.has(key)) {
            priceTiers.set(key, {
              price,
              currency: getSeatCurrency(seat),
              count: 0,
            })
          }
          priceTiers.get(key).count += 1
        }
      }
    }
  }

  return {
    types: [...types.keys()],
    priceTiers: [...priceTiers.values()].sort((a, b) => a.price - b.price),
  }
}

export const buildSeatSelectionPayload = ({
  assignments,
  passengers,
  flightInfo,
  data,
  handlers,
}) => {
  const selectedSeats = passengers
    .filter((p) => assignments[p.passengerIndex])
    .map((p) => {
      const seat = assignments[p.passengerIndex]
      return {
        seatCode: getSeatCode(seat),
        origin: flightInfo?.from || data?.origin || seat?.origin,
        destination: flightInfo?.to || data?.destination || seat?.destination,
        departure:
          flightInfo?.departure || data?.departure || seat?.departure || null,
        passengerIndex: p.passengerIndex,
        price: getSeatPrice(seat),
        currency: getSeatCurrency(seat),
        type: getSeatType(seat),
        successful: true,
      }
    })

  return {
    action: 'selectSeat',
    selectedSeats,
    cookie: data?.cookie ?? handlers?.bookingContext?.cookie ?? null,
  }
}

export const buildSeatConfirmMessage = (assignments, passengers) => {
  const parts = passengers
    .filter((p) => assignments[p.passengerIndex])
    .map((p) => {
      const seat = assignments[p.passengerIndex]
      return `${getSeatCode(seat)} (${p.label})`
    })

  if (parts.length === 0) return 'Confirm my seat selections'
  if (parts.length === 1) return `Please reserve seat ${parts[0]}`
  return `Please reserve seats: ${parts.join(', ')}`
}
