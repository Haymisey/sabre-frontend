import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plane, Clock, AlertTriangle, Users } from 'lucide-react'
import { formatTime, formatDate, formatPrice, formatDuration } from '../../utils/formatters'
import { isValidSabreCookie } from '../../utils/sabreCookie'
import { formatPassengerCountsLabel, formatPassengerCountsShort } from '../../utils/passengers'
import BookingFlowBanner from './BookingFlowBanner'

function FlightOptionCard({ option, cookie, itineraryParts, handlers, legCheapest }) {
  const [selectedFareIdx, setSelectedFareIdx] = useState(() => {
    const cheapest = option.fareOptions?.reduce(
      (min, f, i) => (f.total < (option.fareOptions[min]?.total ?? Infinity) ? i : min),
      0,
    )
    return cheapest ?? 0
  })
  const [selectError, setSelectError] = useState(null)

  const fare = option.fareOptions?.[selectedFareIdx]
  const segment = option.segments?.[0]
  const isDirect = option.stops === 0 || !option.isConnection
  const hasSessionCookie = isValidSabreCookie(cookie)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-[300px] shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--primary-light)]/40 md:min-w-0"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]">
            <Plane className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <span className="font-mono text-sm font-semibold text-[var(--accent)]">
              {segment?.flightNumber || 'ET'}
            </span>
            <div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
              {option.from} → {option.to} · {option.stops === 0 ? 'Non-stop' : `${option.stops} stop`}
            </div>
          </div>
        </div>

        {isDirect ? (
          <span className="rounded-full bg-[var(--primary)]/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--accent-light)]">
            DIRECT
          </span>
        ) : (
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-dark)]/30 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[var(--text-secondary)]">
            CONNECTING
          </span>
        )}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {option.from}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
            {option.fromCity}
          </p>
          <p className="mt-2 text-xl font-bold">{formatTime(option.departure)}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            {formatDate(option.departure)}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] text-[var(--text-secondary)]">
            {formatDuration(option.totalDuration)}
          </span>
          <div className="my-2 flex w-full items-center gap-1">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <Plane className="h-3 w-3 rotate-90 text-[var(--accent)]" />
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          {!isDirect && option.segments?.[1] && (
            <span className="text-[10px] text-amber-400/90">
              via {option.segments[0].toCity}
            </span>
          )}
        </div>

        <div className="text-center">
          <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {option.to}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
            {option.toCity}
          </p>
          <p className="mt-2 text-xl font-bold">{formatTime(option.arrival)}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            {formatDate(option.arrival)}
          </p>
        </div>
      </div>

      {segment?.aircraftName && (
        <p className="mb-2 text-center text-xs text-[var(--text-secondary)]">
          {segment.aircraftName} · {segment.cabinClass}
        </p>
      )}

      {!isDirect && option.segments?.length > 1 && (
        <div className="mb-3 space-y-1 rounded-xl bg-[var(--bg-dark)]/40 p-2">
          {option.segments.map((seg, i) => (
            <p key={i} className="text-[10px] text-[var(--text-secondary)]">
              <span className="font-mono text-[10px] text-[var(--accent)]">
                {seg.flightNumber}
              </span>{' '}
              {seg.from} → {seg.to} · {formatDuration(seg.duration)}
            </p>
          ))}
          {option.connectionInfo?.[0]?.layoverDuration && (
            <p className="text-[10px] text-amber-400/90">
              Layover: {option.connectionInfo[0].layoverDuration}
            </p>
          )}
        </div>
      )}

      <div className="mb-3 flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {option.fareOptions?.map((f, i) => {
          const isCheapest = f.total === legCheapest
          const isSelected = i === selectedFareIdx
          return (
            <button
              key={f.brandId || i}
              type="button"
              onClick={() => setSelectedFareIdx(i)}
              className={`shrink-0 rounded-xl border px-2.5 py-2 text-left transition ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] bg-[var(--bg-dark)]/30 hover:border-[var(--primary-light)]/50'
              }`}
            >
              <p className="max-w-[120px] truncate text-[9px] font-medium uppercase text-[var(--text-secondary)]">
                {f.brandLabel}
              </p>
              <p className="text-xs font-bold text-[var(--accent)]">
                {formatPrice(f.total, f.currency)}
              </p>
              {isCheapest && (
                <span className="mt-0.5 block text-[8px] font-medium text-green-400">
                  Best
                </span>
              )}
              {f.lowAvailability && !f.soldOut && (
                <span className="mt-0.5 flex items-center gap-1 text-[8px] text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {f.seatsLeft} left
                </span>
              )}
              {f.soldOut && (
                <span className="mt-0.5 block text-[8px] font-medium text-red-400">
                  Sold out
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectError && <p className="mb-2 text-[10px] text-red-400">{selectError}</p>}

      {fare && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={fare.soldOut || !hasSessionCookie}
          onClick={() => {
            const result = handlers?.handleSelectFlight?.(
              option,
              fare,
              cookie,
              itineraryParts,
            )
            if (result?.error) setSelectError(result.error)
            else setSelectError(null)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--bg-dark)] disabled:opacity-40"
        >
          <Clock className="h-4 w-4" />
          {fare.soldOut ? 'Sold Out' : 'Select this flight'}
        </motion.button>
      )}
    </motion.div>
  )
}

export default function FlightList({ data, handlers, cookie, itineraryParts, passengerCounts }) {
  const legs = Array.isArray(data) ? data : data?.legs || []
  const [activeLeg, setActiveLeg] = useState(0)
  const searchCounts =
    passengerCounts || data?.passengerCounts || handlers?.searchPassengerCounts
  const flowStep = handlers?.bookingFlowStep || 'select'

  if (!legs.length) return null

  const currentLeg = legs[activeLeg]
  const legCheapest = Math.min(
    ...(currentLeg?.options?.flatMap((o) => o.fareOptions?.map((f) => f.total) || []) || [
      Infinity,
    ]),
  )

  return (
    <div className="w-full space-y-3">
      <BookingFlowBanner currentStep={flowStep} />

      {searchCounts && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-3 py-2 text-xs">
          <Users className="h-4 w-4 text-[var(--accent)]" />
          <span>
            Prices for <strong>{formatPassengerCountsLabel(searchCounts)}</strong>
            <span className="ml-1 font-mono text-[10px] text-[var(--text-secondary)]">
              ({formatPassengerCountsShort(searchCounts)})
            </span>
          </span>
        </div>
      )}

      <p className="text-xs text-[var(--text-secondary)]">
        Step 3 — Select a flight (traveler count was set before search).
      </p>

      {!isValidSabreCookie(cookie) && (
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Include cookie in flight_list ui_data to enable booking.
        </p>
      )}

      {legs.length > 1 && (
        <div className="flex gap-2">
          {legs.map((leg, i) => (
            <button
              key={leg.leg_index ?? i}
              type="button"
              onClick={() => setActiveLeg(i)}
              className={`rounded-xl px-4 py-2 text-sm ${
                activeLeg === i
                  ? 'bg-[var(--primary)] text-[var(--accent-light)]'
                  : 'border border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              {leg.leg_label || (i === 0 ? 'Outbound' : 'Return')}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin md:grid md:grid-cols-1 md:overflow-visible">
        {currentLeg.options?.map((option) => (
          <FlightOptionCard
            key={option.option_id}
            option={option}
            cookie={cookie}
            itineraryParts={itineraryParts}
            handlers={handlers}
            legCheapest={legCheapest}
          />
        ))}
      </div>
    </div>
  )
}
