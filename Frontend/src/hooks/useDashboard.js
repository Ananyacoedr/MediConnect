import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const useDashboard = () => {
  const { getToken } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [result, earnings] = await Promise.all([
        apiFetch('/doctors/dashboard', getToken),
        apiFetch('/consultations/earnings', getToken),
      ])
      setData({ ...result, earnings })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const updateAppointmentStatus = async (id, status) => {
    await apiFetch(`/appointments/${id}/status`, getToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await fetchDashboard()
  }

  return { data, loading, error, refetch: fetchDashboard, updateAppointmentStatus }
}
