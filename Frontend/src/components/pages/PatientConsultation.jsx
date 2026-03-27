import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '@/lib/api'
import {
  HeartPulse, ArrowLeft, Video, Phone, PhoneOff,
  MicOff, Mic, VideoOff, Loader2, UserCircle,
  CheckCircle2, AlertCircle, CalendarDays, Clock
} from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const ICE  = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const POLL = 1500

const signal = (roomId, type, data) =>
  fetch(`${BASE}/signal/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  })

const PatientConsultation = () => {
  const { id } = useParams()           // appointment id
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [appt, setAppt]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [activeCall, setActiveCall] = useState(null)  // null | 'video' | 'audio'
  const [callState, setCallState]   = useState('idle') // idle | waiting | connected | ended
  const [micMuted, setMicMuted]     = useState(false)
  const [camOff, setCamOff]         = useState(false)
  const [duration, setDuration]     = useState(0)

  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const pcRef          = useRef(null)
  const localRef       = useRef(null)
  const pollRef        = useRef(null)
  const timerRef       = useRef(null)
  const iceSentRef     = useRef(0)

  // roomId matches what the doctor uses in useWebRTC: the appointment id
  const roomId = id

  useEffect(() => {
    apiFetch(`/patients/appointments/${id}`, getToken)
      .then(setAppt)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null }

  const endCall = () => {
    stopPoll()
    clearInterval(timerRef.current)
    signal(roomId, 'end', null)
    pcRef.current?.close()
    pcRef.current = null
    localRef.current?.getTracks().forEach(t => t.stop())
    localRef.current = null
    setActiveCall(null)
    setCallState('idle')
    setMicMuted(false)
    setCamOff(false)
    setDuration(0)
    iceSentRef.current = 0
  }

  const startCall = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'video' ? { video: true, audio: true } : { audio: true, video: false }
      )
      localRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = new RTCPeerConnection(ICE)
      pcRef.current = pc
      iceSentRef.current = 0
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      pc.ontrack = (e) => {
        const s = e.streams[0]
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = s
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = s
      }

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) signal(roomId, 'ice', candidate)
      }

      pc.onconnectionstatechange = () => {
        if (['connected', 'completed'].includes(pc.connectionState)) {
          setCallState('connected')
          if (!timerRef.current) timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        }
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) endCall()
      }

      setActiveCall(type)
      setCallState('waiting')

      // Patient polls for the doctor's offer
      pollRef.current = setInterval(async () => {
        try {
          const res  = await fetch(`${BASE}/signal/${roomId}?role=patient&since=${iceSentRef.current}`)
          const data = await res.json()

          if (data.ended) { endCall(); return }

          // Doctor sends offer first — patient answers
          if (data.offer && !pc.remoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await signal(roomId, 'answer', answer)
            setCallState('connected')
            if (!timerRef.current) timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
          }

          if (data.iceCandidates?.length) {
            for (const c of data.iceCandidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
            }
            iceSentRef.current += data.iceCandidates.length
          }
        } catch {}
      }, POLL)
    } catch (err) {
      console.error(err)
      setError('Could not access camera/microphone. Please check permissions.')
      setActiveCall(null)
      setCallState('idle')
    }
  }

  const handleCallToggle = (type) => {
    if (activeCall === type) { endCall(); return }
    if (activeCall) endCall()
    startCall(type)
  }

  const toggleMic = () => {
    localRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicMuted(m => !m)
  }

  const toggleCam = () => {
    localRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOff(c => !c)
  }

  useEffect(() => {
    if (localVideoRef.current && localRef.current) localVideoRef.current.srcObject = localRef.current
  }, [activeCall])

  useEffect(() => () => endCall(), [])

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const doctor = appt?.doctor

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 size={36} className="animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => { endCall(); navigate('/patient-dashboard') }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <HeartPulse size={22} /> MediConnect
          </div>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse inline-block" /> Consultation
        </span>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">

        {/* Appointment Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            {doctor?.profileImage
              ? <img src={doctor.profileImage} className="w-14 h-14 rounded-full object-cover border-2 border-blue-100" alt="doc" />
              : <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg">
                  {doctor?.firstName?.[0]}{doctor?.lastName?.[0]}
                </div>
            }
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{doctor?.title} {doctor?.firstName} {doctor?.lastName}</p>
              <p className="text-sm text-blue-600">{doctor?.specialty}</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><CalendarDays size={11} /> {new Date(appt?.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {appt?.time}</span>
                <span className="capitalize">· {appt?.consultationType}</span>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> {appt?.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Call Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Video size={16} className="text-blue-600" /> Join Consultation Call
          </p>

          {/* Status banner when waiting */}
          {callState === 'waiting' && (
            <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl text-sm">
              <Loader2 size={15} className="animate-spin" />
              Waiting for the doctor to start the call… Keep this page open.
            </div>
          )}

          {callState === 'connected' && (
            <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Connected · {fmt(duration)}
            </div>
          )}

          {/* Call type buttons */}
          {callState === 'idle' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => handleCallToggle('video')}
                className="flex flex-col items-center gap-2 py-5 rounded-xl bg-blue-50 text-blue-600 border-2 border-blue-200 hover:border-blue-400 transition-all font-medium">
                <Video size={24} strokeWidth={1.8} />
                <span className="text-sm">Join Video Call</span>
              </button>
              <button onClick={() => handleCallToggle('audio')}
                className="flex flex-col items-center gap-2 py-5 rounded-xl bg-green-50 text-green-600 border-2 border-green-200 hover:border-green-400 transition-all font-medium">
                <Phone size={24} strokeWidth={1.8} />
                <span className="text-sm">Join Audio Call</span>
              </button>
            </div>
          )}

          {/* Video call UI */}
          {activeCall === 'video' && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="bg-gray-900 relative flex gap-2 p-3 min-h-[240px]">
                {/* Remote (doctor) video */}
                <div className="flex-1 rounded-lg bg-gray-800 overflow-hidden relative flex items-center justify-center">
                  {callState === 'connected' ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3 w-full h-full py-8">
                      <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                        <UserCircle size={48} className="text-gray-500" />
                      </div>
                      <p className="text-white text-sm font-medium">{doctor?.title} {doctor?.firstName} {doctor?.lastName}</p>
                      <div className="flex items-center gap-2 text-yellow-400 text-xs">
                        <Loader2 size={14} className="animate-spin" /> Waiting for doctor to start…
                      </div>
                    </div>
                  )}
                </div>
                {/* Local (patient) video */}
                <div className="w-28 rounded-lg bg-gray-700 overflow-hidden relative flex items-center justify-center">
                  <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camOff ? 'hidden' : ''}`} />
                  {camOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1">
                      <VideoOff size={18} /><span className="text-xs">Cam off</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                <span className="text-xs text-gray-400">
                  {callState === 'connected' ? `Connected · ${fmt(duration)}` : 'Waiting for doctor…'}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMic}
                    className={`p-1.5 rounded-full transition-colors ${micMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
                    {micMuted ? <MicOff size={13} /> : <Mic size={13} />}
                  </button>
                  <button onClick={toggleCam}
                    className={`p-1.5 rounded-full transition-colors ${camOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
                    {camOff ? <VideoOff size={13} /> : <Video size={13} />}
                  </button>
                  <button onClick={endCall}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full font-medium">
                    <PhoneOff size={12} /> Leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audio call UI */}
          {activeCall === 'audio' && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <Phone size={32} className="text-green-600" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-800">{doctor?.title} {doctor?.firstName} {doctor?.lastName}</p>
                  <p className="text-xs text-green-600 flex items-center justify-center gap-1 mt-1">
                    {callState === 'connected'
                      ? <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" /> Connected · {fmt(duration)}</>
                      : <><Loader2 size={12} className="animate-spin" /> Waiting for doctor…</>
                    }
                  </p>
                </div>
                {remoteAudioRef && <audio ref={remoteAudioRef} autoPlay />}
                <div className="flex items-center gap-3">
                  <button onClick={toggleMic}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      micMuted ? 'bg-red-100 text-red-600 border border-red-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}>
                    {micMuted ? <MicOff size={14} /> : <Mic size={14} />} {micMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={endCall}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium">
                    <PhoneOff size={14} /> Leave Call
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointment details */}
        {appt?.symptoms && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Symptoms</p>
            <p className="text-sm text-gray-600">{appt.symptoms}</p>
          </div>
        )}

        {appt?.consultationNotes && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Doctor's Notes</p>
            <p className="text-sm text-gray-600">{appt.consultationNotes}</p>
          </div>
        )}

        {appt?.diagnosis && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Diagnosis</p>
            <p className="text-sm text-gray-600">{appt.diagnosis}</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default PatientConsultation
