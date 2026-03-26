import { useEffect, useState, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const usePatientDashboard = () => {
  const { getToken, userId } = useAuth()
  const { user, isLoaded }   = useUser()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refetch = useCallback(async () => {
    if (!userId || !isLoaded) return
    try {
      setLoading(true)
      setError(null)
      // Build query params so backend can auto-create if first visit
      const params = new URLSearchParams({
        firstName: user?.firstName || '',
        lastName:  user?.lastName  || '',
        email:     user?.primaryEmailAddress?.emailAddress || '',
      })
      const result = await apiFetch(`/patients/${userId}?${params}`, getToken)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, isLoaded, getToken, user])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch }
}
