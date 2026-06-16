import { useState } from 'react'

export const useSession = () => {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())

  const resetSession = () => {
    const id = crypto.randomUUID()
    setSessionId(id)
    return id
  }

  return { sessionId, resetSession }
}
