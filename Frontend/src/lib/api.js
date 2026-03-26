const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiFetch = async (path, userId, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId || '',
      ...options.headers,
    },
  })

  const text = await res.text()
  if (!res.ok) {
    let err = {}
    try { err = JSON.parse(text) } catch {}
    throw new Error(err.error || text || 'Request failed')
  }

  return JSON.parse(text)
}
