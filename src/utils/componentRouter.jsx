import FlightList from '../components/UIComponents/FlightList'
import FlightStatusCard from '../components/UIComponents/FlightStatusCard'
import FlightSchedule from '../components/UIComponents/FlightSchedule'
import BookingItinerary from '../components/UIComponents/BookingItinerary'
import BookingPrice from '../components/UIComponents/BookingPrice'
import BookingTickets from '../components/UIComponents/BookingTickets'
import BookingConfirmed from '../components/UIComponents/BookingConfirmed'
import BookingContact from '../components/UIComponents/BookingContact'
import PriceConfirm from '../components/UIComponents/PriceConfirm'
import SeatMap from '../components/UIComponents/SeatMap'
import SeatSelected from '../components/UIComponents/SeatSelected'
import ErrorCard from '../components/UIComponents/ErrorCard'
import PassengerDetailsPanel from '../components/UIComponents/PassengerDetailsPanel'
import PassengerPicker from '../components/UIComponents/PassengerPicker'
import AncillaryPicker from '../components/UIComponents/AncillaryPicker'
import PaymentOptions from '../components/UIComponents/PaymentOptions'

export const componentRouter = {
  flight_list: FlightList,
  flight_status: FlightStatusCard,
  flight_schedule: FlightSchedule,
  booking_itinerary: BookingItinerary,
  booking_price: BookingPrice,
  booking_tickets: BookingTickets,
  booking_confirmed: BookingConfirmed,
  booking_contact: BookingContact,
  booking_price_confirm: PriceConfirm,
  passenger_details: PassengerDetailsPanel,
  passenger_picker: PassengerPicker,
  ancillary_picker: AncillaryPicker,
  seat_map: SeatMap,
  seat_selected: SeatSelected,
  payment_options: PaymentOptions,
  error: ErrorCard,
}

export const renderUIComponent = (ui_component, ui_data, handlers, messageProps = {}) => {
  const Component = componentRouter[ui_component]
  if (!Component) return null
  return (
    <Component
      data={ui_data}
      handlers={handlers}
      cookie={messageProps.cookie}
      itineraryParts={messageProps.itineraryParts}
      passengerCounts={messageProps.passengerCounts}
      promptMessage={messageProps.promptMessage}
    />
  )
}
