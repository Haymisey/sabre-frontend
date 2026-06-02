/**
 * Normalize Sabre session cookies from various backend shapes.
 * Returns null if no valid key/value pairs (never send [null, null, ...]).
 */
export const normalizeSabreCookie = (cookie) => {
  if (cookie == null) return null

  let list = null

  if (Array.isArray(cookie)) {
    list = cookie
  } else if (Array.isArray(cookie.sabreCookies)) {
    list = cookie.sabreCookies
  } else if (Array.isArray(cookie.cookies)) {
    list = cookie.cookies
  } else if (cookie.key && cookie.value != null && cookie.value !== '') {
    list = [cookie]
  }

  if (!Array.isArray(list)) return null

  const sabreCookies = list
    .filter((entry) => entry != null && typeof entry === 'object')
    .map((entry) => ({
      key: entry.key ?? entry.name,
      value: entry.value,
    }))
    .filter(
      (entry) =>
        entry.key != null &&
        String(entry.key).trim() !== '' &&
        entry.value != null &&
        String(entry.value).trim() !== '',
    )
    .map((entry) => ({
      key: String(entry.key).trim(),
      value: String(entry.value),
    }))

  if (sabreCookies.length === 0) return null

  return { sabreCookies }
}

export const isValidSabreCookie = (cookie) => normalizeSabreCookie(cookie) != null
