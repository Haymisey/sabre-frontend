import { useState, useEffect } from 'react'

const SESSION_KEY = 'et_ai_session_id'

export const useSession = () => {
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    setSessionId(id)
  }, [])

  const resetSession = () => {
    const id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
    setSessionId(id)
    return id
  }

  return { sessionId, resetSession }
}
