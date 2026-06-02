import { motion } from 'framer-motion'
import { renderUIComponent } from '../../utils/componentRouter'

export default function MessageBubble({ message, handlers }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
    >
      {message.content && message.ui_component !== 'payment_options' && (
        <div
          className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[85%] ${
            isUser
              ? 'rounded-br-md bg-[var(--accent)]/15 border border-[var(--accent)]/25 text-[var(--text-primary)]'
              : 'rounded-bl-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]'
          }`}
        >
          {message.content}
        </div>
      )}

      {!isUser && message.ui_component && (
        <div className="w-full max-w-full">
          {renderUIComponent(message.ui_component, message.ui_data, handlers, {
            cookie: message.cookie,
            itineraryParts: message.itineraryParts,
            passengerCounts:
              message.passengerCounts || handlers?.searchPassengerCounts,
            promptMessage: message.content,
          })}
        </div>
      )}
    </motion.div>
  )
}
