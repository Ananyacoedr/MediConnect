import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import { HeartPulse, ArrowLeft, Video, Mic, Search, Loader2, CalendarDays, Clock } from 'lucide-react'

const statusStyle = {
  Confirmed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
}

const StartConsultation = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    apiFetch('/doctors/appointments', user?.id)
      .then(data => {
        setAppointments(data.filter(a => ['Pending', 'Confirmed'].includes(a.status)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const filtered = appointments.filter(a => {
    const name = `${a.patient?.firstName} ${a.patient?.lastName}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || (a.reason || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || a.status.toLowerCase() === filter.toLowerCase()
    return matchSearch && matchFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:bg-gray-900 flex flex-col transition-colors">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800 border-gray-200 dark:border-gray-800 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xl">
            <HeartPulse size={22} /> MediConnect
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Start a Consultation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select an appointment to begin the consultation session.</p>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name or reason..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'Confirmed', 'Pending'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors
                  ${filter === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400 dark:text-gray-500">
                <Loader2 size={20} className="animate-spin" /> Loading appointments...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400 dark:text-gray-500 gap-2">
                <CalendarDays size={36} strokeWidth={1} />
                <p className="text-sm">No appointments found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(appt => (
                  <div key={appt._id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 dark:text-blue-300 font-bold text-sm shrink-0">
                        {appt.patient?.firstName?.[0]}{appt.patient?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {appt.patient.firstName} {appt.patient.lastName}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <CalendarDays size={11} /> {new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <Clock size={11} /> {appt.time}
                          </span>
                          {appt.reason && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">· {appt.reason}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[appt.status] || ''}`}>
                        {appt.status}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs flex items-center gap-1.5"
                          onClick={() => navigate(`/consultation/${appt._id}`)}
                        >
                          <Video size={13} /> Video
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs flex items-center gap-1.5"
                          onClick={() => navigate(`/consultation/${appt._id}`)}
                        >
                          <Mic size={13} /> Audio
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StartConsultation
