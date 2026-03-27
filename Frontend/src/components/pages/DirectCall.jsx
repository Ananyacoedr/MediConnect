import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  HeartPulse, PhoneOff, MicOff, Mic, VideoOff, Video,
  Phone, Loader2, UserCircle
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

const DirectCall = () => {
  const { doctorId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const callType   = searchParams.get('type') || 'video'
  const doctorName = searchParams.get('name') || 'Doctor'
  const roomId     = `direct_${doctorId}_${user?.id}`

  const [callState, setCallState] = useState('connecting') // connecting | waiting | connected | ended
  const [micMuted,  setMicMuted]  = useState(false)
  const [camOff,    setCamOff]    = useState(false)
  const [duration,  setDuration]  = useState(0)

  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const pcRef          = useRef(null)
  const localRef       = useRef(null)
  const pollRef        = useRef(null)
  const timerRef       = useRef(null)
  const iceSentRef     = useRef(0)

  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null }

  const endCall = useCallback(() => {
    stopPoll()
    clearInterval(timerRef.current)
    signal(roomId, 'end', null)
    pcRef.current?.close()
    pcRef.current = null
    localRef.current?.getTracks().forEach(t => t.stop())
    localRef.current = null
    setCallState('ended')
  }, [roomId])

  const startPoll = useCallback((pc) => {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${BASE}/signal/${roomId}?role=patient&since=${iceSentRef.current}`)
        const data = await res.json()

        if (data.ended) { endCall(); return }

        if (data.offer && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await signal(roomId, 'answer', answer)
          setCallState('connected')
          timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        }

        if (data.iceCandidates?.length) {
          for (const c of data.iceCandidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
          }
          iceSentRef.current += data.iceCandidates.length
        }
      } catch {}
    }, POLL)
  }, [roomId, endCall])

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          callType === 'video' ? { video: true, audio: true } : { audio: true, video: false }
        )
        localRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        const pc = new RTCPeerConnection(ICE)
        pcRef.current = pc
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
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
          }
          if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) endCall()
        }

        // Patient initiates the offer (reversed role — patient calls doctor)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await signal(roomId, 'offer', offer)
        setCallState('waiting')
        startPoll(pc)
      } catch (err) {
        console.error(err)
        setCallState('ended')
      }
    }

    init()
    return () => { endCall(); clearInterval(timerRef.current) }
  }, [])

  const toggleMic = () => {
    localRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicMuted(m => !m)
  }

  const toggleCam = () => {
    localRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOff(c => !c)
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (callState === 'ended') return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-900 flex items-center justify-center mx-auto">
          <PhoneOff size={28} className="text-red-400" />
        </div>
        <p className="text-white font-semibold text-lg">Call Ended</p>
        <p className="text-gray-400 text-sm">Duration: {fmt(duration)}</p>
        <button
          onClick={() => navigate('/find-doctors')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          Back to Find Doctors
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-blue-400 font-bold">
          <HeartPulse size={20} /> MediConnect
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
            callState === 'connected' ? 'bg-green-900 text-green-400' :
            callState === 'waiting'   ? 'bg-yellow-900 text-yellow-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {callState === 'connected' ? `Connected · ${fmt(duration)}` :
             callState === 'waiting'   ? 'Ringing...' : 'Connecting...'}
          </div>
        </div>
      </header>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">

        {callType === 'video' ? (
          <>
            {/* Remote video (full screen) */}
            <div className="w-full h-full absolute inset-0 flex items-center justify-center">
              {callState === 'connected' ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <UserCircle size={56} className="text-gray-500" />
                  </div>
                  <p className="text-white text-lg font-semibold">{doctorName}</p>
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    {callState === 'waiting' ? 'Waiting for doctor to answer...' : 'Connecting...'}
                  </div>
                </div>
              )}
            </div>

            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-24 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-gray-600 bg-gray-800 shadow-xl">
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camOff ? 'hidden' : ''}`} />
              {camOff && (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <VideoOff size={24} />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Audio call UI */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-2xl">
              <UserCircle size={64} className="text-blue-200" />
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{doctorName}</p>
              <p className="text-gray-400 text-sm mt-1">
                {callState === 'connected' ? `Audio call · ${fmt(duration)}` :
                 callState === 'waiting'   ? 'Ringing...' : 'Connecting...'}
              </p>
            </div>
            {callState === 'waiting' && (
              <div className="flex items-end gap-1 h-8">
                {[3,6,4,8,5,7,3,6,4].map((h, i) => (
                  <span key={i} style={{ height: `${h * 4}px`, animationDelay: `${i * 100}ms` }}
                    className="w-1.5 rounded-full bg-blue-500 animate-pulse" />
                ))}
              </div>
            )}
            <audio ref={remoteAudioRef} autoPlay />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-5 flex items-center justify-center gap-6">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            micMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
          }`}
        >
          {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              camOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
            }`}
          >
            {camOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  )
}

export default DirectCall
