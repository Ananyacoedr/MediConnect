import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { HeartPulse, ArrowLeft, Loader2, CalendarDays } from 'lucide-react'

const statusStyle = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
}

const FILTERS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

const AllAppointments = () => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('All')

  useEffect(() => {
    apiFetch('/patients/appointments', getToken)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status === filter)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} /> MediConnect
        </div>
        <button
          onClick={() => navigate('/patient-dashboard')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">All your past and upcoming appointments.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filter === 'All' ? 'All Appointments' : `${filter} Appointments`}
              <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                <Loader2 size={18} className="animate-spin" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
                <CalendarDays size={36} strokeWidth={1} />
                <p className="text-sm">No {filter !== 'All' ? filter.toLowerCase() : ''} appointments found.</p>
              </div>
            ) : (
              filtered.map(appt => (
                <div key={appt._id} className="flex items-center justify-between py-4 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                      {appt.doctor?.firstName?.[0]}{appt.doctor?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {appt.doctor.specialty && <span className="mr-2">{appt.doctor.specialty}</span>}
                        {new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} — {appt.time}
                      </p>
                      {appt.reason && <p className="text-xs text-gray-400 mt-0.5">Reason: {appt.reason}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusStyle[appt.status]}`}>
                    {appt.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default AllAppointments
