import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const useDashboard = (synced) => {
  const { user, isLoaded } = useUser()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchDashboard = useCallback(async () => {
    if (!isLoaded || !user || !synced) return
    try {
      setLoading(true)
      const [result, earnings] = await Promise.all([
        apiFetch('/doctors/dashboard', user.id),
        apiFetch('/consultations/earnings', user.id),
      ])
      setData({ ...result, earnings })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, isLoaded, synced])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const updateAppointmentStatus = async (id, status) => {
    await apiFetch(`/appointments/${id}/status`, user.id, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await fetchDashboard()
  }

  return { data, loading, error, refetch: fetchDashboard, updateAppointmentStatus }
}
