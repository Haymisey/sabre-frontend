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

/** Sabre-style MM/DD/YYYY HH:mm:ss (US) or ISO. */
export const parseSabreDateTime = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const str = String(value).trim()
  const us = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (us) {
    const [, month, day, year, h = '0', min = '0', sec = '0'] = us
    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(h),
      Number(min),
      Number(sec),
    )
    return Number.isNaN(d.getTime()) ? null : d
  }

  const iso = new Date(str)
  return Number.isNaN(iso.getTime()) ? null : iso
}

export const formatSabreDateTime = (value) => {
  const d = parseSabreDateTime(value)
  if (!d) return value != null ? String(value) : '—'
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const timeToTicketToMs = (tt) => {
  if (!tt || typeof tt !== 'object') return null
  const ms =
    ((Number(tt.days) || 0) * 86400 +
      (Number(tt.hours) || 0) * 3600 +
      (Number(tt.minutes) || 0) * 60 +
      (Number(tt.seconds) || 0)) *
    1000
  return ms > 0 ? ms : null
}

export const formatTimeToTicketRemaining = (ms) => {
  if (ms == null || ms <= 0) return 'Expired'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
  if (days === 0 && hours === 0 && parts.length <= 1) parts.push(`${seconds}s`)
  return parts.join(' ')
}

/** Miles earned on a fare (backend: awardedMiles). */
export const getAwardedMiles = (fare) => {
  const raw = fare?.awardedMiles ?? fare?.awardMiles ?? fare?.milesEarned ?? null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export const formatAwardedMiles = (fare, { short = false } = {}) => {
  const miles = getAwardedMiles(fare)
  if (miles == null) return null
  const formatted = miles.toLocaleString('en-US')
  return short ? `${formatted} mi` : `${formatted} miles`
}

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
