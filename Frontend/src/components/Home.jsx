import { useUser, useClerk } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { HeartPulse } from 'lucide-react'

const Home = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const role = localStorage.getItem('mediconnect_role') || 'patient'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} />
          MediConnect
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">{role}</span>
          <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('mediconnect_role'); signOut({ redirectUrl: '/' }) }}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, <span className="text-blue-600">{user?.firstName}!</span>
        </h1>
        <p className="text-gray-500 text-lg">
          {role === 'doctor' ? 'Manage your patients and appointments.' : 'Book appointments and consult doctors.'}
        </p>
      </main>
    </div>
  )
}

export default Home
