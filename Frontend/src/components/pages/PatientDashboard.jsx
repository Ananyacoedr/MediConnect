import { useUser, useClerk } from '@clerk/clerk-react'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { usePatientDashboard } from '@/hooks/usePatientDashboard'
import { useSyncUser } from '@/hooks/useSyncUser'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@clerk/clerk-react'
import SymptomChecker from '@/components/SymptomChecker'
import {
  HeartPulse, Search, CalendarPlus, Video, FileText,
  Pill, Truck, Bell, History, CalendarDays, CheckCircle,
  Clock, ChevronRight, Loader2, Camera, UserCircle
} from 'lucide-react'

const statusStyle = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
}

const StatCard = ({ icon: Icon, label, value, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border transition-all ${
      active
        ? 'border-blue-400 shadow-md ring-2 ring-blue-100'
        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
    } bg-white`}
  >
    <div className="flex items-center gap-4 p-5">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
      <ChevronRight size={16} className={`text-gray-300 transition-transform ${active ? 'rotate-90 text-blue-400' : ''}`} />
    </div>
  </button>
)

const AppointmentPanel = ({ title, appointments, onClose }) => (
  <div className="col-span-2 lg:col-span-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-semibold text-blue-700">{title}</p>
      <button onClick={onClose} className="text-blue-400 hover:text-blue-600">
        <X size={15} />
      </button>
    </div>
    {appointments.length === 0 ? (
      <p className="text-sm text-gray-400 py-2">No appointments in this category.</p>
    ) : (
      <div className="flex flex-col gap-2">
        {appointments.map(appt => (
          <div key={appt._id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Dr. {appt.doctor.firstName} {appt.doctor.lastName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {appt.doctor.specialty && <span className="mr-2">{appt.doctor.specialty}</span>}
                {new Date(appt.date).toLocaleDateString()} — {appt.time}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[appt.status]}`}>
              {appt.status}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
)

const quickActions = [
  { icon: Search,      label: 'Find Doctors',       color: 'bg-blue-50 text-blue-600'    },
  { icon: CalendarPlus,label: 'Book Appointment',   color: 'bg-green-50 text-green-600'  },
  { icon: Video,       label: 'Join Consultation',  color: 'bg-purple-50 text-purple-600'},
  { icon: FileText,    label: 'Upload Reports',     color: 'bg-orange-50 text-orange-600'},
  { icon: Pill,        label: 'My Prescriptions',   color: 'bg-pink-50 text-pink-600'    },
  { icon: Truck,       label: 'Order Medicines',    color: 'bg-teal-50 text-teal-600'    },
  { icon: Bell,        label: 'Reminders',          color: 'bg-yellow-50 text-yellow-600'},
  { icon: History,     label: 'History',            color: 'bg-gray-100 text-gray-600'   },
]

const PatientDashboard = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error } = usePatientDashboard()
  const [profileImage, setProfileImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  useSyncUser()

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result
      setProfileImage(base64)
      try {
        setUploading(true)
        await apiFetch('/patients/profile-image', getToken, {
          method: 'PATCH',
          body: JSON.stringify({ profileImage: base64 }),
        })
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const avatarSrc = profileImage || data?.patient?.profileImage || user?.imageUrl

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <HeartPulse size={24} />
          MediConnect
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">Patient</span>

          {/* Cart icon */}
          <button
            onClick={() => navigate('/prescription-cart')}
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600"
          >
            <ShoppingCart size={22} strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Profile Picture */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            {avatarSrc
              ? <img src={avatarSrc} alt="profile" className="w-9 h-9 rounded-full object-cover border-2 border-blue-200" />
              : <UserCircle size={36} className="text-gray-400" />
            }
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Camera size={14} className="text-white" />}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

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
            Welcome, <span className="text-blue-600">{data?.patient?.firstName || user?.firstName}!</span>
          </h1>
          <p className="text-gray-500 mt-1">
            {data?.patient?.email && (
              <span className="text-xs text-gray-400 mr-3">{data.patient.email}</span>
            )}
            How are you feeling today?
          </p>
        </div>

        {/* Symptom Checker */}
        <SymptomChecker />

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map(({ icon: Icon, label, color, to }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`p-3 rounded-full ${color}`}><Icon size={22} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 text-center">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            Failed to load dashboard: {error}
          </div>
        )}

        {/* Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-6">
              <Loader2 size={18} className="animate-spin" /> Loading...
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={CalendarDays} label="Total Appointments" value={data?.stats.total}
                color="bg-blue-50 text-blue-600"
                active={activePanel === 'total'}
                onClick={() => togglePanel('total')}
              />
              <StatCard
                icon={CheckCircle} label="Completed" value={data?.stats.completed}
                color="bg-green-50 text-green-600"
                active={activePanel === 'completed'}
                onClick={() => togglePanel('completed')}
              />
              <StatCard
                icon={Clock} label="Pending" value={data?.stats.pending}
                color="bg-yellow-50 text-yellow-600"
                active={activePanel === 'pending'}
                onClick={() => togglePanel('pending')}
              />
              {/* Inline detail panel */}
              {activePanel && (
                <AppointmentPanel
                  title={panelData[activePanel].title}
                  appointments={panelData[activePanel].appointments}
                  onClose={() => setActivePanel(null)}
                />
              )}
            </div>
          )}
        </section>

        {/* Medical History */}
        {!loading && data?.patient?.medicalHistory?.length > 0 && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                {data.patient.medicalHistory.map((item, i) => (
                  <div key={i} className="flex items-start justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.condition}</p>
                      {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                    </div>
                    {item.diagnosedOn && (
                      <span className="text-xs text-gray-400 shrink-0 ml-4">
                        {new Date(item.diagnosedOn).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Appointments */}
        {!loading && (
          <section>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Appointments</CardTitle>
                  <button onClick={() => navigate('/patient-appointments')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={14} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {data?.recentAppointments?.length === 0 && (
                  <p className="text-sm text-gray-400 py-2">No appointments yet.</p>
                )}
                {data?.recentAppointments?.map(appt => (
                  <div key={appt._id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {appt.doctor.specialty && <span className="mr-2">{appt.doctor.specialty}</span>}
                        {new Date(appt.date).toLocaleDateString()} — {appt.time}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[appt.status]}`}>
                      {appt.status}
                    </span>
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

export default PatientDashboard
