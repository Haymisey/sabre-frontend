import { useState, useCallback, useRef } from 'react'
import axios from 'axios'
import { formatPrice } from '../utils/formatters'
import {
  INITIAL_PASSENGER_COUNTS,
  normalizePassengerCounts,
  validatePassengerCounts,
  formatPassengerCountsLabel,
  formatPassengersForSearch,
  validatePassengersMatchSearch,
  buildPassengerSearchMessage,
  parsePassengerCountsFromText,
  parsePassengerCountsFromAssistant,
  extractPassengersFromResponse,
} from '../utils/passengers'
import {
  buildApiPassengers,
  buildApiContact,
  buildPassengerSubmissionMessage,
  sanitizeApiContact,
  sanitizeEmail,
  validateAllBookingForms,
} from '../utils/passengerForm'
import { normalizeSabreCookie, isValidSabreCookie } from '../utils/sabreCookie'
import {
  buildPaymentUiDataFallback,
  hasPaymentOptionsData,
  messageSuggestsPaymentChoice,
} from '../utils/paymentUtils'

const messageAsksPassengerDetails = (text = '') => {
  const m = text.toLowerCase()
  return (
    (m.includes('passenger') || m.includes('traveler')) &&
    (m.includes('provide') ||
      m.includes('details') ||
      m.includes('first name') ||
      m.includes('date of birth'))
  )
}

const WEBHOOK_URL =
  import.meta.env.VITE_WEBHOOK_URL ||
  'https://n8n-service-j7o2.onrender.com/webhook/4edc837e-bb47-40f3-a8c7-9889fe241956'

const REQUEST_TIMEOUT = 30000

const createMessage = (role, content, extras = {}) => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: Date.now(),
  ui_component: null,
  ui_data: null,
  cookie: null,
  itineraryParts: null,
  ...extras,
})

const buildHistory = (messages) =>
  messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }))

/** n8n often returns [{ message, ui_component, ui_data }] instead of a bare object */
const normalizeApiResponse = (raw) => {
  if (raw == null) return {}

  let data = raw

  if (Array.isArray(data)) {
    data = data[0] ?? {}
  }

  if (data && typeof data === 'object' && !('message' in data) && data.data != null) {
    const inner = data.data
    data = Array.isArray(inner) ? inner[0] ?? {} : inner
  }

  if (Array.isArray(data)) {
    data = data[0] ?? {}
  }

  return data && typeof data === 'object' ? data : {}
}

const buildSelectFlightPayload = ({
  outboundHashCode,
  returnHashCode = 0,
  itineraryParts,
  cookie,
  passengerCounts,
  fareOption,
}) => {
  const sabreCookie = normalizeSabreCookie(cookie)
  const counts = normalizePassengerCounts(passengerCounts)

  return {
    action: 'selectFlight',
    outboundHashCode,
    returnHashCode:
      returnHashCode === null || returnHashCode === undefined ? 0 : returnHashCode,
    itineraryParts,
    cookie: sabreCookie,
    cookieSabreDataRequest: sabreCookie,
    passengerCounts: counts,
    selectedBrand: fareOption?.brandLabel,
    totalPrice: fareOption?.total,
    currency: fareOption?.currency || 'ETB',
  }
}

const buildSelectedFlightPayload = (selectedFlight) => {
  if (!selectedFlight) return null

  const action = selectedFlight.action || 'selectFlight'
  const sabreCookieFromSelection = normalizeSabreCookie(selectedFlight.cookie)

  if (action === 'selectSeat') {
    return {
      action,
      selectedSeats: selectedFlight.selectedSeats,
      cookie: sabreCookieFromSelection,
      cookieSabreDataRequest: sabreCookieFromSelection,
    }
  }

  if (action === 'selectAncillaries' || action === 'skipAncillaries') {
    return {
      action,
      ancillarySelections: selectedFlight.ancillarySelections ?? [],
      cookie: sabreCookieFromSelection,
      cookieSabreDataRequest: sabreCookieFromSelection,
    }
  }

  if (action === 'holdNow') {
    return {
      action: 'holdNow',
      holdOptionId: selectedFlight.holdOptionId,
      paymentCode: selectedFlight.paymentCode,
      paymentType: selectedFlight.paymentType || 'BNPL',
      cookie: sabreCookieFromSelection,
      cookieSabreDataRequest: sabreCookieFromSelection,
    }
  }

  if (action === 'selectPayment') {
    return {
      action: 'selectPayment',
      paymentType: selectedFlight.paymentType,
      paymentCode: selectedFlight.paymentCode,
      fopCode: selectedFlight.fopCode,
      fopSubCode: selectedFlight.fopSubCode,
      fopSubQQCode: selectedFlight.fopSubQQCode ?? null,
      afopQQCode: selectedFlight.afopQQCode ?? null,
      paymentName: selectedFlight.paymentName,
      amount: selectedFlight.amount ?? null,
      cookie: sabreCookieFromSelection,
      cookieSabreDataRequest: sabreCookieFromSelection,
    }
  }

  const outboundHashCode = selectedFlight.outboundHashCode
  const passengerCounts = normalizePassengerCounts(
    selectedFlight.passengerCounts || INITIAL_PASSENGER_COUNTS,
  )
  const sabreCookie = sabreCookieFromSelection

  const itineraryParts = (selectedFlight.itineraryParts || []).map((part) => ({
    from: part.from,
    to: part.to,
    date: part.date,
    ...(part.selectedOfferRef != null
      ? { selectedOfferRef: part.selectedOfferRef }
      : outboundHashCode != null
        ? { selectedOfferRef: outboundHashCode }
        : {}),
  }))

  const passengers = Array.isArray(selectedFlight.passengers)
    ? selectedFlight.passengers.map((p) => ({
        ...p,
        passengerInfo: {
          ...p.passengerInfo,
          emails: (p.passengerInfo?.emails || []).map(sanitizeEmail).filter(Boolean),
        },
      }))
    : []

  const contact = sanitizeApiContact(
    selectedFlight.contact?.phones != null
      ? selectedFlight.contact
      : buildApiContact(
          selectedFlight.contactForm || {
            countryCode: '251',
            number: '',
            email: '',
          },
        ),
  )

  return {
    action,
    outboundHashCode,
    returnHashCode:
      selectedFlight.returnHashCode === null || selectedFlight.returnHashCode === undefined
        ? 0
        : selectedFlight.returnHashCode,
    itineraryParts,
    cookie: sabreCookie,
    cookieSabreDataRequest: sabreCookie,
    passengerCounts,
    passengers,
    contact,
    ancillarySelections: Array.isArray(selectedFlight.ancillarySelections)
      ? selectedFlight.ancillarySelections
      : undefined,
    selectedSeats: Array.isArray(selectedFlight.selectedSeats)
      ? selectedFlight.selectedSeats
      : undefined,
  }
}

const buildItineraryPartsFromLegs = (legs) =>
  (legs || []).flatMap((leg) =>
    leg.from && leg.to
      ? [
          {
            from: leg.from,
            to: leg.to,
            date:
              leg.options?.[0]?.departure?.split?.('T')[0] ||
              leg.options?.[0]?.segments?.[0]?.departure?.split?.('T')[0],
          },
        ]
      : [],
  )

const extractFlightListMeta = (ui_component, ui_data, rootCookie = null) => {
  if (ui_component !== 'flight_list' || ui_data == null) {
    return { ui_data, cookie: normalizeSabreCookie(rootCookie), itineraryParts: null }
  }

  let cookie = normalizeSabreCookie(rootCookie)
  let legs = null
  let displayData = ui_data

  // { cookie, legs: [...] }
  if (!Array.isArray(ui_data) && typeof ui_data === 'object') {
    cookie = normalizeSabreCookie(ui_data.cookie) ?? cookie
    legs = ui_data.legs
    displayData = legs ?? ui_data
  }

  // [ { leg... }, ... ]  OR  [ { cookie, legs } ]
  if (Array.isArray(ui_data)) {
    const first = ui_data[0]
    const looksLikeLeg =
      first && (first.options || (first.from && first.to && !first.legs))

    if (first?.legs) {
      cookie = normalizeSabreCookie(first.cookie) ?? cookie
      legs = first.legs
      displayData = legs
    } else if (looksLikeLeg) {
      legs = ui_data
      displayData = ui_data
      cookie = normalizeSabreCookie(ui_data.cookie) ?? cookie
    } else if (first && typeof first === 'object') {
      cookie = normalizeSabreCookie(first.cookie) ?? cookie
      if (first.legs) {
        legs = first.legs
        displayData = legs
      }
    }
  }

  const itineraryParts = buildItineraryPartsFromLegs(legs ?? (Array.isArray(displayData) ? displayData : null))

  return {
    ui_data: Array.isArray(displayData) ? displayData : legs ?? ui_data,
    cookie,
    itineraryParts: itineraryParts.length ? itineraryParts : null,
  }
}

/** Booking: search → travelers → select flight → confirm fare → passenger details → full price → hold */
export const BOOKING_FLOW_STEP = {
  SEARCH: 'search',
  TRAVELERS: 'travelers',
  SELECT: 'select',
  CONFIRM: 'confirm',
  DETAILS: 'details',
  PRICE: 'price',
  HOLD: 'hold',
}

export const useChat = (sessionId) => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [bookingContext, setBookingContext] = useState(null)
  const [searchPassengerCounts, setSearchPassengerCounts] = useState(null)
  const [bookingFlowStep, setBookingFlowStep] = useState(BOOKING_FLOW_STEP.SEARCH)
  const [blockFreeTextInput, setBlockFreeTextInput] = useState(false)
  const bookingContextRef = useRef(null)
  const searchPassengerCountsRef = useRef(null)
  const lastPaymentUiDataRef = useRef(null)
  const abortRef = useRef(null)

  bookingContextRef.current = bookingContext
  searchPassengerCountsRef.current = searchPassengerCounts

  const lockSearchPassengers = useCallback((counts) => {
    if (!counts) return null
    const normalized = normalizePassengerCounts(counts)
    searchPassengerCountsRef.current = normalized
    setSearchPassengerCounts(normalized)
    setBookingFlowStep(BOOKING_FLOW_STEP.TRAVELERS)
    return normalized
  }, [])

  const startBookingSearch = useCallback((counts) => {
    const err = validatePassengerCounts(counts)
    if (err) return { error: err }

    const normalized = lockSearchPassengers(counts)
    setBookingContext(null)

    const label = formatPassengerCountsLabel(normalized)
    setMessages([
      createMessage(
        'assistant',
        `Travelers locked for this booking: ${label}.\n\nWhere would you like to fly? Tell me your departure city, destination, and travel dates (for example: "Addis Ababa to Dubai on 30 September 2026").`,
      ),
    ])

    return { ok: true }
  }, [lockSearchPassengers])

  const resetBookingSearch = useCallback(() => {
    setSearchPassengerCounts(null)
    setBookingContext(null)
    setBookingFlowStep(BOOKING_FLOW_STEP.SEARCH)
  }, [])

  const appendPassengerDetailsPrompt = useCallback(() => {
    const counts =
      searchPassengerCountsRef.current ||
      bookingContextRef.current?.passengerCounts ||
      INITIAL_PASSENGER_COUNTS
    setMessages((prev) => {
      const recentForm = prev.some(
        (m) =>
          m.ui_component === 'passenger_details' &&
          Date.now() - m.timestamp < 60_000,
      )
      if (recentForm) return prev
      return [
        ...prev,
        createMessage('assistant', 'Please enter details for each traveler below.', {
          ui_component: 'passenger_details',
          ui_data: { passengerCounts: counts },
        }),
      ]
    })
    setBookingFlowStep(BOOKING_FLOW_STEP.DETAILS)
  }, [])

  const sendMessage = useCallback(
    async (text, selectedFlight = null, passengers = null, cabinClass = null) => {
      if (!text?.trim() || !sessionId || isLoading) return

      const userMessage = createMessage('user', text.trim())
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      const historyForApi = buildHistory([...messages, userMessage])

      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      try {
        let lockedPassengers = passengers
          ? lockSearchPassengers(passengers)
          : searchPassengerCountsRef.current

        if (!lockedPassengers) {
          const fromUserText = parsePassengerCountsFromText(text.trim())
          if (fromUserText) lockedPassengers = lockSearchPassengers(fromUserText)
        }

        const payload = {
          message: text.trim(),
          sessionId,
          history: historyForApi,
          selectedFlight: buildSelectedFlightPayload(selectedFlight),
        }
        if (lockedPassengers) {
          payload.passengers = formatPassengersForSearch(lockedPassengers)
        }
        if (cabinClass != null && cabinClass !== '') {
          payload.cabinClass = cabinClass
        }

        const { data: rawData } = await axios.post(WEBHOOK_URL, payload, {
          signal: controller.signal,
          timeout: REQUEST_TIMEOUT,
          headers: { 'Content-Type': 'application/json' },
        })

        clearTimeout(timeoutId)

        const data = normalizeApiResponse(rawData)

        const ui_component = data.ui_component || null
        const ui_data = data.ui_data ?? null

        const rootCookie =
          data.cookie ?? data.sabreCookie ?? data.sessionCookie ?? data.ui_data?.cookie ?? null

        const { ui_data: parsedUiData, cookie, itineraryParts } = extractFlightListMeta(
          ui_component,
          ui_data,
          rootCookie,
        )

        if (data.statusAPI === 'ERROR') {
          const errorMessage = createMessage('assistant', data.message || 'Something went wrong.', {
            ui_component: 'error',
            ui_data: { message: data.message || 'An error occurred. Please try again.' },
          })
          setMessages((prev) => [...prev, errorMessage])
          return
        }

        let enrichedUiData = parsedUiData
        const asksPassengers = messageAsksPassengerDetails(data.message)
        const ai_summary = data.ai_summary ?? null

        if (ui_component === 'booking_price_confirm' && parsedUiData) {
          const ctxStep = bookingContextRef.current?.step
          const isHold = ctxStep === 'passengers_sent'
          enrichedUiData = {
            ...parsedUiData,
            step: isHold ? 'hold' : 'flight',
            flightSummary: bookingContextRef.current?.flightSummary,
            skipConfirm: !isHold && asksPassengers,
          }
          setBookingFlowStep(isHold ? BOOKING_FLOW_STEP.HOLD : BOOKING_FLOW_STEP.CONFIRM)

          if (!isHold && asksPassengers) {
            setTimeout(() => appendPassengerDetailsPrompt(), 150)
          }
        }

        if (asksPassengers && ui_component !== 'passenger_details') {
          setBookingFlowStep(BOOKING_FLOW_STEP.DETAILS)
        }
        if (ui_component === 'passenger_picker') {
          setBookingFlowStep(BOOKING_FLOW_STEP.TRAVELERS)
        }
        if (ui_component === 'flight_list') {
          setBookingFlowStep(BOOKING_FLOW_STEP.SELECT)
          const fromApi = extractPassengersFromResponse(data, parsedUiData)
          const fromAssistant = parsePassengerCountsFromAssistant(data.message)
          const resolved = fromApi || fromAssistant || lockedPassengers
          if (resolved) {
            lockSearchPassengers(resolved)
            if (enrichedUiData && typeof enrichedUiData === 'object' && !Array.isArray(enrichedUiData)) {
              enrichedUiData = { ...enrichedUiData, passengerCounts: resolved }
            }
          }
        }
        if (ui_component === 'passenger_details') {
          setBookingFlowStep(BOOKING_FLOW_STEP.DETAILS)
        }
        if (ui_component === 'booking_price') {
          setBookingFlowStep(BOOKING_FLOW_STEP.PRICE)
        }
        if (ui_component === 'booking_confirmed') {
          setBookingFlowStep(BOOKING_FLOW_STEP.HOLD)
        }
        let resolvedUiComponent = ui_component

        const paymentCookie =
          normalizeSabreCookie(
            cookie ?? rootCookie ?? bookingContextRef.current?.cookie ?? null,
          ) ?? null

        const shouldShowPaymentChoice =
          resolvedUiComponent === 'payment_options' ||
          (!resolvedUiComponent && messageSuggestsPaymentChoice(data.message))

        if (shouldShowPaymentChoice) {
          resolvedUiComponent = 'payment_options'
          enrichedUiData = buildPaymentUiDataFallback({
            apiData: { ...data, ui_data: enrichedUiData ?? ui_data },
            messages: [...messages, userMessage],
            cookie: paymentCookie,
          })
          if (hasPaymentOptionsData(enrichedUiData)) {
            lastPaymentUiDataRef.current = enrichedUiData
          }
          setBlockFreeTextInput(true)
          setBookingFlowStep(BOOKING_FLOW_STEP.HOLD)
        }

        // Many backend responses include additional metadata in `ai_summary`
        // alongside `ui_data`. Merge it into `ui_data` (when ui_data is an object)
        // so UI components can render it.
        if (
          ai_summary &&
          enrichedUiData &&
          typeof enrichedUiData === 'object' &&
          !Array.isArray(enrichedUiData)
        ) {
          if (typeof ai_summary === 'object' && !Array.isArray(ai_summary)) {
            enrichedUiData = { ...enrichedUiData, ...ai_summary, ai_summary }
          } else {
            enrichedUiData = { ...enrichedUiData, ai_summary }
          }
        }

        const assistantMessage = createMessage('assistant', data.message || '', {
          ui_component: resolvedUiComponent,
          ui_data: enrichedUiData,
          cookie,
          itineraryParts,
          passengerCounts: searchPassengerCountsRef.current,
        })

        setMessages((prev) => [...prev, assistantMessage])

        if (ui_component === 'booking_confirmed' && data.ui_data?.success) {
          setBookingContext(null)
          setSearchPassengerCounts(null)
          setBookingFlowStep(BOOKING_FLOW_STEP.SEARCH)
        }
      } catch (err) {
        clearTimeout(timeoutId)

        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          const timeoutMsg = createMessage(
            'assistant',
            'This is taking longer than usual. Please wait a moment and try again.',
          )
          setMessages((prev) => [...prev, timeoutMsg])
        } else {
          const errorMsg = createMessage(
            'assistant',
            'Connection issue. Please try again.',
            {
              ui_component: 'error',
              ui_data: {
                message: 'Unable to reach the server. Check your connection and try again.',
              },
            },
          )
          setMessages((prev) => [...prev, errorMsg])
        }
      } finally {
        setIsLoading(false)
        abortRef.current = null
      }
    },
    [sessionId, messages, isLoading, appendPassengerDetailsPrompt, lockSearchPassengers],
  )

  const handlePassengerConfirm = useCallback(
    (passengers, cabinClass, flightDetails) => {
      const err = validatePassengerCounts(passengers)
      if (err) return { error: err }

      const message = buildPassengerSearchMessage(passengers, cabinClass, flightDetails)
      sendMessage(message, null, passengers, cabinClass)
      return { ok: true }
    },
    [sendMessage],
  )

  const handleSelectFlight = useCallback(
    (option, fareOption, cookie, itineraryParts) => {
      const counts = normalizePassengerCounts(
        searchPassengerCountsRef.current || INITIAL_PASSENGER_COUNTS,
      )
      if (!searchPassengerCountsRef.current) {
        return {
          error:
            'Traveler count is not locked for this search. Mention passengers in your search (e.g. "2 adults") or use the traveler picker when it appears.',
        }
      }

      const sabreCookie = normalizeSabreCookie(cookie)
      if (!sabreCookie) {
        return {
          error:
            'Session cookies are missing. The flight search response must include cookie in flight_list ui_data.',
        }
      }
      const flightNumber = option.segments?.[0]?.flightNumber || 'this flight'
      const brandLabel = fareOption.brandLabel || fareOption.selectedBrand
      const currency = fareOption.currency || 'ETB'
      const travelerLabel = formatPassengerCountsLabel(counts)
      const flightSummary = `${flightNumber} · ${option.from}→${option.to} · ${brandLabel}`

      const ctx = {
        step: 'selected',
        option,
        fareOption,
        cookie: sabreCookie,
        itineraryParts,
        passengerCounts: counts,
        outboundHashCode: fareOption.shoppingBasketHashCode,
        flightNumber,
        brandLabel,
        currency,
        flightSummary,
      }
      setBookingContext(ctx)
      setBookingFlowStep(BOOKING_FLOW_STEP.CONFIRM)

      const payload = buildSelectFlightPayload({
        outboundHashCode: fareOption.shoppingBasketHashCode,
        itineraryParts,
        cookie: sabreCookie,
        passengerCounts: counts,
        fareOption,
      })

      sendMessage(
        `I want to select ${flightNumber} - ${brandLabel} for ${formatPrice(fareOption.total, currency)} (${travelerLabel})`,
        payload,
      )

      return { ok: true }
    },
    [sendMessage],
  )

  const onConfirmFlightSelection = useCallback(() => {
    sendMessage('Yes, I confirm this flight selection')
    setBookingContext((ctx) => (ctx ? { ...ctx, step: 'flight_confirmed' } : ctx))
    const alreadyHasForm = messages.some((m) => m.ui_component === 'passenger_details')
    if (!alreadyHasForm) {
      setTimeout(() => appendPassengerDetailsPrompt(), 300)
    }
  }, [sendMessage, appendPassengerDetailsPrompt, messages])

  const handleSubmitPassengerDetails = useCallback(
    (bookingForms) => {
      const ctx = bookingContextRef.current
      if (!ctx) return { error: 'No flight selected. Please choose a flight first.' }

      const formValidation = validateAllBookingForms(
        bookingForms.passengerForms,
        bookingForms.contactForm,
      )
      if (!formValidation.valid) {
        return { error: 'Please fix the highlighted passenger or contact fields.' }
      }

      const apiPassengers = buildApiPassengers(bookingForms.passengerForms)
      const searchCounts = searchPassengerCountsRef.current || ctx.passengerCounts
      const matchError = validatePassengersMatchSearch(apiPassengers, searchCounts)
      if (matchError) return { error: matchError }
      const apiContact = buildApiContact(bookingForms.contactForm)
      const travelerLabel = formatPassengerCountsLabel(ctx.passengerCounts)

      const payload = buildSelectedFlightPayload({
        action: 'submitPassengers',
        outboundHashCode: ctx.outboundHashCode,
        returnHashCode: 0,
        itineraryParts: ctx.itineraryParts,
        cookie: ctx.cookie,
        passengerCounts: ctx.passengerCounts,
        passengers: apiPassengers,
        contact: apiContact,
      })

      setBookingContext((c) =>
        c
          ? {
              ...c,
              step: 'passengers_sent',
              passengers: apiPassengers,
              contact: apiContact,
            }
          : c,
      )
      setBookingFlowStep(BOOKING_FLOW_STEP.PRICE)

      sendMessage(
        buildPassengerSubmissionMessage(apiPassengers, apiContact, travelerLabel),
        payload,
      )

      return { ok: true }
    },
    [sendMessage],
  )

  const handleAncillaryConfirm = useCallback(
    (selectedAncillaries = [], ancillaryData = null) => {
      const picks = Array.isArray(selectedAncillaries) ? selectedAncillaries : []
      if (picks.length === 0) {
        return { error: 'Select at least one service, or click Skip.' }
      }

      const label = picks
        .map((item) => `${item.name}${item.price ? ` (${item.currency || 'ETB'} ${Number(item.price).toLocaleString('en-US')})` : ''}`)
        .join(', ')

      sendMessage(`Add these services to my booking: ${label}`, {
        action: 'selectAncillaries',
        ancillarySelections: picks,
        cookie: ancillaryData?.cookie ?? bookingContextRef.current?.cookie ?? null,
      })
      return { ok: true }
    },
    [sendMessage],
  )

  const handleAncillarySkip = useCallback(() => {
    sendMessage('Skip ancillary services and continue with booking.', {
      action: 'skipAncillaries',
      ancillarySelections: [],
      cookie: bookingContextRef.current?.cookie ?? null,
    })
    return { ok: true }
  }, [sendMessage])

  const handlePaymentHold = useCallback(
    (payload) => {
      setBlockFreeTextInput(false)
      sendMessage('Hold my booking now', payload)
      setBookingFlowStep(BOOKING_FLOW_STEP.HOLD)
      return { ok: true }
    },
    [sendMessage],
  )

  const handlePaymentSelect = useCallback(
    (payload, method) => {
      setBlockFreeTextInput(false)
      const label = method?.paymentName || payload?.paymentName || 'selected method'
      sendMessage(`Pay with ${label}`, payload)
      return { ok: true }
    },
    [sendMessage],
  )

  const onConfirmHoldBooking = useCallback(() => {
    const ctx = bookingContextRef.current
    const payload = ctx
      ? buildSelectedFlightPayload({
          action: 'holdBooking',
          outboundHashCode: ctx.outboundHashCode,
          returnHashCode: 0,
          itineraryParts: ctx.itineraryParts,
          cookie: ctx.cookie,
          passengerCounts: ctx.passengerCounts,
          passengers: ctx.passengers || [],
          contact: ctx.contact || { emails: [], phones: [] },
        })
      : null

    sendMessage('Yes, confirm and hold the booking', payload)
    setBookingFlowStep(BOOKING_FLOW_STEP.HOLD)
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    setBookingContext(null)
    setSearchPassengerCounts(null)
    setBookingFlowStep(BOOKING_FLOW_STEP.SEARCH)
    setBlockFreeTextInput(false)
    lastPaymentUiDataRef.current = null
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    startBookingSearch,
    resetBookingSearch,
    searchPassengerCounts,
    handlePassengerConfirm,
    handleSelectFlight,
    handleSubmitPassengerDetails,
    handleAncillaryConfirm,
    handleAncillarySkip,
    onConfirmFlightSelection,
    onConfirmHoldBooking,
    handlePaymentHold,
    handlePaymentSelect,
    bookingContext,
    bookingFlowStep,
    blockFreeTextInput,
    clearMessages,
    hasStarted: messages.length > 0,
  }
}
