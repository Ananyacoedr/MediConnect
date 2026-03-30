import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { HeartPulse } from 'lucide-react'

const APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID)
const SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET

const AnswerCall = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !user) return

    const userID = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 36)
    const userName = user.firstName || 'User'

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      APP_ID, SERVER_SECRET, roomId, userID, userName
    )

    const zp = ZegoUIKitPrebuilt.create(kitToken)
    zp.joinRoom({
      container: containerRef.current,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      showScreenSharingButton: true,
      showPreJoinView: true,
      onLeaveRoom: () => navigate(-1),
    })

    return () => zp.destroy?.()
  }, [user, roomId])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="flex items-center gap-2 px-6 py-3 bg-gray-800 border-b dark:border-gray-800 border-gray-700 text-blue-400 font-bold">
        <HeartPulse size={20} /> MediConnect — Incoming Call
      </header>
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  )
}

export default AnswerCall
