import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL  = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

let socketInstance = null

export const getSocket = () => {
  if (!socketInstance) socketInstance = io(SOCKET_URL, { transports: ['websocket'] })
  return socketInstance
}

export const useWebRTC = (userId) => {
  const [remoteStream, setRemoteStream] = useState(null)
  const [localStream,  setLocalStream]  = useState(null)
  const [callState,    setCallState]    = useState('idle') // idle | ringing | connected | ended
  const [incomingCall, setIncomingCall] = useState(null)  // { from, fromName, offer, type }
  const [micMuted,     setMicMuted]     = useState(false)
  const [camOff,       setCamOff]       = useState(false)
  const [onlineUsers,  setOnlineUsers]  = useState([])

  const pcRef      = useRef(null)
  const localRef   = useRef(null)
  const remoteRef  = useRef(null) // who we're in call with
  const socket     = getSocket()

  // Register this user with the signaling server
  useEffect(() => {
    if (!userId) return
    socket.emit('register', userId)

    socket.on('online-users', (users) => setOnlineUsers(users))

    // Doctor receives incoming call
    socket.on('incoming-call', async ({ from, fromName, offer, type }) => {
      setIncomingCall({ from, fromName, offer, type })
    })

    // Patient receives doctor's answer
    socket.on('call-answered', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        setCallState('connected')
      }
    })

    // Receive ICE candidates
    socket.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
      }
    })

    // Call rejected by doctor
    socket.on('call-rejected', () => {
      stopCall()
      setCallState('idle')
    })

    // Other side ended the call
    socket.on('call-ended', () => {
      stopCall()
    })

    return () => {
      socket.off('online-users')
      socket.off('incoming-call')
      socket.off('call-answered')
      socket.off('ice-candidate')
      socket.off('call-rejected')
      socket.off('call-ended')
    }
  }, [userId])

  const createPC = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc
    remoteRef.current = targetUserId

    pc.ontrack = (e) => setRemoteStream(e.streams[0])

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', { to: targetUserId, candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      if (['connected', 'completed'].includes(pc.connectionState)) setCallState('connected')
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) stopCall()
    }

    return pc
  }, [])

  // Patient initiates call to doctor
  const startCall = useCallback(async (targetUserId, targetName, type = 'video') => {
    const stream = await navigator.mediaDevices.getUserMedia(
      type === 'video' ? { video: true, audio: true } : { audio: true, video: false }
    )
    localRef.current = stream
    setLocalStream(stream)

    const pc = createPC(targetUserId)
    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket.emit('call-user', {
      to: targetUserId,
      from: userId,
      fromName: 'Patient',
      offer,
      type,
    })

    setCallState('ringing')
  }, [userId, createPC])

  // Doctor accepts incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    const { from, offer, type } = incomingCall

    const stream = await navigator.mediaDevices.getUserMedia(
      type === 'video' ? { video: true, audio: true } : { audio: true, video: false }
    )
    localRef.current = stream
    setLocalStream(stream)

    const pc = createPC(from)
    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socket.emit('call-answer', { to: from, answer })
    setIncomingCall(null)
    setCallState('connected')
  }, [incomingCall, createPC])

  // Doctor rejects call
  const rejectCall = useCallback(() => {
    if (!incomingCall) return
    socket.emit('call-rejected', { to: incomingCall.from })
    setIncomingCall(null)
  }, [incomingCall])

  // End call from either side
  const stopCall = useCallback(() => {
    if (remoteRef.current) {
      socket.emit('call-ended', { to: remoteRef.current })
    }
    pcRef.current?.close()
    pcRef.current = null
    localRef.current?.getTracks().forEach(t => t.stop())
    localRef.current = null
    remoteRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setCallState('idle')
    setMicMuted(false)
    setCamOff(false)
    setIncomingCall(null)
  }, [])

  const toggleMic = useCallback(() => {
    localRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicMuted(m => !m)
  }, [])

  const toggleCam = useCallback(() => {
    localRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamOff(c => !c)
  }, [])

  return {
    startCall, acceptCall, rejectCall, stopCall,
    toggleMic, toggleCam,
    localStream, remoteStream,
    callState, incomingCall,
    micMuted, camOff, onlineUsers,
  }
}
