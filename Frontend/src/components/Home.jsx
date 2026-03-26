import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const Home = () => {
  const { isLoaded } = useUser()
  const role = localStorage.getItem('mediconnect_role')

  if (!isLoaded) return null
  return <Navigate to={role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />
}

export default Home
