import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Armchair,
  Check,
  ChevronRight,
  Info,
  Plane,
  RotateCcw,
  User,
  X,
} from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import {
  buildSeatConfirmMessage,
  buildSeatSelectionPayload,
  buildSeatablePassengers,
  collectSeatCatalog,
  getSeatCode,
  getSeatColumn,
  getSeatCurrency,
  getSeatDescription,
  getSeatPrice,
  getSeatType,
  isSeatAvailable,
  isSeatCell,
  normalizeSeatMapUiData,
} from '../../utils/seatMapUtils'

function SeatCell({
  seat,
  assignmentPassengerIndex,
  isActivePassengerSeat,
  isFocused,
  passengerColor,
  onClick,
}) {
  const code = getSeatCode(seat)
  const available = isSeatAvailable(seat)
  const assigned = assignmentPassengerIndex != null
  const price = getSeatPrice(seat)

  let className =
    'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[9px] font-mono font-semibold transition-all '

  if (assigned && passengerColor) {
    className += `${passengerColor.seat} text-[var(--bg-dark)] cursor-pointer scale-[1.02]`
  } else if (isFocused) {
    className += 'border-[var(--accent)] bg-[var(--accent)]/30 text-[var(--accent)] ring-2 ring-[var(--accent)]/50 cursor-pointer'
  } else if (!available) {
    className +=
      'border-gray-600/40 bg-gray-700/30 text-gray-600 cursor-not-allowed opacity-60'
  } else if (price != null && price > 0) {
    className +=
      'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 cursor-pointer'
  } else {
    className +=
      'border-green-500/40 bg-green-500/15 text-green-200 hover:bg-green-500/35 cursor-pointer'
  }

  if (isActivePassengerSeat && !assigned) {
    className += ' ring-2 ring-[var(--accent)]/40'
  }

  return (
    <button
      type="button"
      disabled={!available && !assigned}
      onClick={() => onClick(seat)}
      title={code}
      className={className}
    >
      {getSeatColumn(seat) || code?.slice(-1)}
      {assigned && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--bg-dark)] text-[8px] font-bold text-white">
          {assignmentPassengerIndex}
        </span>
      )}
    </button>
  )
}

function AisleGap({ width = 'w-5' }) {
  return <div className={`${width} shrink-0`} aria-hidden />
}

function SeatDetailPanel({
  seat,
  activePassenger,
  assignmentOwner,
  onAssign,
  onReassign,
  onRemove,
  onClose,
}) {
  if (!seat) return null

  const code = getSeatCode(seat)
  const available = isSeatAvailable(seat)
  const price = getSeatPrice(seat)
  const currency = getSeatCurrency(seat)
  const description = getSeatDescription(seat)
  const seatType = getSeatType(seat)

  const ownedByOther =
    assignmentOwner != null &&
    assignmentOwner !== activePassenger?.passengerIndex
  const ownedByActive = assignmentOwner === activePassenger?.passengerIndex

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-xl border border-[var(--accent)]/30 bg-[var(--bg-dark)]/90 p-4 shadow-lg backdrop-blur-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/40">
            <Armchair className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{code}</p>
            {seatType && (
              <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                {seatType}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {description && (
        <p className="mb-3 flex gap-2 text-sm text-[var(--text-secondary)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
          {description}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {price != null ? (
          <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-200">
            +{formatPrice(price, currency)}
          </span>
        ) : (
          <span className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-300">
            Included in fare
          </span>
        )}
        <span
          className={`rounded-lg border px-3 py-1 text-xs ${
            available
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-gray-500/30 bg-gray-500/10 text-gray-400'
          }`}
        >
          {available ? 'Available' : 'Not available'}
        </span>
      </div>

      {ownedByOther && (
        <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          This seat is assigned to Passenger {assignmentOwner}. Select that traveler to
          change it, or pick another seat.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {available && !ownedByOther && activePassenger && (
          <button
            type="button"
            onClick={ownedByActive ? onReassign : onAssign}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-dark)] transition hover:brightness-110"
          >
            <Check className="h-4 w-4" />
            {ownedByActive ? 'Change to another seat' : `Assign to ${activePassenger.label}`}
          </button>
        )}
        {ownedByActive && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:border-red-500/40 hover:text-red-300"
          >
            <RotateCcw className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function SeatMap({ data: rawData, handlers }) {
  const mapData = useMemo(() => normalizeSeatMapUiData(rawData), [rawData])
  const { cabins, flightInfo } = mapData

  const passengers = useMemo(
    () => buildSeatablePassengers(handlers, mapData),
    [handlers, mapData],
  )

  const catalog = useMemo(() => collectSeatCatalog(cabins), [cabins])

  const [activePassengerIndex, setActivePassengerIndex] = useState(
    () => passengers[0]?.passengerIndex ?? 1,
  )
  const [assignments, setAssignments] = useState({})
  const [focusedSeat, setFocusedSeat] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const activePassenger =
    passengers.find((p) => p.passengerIndex === activePassengerIndex) || passengers[0]

  const assignmentBySeatCode = useMemo(() => {
    const map = {}
    Object.entries(assignments).forEach(([paxIdx, seat]) => {
      const code = getSeatCode(seat)
      if (code) map[code] = Number(paxIdx)
    })
    return map
  }, [assignments])

  const assignedCount = Object.keys(assignments).length
  const allAssigned = passengers.length > 0 && assignedCount === passengers.length

  const seatFeesTotal = useMemo(
    () =>
      Object.values(assignments).reduce(
        (sum, seat) => sum + (getSeatPrice(seat) || 0),
        0,
      ),
    [assignments],
  )

  const seatFeesCurrency =
    Object.values(assignments).find((s) => getSeatCurrency(s)) &&
    getSeatCurrency(Object.values(assignments)[0])

  const findAssignmentOwner = useCallback(
    (seatCode) => assignmentBySeatCode[seatCode] ?? null,
    [assignmentBySeatCode],
  )

  const advanceToNextOpen = useCallback(
    (nextAssignments) => {
      const next = passengers.find(
        (p) => !nextAssignments[p.passengerIndex],
      )
      if (next) setActivePassengerIndex(next.passengerIndex)
    },
    [passengers],
  )

  const handleSeatClick = (seat) => {
    if (!isSeatCell(seat)) return
    const code = getSeatCode(seat)
    const owner = findAssignmentOwner(code)

    if (!isSeatAvailable(seat) && owner == null) return

    setFocusedSeat(seat)
    setError(null)

    if (owner === activePassengerIndex) {
      return
    }
  }

  const assignFocusedToActive = () => {
    if (!focusedSeat || !activePassenger) return
    const code = getSeatCode(focusedSeat)
    if (!isSeatAvailable(focusedSeat)) {
      setError('This seat is not available.')
      return
    }

    const owner = findAssignmentOwner(code)
    if (owner != null && owner !== activePassenger.passengerIndex) {
      setError(`Seat ${code} is already assigned to Passenger ${owner}.`)
      return
    }

    setAssignments((prev) => {
      const next = { ...prev }

      Object.keys(next).forEach((paxIdx) => {
        if (getSeatCode(next[paxIdx]) === code) delete next[paxIdx]
      })

      Object.keys(next).forEach((paxIdx) => {
        if (Number(paxIdx) === activePassenger.passengerIndex) delete next[paxIdx]
      })

      next[activePassenger.passengerIndex] = focusedSeat
      advanceToNextOpen(next)
      return next
    })

    setFocusedSeat(null)
    setError(null)
  }

  const removeAssignment = (passengerIndex) => {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[passengerIndex]
      return next
    })
    setFocusedSeat(null)
    setError(null)
  }

  const handleConfirm = () => {
    if (!allAssigned) {
      setError(`Please assign a seat for all ${passengers.length} travelers.`)
      return
    }
    if (handlers?.isLoading || submitting) return

    setSubmitting(true)
    const payload = buildSeatSelectionPayload({
      assignments,
      passengers,
      flightInfo,
      data: mapData,
      handlers,
    })
    const message = buildSeatConfirmMessage(assignments, passengers)

    handlers?.sendMessage?.(message, payload)
    setSubmitting(false)
  }

  const columnLetters = useMemo(() => {
    const firstRow = cabins[0]?.rows?.[0]
    if (!firstRow) return []
    return firstRow.columnGroups.flatMap((group) =>
      group.map((cell) => (isSeatCell(cell) ? getSeatColumn(cell) : null)).filter(Boolean),
    )
  }, [cabins])

  if (!cabins.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)]">
        Seat map data is not available yet.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
    >
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/30 to-transparent px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              Choose your seats
            </p>
            {flightInfo && (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <Plane className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-mono font-bold text-[var(--accent)]">
                  {flightInfo.flightNumber}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {flightInfo.from} → {flightInfo.to}
                </span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">Progress</p>
            <p className="font-heading text-lg font-semibold text-[var(--text-primary)]">
              {assignedCount} / {passengers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Passenger tabs */}
      <div className="border-b border-[var(--border)] px-3 py-3">
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Select traveler, then tap a seat
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {passengers.map((p) => {
            const assigned = assignments[p.passengerIndex]
            const isActive = p.passengerIndex === activePassengerIndex
            return (
              <div
                key={p.passengerIndex}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActivePassengerIndex(p.passengerIndex)
                  setFocusedSeat(null)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActivePassengerIndex(p.passengerIndex)
                    setFocusedSeat(null)
                    setError(null)
                  }
                }}
                className={`flex min-w-[120px] shrink-0 cursor-pointer flex-col rounded-xl border px-3 py-2 text-left transition ${
                  isActive
                    ? `${p.color.chip} ring-1 ring-[var(--accent)]/40`
                    : 'border-[var(--border)] bg-[var(--bg-dark)]/40 hover:border-[var(--accent)]/30'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <span className={`h-2 w-2 rounded-full ${p.color.dot}`} />
                  <User className="h-3 w-3 opacity-70" />
                  {p.label}
                </span>
                <span className="mt-1 font-mono text-sm font-bold text-[var(--text-primary)]">
                  {assigned ? getSeatCode(assigned) : '—'}
                </span>
                {assigned && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeAssignment(p.passengerIndex)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        removeAssignment(p.passengerIndex)
                      }
                    }}
                    className="mt-1 text-[10px] text-[var(--text-secondary)] underline hover:text-red-300"
                  >
                    Clear seat
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--border)] px-4 py-2.5 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-green-500/50 bg-green-500/20" />
          Free / included
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-amber-500/50 bg-amber-500/20" />
          Paid seat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-gray-600/50 bg-gray-700/30" />
          Unavailable
        </span>
        {passengers.slice(0, 4).map((p) => (
          <span key={p.passengerIndex} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${p.color.dot}`} />
            {p.label}
          </span>
        ))}
      </div>

      {/* Map scroll area */}
      <div className="max-h-[min(420px,55vh)] overflow-auto px-3 py-4 touch-pan-x touch-pan-y">
        <div className="mx-auto min-w-[280px] max-w-lg">
          <div className="mb-2 rounded-t-2xl border border-b-0 border-[var(--border)] bg-[var(--bg-dark)] py-2 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">
            Front of aircraft
          </div>

          {columnLetters.length > 0 && (
            <div className="mb-1 flex items-center justify-center gap-0.5 px-6">
              {cabins[0]?.rows?.[0]?.columnGroups.map((group, gi) => (
                <div key={gi} className="flex items-center">
                  {gi > 0 && <AisleGap />}
                  <div className="flex gap-0.5">
                    {group.map((cell, ci) =>
                      isSeatCell(cell) ? (
                        <span
                          key={ci}
                          className="flex h-6 w-8 items-center justify-center text-[9px] font-mono text-[var(--text-secondary)]"
                        >
                          {getSeatColumn(cell)}
                        </span>
                      ) : (
                        <span key={ci} className="w-8" />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cabins.map((cabin, ci) => (
            <div key={ci} className="mb-4">
              <p className="mb-2 text-center text-xs font-medium text-[var(--accent)]">
                {cabin.cabinClass}
                {cabin.firstRow != null && cabin.lastRow != null && (
                  <span className="text-[var(--text-secondary)]">
                    {' '}
                    · Rows {cabin.firstRow}–{cabin.lastRow}
                  </span>
                )}
              </p>

              <div className="space-y-0.5">
                {cabin.rows.map((row) => (
                  <div
                    key={row.rowNumber ?? getSeatCode(row.seats?.[0])}
                    className="flex items-center justify-center gap-0.5"
                  >
                    <span className="w-7 shrink-0 text-right font-mono text-[10px] text-[var(--text-secondary)]">
                      {row.rowNumber}
                    </span>

                    {row.columnGroups.map((group, gi) => (
                      <div key={gi} className="flex items-center">
                        {gi > 0 && <AisleGap />}
                        <div className="flex gap-0.5">
                          {group.map((cell, si) => {
                            if (!isSeatCell(cell)) {
                              return <AisleGap key={si} width="w-8" />
                            }
                            const code = getSeatCode(cell)
                            const owner = findAssignmentOwner(code)
                            const pax = owner
                              ? passengers.find((p) => p.passengerIndex === owner)
                              : null

                            return (
                              <SeatCell
                                key={code}
                                seat={cell}
                                assignmentPassengerIndex={owner}
                                isActivePassengerSeat={
                                  activePassengerIndex === owner ||
                                  (focusedSeat && getSeatCode(focusedSeat) === code)
                                }
                                isFocused={focusedSeat && getSeatCode(focusedSeat) === code}
                                passengerColor={pax?.color}
                                onClick={handleSeatClick}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-b-2xl border border-t-0 border-[var(--border)] bg-[var(--bg-dark)] py-2 text-center text-[10px] text-[var(--text-secondary)]">
            Rear
          </div>
        </div>
      </div>

      {/* Seat detail + confirm */}
      <div className="space-y-3 border-t border-[var(--border)] bg-[var(--bg-dark)]/50 px-4 py-4">
        <AnimatePresence mode="wait">
          {focusedSeat && (
            <SeatDetailPanel
              key={getSeatCode(focusedSeat)}
              seat={focusedSeat}
              activePassenger={activePassenger}
              assignmentOwner={findAssignmentOwner(getSeatCode(focusedSeat))}
              onAssign={assignFocusedToActive}
              onReassign={() => {
                removeAssignment(activePassenger.passengerIndex)
                setError(null)
              }}
              onRemove={() => {
                const owner = findAssignmentOwner(getSeatCode(focusedSeat))
                if (owner != null) removeAssignment(owner)
              }}
              onClose={() => setFocusedSeat(null)}
            />
          )}
        </AnimatePresence>

        {!focusedSeat && activePassenger && !assignments[activePassenger.passengerIndex] && (
          <p className="text-center text-xs text-[var(--text-secondary)]">
            Tap an available seat for{' '}
            <span className="font-medium text-[var(--accent)]">{activePassenger.label}</span>
            , then confirm assignment.
          </p>
        )}

        {catalog.priceTiers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {catalog.priceTiers.map((tier) => (
              <span
                key={`${tier.currency}-${tier.price}`}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-[10px] text-[var(--text-secondary)]"
              >
                {formatPrice(tier.price, tier.currency)} · {tier.count} seats
              </span>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {seatFeesTotal > 0 && (
              <p className="text-xs text-[var(--text-secondary)]">Seat extras</p>
            )}
            <p className="font-heading text-lg font-semibold text-[var(--text-primary)]">
              {seatFeesTotal > 0
                ? formatPrice(seatFeesTotal, seatFeesCurrency || 'ETB')
                : allAssigned
                  ? 'All travelers seated'
                  : `${passengers.length - assignedCount} seat${passengers.length - assignedCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>

          <button
            type="button"
            disabled={!allAssigned || handlers?.isLoading || submitting}
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg-dark)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allAssigned ? 'Confirm all seats' : 'Assign all travelers'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
