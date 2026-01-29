import { useState, useEffect, useRef } from 'react'
import { Users, Calendar, MessageCircle, FileText, DollarSign, TrendingUp, MapPin, Clock, CheckCircle, AlertCircle, Building2, RefreshCw, Send } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getAuthToken } from '../utils/api'
import { io } from 'socket.io-client'

function MemberGroup() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [groupData, setGroupData] = useState(null)
  const [messageModal, setMessageModal] = useState({ open: false, leader: null })
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const socketRef = useRef(null)

  const loadGroupData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/groups/my-group/data')
      
      if (response.data?.success) {
        setGroupData(response.data.data)
      } else {
        console.error('Failed to load group data:', response.data?.message)
      }
    } catch (error) {
      console.error('Error loading group data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroupData()
    
    // Set up global refresh function for Socket.io
    window.refreshMyGroupData = loadGroupData
    
    // Initialize Socket.io connection for real-time savings updates
    const token = getAuthToken()
    if (token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
      
      try {
        const socket = io(socketUrl, {
          auth: { token },
          transports: ['polling', 'websocket'], // Try polling first
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 3,
          timeout: 10000
        })
        
        socketRef.current = socket
        
        socket.on('connect', () => {
          console.log('[MemberGroup] Socket.io connected')
        })
        
        socket.on('connect_error', (error) => {
          console.warn('[MemberGroup] Socket.io connection error:', error.message)
          // Continue without real-time updates - will use periodic refresh instead
        })
        
        socket.on('savings_updated', (data) => {
          console.log('[MemberGroup] Savings updated via Socket.io:', data)
          // Update the financials in real-time
          setGroupData(prev => {
            if (prev && data.groupId === prev.groupInfo?.id) {
              return {
                ...prev,
                financials: {
                  ...prev.financials,
                  totalSavings: data.totalSavings
                }
              }
            }
            return prev
          })
        })
        
        return () => {
          if (socket) {
            socket.close()
          }
          window.refreshMyGroupData = null
        }
      } catch (error) {
        console.warn('[MemberGroup] Failed to initialize Socket.io:', error)
        // Continue without real-time updates
      }
    }
  }, [])
  
  // Subscribe to savings updates when groupData is loaded
  useEffect(() => {
    if (socketRef.current?.connected && groupData?.groupInfo?.id) {
      socketRef.current.emit('subscribe_savings_updates', { groupId: groupData.groupInfo.id })
    }
  }, [groupData])

  const handleMessageLeader = (leader) => {
    if (!leader || !leader.id) {
      alert(t('leaderInfoNotAvailable', { defaultValue: 'Leader information not available' }))
      return
    }
    // Navigate directly to chat page with the specific leader selected
    navigate(`/chat?userId=${leader.id}`)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert(tCommon('enterMessage', { defaultValue: 'Please enter a message' }))
      return
    }

    if (!groupData || !groupData.groupInfo || !messageModal.leader) {
      alert(t('missingInformationToSend', { defaultValue: 'Missing information to send message' }))
      return
    }

    try {
      setSendingMessage(true)
      
      // Send private message to the leader (not group chat)
      const response = await api.post('/chat/user', {
        message: messageText,
        recipientIds: [messageModal.leader.id]
      })

      if (response.data?.success) {
        alert(t('privateMessageSent', { defaultValue: 'Private message sent successfully!' }))
        setMessageText('')
        setMessageModal({ open: false, leader: null })
        // Navigate to private chat with the leader
        navigate(`/chat?userId=${messageModal.leader.id}`)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send message'
      alert(errorMessage)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMessageAllLeaders = () => {
    if (!groupData || !groupData.leaders) {
      alert(t('noLeadersAvailable', { defaultValue: 'No leaders available' }))
      return
    }

    const activeLeaders = [
      groupData.leaders.admin,
      groupData.leaders.cashier,
      groupData.leaders.secretary
    ].filter(Boolean)

    if (activeLeaders.length === 0) {
      alert(t('noActiveLeadersAvailable', { defaultValue: 'No active leaders available to message' }))
      return
    }

    // Navigate to chat page - it will show all leaders in the list
    // User can click on any leader to start chatting with them
    navigate('/chat')
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Group Admin': return 'bg-blue-100 text-blue-700'
      case 'Cashier': return 'bg-green-100 text-green-700'
      case 'Secretary': return 'bg-purple-100 text-purple-700'
      case 'Member': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <Layout userRole="Member">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 animate-spin text-primary-600" size={48} />
            <p className="text-gray-600">{tCommon('loadingGroupData', { defaultValue: 'Loading group data...' })}</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!groupData) {
    return (
      <Layout userRole="Member">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600">Failed to load group data. Please try again.</p>
          <button onClick={loadGroupData} className="btn-primary mt-4">
            <RefreshCw size={16} className="inline mr-2" />
            Retry
          </button>
        </div>
      </Layout>
    )
  }

  const { groupInfo, leaders, members, totalMembers, financials } = groupData

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('myGroup', { defaultValue: 'My Group' })}</h1>
          <p className="text-gray-600 mt-1">Group: {groupInfo.name}</p>
          </div>
          <button
            onClick={loadGroupData}
            className="btn-secondary flex items-center gap-2"
            title="Refresh group data"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Members</p>
                <p className="text-2xl font-bold text-gray-800">{totalMembers}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Savings</p>
                <p className="text-2xl font-bold text-gray-800">{financials.totalSavings.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Loans</p>
                <p className="text-2xl font-bold text-gray-800">{financials.activeLoans.toLocaleString()} RWF</p>
              </div>
              <TrendingUp className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Monthly Contribution</p>
                <p className="text-2xl font-bold text-gray-800">{financials.monthlyContributions.toLocaleString()} RWF</p>
              </div>
              <Calendar className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2 overflow-x-auto">
              {['overview', 'members'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Building2 className="text-blue-600" size={20} />
                      Group Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group Name:</span>
                        <span className="font-semibold text-gray-800">{groupInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group ID:</span>
                        <span className="font-semibold text-gray-800">{groupInfo.code}</span>
                      </div>
                      {groupInfo.establishedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Established:</span>
                          <span className="font-semibold text-gray-800">{new Date(groupInfo.establishedDate).toLocaleDateString()}</span>
                      </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <MapPin size={14} /> {groupInfo.location}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contribution Day:</span>
                        <span className="font-semibold text-gray-800">{groupInfo.contributionDay}</span>
                      </div>
                      {groupInfo.contributionAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contribution Amount:</span>
                          <span className="font-semibold text-gray-800">{groupInfo.contributionAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Users className="text-green-600" size={20} />
                      Group Leaders
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Group Admin:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {leaders.admin ? leaders.admin.name : 'Not assigned'}
                          </span>
                          {leaders.admin && (
                            <button
                              onClick={() => handleMessageLeader(leaders.admin)}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                              title="Message Group Admin"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cashier:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {leaders.cashier ? leaders.cashier.name : 'Not assigned'}
                          </span>
                          {leaders.cashier && (
                            <button
                              onClick={() => handleMessageLeader(leaders.cashier)}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                              title="Message Cashier"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Secretary:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {leaders.secretary ? leaders.secretary.name : 'Not assigned'}
                          </span>
                          {leaders.secretary && (
                            <button
                              onClick={() => handleMessageLeader(leaders.secretary)}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                              title="Message Secretary"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleMessageAllLeaders}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                        disabled={!leaders.admin && !leaders.cashier && !leaders.secretary}
                      >
                        <MessageCircle size={16} />
                        Message All Leaders
                      </button>
                      {(!leaders.admin && !leaders.cashier && !leaders.secretary) && (
                        <p className="text-xs text-gray-500 text-center mt-2">No active leaders available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-purple-600" size={20} />
                    Group Financial Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Savings</p>
                      <p className="text-2xl font-bold text-green-600">{financials.totalSavings.toLocaleString()} RWF</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                      <p className="text-2xl font-bold text-blue-600">{financials.activeLoans.toLocaleString()} RWF</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Monthly Contributions</p>
                      <p className="text-2xl font-bold text-purple-600">{financials.monthlyContributions.toLocaleString()} RWF</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Group Members ({members.length})</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Savings</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Score</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.length > 0 ? (
                        members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.totalSavings.toLocaleString()} RWF</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.creditScore}/100</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                                onClick={() => navigate(`/chat?groupId=${groupInfo.id}&userId=${member.id}`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Message
                            </button>
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No members found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
                        </div>
                      </div>
                    </div>

      {/* Message Modal */}
      {messageModal.open && messageModal.leader && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Message {messageModal.leader.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Send a message to {messageModal.leader.name} ({messageModal.leader.role}). 
              The message will be sent to the group chat and they will be notified.
            </p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMessageModal({ open: false, leader: null })
                  setMessageText('')
                }}
                className="btn-secondary flex-1"
                disabled={sendingMessage}
              >
                Cancel
                        </button>
              <button
                onClick={handleSendMessage}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
              </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MemberGroup
