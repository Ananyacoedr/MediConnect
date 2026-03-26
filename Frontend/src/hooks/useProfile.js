import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const useProfile = () => {
  const { user, isLoaded } = useUser()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!isLoaded || !user) return
    try {
      setLoading(true)
      const data = await apiFetch('/doctors/profile', user.id)
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, isLoaded])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const updateProfile = async (formData) => {
    try {
      setSaving(true)
      setSuccess(false)
      const updated = await apiFetch('/doctors/profile', user.id, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return { profile, loading, saving, error, success, updateProfile }
}
