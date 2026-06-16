export const ACTIVE_FLOW = {
  BOOKING: 'booking',
  MANAGE: 'manage',
}

export const INITIAL_GATEWAY_FLOW = {
  activeFlow: null,
}

/** Pay / manage / change an existing reservation (not a new flight search). */
export const detectManageFlowIntent = (text = '') => {
  const m = String(text).toLowerCase()
  if (!m) return false

  const mentionsBooking =
    m.includes('booking') ||
    m.includes('reservation') ||
    m.includes('pnr') ||
    m.includes('record locator')

  if (/\bmanage\b/.test(m) && mentionsBooking) return true
  if (/\bpay\b/.test(m) && mentionsBooking) return true
  if (/\b(check.?in|cancel|refund|change|modify)\b/.test(m) && mentionsBooking) return true
  if (/\b(existing|held|my)\b/.test(m) && mentionsBooking) return true

  return false
}

/**
 * Build POST body for n8n Gateway.
 */
export function buildGatewayRequest({
  chatInput,
  sessionId,
  flowState = INITIAL_GATEWAY_FLOW,
  history = null,
  selectedFlight = null,
  passengers = null,
  cabinClass = null,
  activeFlow = null,
  ui_action = null,
  ui_payload = null,
  /** True when user locked travelers and is in a new-booking search (not manage-PNR). */
  isNewBookingFlow = false,
}) {
  const text = String(chatInput || '').trim()
  const state = { ...INITIAL_GATEWAY_FLOW, ...flowState }

  let flowActive = activeFlow ?? state.activeFlow ?? null
  let resolvedUiAction = ui_action
  let resolvedUiPayload = ui_payload

  if (detectManageFlowIntent(text) && !isNewBookingFlow) {
    flowActive = flowActive || ACTIVE_FLOW.MANAGE
  } else {
    // If the user is searching for a flight (booking intent), reset flowActive to null
    const lowerText = text.toLowerCase()
    const hasBookingKeywords =
      lowerText.includes('flight') ||
      lowerText.includes('book') ||
      lowerText.includes('fly') ||
      lowerText.includes('to')
    if (hasBookingKeywords) {
      flowActive = null
    }
  }

  const nextState = {
    activeFlow: flowActive,
  }

  const payload = {
    sessionId,
    chatInput: text,
    message: text,
    activeFlow: flowActive,
    ui_action: resolvedUiAction ?? null,
    ui_payload: resolvedUiPayload ?? null,
  }

  if (history != null) payload.history = history
  if (selectedFlight != null) payload.selectedFlight = selectedFlight
  if (passengers != null) payload.passengers = passengers
  if (cabinClass != null && cabinClass !== '') payload.cabinClass = cabinClass

  return { payload, nextState }
}

/** Update client flow after assistant reply. */
export function applyAssistantToGatewayFlow(
  flowState,
  { message = '', uiData = null, userText = '' } = {},
) {
  const next = { ...INITIAL_GATEWAY_FLOW, ...flowState }
  return next
}

export const clearGatewayFlow = () => ({ ...INITIAL_GATEWAY_FLOW })
