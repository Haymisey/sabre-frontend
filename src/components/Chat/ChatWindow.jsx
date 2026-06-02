import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import WelcomeScreen from '../Layout/WelcomeScreen'
import TravelersLockedBanner from '../Layout/TravelersLockedBanner'

export default function ChatWindow({
  messages,
  isLoading,
  hasStarted,
  onQuickAction,
  onStartBooking,
  handlers,
  searchPassengerCounts,
  onResetBookingSearch,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4 md:px-6">
        {!hasStarted ? (
          <WelcomeScreen onQuickAction={onQuickAction} onStartBooking={onStartBooking} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <TravelersLockedBanner
              counts={searchPassengerCounts}
              onNewSearch={onResetBookingSearch}
            />
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} handlers={handlers} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
