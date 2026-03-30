import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'

export const useSyncUser = () => {
  const { user, isLoaded } = useUser()
  const [synced, setSynced] = useState(false)
  const role = localStorage.getItem('mediconnect_role')

  useEffect(() => {
    if (!isLoaded || !user) return
    const endpoint = role === 'doctor' ? '/doctors/sync' : '/patients/sync'

    apiFetch(endpoint, null, {
      method: 'POST',
      body: JSON.stringify({
        clerkId:      user.id,
        firstName:    user.firstName,
        lastName:     user.lastName,
        email:        user.primaryEmailAddress?.emailAddress,
        profileImage: user.imageUrl || '',
      }),
    })
      .then(() => setSynced(true))
      .catch(() => setSynced(true)) // still allow dashboard to load
  }, [isLoaded, user, role])

  return synced
}
