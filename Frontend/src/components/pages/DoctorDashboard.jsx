import { useUser, useClerk } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDashboard } from '@/hooks/useDashboard'
import { useSyncUser } from '@/hooks/useSyncUser'
import {
  HeartPulse, UserCircle, CalendarCheck, CalendarDays,
  Users, BookCheck, Clock, ChevronRight, Loader2
} from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card>
    <CardContent className="flex items-center gap-4 pt-6">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </CardContent>
  </Card>
)

const statusStyle = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
}

const DoctorDashboard = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { data, loading, error, updateAppointmentStatus } = useDashboard()
  useSyncUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} />
          MediConnect
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Doctor</span>
          <Button
            variant="outline" size="sm"
            onClick={() => { localStorage.removeItem('mediconnect_role'); signOut({ redirectUrl: '/' }) }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">

        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good day, Dr. <span className="text-blue-600">{user?.lastName || user?.firstName}!</span>
          </h1>
          <p className="text-gray-500 mt-1">Here's your practice overview.</p>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: UserCircle,    label: 'My Profile',          color: 'bg-purple-50 text-purple-600' },
              { icon: CalendarCheck, label: 'Manage Availability', color: 'bg-green-50 text-green-600'   },
              { icon: CalendarDays,  label: 'View Appointments',   color: 'bg-blue-50 text-blue-600'     },
              { icon: Users,         label: 'My Patients',         color: 'bg-orange-50 text-orange-600' },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`p-3 rounded-full ${color}`}><Icon size={22} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            Failed to load dashboard data: {error}
          </div>
        )}

        {/* Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6">
              <Loader2 size={18} className="animate-spin" /> Loading stats...
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users}        label="Total Patients"          value={data?.stats.totalPatients}          color="bg-blue-50 text-blue-600"    />
              <StatCard icon={BookCheck}    label="Successfully Appointed"  value={data?.stats.successfullyAppointed}  color="bg-green-50 text-green-600"  />
              <StatCard icon={Clock}        label="Pending Bookings"        value={data?.stats.pendingBookings}        color="bg-yellow-50 text-yellow-600"/>
              <StatCard icon={CalendarDays} label="Requested Appointments"  value={data?.stats.requestedAppointments} color="bg-purple-50 text-purple-600"/>
            </div>
          )}
        </section>

        {/* Appointments + Pending */}
        {!loading && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Today's Appointments</CardTitle>
                  <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={14} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {data?.todayAppointments?.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">No appointments today.</p>
                )}
                {data?.todayAppointments?.map(appt => (
                  <div key={appt._id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appt.patient.firstName} {appt.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{appt.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[appt.status]}`}>
                      {appt.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Booking Requests</CardTitle>
                  <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={14} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {data?.pendingRequests?.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">No pending requests.</p>
                )}
                {data?.pendingRequests?.map(appt => (
                  <div key={appt._id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appt.patient.firstName} {appt.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(appt.date).toLocaleDateString()} — {appt.time}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm" className="h-7 px-3 text-xs"
                        onClick={() => updateAppointmentStatus(appt._id, 'Confirmed')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm" variant="outline" className="h-7 px-3 text-xs"
                        onClick={() => updateAppointmentStatus(appt._id, 'Cancelled')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </section>
        )}

      </main>
    </div>
  )
}

export default DoctorDashboard
