export const formatTime = (datetime) => {
  if (!datetime) return '—'
  const date = new Date(datetime)
  if (Number.isNaN(date.getTime())) return datetime
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const formatDate = (datetime) => {
  if (!datetime) return '—'
  const date = new Date(datetime)
  if (Number.isNaN(date.getTime())) return datetime
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export const formatPrice = (amount, currency = 'ETB') => {
  if (amount == null) return '—'
  const formatted = Number(amount).toLocaleString('en-US')
  return `${currency} ${formatted}`
}

export const formatDuration = (duration) => duration || '—'

export const getStatusColor = (status) => {
  const map = {
    ARRIVED: 'text-green-400',
    DEPARTED: 'text-blue-400',
    'ON TIME': 'text-green-400',
    DELAYED: 'text-amber-400',
    CANCELLED: 'text-red-400',
    'NOT DEPARTED': 'text-gray-400',
  }
  return map[status?.toUpperCase?.()] || map[status] || 'text-gray-400'
}

export const getStatusBg = (status) => {
  const map = {
    ARRIVED: 'bg-green-500/20 text-green-400 border-green-500/30',
    DEPARTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'ON TIME': 'bg-green-500/20 text-green-400 border-green-500/30',
    DELAYED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    'NOT DEPARTED': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  const key = status?.toUpperCase?.() || status
  return map[key] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
