import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { HeartPulse, Stethoscope, User } from 'lucide-react'

const RoleRedirect = () => {
  const { user, isLoaded } = useUser()
  const existingRole = localStorage.getItem('mediconnect_role')
  const [selected, setSelected] = useState(null)

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Already has a role — go straight to dashboard
  if (existingRole) {
    return <Navigate to={existingRole === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />
  }

  // Role selected — save and redirect
  if (selected) {
    localStorage.setItem('mediconnect_role', selected)
    return <Navigate to={selected === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />
  }

  // New user — show role picker
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-2xl mb-2">
            <HeartPulse size={28} /> MediConnect
          </div>
          <p className="text-xl font-bold text-gray-900">Welcome, {user?.firstName}!</p>
          <p className="text-sm text-gray-500">How would you like to use MediConnect?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelected('patient')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <User size={28} className="text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Patient</p>
              <p className="text-xs text-gray-400 mt-0.5">Book appointments & consult doctors</p>
            </div>
          </button>

          <button
            onClick={() => setSelected('doctor')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
              <Stethoscope size={28} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Doctor</p>
              <p className="text-xs text-gray-400 mt-0.5">Manage patients & consultations</p>
            </div>
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">You can only select this once. Choose carefully.</p>
      </div>
    </div>
  )
}

export default RoleRedirect
