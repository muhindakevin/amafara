import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, FileText, AlertCircle, CheckCircle, Clock, User, Phone, Mail, Headphones, Database, ChevronDown } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { io } from 'socket.io-client'
import { getAuthToken } from '../utils/api'

function GroupAdminAgent() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueType, setIssueType] = useState('technical')

  // Quick action modals
  const [showRegisterOfficerModal, setShowRegisterOfficerModal] = useState(false)
  const [showRestoreAccountModal, setShowRestoreAccountModal] = useState(false)
  const [showPerformanceReviewModal, setShowPerformanceReviewModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showReviewMeetingModal, setShowReviewMeetingModal] = useState(false)
  
  // Form states
  const [registerOfficerData, setRegisterOfficerData] = useState({
    officerName: '',
    officerEmail: '',
    officerPhone: '',
    officerRole: 'Secretary',
    reason: ''
  })
  
  const [restoreAccountData, setRestoreAccountData] = useState({
    memberName: '',
    memberId: '',
    reason: '',
    details: ''
  })
  
  const [performanceReviewData, setPerformanceReviewData] = useState({
    period: '',
    achievements: '',
    challenges: '',
    recommendations: ''
  })
  
  const [feedbackData, setFeedbackData] = useState({
    subject: '',
    category: 'general',
    message: ''
  })
  
  const [reviewMeetingData, setReviewMeetingData] = useState({
    preferredDate: '',
    preferredTime: '',
    location: '',
    agenda: '',
    reason: ''
  })
  
  const [submitting, setSubmitting] = useState(false)

  // Real data states
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socket, setSocket] = useState(null)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [groupInfo, setGroupInfo] = useState(null)
  const messagesEndRef = useRef(null)

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

  // Initialize Socket.io connection
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
    
    try {
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000
      })

      newSocket.on('connect', () => {
        console.log('[Agent Chat] Socket.io connected')
        setSocket(newSocket)
      })

      newSocket.on('disconnect', () => {
        console.log('[Agent Chat] Socket.io disconnected')
        setSocket(null)
      })

      newSocket.on('new_message', (data) => {
        if (selectedAgent && data.senderId === selectedAgent.id) {
          setMessages(prev => [...prev, {
            id: data.id || Date.now(),
      sender: 'Agent',
            message: data.message,
            timestamp: data.createdAt || new Date().toISOString(),
            read: data.isRead || false
          }])
        }
      })

      return () => {
        if (newSocket) {
          newSocket.close()
        }
      }
    } catch (error) {
      console.warn('[Agent Chat] Failed to initialize Socket.io:', error)
    }
  }, [selectedAgent])

  // Function to load agents from database
  const loadAgents = async () => {
    try {
      setLoading(true)
      console.log('[Agent Chat] Fetching agents from database...')
      
      // Check if user is authenticated
      const token = localStorage.getItem('uw_token')
      if (!token) {
        console.warn('[Agent Chat] No authentication token found. User may need to log in.')
        setAgents([])
        setLoading(false)
        return
      }
      
      // Fetch all agents - don't filter by status in case some don't have it set
      const response = await api.get('/system-admin/users', {
        params: { role: 'Agent' }
      })
      
      console.log('[Agent Chat] Full API Response:', response)
      console.log('[Agent Chat] Response data:', response.data)
      console.log('[Agent Chat] Response status:', response.status)
      
      if (response.data?.success) {
        const agentsList = response.data.data || []
        console.log('[Agent Chat] Found agents:', agentsList.length)
        console.log('[Agent Chat] Agents list:', agentsList)
        
        // Filter to only active agents on frontend (in case some don't have status set)
        const activeAgents = agentsList.filter(agent => 
          !agent.status || agent.status === 'active'
        )
        
        console.log('[Agent Chat] Active agents after filter:', activeAgents.length)
        
        setAgents(activeAgents)
        
        // Auto-select first agent if available and none selected
        if (activeAgents.length > 0 && !selectedAgent) {
          setSelectedAgent(activeAgents[0])
          console.log('[Agent Chat] Auto-selected agent:', activeAgents[0])
        }
      } else {
        console.error('[Agent Chat] API returned unsuccessful response:', response.data)
        setAgents([])
      }
    } catch (error) {
      console.error('[Agent Chat] Error loading agents:', error)
      console.error('[Agent Chat] Error response:', error.response)
      console.error('[Agent Chat] Error details:', error.response?.data || error.message)
      
      // Don't show alert for authentication errors - let the API interceptor handle redirect
      if (error.message === 'No authentication token') {
        console.warn('[Agent Chat] Authentication required. Please log in.')
        setAgents([])
      } else {
        setAgents([])
        // Only show alert for other errors
        if (error.response?.status !== 401) {
          console.error('[Agent Chat] Failed to load agents:', error.response?.data?.message || error.message)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch group information
  useEffect(() => {
    const loadGroupInfo = async () => {
      try {
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (groupId) {
          const groupRes = await api.get(`/groups/${groupId}`)
          if (groupRes.data?.success) {
            setGroupInfo(groupRes.data.data)
          }
        }
      } catch (error) {
        console.error('[Agent Chat] Error loading group info:', error)
      }
    }
    loadGroupInfo()
  }, [])

  // Fetch all agents on mount - only if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('uw_token')
    if (token) {
      loadAgents()
    } else {
      console.warn('[Agent Chat] No authentication token. User needs to log in.')
      setLoading(false)
    }
  }, [])

  // Fetch messages when agent is selected
  useEffect(() => {
    if (!selectedAgent) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        const response = await api.get('/chat/user', {
          params: { receiverId: selectedAgent.id }
        })
        
        if (response.data?.success) {
          const chatMessages = response.data.data || []
          const formattedMessages = chatMessages.map(msg => {
            const isFromAgent = msg.senderId === selectedAgent.id
            return {
              id: msg.id,
              sender: isFromAgent ? 'Agent' : 'Group Admin',
              message: msg.message,
              timestamp: msg.createdAt,
              read: msg.isRead || false
            }
          })
          setMessages(formattedMessages)
          
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      } catch (error) {
        console.error('[Agent Chat] Error loading messages:', error)
        setMessages([])
      }
    }
    
    loadMessages()
  }, [selectedAgent])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedAgent || sending) return

    try {
      setSending(true)
      
      const response = await api.post('/chat/user', {
        message: message.trim(),
        recipientIds: [selectedAgent.id],
        type: 'text'
      })

      if (response.data?.success) {
        // Add message to local state immediately
        const newMessage = {
          id: response.data.data?.id || Date.now(),
          sender: 'Group Admin',
          message: message.trim(),
          timestamp: new Date().toISOString(),
          read: true
        }
        setMessages(prev => [...prev, newMessage])
      setMessage('')
        
        // Emit via socket if connected
        if (socket && socket.connected) {
          socket.emit('send_message', {
            message: message.trim(),
            receiverId: selectedAgent.id,
            type: 'text'
          })
        }
      } else {
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleSubmitIssue = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first.')
      return
    }
    
    const titleInput = document.getElementById('issueTitle')
    const descriptionInput = document.getElementById('issueDescription')
    
    if (!titleInput?.value || !descriptionInput?.value) {
      alert('Please fill in both title and description.')
      return
    }
    
    try {
      setSubmitting(true)
      
      // Include group information in the message
      const groupInfoText = groupInfo 
        ? `\n\nGroup Information:\nGroup ID: ${groupInfo.id}\nGroup Name: ${groupInfo.name}${groupInfo.code ? `\nGroup Code: ${groupInfo.code}` : ''}`
        : ''
      
      const fullMessage = `${descriptionInput.value}${groupInfoText}`
      
      // Create support ticket
      const ticketResponse = await api.post('/support', {
        subject: titleInput.value,
        message: fullMessage,
        category: issueType,
        priority: 'medium',
        assignedTo: selectedAgent.id
      })
      
      if (ticketResponse.data?.success) {
        // Also send a message to the agent
        await api.post('/chat/user', {
          message: `New Issue Reported:\n\nType: ${issueType}\nTitle: ${titleInput.value}\n\n${fullMessage}`,
          recipientIds: [selectedAgent.id],
          type: 'text'
        })
        
    alert('Issue reported successfully! The agent will respond soon.')
    setShowIssueForm(false)
        titleInput.value = ''
        descriptionInput.value = ''
      } else {
        alert('Failed to submit issue. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error submitting issue:', error)
      alert(`Failed to submit issue: ${error.response?.data?.message || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleRegisterOfficer = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first.')
      return
    }
    
    if (!registerOfficerData.officerName || !registerOfficerData.officerEmail || !registerOfficerData.officerPhone) {
      alert('Please fill in all required fields.')
      return
    }
    
    try {
      setSubmitting(true)
      
      const groupInfoText = groupInfo 
        ? `\n\nGroup Information:\nGroup ID: ${groupInfo.id}\nGroup Name: ${groupInfo.name}${groupInfo.code ? `\nGroup Code: ${groupInfo.code}` : ''}`
        : ''
      
      const message = `Request to Register New Officer:\n\nOfficer Name: ${registerOfficerData.officerName}\nEmail: ${registerOfficerData.officerEmail}\nPhone: ${registerOfficerData.officerPhone}\nRole: ${registerOfficerData.officerRole}\n\nReason: ${registerOfficerData.reason || 'N/A'}${groupInfoText}`
      
      // Create support ticket
      const ticketResponse = await api.post('/support', {
        subject: `Register New ${registerOfficerData.officerRole}`,
        message: message,
        category: 'account',
        priority: 'high',
        assignedTo: selectedAgent.id
      })
      
      if (ticketResponse.data?.success) {
        // Send message to agent
        await api.post('/chat/user', {
          message: message,
          recipientIds: [selectedAgent.id],
          type: 'text'
        })
        
        alert(t('requestSubmittedSuccessfully', { defaultValue: 'Request submitted successfully! The agent will help you register the officer.' }))
        setShowRegisterOfficerModal(false)
        setRegisterOfficerData({
          officerName: '',
          officerEmail: '',
          officerPhone: '',
          officerRole: 'Secretary',
          reason: ''
        })
      } else {
        alert('Failed to submit request. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error registering officer:', error)
      alert(`Failed to submit request: ${error.response?.data?.message || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleRestoreAccount = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first.')
      return
    }
    
    if (!restoreAccountData.memberName || !restoreAccountData.memberId) {
      alert(t('fillMemberNameAndId', { defaultValue: 'Please fill in member name and ID.' }))
      return
    }
    
    try {
      setSubmitting(true)
      
      const groupInfoText = groupInfo 
        ? `\n\nGroup Information:\nGroup ID: ${groupInfo.id}\nGroup Name: ${groupInfo.name}${groupInfo.code ? `\nGroup Code: ${groupInfo.code}` : ''}`
        : ''
      
      const message = `Request to Restore Account:\n\nMember Name: ${restoreAccountData.memberName}\nMember ID: ${restoreAccountData.memberId}\n\nReason: ${restoreAccountData.reason || 'N/A'}\n\nDetails: ${restoreAccountData.details || 'N/A'}${groupInfoText}`
      
      // Create support ticket
      const ticketResponse = await api.post('/support', {
        subject: `Restore Account for ${restoreAccountData.memberName}`,
        message: message,
        category: 'account',
        priority: 'high',
        assignedTo: selectedAgent.id
      })
      
      if (ticketResponse.data?.success) {
        // Send message to agent
        await api.post('/chat/user', {
          message: message,
          recipientIds: [selectedAgent.id],
          type: 'text'
        })
        
        alert(t('requestSubmittedRestoreAccount', { defaultValue: 'Request submitted successfully! The agent will help restore the account.' }))
        setShowRestoreAccountModal(false)
        setRestoreAccountData({
          memberName: '',
          memberId: '',
          reason: '',
          details: ''
        })
      } else {
        alert('Failed to submit request. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error restoring account:', error)
      alert(`Failed to submit request: ${error.response?.data?.message || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }
  
  const handlePerformanceReview = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first.')
      return
    }
    
    if (!performanceReviewData.period || !performanceReviewData.achievements) {
      alert('Please fill in period and achievements.')
      return
    }
    
    try {
      setSubmitting(true)
      
      const groupInfoText = groupInfo 
        ? `\n\nGroup Information:\nGroup ID: ${groupInfo.id}\nGroup Name: ${groupInfo.name}${groupInfo.code ? `\nGroup Code: ${groupInfo.code}` : ''}`
        : ''
      
      const message = `Performance Review Submission:\n\nPeriod: ${performanceReviewData.period}\n\nAchievements:\n${performanceReviewData.achievements}\n\nChallenges:\n${performanceReviewData.challenges || 'N/A'}\n\nRecommendations:\n${performanceReviewData.recommendations || 'N/A'}${groupInfoText}`
      
      // Create support ticket
      const ticketResponse = await api.post('/support', {
        subject: `Performance Review - ${performanceReviewData.period}`,
        message: message,
        category: 'other',
        priority: 'medium',
        assignedTo: selectedAgent.id
      })
      
      if (ticketResponse.data?.success) {
        // Send message to agent
        await api.post('/chat/user', {
          message: message,
          recipientIds: [selectedAgent.id],
          type: 'text'
        })
        
        alert('Performance review submitted successfully!')
        setShowPerformanceReviewModal(false)
        setPerformanceReviewData({
          period: '',
          achievements: '',
          challenges: '',
          recommendations: ''
        })
      } else {
        alert('Failed to submit review. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error submitting review:', error)
      alert(`Failed to submit review: ${error.response?.data?.message || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first.')
      return
    }
    
    if (!feedbackData.subject || !feedbackData.message) {
      alert('Please fill in subject and message.')
      return
    }
    
    try {
      setSubmitting(true)
      
      const groupInfoText = groupInfo 
        ? `\n\nGroup Information:\nGroup ID: ${groupInfo.id}\nGroup Name: ${groupInfo.name}${groupInfo.code ? `\nGroup Code: ${groupInfo.code}` : ''}`
        : ''
      
      const fullMessage = `${feedbackData.message}${groupInfoText}`
      
      // Create support ticket
      const ticketResponse = await api.post('/support', {
        subject: `Feedback: ${feedbackData.subject}`,
        message: fullMessage,
        category: feedbackData.category,
        priority: 'medium',
        assignedTo: selectedAgent.id
      })
      
      if (ticketResponse.data?.success) {
        // Send message to agent
        await api.post('/chat/user', {
          message: `New Feedback Received:\n\nSubject: ${feedbackData.subject}\nCategory: ${feedbackData.category}\n\n${fullMessage}`,
          recipientIds: [selectedAgent.id],
          type: 'text'
        })
        
        alert('Feedback submitted successfully! The agent will review it.')
        setShowFeedbackModal(false)
        setFeedbackData({
          subject: '',
          category: 'general',
          message: ''
        })
      } else {
        alert('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error submitting feedback:', error)
      alert(`Failed to submit feedback: ${error.response?.data?.message || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleScheduleReviewMeeting = async () => {
    if (!selectedAgent) {
      alert('Please select an agent first.')
      return
    }
    
    if (!reviewMeetingData.preferredDate || !reviewMeetingData.preferredTime) {
      alert(t('fillPreferredDateAndTime', { defaultValue: 'Please fill in preferred date and time.' }))
      return
    }
    
    try {
      setSubmitting(true)
      
      const groupInfoText = groupInfo 
        ? `\n\nGroup Information:\nGroup ID: ${groupInfo.id}\nGroup Name: ${groupInfo.name}${groupInfo.code ? `\nGroup Code: ${groupInfo.code}` : ''}`
        : ''
      
      const meetingRequestMessage = `Review Meeting Request:\n\nPreferred Date: ${reviewMeetingData.preferredDate}\nPreferred Time: ${reviewMeetingData.preferredTime}\n${reviewMeetingData.location ? `Location: ${reviewMeetingData.location}\n` : ''}${reviewMeetingData.agenda ? `Agenda:\n${reviewMeetingData.agenda}\n` : ''}${reviewMeetingData.reason ? `Reason: ${reviewMeetingData.reason}\n` : ''}${groupInfoText}`
      
      // Create support ticket for meeting request
      const ticketResponse = await api.post('/support', {
        subject: 'Review Meeting Request',
        message: meetingRequestMessage,
        category: 'other',
        priority: 'high',
        assignedTo: selectedAgent.id
      })
      
      if (ticketResponse.data?.success) {
        // Send message to agent
        await api.post('/chat/user', {
          message: meetingRequestMessage,
          recipientIds: [selectedAgent.id],
          type: 'text'
        })
        
        alert(t('reviewMeetingRequestSubmitted', { defaultValue: 'Review meeting request submitted successfully! The agent will schedule the meeting and get back to you.' }))
        setShowReviewMeetingModal(false)
        setReviewMeetingData({
          preferredDate: '',
          preferredTime: '',
          location: '',
          agenda: '',
          reason: ''
        })
      } else {
        alert('Failed to submit meeting request. Please try again.')
      }
    } catch (error) {
      console.error('[Agent Chat] Error scheduling review meeting:', error)
      alert(`Failed to submit meeting request: ${error.response?.data?.message || error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'in-progress': return 'bg-blue-100 text-blue-700'
      case 'open': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('collaborationWithAgent', { defaultValue: 'Collaboration with Agent' })}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('communicateWithAgent', { defaultValue: 'Communicate with your assigned agent and report issues' })}</p>
        </div>

        {/* Agent Selection Card */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <div className="flex items-center gap-4">
            {selectedAgent ? (
              <>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {selectedAgent.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">{selectedAgent.name}</h2>
                  <p className="text-gray-600">Agent</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {selectedAgent.phone && (
                <div className="flex items-center gap-1">
                        <Phone size={16} /> {selectedAgent.phone}
                </div>
                    )}
                    {selectedAgent.email && (
                <div className="flex items-center gap-1">
                        <Mail size={16} /> {selectedAgent.email}
                      </div>
                    )}
                </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  {selectedAgent.status === 'active' ? 'active' : 'inactive'}
                </span>
              </>
            ) : (
              <div className="flex-1 text-center py-4">
                <p className="text-gray-600">No agent selected</p>
              </div>
            )}
            
            {/* Agent Selection Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  // Refresh agents list when opening dropdown
                  if (!showAgentDropdown) {
                    loadAgents()
                  }
                  setShowAgentDropdown(!showAgentDropdown)
                }}
                className="btn-primary flex items-center gap-2"
              >
                <User size={18} />
                {selectedAgent ? 'Change Agent' : 'Select Agent'}
                <ChevronDown size={18} />
              </button>
              
              {showAgentDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowAgentDropdown(false)}
                  ></div>
                  <div className="absolute z-20 right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">Select an Agent</h3>
                        <p className="text-xs text-gray-600">Choose an agent to chat with</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          loadAgents()
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        title="Refresh agents list"
                      >
                        Refresh
                      </button>
                    </div>
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Loading agents...</p>
                      </div>
                    ) : agents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm mb-2">No agents available</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            loadAgents()
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 underline"
                        >
                          Click to refresh
                        </button>
                      </div>
                    ) : (
                      agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgent(agent)
                            setShowAgentDropdown(false)
                            setActiveTab('chat') // Switch to chat tab when agent is selected
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedAgent?.id === agent.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                            {agent.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-800">{agent.name}</p>
                            <p className="text-sm text-gray-600">{agent.email || 'No email'}</p>
                            {agent.phone && (
                              <p className="text-xs text-gray-500">{agent.phone}</p>
                            )}
                          </div>
                          {selectedAgent?.id === agent.id && (
                            <CheckCircle className="text-primary-500" size={20} />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs - Only show if agent is selected */}
        {selectedAgent ? (
        <div className="card">
          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-2">
              {[
                { id: 'chat', label: 'Direct Chat', icon: MessageCircle },
                { id: 'issues', label: 'Report Issues', icon: AlertCircle },
                { id: 'feedback', label: 'Feedback & Reports', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} /> {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="mx-auto mb-2 text-gray-400" size={32} />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'Group Admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-xl p-4 ${
                        msg.sender === 'Group Admin'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="font-semibold mb-1">{msg.sender}</p>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-2 ${msg.sender === 'Group Admin' ? 'text-primary-100' : 'text-gray-500'}`}>
                            {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="input-field flex-1"
                    disabled={sending}
                  onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send size={18} />
                    )}
                    Send
                </button>
              </div>
            </div>
          )}

          {/* Report Issues Tab */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Reported Issues</h3>
                <button
                  onClick={() => setShowIssueForm(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <AlertCircle size={18} /> Report New Issue
                </button>
              </div>

                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
                  <p>No issues reported yet. Use the button above to report an issue.</p>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Feedback & Reports</h3>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FileText size={18} /> Submit Feedback
                </button>
              </div>

                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto mb-2 text-gray-400" size={32} />
                  <p>No feedback submitted yet. Use the button above to submit feedback.</p>
              </div>

              <div className="card bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">Periodic Reviews</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Submit quarterly performance reviews and participate in periodic training sessions with your agent.
                </p>
                <button 
                  onClick={() => setShowReviewMeetingModal(true)}
                  className="btn-primary text-sm"
                >
                  Schedule Review Meeting
                </button>
              </div>
            </div>
          )}
        </div>
        ) : (
          <div className="card text-center py-12">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('selectAnAgent', { defaultValue: 'Select an Agent' })}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('selectAgentToStartChatting', { defaultValue: 'Please select an agent from the dropdown above to start chatting.' })}</p>
          </div>
        )}

        {/* Quick Actions */}
        {selectedAgent && (
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Headphones className="text-purple-600" size={24} />
            {t('quickSupportActions', { defaultValue: 'Quick Support Actions' })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setShowRegisterOfficerModal(true)}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow text-left"
              >
              <User className="text-blue-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{t('registerNewOfficer', { defaultValue: 'Register New Officer' })}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('requestHelpRegisteringOfficer', { defaultValue: 'Request help registering Secretary or Cashier' })}</p>
            </button>
              <button 
                onClick={() => setShowRestoreAccountModal(true)}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow text-left"
              >
              <AlertCircle className="text-red-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{t('restoreAccount', { defaultValue: 'Restore Account' })}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('requestAccountRestoration', { defaultValue: 'Request account restoration for members' })}</p>
            </button>
              <button 
                onClick={() => setShowPerformanceReviewModal(true)}
                className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow text-left"
              >
              <FileText className="text-green-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800 mb-1">Performance Review</h3>
              <p className="text-sm text-gray-600">Submit quarterly group performance feedback</p>
            </button>
          </div>
        </div>
        )}

        {/* Issue Report Modal */}
        {showIssueForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Report Issue</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue Type
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="input-field"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="financial">Financial Issue</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Brief description of the issue"
                    id="issueTitle"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Provide details about the issue..."
                    id="issueDescription"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowIssueForm(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitIssue}
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Issue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Register Officer Modal */}
        {showRegisterOfficerModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Register New Officer</h2>
                <p className="text-sm text-gray-600 mt-1">Request help registering a new officer</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Officer Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={registerOfficerData.officerRole}
                    onChange={(e) => setRegisterOfficerData({...registerOfficerData, officerRole: e.target.value})}
                    className="input-field"
                  >
                    <option value="Secretary">Secretary</option>
                    <option value="Cashier">Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Officer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Full name of the officer"
                    value={registerOfficerData.officerName}
                    onChange={(e) => setRegisterOfficerData({...registerOfficerData, officerName: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="officer@example.com"
                    value={registerOfficerData.officerEmail}
                    onChange={(e) => setRegisterOfficerData({...registerOfficerData, officerEmail: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+250788123456"
                    value={registerOfficerData.officerPhone}
                    onChange={(e) => setRegisterOfficerData({...registerOfficerData, officerPhone: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Why do you need to register this officer?"
                    value={registerOfficerData.reason}
                    onChange={(e) => setRegisterOfficerData({...registerOfficerData, reason: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRegisterOfficerModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegisterOfficer}
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Account Modal */}
        {showRestoreAccountModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Restore Account</h2>
                <p className="text-sm text-gray-600 mt-1">Request account restoration for a member</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Member Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Full name of the member"
                    value={restoreAccountData.memberName}
                    onChange={(e) => setRestoreAccountData({...restoreAccountData, memberName: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Member ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Member ID or National ID"
                    value={restoreAccountData.memberId}
                    onChange={(e) => setRestoreAccountData({...restoreAccountData, memberId: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Why does this account need to be restored?"
                    value={restoreAccountData.reason}
                    onChange={(e) => setRestoreAccountData({...restoreAccountData, reason: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Any additional information that might help..."
                    value={restoreAccountData.details}
                    onChange={(e) => setRestoreAccountData({...restoreAccountData, details: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRestoreAccountModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestoreAccount}
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Review Modal */}
        {showPerformanceReviewModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Performance Review</h2>
                <p className="text-sm text-gray-600 mt-1">Submit quarterly group performance feedback</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Period <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Q1 2024, January 2024, etc."
                    value={performanceReviewData.period}
                    onChange={(e) => setPerformanceReviewData({...performanceReviewData, period: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Achievements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Describe the group's achievements during this period..."
                    value={performanceReviewData.achievements}
                    onChange={(e) => setPerformanceReviewData({...performanceReviewData, achievements: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Challenges
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Describe any challenges faced..."
                    value={performanceReviewData.challenges}
                    onChange={(e) => setPerformanceReviewData({...performanceReviewData, challenges: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recommendations
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Any recommendations for improvement..."
                    value={performanceReviewData.recommendations}
                    onChange={(e) => setPerformanceReviewData({...performanceReviewData, recommendations: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPerformanceReviewModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePerformanceReview}
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Submit Feedback</h2>
                <p className="text-sm text-gray-600 mt-1">Share your feedback with your agent</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Brief subject of your feedback"
                    value={feedbackData.subject}
                    onChange={(e) => setFeedbackData({...feedbackData, subject: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={feedbackData.category}
                    onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                    className="input-field"
                  >
                    <option value="general">General Feedback</option>
                    <option value="technical">Technical Issue</option>
                    <option value="account">Account Related</option>
                    <option value="loan">Loan Related</option>
                    <option value="contribution">Contribution Related</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="6"
                    placeholder="Please share your feedback, suggestions, or concerns..."
                    value={feedbackData.message}
                    onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false)
                      setFeedbackData({ subject: '', category: 'general', message: '' })
                    }}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Review Meeting Modal */}
        {showReviewMeetingModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Schedule Review Meeting</h2>
                <p className="text-sm text-gray-600 mt-1">Request a review meeting with your agent</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={reviewMeetingData.preferredDate}
                    onChange={(e) => setReviewMeetingData({...reviewMeetingData, preferredDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={reviewMeetingData.preferredTime}
                    onChange={(e) => setReviewMeetingData({...reviewMeetingData, preferredTime: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Meeting location or 'Online'"
                    value={reviewMeetingData.location}
                    onChange={(e) => setReviewMeetingData({...reviewMeetingData, location: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agenda (Optional)
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="What topics would you like to discuss?"
                    value={reviewMeetingData.agenda}
                    onChange={(e) => setReviewMeetingData({...reviewMeetingData, agenda: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Meeting
                  </label>
                  <textarea
                    className="input-field"
                    rows="2"
                    placeholder="Why do you need this review meeting?"
                    value={reviewMeetingData.reason}
                    onChange={(e) => setReviewMeetingData({...reviewMeetingData, reason: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowReviewMeetingModal(false)
                      setReviewMeetingData({
                        preferredDate: '',
                        preferredTime: '',
                        location: '',
                        agenda: '',
                        reason: ''
                      })
                    }}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleReviewMeeting}
                    className="btn-primary flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Request Meeting'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminAgent
