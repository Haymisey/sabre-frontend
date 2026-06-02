import { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import Header from './components/Layout/Header'
import ChatWindow from './components/Chat/ChatWindow'
import InputBar from './components/Chat/InputBar'
import { useSession } from './hooks/useSession'
import { useChat } from './hooks/useChat'

export default function App() {
  const { sessionId } = useSession()
  const {
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
    hasStarted,
  } = useChat(sessionId)

  const handlers = useMemo(
    () => ({
      sendMessage,
      isLoading,
      searchPassengerCounts,
      handlePassengerConfirm,
      onPassengerConfirm: handlePassengerConfirm,
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
      allMessages: messages,
    }),
    [
      sendMessage,
      isLoading,
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
      messages,
    ],
  )

  const handleQuickAction = (text) => {
    sendMessage(text)
  }

  const handleStartBooking = (counts) => {
    startBookingSearch(counts)
  }

  const handleResetBookingSearch = () => {
    if (
      window.confirm(
        'Start a new search? This clears the locked traveler count — you will set passengers again before searching.',
      )
    ) {
      resetBookingSearch()
    }
  }

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-dark)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="bg-pattern flex h-full flex-col bg-[var(--bg-dark)]">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            hasStarted={hasStarted}
            onQuickAction={handleQuickAction}
            onStartBooking={handleStartBooking}
            searchPassengerCounts={searchPassengerCounts}
            onResetBookingSearch={handleResetBookingSearch}
            handlers={handlers}
          />
        </AnimatePresence>
        <InputBar
          onSend={sendMessage}
          disabled={isLoading || blockFreeTextInput}
          inputLockedByPayment={blockFreeTextInput}
          searchPassengerCounts={searchPassengerCounts}
        />
      </main>
    </div>
  )
}
