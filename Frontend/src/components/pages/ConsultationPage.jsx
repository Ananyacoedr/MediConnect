import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import {
  HeartPulse, ArrowLeft, Video, Phone, MessageSquare,
  FileText, Stethoscope, Plus, Trash2, Loader2,
  CheckCircle2, User, Calendar, ClipboardList, AlertCircle, Send
} from 'lucide-react'

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block'

const Section = ({ title, icon: Icon, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon size={16} className="text-blue-600" strokeWidth={2} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

const ConsultationPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const [appt, setAppt]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [ending, setEnding]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef(null)

  const [form, setForm] = useState({
    consultationNotes: '',
    diagnosis: '',
    consultationFee: '',
    feePaid: false,
    prescription: [{ medicine: '', dosage: '', duration: '', notes: '' }],
  })

  useEffect(() => {
    apiFetch(`/consultations/${id}`, user?.id)
      .then(data => {
        setAppt(data)
        setForm({
          consultationNotes: data.consultationNotes || '',
          diagnosis:         data.diagnosis || '',
          consultationFee:   data.consultationFee || '',
          feePaid:           data.feePaid || false,
          prescription:      data.prescription?.length
            ? data.prescription
            : [{ medicine: '', dosage: '', duration: '', notes: '' }],
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setPrescription = (i, k, v) =>
    setForm(f => ({
      ...f,
      prescription: f.prescription.map((p, idx) => idx === i ? { ...p, [k]: v } : p),
    }))

  const addMedicine = () =>
    setForm(f => ({ ...f, prescription: [...f.prescription, { medicine: '', dosage: '', duration: '', notes: '' }] }))

  const removeMedicine = (i) =>
    setForm(f => ({ ...f, prescription: f.prescription.filter((_, idx) => idx !== i) }))

  const saveNotes = async () => {
    try {
      setSaving(true)
      const updated = await apiFetch(`/consultations/${id}/notes`, user?.id, {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      setAppt(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const endConsultation = async () => {
    if (!window.confirm('End this consultation and mark it as Completed?')) return
    try {
      setEnding(true)
      await saveNotes()
      await apiFetch(`/consultations/${id}/end`, user?.id, { method: 'PATCH' })
      navigate('/doctor-dashboard')
    } catch (err) {
      setError(err.message)
      setEnding(false)
    }
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    setChatMessages(m => [...m, { from: 'doctor', text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setChatInput('')
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const roomLink = `${window.location.origin}/video/${id}`

  const patient = appt?.patient
  const age = patient?.dob
    ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : appt?.patientAge

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 size={36} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <HeartPulse size={22} /> MediConnect
          </div>
        </div>
        <div className="flex items-center gap-3">
          {appt?.consultationEnded ? (
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium flex items-center gap-1">
              <CheckCircle2 size={13} /> Completed
            </span>
          ) : (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" /> Active
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Consultation Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date(appt?.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {appt?.time}
            </p>
          </div>
          {!appt?.consultationEnded && (
            <Button onClick={endConsultation} disabled={ending} className="bg-red-500 hover:bg-red-600 text-white">
              {ending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              End Consultation
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Patient Info */}
          <div className="flex flex-col gap-6">

            <Section title="Patient Details" icon={User}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xl font-bold">
                  {patient?.firstName?.[0]}{patient?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    {patient?.firstName} {patient?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{patient?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Age',    value: age ? `${age} years` : '—' },
                  { label: 'Gender', value: patient?.gender || appt?.patientGender || '—' },
                  { label: 'Phone',  value: patient?.phone || '—' },
                  { label: 'Type',   value: appt?.consultationType || 'video' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Symptoms" icon={AlertCircle}>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {appt?.symptoms || appt?.reason || 'No symptoms recorded.'}
              </p>
            </Section>

            <Section title="Medical History" icon={ClipboardList}>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {appt?.medicalHistory || 'No medical history available.'}
              </p>
            </Section>

            <Section title="Uploaded Reports" icon={FileText}>
              {appt?.uploadedReports?.length ? (
                <div className="flex flex-col gap-2">
                  {appt.uploadedReports.map((r, i) => (
                    <a key={i} href={r} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <FileText size={14} /> Report {i + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No reports uploaded.</p>
              )}
            </Section>

          </div>

          {/* RIGHT: Consultation Actions + Notes */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Consultation Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Video size={16} className="text-blue-600" /> Consultation Actions
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <a
                  href={`/video/${id}?name=${encodeURIComponent(user?.firstName || 'Doctor')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:ring-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Video size={22} strokeWidth={1.8} />
                  <span className="text-xs font-semibold">Video Call</span>
                </a>

                <a
                  href={`/video/${id}?name=${encodeURIComponent(user?.firstName || 'Doctor')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:ring-green-300 hover:text-green-600 hover:bg-green-50 transition-all"
                >
                  <Phone size={22} strokeWidth={1.8} />
                  <span className="text-xs font-semibold">Audio Call</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowChat(c => !c)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-all select-none ${
                    showChat
                      ? 'bg-purple-50 text-purple-600 ring-2 ring-purple-400 shadow-md'
                      : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:ring-purple-300 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <MessageSquare size={22} strokeWidth={1.8} />
                  <span className="text-xs font-semibold">{showChat ? 'Close Chat' : 'Start Chat'}</span>
                </button>
              </div>

              {/* Share room link */}
              <div className="mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2.5">
                <span className="text-xs text-blue-700 dark:text-blue-300 flex-1 truncate">
                  Share with patient: <span className="font-mono">{roomLink}</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(roomLink)}
                  className="text-xs text-blue-600 hover:underline shrink-0"
                >
                  Copy
                </button>
              </div>

              {/* Chat Panel */}
              {showChat && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-700 overflow-hidden flex flex-col" style={{ height: '320px' }}>
                  <div className="bg-purple-50 dark:bg-purple-900 px-4 py-2.5 border-b border-purple-200 dark:border-purple-700 flex items-center gap-2">
                    <MessageSquare size={14} className="text-purple-600 dark:text-purple-300" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-200">
                      Chat with {patient?.firstName} {patient?.lastName}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 bg-white dark:bg-gray-800 flex flex-col gap-2">
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-gray-400 text-center mt-6">No messages yet. Start the conversation.</p>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.from === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          msg.from === 'doctor'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                        }`}>
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-0.5 ${msg.from === 'doctor' ? 'text-blue-200' : 'text-gray-400'}`}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2 px-3 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <input
                      className={inputCls}
                      placeholder="Type a message…"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                    />
                    <button
                      type="button"
                      onClick={sendChat}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-sm font-medium shrink-0"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Section title="Consultation Notes" icon={FileText}>
              <label className={labelCls}>Doctor's Notes</label>
              <textarea
                rows={4}
                value={form.consultationNotes}
                onChange={e => setField('consultationNotes', e.target.value)}
                className={inputCls}
                placeholder="Write your consultation notes here..."
              />
            </Section>

            <Section title="Diagnosis" icon={Stethoscope}>
              <label className={labelCls}>Diagnosis</label>
              <textarea
                rows={3}
                value={form.diagnosis}
                onChange={e => setField('diagnosis', e.target.value)}
                className={inputCls}
                placeholder="Enter diagnosis..."
              />
            </Section>

            <Section title="Prescriptions Issued" icon={ClipboardList}>
              <div className="flex flex-col gap-3">
                {form.prescription.map((p, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl relative">
                    <div>
                      <label className={labelCls}>Medicine</label>
                      <input value={p.medicine} onChange={e => setPrescription(i, 'medicine', e.target.value)} className={inputCls} placeholder="Medicine name" />
                    </div>
                    <div>
                      <label className={labelCls}>Dosage</label>
                      <input value={p.dosage} onChange={e => setPrescription(i, 'dosage', e.target.value)} className={inputCls} placeholder="e.g. 500mg" />
                    </div>
                    <div>
                      <label className={labelCls}>Duration</label>
                      <input value={p.duration} onChange={e => setPrescription(i, 'duration', e.target.value)} className={inputCls} placeholder="e.g. 7 days" />
                    </div>
                    <div>
                      <label className={labelCls}>Notes</label>
                      <input value={p.notes} onChange={e => setPrescription(i, 'notes', e.target.value)} className={inputCls} placeholder="After meals..." />
                    </div>
                    {form.prescription.length > 1 && (
                      <button onClick={() => removeMedicine(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addMedicine} className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1">
                  <Plus size={15} /> Add Medicine
                </button>
              </div>
            </Section>

            <Section title="Earnings / Consultation Fee" icon={Calendar}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={form.consultationFee}
                    onChange={e => setField('consultationFee', e.target.value)}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.feePaid}
                      onChange={e => setField('feePaid', e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Fee Paid</span>
                  </label>
                </div>
              </div>
            </Section>

            {success && (
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 size={15} /> Consultation saved successfully!
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={saveNotes} disabled={saving} className="flex-1">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Consultation'}
              </Button>
              {!appt?.consultationEnded && (
                <Button onClick={endConsultation} disabled={ending} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                  {ending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  End Consultation
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultationPage
