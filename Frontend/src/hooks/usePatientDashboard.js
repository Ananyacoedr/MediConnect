import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const usePatientDashboard = () => {
  const { getToken } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiFetch('/patients/dashboard', getToken)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
