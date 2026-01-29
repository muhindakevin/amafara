import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Paperclip, Smile, MoreVertical, Search, Filter, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api, { getAuthToken } from '../utils/api'
import { io } from 'socket.io-client'

function ChatInterface() {
  const [searchParams] = useSearchParams()
  const { t } = useTranslation('common')
  const [message, setMessage] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentGroupId, setCurrentGroupId] = useState(null)
  
  const messagesEndRef = useRef(null)
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
        // Backend already filters by groupId for Secretary role
        const chatListResponse = await api.get('/chat/list')
        if (chatListResponse.data?.success) {
          const chatList = chatListResponse.data.data
          setChats(chatList)
          
          // Check URL params for specific chat selection
          const urlParams = new URLSearchParams(window.location.search)
          const groupIdParam = urlParams.get('groupId')
          const userIdParam = urlParams.get('userId')
          const messageParam = urlParams.get('message')
          
          // Prefill message if provided in URL
          if (messageParam) {
            setMessage(decodeURIComponent(messageParam))
          }
          
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


  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">{t('loading', { defaultValue: 'Loading chats...' })}</div>
      </div>
    )
  }

  const selectedChatData = chats.find(c => c.id === selectedChat?.id) || selectedChat

  return (
    <div className="h-full flex flex-col md:flex-row relative">
      {/* Notification sound (hidden audio element) */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Chat List */}
      <div className={`${selectedChatData ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full`}>
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{t('chat')}</h2>
            {selectedChatData && (
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Search size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Filter size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t('noChatsAvailable', { defaultValue: 'No chats available' })}
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`w-full border-b border-gray-100 dark:border-gray-700 ${
                  selectedChat?.id === chat.id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : ''
                }`}
              >
            <button
                  onClick={() => {
                    setSelectedChat(chat)
                    // On mobile, hide chat list after selection
                    if (window.innerWidth < 768) {
                      // Chat list will be hidden via CSS
                    }
                  }}
                  className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                  {chat.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white truncate text-sm sm:text-base">{chat.name}</h3>
                          {chat.type === 'group' && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">Group</span>
                          )}
                          {chat.role && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">{chat.role}</span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{formatTime(chat.lastMessage.time)}</span>
                        )}
                  </div>
                      {chat.lastMessage ? (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                          {chat.lastMessage.sender}: {chat.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 italic mt-1">
                          {chat.type === 'group' ? t('noMessagesYet', { defaultValue: 'No messages yet' }) : t('startConversation', { defaultValue: 'Start a conversation' })}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {chat.type === 'group' ? `${chat.members} ${t('members', { defaultValue: 'members' })}` : t('directMessage', { defaultValue: 'Direct message' })}
                        </span>
                  {chat.unread > 0 && (
                      <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                        {chat.unread}
                      </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChatData ? (
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                  {selectedChatData.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate text-sm sm:text-base">{selectedChatData.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{selectedChatData.members} {selectedChatData.members === 1 ? 'member' : 'members'}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MoreVertical size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8 text-sm sm:text-base">
                {t('noMessagesYetStartConversation', { defaultValue: 'No messages yet. Start the conversation!' })}
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId
                return (
            <div
              key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 py-2 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl ${
                      isOwn
                  ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}>
                      {!isOwn && msg.sender && (
                        <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">{msg.sender.name}</p>
                )}
                <p className="text-sm sm:text-base break-words">{msg.message}</p>
                <p className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
              <Paperclip size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
            </button>
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('typeMessage', { defaultValue: 'Type a message...' })}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all text-sm sm:text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sending}
              />
              <button className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                <Smile size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
                disabled={!message.trim() || sending}
              className="p-2.5 sm:p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-base sm:text-lg mb-2">{t('selectChatToStart', { defaultValue: 'Select a chat to start messaging' })}</p>
            <p className="text-sm">{t('chooseConversationFromList', { defaultValue: 'Choose a conversation from the list' })}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface
