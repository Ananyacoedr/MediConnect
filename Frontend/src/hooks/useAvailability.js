import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const defaultSchedule = DAYS.map(day => ({
  day,
  startTime: '09:00',
  endTime: '17:00',
  isAvailable: day !== 'Saturday' && day !== 'Sunday',
}))

export const useAvailability = (initialAvailability) => {
  const { getToken } = useAuth()
  const [schedule, setSchedule] = useState(
    initialAvailability?.length ? initialAvailability : defaultSchedule
  )
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState(null)

  const update = useCallback((day, field, value) => {
    setSchedule(prev => prev.map(s => s.day === day ? { ...s, [field]: value } : s))
  }, [])

  const save = async () => {
    try {
      setSaving(true)
      setError(null)
      await apiFetch('/doctors/availability', getToken, {
        method: 'PUT',
        body: JSON.stringify({ availability: schedule }),
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return { schedule, update, save, saving, success, error, DAYS }
}
