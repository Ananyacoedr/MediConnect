import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useWebRTC } from '@/hooks/useWebRTC'
import {
  HeartPulse, PhoneOff, MicOff, Mic,
  VideoOff, Video, Phone, Loader2, UserCircle
} from 'lucide-react'

const DirectCall = () => {
  const { doctorId }     = useParams()
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()
  const { user }         = useUser()

  const callType   = searchParams.get('type') || 'video'
  const doctorName = searchParams.get('name') || 'Doctor'

  const {
    startCall, stopCall, toggleMic, toggleCam,
    localStream, remoteStream,
    callState, micMuted, camOff,
  } = useWebRTC(user?.id)

  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef(null)

  // Start call as soon as page loads
  useEffect(() => {
    if (user?.id) startCall(doctorId, doctorName, callType)
    return () => stopCall()
  }, [user?.id])

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current  && localStream)  localVideoRef.current.srcObject  = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream
    if (remoteAudioRef.current && remoteStream) remoteAudioRef.current.srcObject = remoteStream
  }, [remoteStream])

  // Start timer when connected
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [callState])

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const handleEnd = () => { stopCall(); navigate('/find-doctors') }

  if (callState === 'idle' || callState === 'ended') return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-900 flex items-center justify-center mx-auto">
          <PhoneOff size={28} className="text-red-400" />
        </div>
        <p className="text-white font-semibold text-lg">Call Ended</p>
        <p className="text-gray-400 text-sm">Duration: {fmt(duration)}</p>
        <button onClick={() => navigate('/find-doctors')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
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
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
          callState === 'connected' ? 'bg-green-900 text-green-400' :
          callState === 'ringing'   ? 'bg-yellow-900 text-yellow-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {callState === 'connected' ? `Connected · ${fmt(duration)}` :
           callState === 'ringing'   ? 'Ringing...' : 'Connecting...'}
        </div>
      </header>

      {/* Video */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
        {callType === 'video' ? (
          <>
            {/* Remote full screen */}
            <div className="absolute inset-0 flex items-center justify-center">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <UserCircle size={56} className="text-gray-500" />
                  </div>
                  <p className="text-white text-lg font-semibold">{doctorName}</p>
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    {callState === 'ringing' ? 'Waiting for doctor to answer...' : 'Connecting...'}
                  </div>
                </div>
              )}
            </div>
            {/* Local PiP */}
            <div className="absolute bottom-24 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-gray-600 bg-gray-800 shadow-xl">
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camOff ? 'hidden' : ''}`} />
              {camOff && <div className="w-full h-full flex items-center justify-center text-gray-400"><VideoOff size={24} /></div>}
            </div>
          </>
        ) : (
          /* Audio UI */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-2xl">
              <UserCircle size={64} className="text-blue-200" />
            </div>
            <div>
              <p className="text-white text-2xl font-bold">{doctorName}</p>
              <p className="text-gray-400 text-sm mt-1">
                {callState === 'connected' ? `Audio call · ${fmt(duration)}` : 'Ringing...'}
              </p>
            </div>
            <audio ref={remoteAudioRef} autoPlay />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-5 flex items-center justify-center gap-6">
        <button onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
          {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        {callType === 'video' && (
          <button onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOff ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
            {camOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}
        <button onClick={handleEnd}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg">
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  )
}

export default DirectCall
