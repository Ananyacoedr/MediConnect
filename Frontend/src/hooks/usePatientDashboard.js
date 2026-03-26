import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const usePatientDashboard = () => {
  const { user, isLoaded } = useUser()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!isLoaded || !user) return
    try {
      setLoading(true)
      setError(null)
      const result = await apiFetch('/patients/dashboard', user.id)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, isLoaded])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
