import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, Search, Filter, X } from 'lucide-react'
import { getTranslation } from '../utils/translations'
import { useLanguage } from '../contexts/LanguageContext'
import api, { getAuthToken } from '../utils/api'
import { io } from 'socket.io-client'

// Dynamic import for simple-peer to avoid build issues
let Peer = null
const loadPeer = async () => {
  if (!Peer) {
    const simplePeer = await import('simple-peer')
    Peer = simplePeer.default || simplePeer
  }
  return Peer
}

function ChatInterface() {
  const { language } = useLanguage()
  const [message, setMessage] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentGroupId, setCurrentGroupId] = useState(null)
  
  // WebRTC state
  const [call, setCall] = useState(null)
  const [callAccepted, setCallAccepted] = useState(false)
  const [stream, setStream] = useState(null)
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState(null)
  const [callerSignal, setCallerSignal] = useState(null)
  const [callType, setCallType] = useState(null) // 'voice' or 'video'
  const [isCallActive, setIsCallActive] = useState(false)
  
  const messagesEndRef = useRef(null)
  const myVideo = useRef(null)
  const userVideo = useRef(null)
  const connectionRef = useRef(null)
  const audioRef = useRef(null)
  const selectedChatRef = useRef(null)

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.warn('Could not play notification sound:', err))
    }
  }

  // Initialize Socket.io connection
  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      console.warn('[Chat] No auth token found - real-time features will be limited')
      return
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
    
    // Try to connect with better error handling
    let newSocket
    try {
      newSocket = io(socketUrl, {
        auth: { token },
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000
      })

      newSocket.on('connect', () => {
        console.log('[Chat] Socket.io connected successfully')
        setSocket(newSocket)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('[Chat] Socket.io disconnected:', reason)
        setSocket(null)
      })

      newSocket.on('connect_error', (error) => {
        console.warn('[Chat] Socket.io connection error:', error.message)
        // Don't set socket to null - let it keep trying to reconnect
        // Chat will still work via HTTP API
      })

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[Chat] Socket.io reconnection attempt ${attemptNumber}`)
      })

      newSocket.on('reconnect_failed', () => {
        console.warn('[Chat] Socket.io reconnection failed - using HTTP fallback')
        // Chat will still work via HTTP API, just without real-time updates
      })

      newSocket.on('new_message', (data) => {
        console.log('[Chat] New message received:', data)
        if (data.message) {
          // Use ref to get current selectedChat value
          const currentSelectedChat = selectedChatRef.current
          
          // Use functional updates to access current selectedChat
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => m.id === data.message.id)
            if (exists) return prev
            
            if (currentSelectedChat) {
              const isForCurrentChat = 
                (data.groupId && currentSelectedChat.groupId === data.groupId) ||
                (data.receiverId && currentSelectedChat.receiverId === data.receiverId)
              
              if (isForCurrentChat) {
                return [...prev, data.message]
              }
            }
            return prev
          })
          
          playNotificationSound()
          
          // Update chat list with new last message
          setChats(prev => {
            return prev.map(chat => {
              if (data.groupId && chat.groupId === data.groupId) {
                return {
                  ...chat,
                  lastMessage: {
                    text: data.message.message,
                    sender: data.message.sender?.name || 'Unknown',
                    time: data.message.createdAt
                  },
                  unread: chat.id === currentSelectedChat?.id ? 0 : (chat.unread || 0) + 1
                }
              } else if (data.receiverId && chat.receiverId === data.receiverId) {
                return {
                  ...chat,
                  lastMessage: {
                    text: data.message.message,
                    sender: data.message.sender?.name || 'Unknown',
                    time: data.message.createdAt
                  },
                  unread: chat.id === currentSelectedChat?.id ? 0 : (chat.unread || 0) + 1
                }
              }
              return chat
            })
          })
        }
      })

      newSocket.on('play_notification_sound', () => {
        playNotificationSound()
      })

      // WebRTC call handlers
      newSocket.on('incoming_call', (data) => {
        setReceivingCall(true)
        setCaller(data.from)
        setCallerSignal(data.signal)
        setCallType(data.callType)
        playNotificationSound()
      })

      newSocket.on('call_accepted', (data) => {
        setCallAccepted(true)
        if (connectionRef.current) {
          connectionRef.current.signal(data.signal)
        }
      })

      newSocket.on('call_ended', () => {
        endCall()
      })

      newSocket.on('call_failed', (data) => {
        alert(data.message || 'Call failed')
        endCall()
      })

      return () => {
        if (newSocket) {
          newSocket.close()
        }
      }
    } catch (error) {
      console.warn('[Chat] Failed to initialize Socket.io:', error)
      // Chat will still work via HTTP API, just without real-time updates
    }
  }, []) // Remove selectedChat from dependencies - we'll use functional updates instead

  // Fetch current user info and chat list
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setLoading(true)
        
        // Get current user info
        const meResponse = await api.get('/auth/me')
        if (meResponse.data?.success) {
          setCurrentUserId(meResponse.data.data.id)
          setCurrentGroupId(meResponse.data.data.groupId)
        }

        // Get chat list (includes group chat and all leaders)
        const chatListResponse = await api.get('/chat/list')
        if (chatListResponse.data?.success) {
          const chatList = chatListResponse.data.data
          setChats(chatList)
          
          // Check URL params for specific chat selection
          const urlParams = new URLSearchParams(window.location.search)
          const groupIdParam = urlParams.get('groupId')
          const userIdParam = urlParams.get('userId')
          
          if (userIdParam) {
            // Select specific leader chat
            const leaderChat = chatList.find(chat => 
              chat.receiverId === parseInt(userIdParam) || chat.id === `user-${userIdParam}`
            )
            if (leaderChat) {
              setSelectedChat(leaderChat)
            } else if (chatList.length > 0) {
              setSelectedChat(chatList[0])
            }
          } else if (groupIdParam) {
            // Select group chat
            const groupChat = chatList.find(chat => 
              chat.groupId === parseInt(groupIdParam) || chat.id === `group-${groupIdParam}`
            )
            if (groupChat) {
              setSelectedChat(groupChat)
            } else if (chatList.length > 0) {
              setSelectedChat(chatList[0])
            }
          } else {
            // Select first chat by default (group chat will be first)
            if (chatList.length > 0 && !selectedChat) {
              setSelectedChat(chatList[0])
            }
          }
        }
      } catch (error) {
        console.error('[Chat] Error loading chat data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChatData()
  }, [])

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return

    const loadMessages = async () => {
      try {
        let url
        const params = new URLSearchParams()
        
        // Determine the correct endpoint based on chat type
        if (selectedChat.type === 'private' && selectedChat.receiverId) {
          // Private chat - use 'user' as groupId and receiverId as query param
          url = `/chat/user`
          params.append('receiverId', selectedChat.receiverId)
        } else if (selectedChat.type === 'group' && selectedChat.groupId) {
          // Group chat - use groupId directly
          url = `/chat/${selectedChat.groupId}`
        } else {
          // Fallback: try to determine from available data
          if (selectedChat.receiverId) {
            url = `/chat/user`
            params.append('receiverId', selectedChat.receiverId)
          } else if (selectedChat.groupId) {
            url = `/chat/${selectedChat.groupId}`
          } else {
            console.error('[Chat] Invalid chat selection:', selectedChat)
            return
          }
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await api.get(url)
        if (response.data?.success) {
          // Load all messages (chat history) - like WhatsApp
          const loadedMessages = response.data.data || []
          setMessages(loadedMessages)
          
          // Mark messages as read via socket (if connected)
          if (socket && socket.connected) {
            socket.emit('mark_messages_read', {
              groupId: selectedChat.groupId || null,
              senderId: selectedChat.receiverId || null
            })
          }
          
          // Reset unread count for this chat
          setChats(prev => prev.map(chat => 
            chat.id === selectedChat.id ? { ...chat, unread: 0 } : chat
          ))
        }
      } catch (error) {
        console.error('[Chat] Error loading messages:', error)
        const errorMessage = error.response?.data?.message || 'Failed to load messages'
        console.error('[Chat] Error details:', errorMessage)
      }
    }

    loadMessages()
    
    // Scroll to bottom to show latest messages
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [selectedChat, socket])

  // Update selectedChat ref when it changes
  useEffect(() => {
    selectedChatRef.current = selectedChat
  }, [selectedChat])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to savings updates if groupId is available
  useEffect(() => {
    if (socket && socket.connected && currentGroupId) {
      socket.emit('subscribe_savings_updates', { groupId: currentGroupId })
      
      socket.on('savings_updated', (data) => {
        console.log('[Chat] Savings updated:', data)
        // Trigger a refresh of the My Group page if it's open
        if (window.refreshMyGroupData) {
          window.refreshMyGroupData()
        }
      })
    }
  }, [socket, currentGroupId])

  // Periodic refresh of chat list if Socket.io is not connected (fallback)
  useEffect(() => {
    if (!socket || !socket.connected) {
      const refreshInterval = setInterval(() => {
        // Refresh chat list every 5 seconds if Socket.io is not connected
        const loadChatList = async () => {
          try {
            const chatListResponse = await api.get('/chat/list')
            if (chatListResponse.data?.success) {
              setChats(chatListResponse.data.data)
            }
          } catch (error) {
            console.warn('[Chat] Error refreshing chat list:', error)
          }
        }
        loadChatList()
      }, 5000) // Refresh every 5 seconds

      return () => clearInterval(refreshInterval)
    }
  }, [socket])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return

    const messageText = message.trim()
    setMessage('')
    setSending(true)

    try {
      let response
      
      // Determine if this is a group chat or private chat
      if (selectedChat.type === 'private' && selectedChat.receiverId) {
        // Private message - use /chat/user endpoint
        response = await api.post('/chat/user', {
          message: messageText,
          recipientIds: [selectedChat.receiverId]
        })
      } else if (selectedChat.type === 'group' && selectedChat.groupId) {
        // Group message - use /chat/:groupId endpoint (NO recipientIds)
        response = await api.post(`/chat/${selectedChat.groupId}`, {
          message: messageText
        })
      } else {
        // Fallback: try to determine from available data
        if (selectedChat.receiverId) {
          response = await api.post('/chat/user', {
            message: messageText,
            recipientIds: [selectedChat.receiverId]
          })
        } else if (selectedChat.groupId) {
          response = await api.post(`/chat/${selectedChat.groupId}`, {
            message: messageText
          })
        } else {
          throw new Error('Invalid chat selection')
        }
      }
      
      if (response.data?.success && response.data.data) {
        // Add message to local state immediately for instant feedback
        const newMessage = response.data.data
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMessage.id)
          if (exists) return prev
          return [...prev, newMessage]
        })
      }
    } catch (error) {
      console.error('[Chat] Error sending message:', error)
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.'
      alert(errorMessage)
      setMessage(messageText) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  // WebRTC functions
  const callUser = async (userId, type = 'voice') => {
    try {
      if (!socket || !socket.connected) {
        alert('Please wait for connection to be established')
        return
      }
      
      const PeerClass = await loadPeer()
      if (!PeerClass) {
        alert('Call feature is not available. Please refresh the page.')
        return
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      })
      
      setStream(stream)
      setCallType(type)
      setIsCallActive(true)
      
      if (myVideo.current) {
        myVideo.current.srcObject = stream
      }

      const peer = new PeerClass({
        initiator: true,
        trickle: false,
        stream: stream
      })

      peer.on('signal', (data) => {
        if (socket) {
          socket.emit('call_user', {
            userToCall: userId,
            signalData: data,
            from: currentUserId,
            name: 'You',
            callType: type
          })
        }
      })

      peer.on('stream', (stream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = stream
        }
      })

      connectionRef.current = peer
    } catch (error) {
      console.error('[Chat] Error starting call:', error)
      alert('Failed to start call. Please check your camera/microphone permissions.')
    }
  }

  const answerCall = async () => {
    setCallAccepted(true)
    
    try {
      if (!socket || !socket.connected) {
        alert('Please wait for connection to be established')
        return
      }
      
      const PeerClass = await loadPeer()
      if (!PeerClass) {
        alert('Call feature is not available. Please refresh the page.')
        return
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      })
      
      setStream(stream)
      setIsCallActive(true)
      
      if (myVideo.current) {
        myVideo.current.srcObject = stream
      }

      const peer = new PeerClass({
        initiator: false,
        trickle: false,
        stream: stream
      })

      peer.on('signal', (data) => {
        if (socket) {
          socket.emit('accept_call', {
            signal: data,
            to: caller
          })
        }
      })

      peer.on('stream', (stream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = stream
        }
      })

      if (callerSignal) {
        peer.signal(callerSignal)
      }

      connectionRef.current = peer
      setReceivingCall(false)
    } catch (error) {
      console.error('[Chat] Error answering call:', error)
      alert('Failed to answer call. Please check your camera/microphone permissions.')
    }
  }

  const endCall = () => {
    setIsCallActive(false)
    setCallAccepted(false)
    setReceivingCall(false)
    setCaller(null)
    setCallerSignal(null)
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (connectionRef.current) {
      connectionRef.current.destroy()
      connectionRef.current = null
    }
    
    if (socket && selectedChat?.receiverId) {
      socket.emit('end_call', { to: selectedChat.receiverId })
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading chats...</div>
      </div>
    )
  }

  const selectedChatData = chats.find(c => c.id === selectedChat?.id) || selectedChat

  return (
    <div className="h-full flex relative">
      {/* Notification sound (hidden audio element) */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Incoming call modal */}
      {receivingCall && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
            <p className="text-gray-600 mb-4">From: {caller}</p>
            <div className="flex gap-3">
              <button
                onClick={answerCall}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
              >
                Answer
              </button>
              <button
                onClick={() => {
                  setReceivingCall(false)
                  setCaller(null)
                  setCallerSignal(null)
                }}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active call UI */}
      {isCallActive && (
        <div className="absolute inset-0 bg-black z-50 flex">
          <div className="flex-1 relative">
            {callType === 'video' && (
              <>
                <video
                  ref={userVideo}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <video
                  ref={myVideo}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white"
                />
              </>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button
                onClick={endCall}
                className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600"
              >
                <Phone size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{getTranslation('chat', language)}</h2>
          <div className="flex gap-2 mt-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search size={18} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No chats available
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`w-full border-b border-gray-100 ${
                  selectedChat?.id === chat.id ? 'bg-primary-50 border-primary-200' : ''
                }`}
              >
            <button
                  onClick={() => setSelectedChat(chat)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {chat.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{chat.name}</h3>
                          {chat.type === 'group' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Group</span>
                          )}
                          {chat.role && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{chat.role}</span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500">{formatTime(chat.lastMessage.time)}</span>
                        )}
                  </div>
                      {chat.lastMessage ? (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.lastMessage.sender}: {chat.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mt-1">
                          {chat.type === 'group' ? 'No messages yet' : 'Start a conversation'}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {chat.type === 'group' ? `${chat.members} members` : 'Direct message'}
                        </span>
                  {chat.unread > 0 && (
                      <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                        {chat.unread}
                      </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                
                {/* Call buttons for leaders (private chats only) */}
                {chat.type === 'private' && chat.receiverId && (
                  <div className="px-4 pb-3 flex gap-2 justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        callUser(chat.receiverId, 'voice')
                      }}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Voice Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        callUser(chat.receiverId, 'video')
                      }}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Video Call"
                    >
                      <Video size={16} />
                    </button>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChatData ? (
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedChatData.name[0]}
              </div>
              <div>
                  <h3 className="font-semibold text-gray-800">{selectedChatData.name}</h3>
                  <p className="text-sm text-gray-500">{selectedChatData.members} {selectedChatData.members === 1 ? 'member' : 'members'}</p>
              </div>
            </div>
            <div className="flex gap-2">
                {selectedChatData.receiverId && (
                  <>
                    <button
                      onClick={() => callUser(selectedChatData.receiverId, 'voice')}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Voice Call"
                    >
                <Phone size={18} />
              </button>
                    <button
                      onClick={() => callUser(selectedChatData.receiverId, 'video')}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Video Call"
                    >
                <Video size={18} />
              </button>
                  </>
                )}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId
                return (
            <div
              key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isOwn
                  ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
              }`}>
                      {!isOwn && msg.sender && (
                        <p className="text-xs font-semibold mb-1">{msg.sender.name}</p>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                        {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip size={18} />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={getTranslation('chat', language) === 'Chat' ? 'Type a message...' : 'Andika ubutumwa...'}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sending}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <Smile size={18} />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
                disabled={!message.trim() || sending}
              className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">Select a chat to start messaging</p>
            <p className="text-sm">Choose a conversation from the list</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface
