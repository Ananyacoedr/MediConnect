import { useEffect, useRef, useState, useCallback } from 'react'

const BASE = 'http://localhost:5000/api/signal'
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const POLL_MS = 1500

const signal = (roomId, type, data) =>
  fetch(`${BASE}/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  })

export const useWebRTC = (roomId, role) => {
  const [remoteStream, setRemoteStream] = useState(null)
  const [localStream, setLocalStream]   = useState(null)
  const [callState, setCallState]       = useState('idle')
  const [micMuted, setMicMuted]         = useState(false)
  const [camOff, setCamOff]             = useState(false)

  const pcRef       = useRef(null)
  const localRef    = useRef(null)
  const pollRef     = useRef(null)
  const iceSentRef  = useRef(0)  // how many ICE candidates we've already read

  const stopPoll = () => { clearInterval(pollRef.current); pollRef.current = null }

  const startPoll = useCallback((pc) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/${roomId}?role=${role}&since=${iceSentRef.current}`)
        const data = await res.json()

        if (data.ended) { stopCall(); return }

        if (data.offer && role === 'patient' && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await signal(roomId, 'answer', answer)
          setCallState('connected')
        }

        if (data.answer && role === 'doctor' && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
          setCallState('connected')
        }

        if (data.iceCandidates?.length) {
          for (const c of data.iceCandidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
          }
          iceSentRef.current += data.iceCandidates.length
        }
      } catch {}
    }, POLL_MS)
  }, [roomId, role])

  const startCall = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia(
      type === 'video' ? { video: true, audio: true } : { audio: true, video: false }
    )
    localRef.current = stream
    setLocalStream(stream)
    iceSentRef.current = 0

    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    pc.ontrack = (e) => setRemoteStream(e.streams[0])

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) signal(roomId, 'ice', candidate)
    }

    pc.onconnectionstatechange = () => {
      if (['connected', 'completed'].includes(pc.connectionState)) setCallState('connected')
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) setCallState('ended')
    }

    startPoll(pc)

    if (role === 'doctor') {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await signal(roomId, 'offer', offer)
      setCallState('waiting')
    } else {
      setCallState('waiting')
    }
  }, [roomId, role, startPoll])

  const stopCall = useCallback(() => {
    stopPoll()
    signal(roomId, 'end', null)
    pcRef.current?.close()
    pcRef.current = null
    localRef.current?.getTracks().forEach(t => t.stop())
    localRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setCallState('idle')
    setMicMuted(false)
    setCamOff(false)
    iceSentRef.current = 0
  }, [roomId])

  const toggleMic = useCallback(() => {
    localRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicMuted(m => !m)
  }, [])

  const toggleCam = useCallback(() => {
    localRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOff(c => !c)
  }, [])

  useEffect(() => () => stopCall(), [])

  return { startCall, stopCall, toggleMic, toggleCam, localStream, remoteStream, callState, micMuted, camOff }
}
