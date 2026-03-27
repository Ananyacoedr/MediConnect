const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiFetch = async (path, getTokenOrId, options = {}) => {
  let headers = { 'Content-Type': 'application/json', ...options.headers }

  if (typeof getTokenOrId === 'function') {
    try {
      const token = await getTokenOrId()
      if (token) headers['Authorization'] = `Bearer ${token}`
    } catch {}
  } else if (typeof getTokenOrId === 'string' && getTokenOrId) {
    headers['x-clerk-user-id'] = getTokenOrId
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await res.text()
  if (!res.ok) {
    let err = {}
    try { err = JSON.parse(text) } catch {}
    throw new Error(err.error || text || 'Request failed')
  }

  return JSON.parse(text)
}
