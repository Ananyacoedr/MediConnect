import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDashboard } from '@/hooks/useDashboard'
import { useSyncUser } from '@/hooks/useSyncUser'
import { useAvailability } from '@/hooks/useAvailability'
import ThemeToggle from '@/components/ThemeToggle'
import {
  HeartPulse, CalendarDays, Users, BookCheck, Clock,
  ChevronRight, Loader2, Briefcase, MapPin,
  LayoutDashboard, UserCircle, CalendarCheck, LogOut,
  Video, Mic, PhoneOff, CheckCircle2, CalendarClock,
  DollarSign, ClipboardList, Stethoscope, History
} from 'lucide-react'
const statusStyle = {
  Confirmed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
}

const NAV_ITEMS = [
  { key: 'overview',      icon: LayoutDashboard, label: 'Overview'          },
  { key: 'profile',       icon: UserCircle,      label: 'Edit Profile'      },
  { key: 'patients',      icon: Users,           label: 'My Patients'       },
  { key: 'appointments',  icon: CalendarCheck,   label: 'View Appointments' },
  { key: 'consultations', icon: Video,           label: 'Consultations'     },
  { key: 'availability',  icon: CalendarClock,   label: 'My Availability'   },
  { key: 'previous',      icon: History,         label: 'Past Consultations'},
]

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
    {children}
  </h2>
)

const inputCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── Consultations Section ──────────────────────────────────────────────────
const ConsultationsSection = ({ appointments, navigate }) => {
  const [activeCall, setActiveCall] = useState(null)
  const confirmed = appointments?.filter(a => a.status === 'Confirmed') || []

  return (
    <div className="space-y-6">
      <SectionTitle>Consultations</SectionTitle>

      {/* Call type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-blue-200 dark:border-blue-700">
          <CardContent className="flex items-center gap-4 pt-5 pb-5">
            <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              <Video size={22} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Video Consultation</p>
              <p className="text-xs text-gray-400 mt-0.5">Face-to-face virtual appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-700">
          <CardContent className="flex items-center gap-4 pt-5 pb-5">
            <div className="p-3 rounded-full bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300">
              <Mic size={22} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Audio Consultation</p>
              <p className="text-xs text-gray-400 mt-0.5">Voice-only appointments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled consultations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Scheduled Consultations</CardTitle>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
              {confirmed.length} confirmed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {confirmed.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No consultations scheduled for today.</p>
          ) : (
            confirmed.map(appt => (
              <div key={appt._id} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold">
                    {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{appt.time} · {appt.reason || 'General consultation'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-8 px-3 text-xs" onClick={() => navigate(`/consultation/${appt._id}`)}>
                    Start Consultation
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active call UI */}
      {activeCall && (
        <Card className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse inline-block" />
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Call in progress with {confirmed.find(a => a._id === activeCall)?.patient.firstName}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white h-8 px-4 text-xs"
                onClick={() => setActiveCall(null)}
              >
                <PhoneOff size={13} /> End Call
              </Button>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 h-32 rounded-xl bg-gray-800 dark:bg-gray-900 flex items-center justify-center text-gray-400 text-xs">
                Patient Camera
              </div>
              <div className="w-28 h-32 rounded-xl bg-gray-700 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                Your Camera
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Previous Consultations Section ───────────────────────────────────────
const PreviousConsultationsSection = () => {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/consultations/previous', getToken)
      .then(setConsultations)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <SectionTitle>Past Consultations</SectionTitle>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Completed Consultations</CardTitle>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
              {consultations.length} total
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6"><Loader2 size={16} className="animate-spin" /> Loading...</div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
              <History size={36} strokeWidth={1} />
              <p className="text-sm">No completed consultations yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {consultations.map(c => (
                <div key={c._id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold shrink-0">
                      {c.patient.firstName[0]}{c.patient.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {c.patient.firstName} {c.patient.lastName}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <CalendarDays size={11} /> {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} /> {c.time}
                        </span>
                        {c.diagnosis && (
                          <span className="text-xs text-gray-400 truncate max-w-[160px]">· {c.diagnosis}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.feePaid && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Paid</span>
                    )}
                    {c.consultationFee > 0 && (
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">${c.consultationFee}</span>
                    )}
                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => navigate(`/consultation/${c._id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Availability Section ───────────────────────────────────────────────────
const AvailabilitySection = ({ initialAvailability }) => {
  const { schedule, update, save, saving, success, error, DAYS } = useAvailability(initialAvailability)

  return (
    <div className="space-y-4">
      <SectionTitle>My Availability</SectionTitle>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <p className="text-xs text-gray-400 mt-1">Set the days and hours you are available for appointments.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map(slot => (
            <div key={slot.day} className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">

              {/* Toggle */}
              <button
                onClick={() => update(slot.day, 'isAvailable', !slot.isAvailable)}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${slot.isAvailable ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${slot.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>

              {/* Day */}
              <span className={`w-24 text-sm font-medium shrink-0 ${slot.isAvailable ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                {slot.day}
              </span>

              {/* Time pickers */}
              {slot.isAvailable ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={e => update(slot.day, 'startTime', e.target.value)}
                    className={inputCls}
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={e => update(slot.day, 'endTime', e.target.value)}
                    className={inputCls}
                  />
                  <span className="text-xs text-gray-400 ml-1">
                    {(() => {
                      const [sh, sm] = slot.startTime.split(':').map(Number)
                      const [eh, em] = slot.endTime.split(':').map(Number)
                      const hrs = ((eh * 60 + em) - (sh * 60 + sm)) / 60
                      return hrs > 0 ? `${hrs}h` : ''
                    })()}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Not available</span>
              )}
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 px-3 py-2 rounded-lg text-sm">
              <CheckCircle2 size={15} /> Availability saved successfully!
            </div>
          )}

          <Button onClick={save} disabled={saving} className="w-full mt-2">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Availability'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const { data, loading, error, updateAppointmentStatus } = useDashboard()
  const [active, setActive] = useState('overview')
  useSyncUser()

  const doctor = data?.doctor

  const stats = [
    { icon: Users,        label: 'Total Patients',         value: data?.stats?.totalPatients,                                    color: 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'     },
    { icon: BookCheck,    label: 'Successfully Appointed', value: data?.stats?.successfullyAppointed,                            color: 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300'  },
    { icon: Clock,        label: 'Pending Bookings',       value: data?.stats?.pendingBookings,                                  color: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'},
    { icon: CalendarDays, label: 'Requested Appointments', value: data?.stats?.requestedAppointments,                            color: 'bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300'},
    { icon: DollarSign,   label: 'Monthly Earnings',       value: data?.earnings ? `$${data.earnings.monthlyEarnings}` : '—',  color: 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'},
    { icon: ClipboardList,label: 'Prescriptions Issued',   value: data?.earnings?.prescriptionsIssued ?? '—',                  color: 'bg-pink-50 dark:bg-pink-900 text-pink-600 dark:text-pink-300'      },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} /> MediConnect
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">Doctor</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-60 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full sticky top-0">

          {/* Mini profile */}
          <div className="flex flex-col items-center gap-2 px-4 py-6 border-b border-gray-100 dark:border-gray-700">
            {doctor?.profileImage ? (
              <img src={doctor.profileImage} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-blue-200" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-500 text-lg font-bold">
                {doctor?.firstName?.[0]}{doctor?.lastName?.[0]}
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                {doctor?.title} {doctor?.firstName} {doctor?.lastName}
              </p>
              {doctor?.specialty && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{doctor.specialty}</p>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
            {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => key === 'profile' ? navigate('/doctor-profile') : setActive(key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left
                  ${active === key && key !== 'profile'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => { localStorage.removeItem('mediconnect_role'); signOut({ redirectUrl: '/' }) }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition-colors w-full"
            >
              <LogOut size={18} strokeWidth={1.8} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 px-8 py-8 overflow-y-auto">

          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Good day, <span className="text-blue-600">{doctor?.title || 'Dr.'} {doctor?.lastName || user?.lastName || user?.firstName}!</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Here's your practice overview.</p>
            </div>
            <Button
              onClick={() => navigate('/start-consultation')}
              className="flex items-center gap-2 shrink-0"
            >
              <Stethoscope size={15} /> Start Consultation
            </Button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
              Failed to load dashboard data: {error}
            </div>
          )}

          {/* OVERVIEW */}
          {active === 'overview' && (
            <div className="space-y-6">

              {/* Stat Cards */}
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400"><Loader2 size={18} className="animate-spin" /> Loading...</div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {stats.map(({ icon: Icon, label, value, color }) => (
                    <Card key={label}>
                      <CardContent className="flex items-center gap-4 pt-5 pb-5">
                        <div className={`p-3 rounded-full ${color}`}><Icon size={20} strokeWidth={1.5} /></div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Today's schedule + upcoming */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Today's schedule timeline */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Today's Schedule</CardTitle>
                      <span className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 size={15} className="animate-spin"/> Loading...</div>
                    ) : data?.todayAppointments?.length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-gray-400">
                        <CalendarDays size={32} strokeWidth={1} className="mb-2"/>
                        <p className="text-sm">No appointments today</p>
                      </div>
                    ) : (
                      <div className="relative pl-4">
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-100 dark:bg-blue-900"/>
                        {data?.todayAppointments?.map(appt => (
                          <div key={appt._id} className="relative flex gap-3 pb-4 last:pb-0">
                            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 border-blue-500 bg-white dark:bg-gray-800"/>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appt.patient.firstName} {appt.patient.lastName}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[appt.status]}`}>{appt.status}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5"><Clock size={10} className="inline mr-1"/>{appt.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming pending requests */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Upcoming Requests</CardTitle>
                      <button onClick={() => setActive('appointments')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">View all <ChevronRight size={13}/></button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 size={15} className="animate-spin"/> Loading...</div>
                    ) : data?.pendingRequests?.length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-gray-400">
                        <BookCheck size={32} strokeWidth={1} className="mb-2"/>
                        <p className="text-sm">No pending requests</p>
                      </div>
                    ) : (
                      data?.pendingRequests?.map(appt => (
                        <div key={appt._id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold">
                              {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appt.patient.firstName} {appt.patient.lastName}</p>
                              <p className="text-xs text-gray-400">{new Date(appt.date).toLocaleDateString()} · {appt.time}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => updateAppointmentStatus(appt._id,'Confirmed')}>✓</Button>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => updateAppointmentStatus(appt._id,'Cancelled')}>✕</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Consultation feature banner */}
              <Card className="bg-gradient-to-r from-blue-600 to-blue-500 border-0">
                <CardContent className="flex items-center justify-between pt-5 pb-5">
                  <div>
                    <p className="text-white font-semibold text-lg">Start a Consultation</p>
                    <p className="text-blue-100 text-sm mt-0.5">Connect with your patients via video or audio call</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => navigate('/start-consultation')} className="flex items-center gap-2 bg-white text-blue-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                      <Video size={16}/> Video Call
                    </button>
                    <button onClick={() => navigate('/start-consultation')} className="flex items-center gap-2 bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors">
                      <Mic size={16}/> Audio Call
                    </button>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* MY PATIENTS */}
          {active === 'patients' && (
            <div className="space-y-4">
              <SectionTitle>My Patients</SectionTitle>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Today's Patients</CardTitle>
                    <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">View all <ChevronRight size={14} /></button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 size={16} className="animate-spin" /> Loading...</div>
                  ) : data?.todayAppointments?.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">No patients today.</p>
                  ) : (
                    data?.todayAppointments?.map(appt => (
                      <div key={appt._id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-bold">
                            {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appt.patient.firstName} {appt.patient.lastName}</p>
                            <p className="text-xs text-gray-400">{appt.time}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[appt.status]}`}>{appt.status}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* VIEW APPOINTMENTS */}
          {active === 'appointments' && (
            <div className="space-y-4">
              <SectionTitle>View Appointments</SectionTitle>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Booking Requests</CardTitle>
                    <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">View all <ChevronRight size={14} /></button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center gap-2 text-gray-400 py-4"><Loader2 size={16} className="animate-spin" /> Loading...</div>
                  ) : data?.pendingRequests?.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">No pending requests.</p>
                  ) : (
                    data?.pendingRequests?.map(appt => (
                      <div key={appt._id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold">
                            {appt.patient.firstName[0]}{appt.patient.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appt.patient.firstName} {appt.patient.lastName}</p>
                            <p className="text-xs text-gray-400">{new Date(appt.date).toLocaleDateString()} — {appt.time}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 px-3 text-xs" onClick={() => updateAppointmentStatus(appt._id, 'Confirmed')}>Accept</Button>
                          <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => updateAppointmentStatus(appt._id, 'Cancelled')}>Decline</Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* CONSULTATIONS */}
          {active === 'consultations' && (
            <ConsultationsSection appointments={data?.todayAppointments ?? []} navigate={navigate} />
          )}

          {/* PREVIOUS CONSULTATIONS */}
          {active === 'previous' && <PreviousConsultationsSection />}

          {/* AVAILABILITY */}
          {active === 'availability' && (
            <AvailabilitySection initialAvailability={doctor?.availability} />
          )}

        </main>
      </div>
    </div>
  )
}

export default DoctorDashboard
