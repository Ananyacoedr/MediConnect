import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { HeartPulse, Stethoscope, UserRound } from 'lucide-react'

const RoleCard = ({ icon: Icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-4 p-8 w-64 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group"
  >
    <div className="p-4 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
      <Icon size={36} strokeWidth={1.5} />
    </div>
    <div className="text-center">
      <p className="text-xl font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <span className="mt-2 text-sm font-medium text-blue-600 group-hover:underline">Continue →</span>
  </button>
)

const Landing = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()

  if (isSignedIn) return <Navigate to="/home" replace />

  const handleRole = (role) => {
    localStorage.setItem('mediconnect_role', role)
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="flex flex-col items-center gap-8 text-center">

        <div className="flex items-center gap-2 text-blue-600">
          <HeartPulse size={48} strokeWidth={1.5} />
        </div>

        <div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            Medi<span className="text-blue-600">Connect</span>
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-md">
            Your trusted platform for seamless healthcare connections.
          </p>
        </div>

        <p className="text-gray-700 font-medium text-lg">How would you like to continue?</p>

        <div className="flex flex-col sm:flex-row gap-6">
          <RoleCard
            icon={Stethoscope}
            title="I'm a Doctor"
            description="Manage patients & appointments"
            onClick={() => handleRole('doctor')}
          />
          <RoleCard
            icon={UserRound}
            title="I'm a Patient"
            description="Book appointments & consult doctors"
            onClick={() => handleRole('patient')}
          />
        </div>

      </div>
    </div>
  )
}

export default Landing
