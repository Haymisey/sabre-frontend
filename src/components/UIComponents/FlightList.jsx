import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plane,
  Clock,
  AlertTriangle,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  formatTime,
  formatDate,
  formatPrice,
  formatDuration,
  getAwardedMiles,
  formatAwardedMiles,
} from '../../utils/formatters'
import { isValidSabreCookie } from '../../utils/sabreCookie'
import { formatPassengerCountsLabel, formatPassengerCountsShort } from '../../utils/passengers'
import BookingFlowBanner from './BookingFlowBanner'

function FlightOptionCard({
  option,
  cookie,
  itineraryParts,
  handlers,
  legCheapest,
  isActive,
}) {
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex h-full w-full flex-col rounded-2xl border bg-[var(--bg-card)] p-4 transition-all duration-300 ${
        isActive
          ? 'border-[var(--accent)]/40 shadow-xl shadow-[var(--primary)]/15 ring-1 ring-[var(--accent)]/25'
          : 'border-[var(--border)] shadow-md opacity-[0.92]'
      }`}
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
              {option.from} → {option.to} ·{' '}
              {option.stops === 0 ? 'Non-stop' : `${option.stops} stop`}
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
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{option.fromCity}</p>
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
            <span className="text-center text-[10px] text-amber-400/90">
              via {option.segments[0].toCity}
            </span>
          )}
        </div>

        <div className="text-center">
          <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">
            {option.to}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{option.toCity}</p>
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
              {getAwardedMiles(f) != null && (
                <span className="mt-1 flex items-center gap-0.5 text-[8px] font-medium text-[var(--accent-light)]">
                  <Award className="h-2.5 w-2.5 shrink-0" />
                  {formatAwardedMiles(f, { short: true })}
                </span>
              )}
              {isCheapest && (
                <span className="mt-0.5 block text-[8px] font-medium text-green-400">Best</span>
              )}
              {f.lowAvailability && !f.soldOut && (
                <span className="mt-0.5 flex items-center gap-1 text-[8px] text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {f.seatsLeft} left
                </span>
              )}
              {f.soldOut && (
                <span className="mt-0.5 block text-[8px] font-medium text-red-400">Sold out</span>
              )}
            </button>
          )
        })}
      </div>

      {selectError && <p className="mb-2 text-[10px] text-red-400">{selectError}</p>}

      {fare && getAwardedMiles(fare) != null && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/25 bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent)]/10 px-3 py-2">
          <Award className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <p className="text-center text-xs text-[var(--text-secondary)]">
            Earn{' '}
            <span className="font-semibold text-[var(--accent)]">
              {formatAwardedMiles(fare)}
            </span>
            <span className="text-[var(--text-secondary)]"> on this fare</span>
          </p>
        </div>
      )}

      <div className="mt-auto">
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
      </div>
    </motion.div>
  )
}

function CarouselNavButton({ direction, onClick, disabled, label }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]/95 text-[var(--text-primary)] shadow-lg backdrop-blur-sm transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)] disabled:pointer-events-none disabled:opacity-0"
      style={direction === 'left' ? { left: '0.25rem' } : { right: '0.25rem' }}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function FlightOptionsCarousel({ options, cookie, itineraryParts, handlers, legCheapest }) {
  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const count = options?.length ?? 0

  const scrollToIndex = useCallback(
    (i) => {
      const track = trackRef.current
      if (!track || count === 0) return
      const clamped = Math.max(0, Math.min(i, count - 1))
      const slide = track.children[clamped]
      if (slide) {
        slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        setActiveIndex(clamped)
      }
    },
    [count],
  )

  useEffect(() => {
    const track = trackRef.current
    if (!track || count === 0) return undefined

    const slides = Array.from(track.children)
    const observer = new IntersectionObserver(
      (entries) => {
        let best = null
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.ratio) {
              best = {
                ratio: entry.intersectionRatio,
                idx: Number(entry.target.dataset.slideIndex),
              }
            }
          }
        }
        if (best != null && !Number.isNaN(best.idx)) {
          setActiveIndex(best.idx)
        }
      },
      { root: track, threshold: [0.45, 0.55, 0.65] },
    )

    slides.forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [count, options])

  useEffect(() => {
    setActiveIndex(0)
    trackRef.current?.scrollTo({ left: 0, behavior: 'auto' })
  }, [options])

  if (!count) return null

  const cheapestOption = options.reduce(
    (best, opt) => {
      const fromFares = opt.fareOptions?.map((f) => f.total).filter(Number.isFinite)
      const min =
        opt.cheapestTotal ??
        (fromFares?.length ? Math.min(...fromFares) : Infinity)
      return min < best.price ? { opt, price: min } : best
    },
    {
      opt: options[0],
      price:
        options[0]?.cheapestTotal ??
        options[0]?.fareOptions?.[0]?.total ??
        Infinity,
    },
  )

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--accent)]/15 bg-gradient-to-b from-[var(--primary)]/8 to-transparent p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
            Available flights
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Swipe or use arrows · from{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {formatPrice(cheapestOption.price, cheapestOption.opt?.currency || 'ETB')}
            </span>
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--accent)]">{activeIndex + 1}</span>
          <span className="mx-1 opacity-50">/</span>
          {count}
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--bg-card)]/90 to-transparent sm:w-12" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[var(--bg-card)]/90 to-transparent sm:w-12" />

        <CarouselNavButton
          direction="left"
          label="Previous flight"
          disabled={activeIndex <= 0}
          onClick={() => scrollToIndex(activeIndex - 1)}
        />
        <CarouselNavButton
          direction="right"
          label="Next flight"
          disabled={activeIndex >= count - 1}
          onClick={() => scrollToIndex(activeIndex + 1)}
        />

        <div
          ref={trackRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-10 py-1 [-webkit-overflow-scrolling:touch]"
        >
          {options.map((option, i) => (
            <div
              key={option.option_id ?? i}
              data-slide-index={i}
              className="w-[min(88vw,360px)] shrink-0 snap-center sm:w-[340px]"
            >
              <FlightOptionCard
                option={option}
                cookie={cookie}
                itineraryParts={itineraryParts}
                handlers={handlers}
                legCheapest={legCheapest}
                isActive={i === activeIndex}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 px-2">
        <div className="h-1 overflow-hidden rounded-full bg-[var(--border)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary-light)] to-[var(--accent)]"
            initial={false}
            animate={{ width: `${((activeIndex + 1) / count) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {count <= 12 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {options.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to flight ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={`rounded-full transition-all ${
                  i === activeIndex
                    ? 'h-2 w-6 bg-[var(--accent)]'
                    : 'h-2 w-2 bg-[var(--border)] hover:bg-[var(--accent)]/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
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

      <FlightOptionsCarousel
        key={activeLeg}
        options={currentLeg.options}
        cookie={cookie}
        itineraryParts={itineraryParts}
        handlers={handlers}
        legCheapest={legCheapest}
      />
    </div>
  )
}
