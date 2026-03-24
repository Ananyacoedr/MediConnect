import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useSyncUser = () => {
  const { user, isLoaded } = useUser()
  const role = localStorage.getItem('mediconnect_role')

  useEffect(() => {
    if (!isLoaded || !user) return
    const endpoint = role === 'doctor' ? '/doctors/sync' : '/patients/sync'

    fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId:      user.id,
        firstName:    user.firstName,
        lastName:     user.lastName,
        email:        user.primaryEmailAddress?.emailAddress,
        profileImage: user.imageUrl || '',
      }),
    }).catch(console.error)
  }, [isLoaded, user, role])
}
