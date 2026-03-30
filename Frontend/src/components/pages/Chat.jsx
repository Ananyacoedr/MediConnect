import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { io } from 'socket.io-client'
import { HeartPulse, Send, ArrowLeft, MessageSquare, User } from 'lucide-react'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

const Chat = () => {
  const { roomId }     = useParams()         // e.g. chat_patientId_doctorId
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { user }       = useUser()
  const socketRef      = useRef(null)
  const bottomRef      = useRef(null)
  const typingTimer    = useRef(null)

  // name passed in URL e.g. /chat/room123?name=Dr.John&otherName=Alice
  const myName    = searchParams.get('name')      || user?.firstName || 'You'
  const otherName = searchParams.get('otherName') || 'Other'

  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState('')
  const [online, setOnline]     = useState(false)

  // Connect socket and join room
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('register', user?.id)   // register for online tracking
      socket.emit('join-chat', roomId)    // join this chat room
      setOnline(true)
    })

    socket.on('disconnect', () => setOnline(false))

    // Receive incoming messages
    socket.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    // Typing indicators
    socket.on('typing',      ({ name }) => setTyping(`${name} is typing...`))
    socket.on('stop-typing', ()         => setTyping(''))

    return () => socket.disconnect()
  }, [roomId, user?.id])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send a message
  const sendMessage = () => {
    if (!input.trim()) return
    const msg = {
      text:     input.trim(),
      sender:   myName,
      senderId: user?.id,
      time:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    socketRef.current?.emit('chat-message', { roomId, message: msg })
    socketRef.current?.emit('stop-typing',  { roomId })
    setInput('')
    clearTimeout(typingTimer.current)
  }

  // Emit typing event with debounce
  const handleTyping = (e) => {
    setInput(e.target.value)
    socketRef.current?.emit('typing', { roomId, name: myName })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { roomId })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <HeartPulse size={22} /> MediConnect
          </div>
        </div>

        {/* Other person info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-sm font-bold">
            {otherName?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{otherName}</p>
            <p className={`text-xs ${online ? 'text-green-500' : 'text-gray-400'}`}>
              {online ? '● Online' : '○ Offline'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <MessageSquare size={40} strokeWidth={1} />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.id
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar for other person */}
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold shrink-0 mr-2 mt-1">
                  {msg.sender?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="max-w-[70%] space-y-0.5">
                {/* Sender name for other person */}
                {!isMe && <p className="text-xs text-gray-400 ml-1">{msg.sender}</p>}

                {/* Message bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>

                {/* Timestamp */}
                <p className={`text-[10px] text-gray-400 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                  {msg.time}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typing && (
        <div className="px-6 pb-1 max-w-2xl mx-auto w-full">
          <p className="text-xs text-gray-400 italic">{typing}</p>
        </div>
      )}

      {/* Input box */}
      <div className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 px-4 py-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Type a message..."
            value={input}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chat
