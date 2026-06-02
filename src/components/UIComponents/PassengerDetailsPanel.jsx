import PassengerDetailsCarousel from './PassengerDetailsCarousel'
import { INITIAL_PASSENGER_COUNTS } from './PassengerSelector'

/**
 * Step 4 in booking flow — shown in chat after flight confirmation.
 * data: { passengerCounts } or uses bookingContext from handlers.
 */
export default function PassengerDetailsPanel({ data, handlers }) {
  const counts =
    data?.passengerCounts ||
    handlers?.bookingContext?.passengerCounts ||
    INITIAL_PASSENGER_COUNTS

  if (!handlers?.handleSubmitPassengerDetails) return null

  return (
    <div className="w-full">
      <PassengerDetailsCarousel
        passengerCounts={counts}
        disabled={handlers?.isLoading}
        onCancel={() => handlers?.sendMessage?.('Cancel passenger details entry')}
        onSubmit={(bookingForms) => handlers.handleSubmitPassengerDetails(bookingForms)}
      />
    </div>
  )
}
