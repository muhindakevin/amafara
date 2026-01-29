import { useState, useEffect } from 'react'
import { XCircle, CheckCircle, Clock, User, MessageCircle, ArrowLeft, FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function TicketDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSolveModal, setShowSolveModal] = useState(false)
  const [solving, setSolving] = useState(false)
  const [solution, setSolution] = useState({
    category: '',
    description: ''
  })

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/support/${id}`)
      if (data?.success) {
        setTicket(data.data)
      }
    } catch (error) {
      console.error('[TicketDetailsPage] Error fetching ticket:', error)
      alert(error?.response?.data?.message || 'Failed to load ticket details')
      navigate('/system-admin/support')
    } finally {
      setLoading(false)
    }
  }

  const handleSolveTicket = async () => {
    if (!solution.category || !solution.description) {
      alert('Please fill in solution category and description')
      return
    }
    
    try {
      setSolving(true)
      const { data } = await api.post(`/support/${id}/solve`, {
        solutionCategory: solution.category,
        solutionDescription: solution.description
      })
      
      if (data?.success) {
        setTicket(data.data)
        setShowSolveModal(false)
        setSolution({ category: '', description: '' })
        alert('Ticket solved successfully!')
        // Refresh ticket
        await fetchTicket()
      }
    } catch (error) {
      console.error('[TicketDetailsPage] Error solving ticket:', error)
      alert(error?.response?.data?.message || 'Failed to solve ticket')
    } finally {
      setSolving(false)
    }
  }

  const handleChat = () => {
    if (ticket?.user?.id) {
      const message = encodeURIComponent("Hello, your issue has been solved. Please check and confirm.")
      navigate(`/system-admin/chat?userId=${ticket.user.id}&message=${message}`)
    }
  }

  const handleUserClick = (userId) => {
    navigate(`/system-admin/users/${userId}`)
  }

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'open': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase()
    switch (priorityLower) {
      case 'urgent':
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getCategoryColor = (category) => {
    const categoryLower = category?.toLowerCase()
    switch (categoryLower) {
      case 'technical': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'account': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'loan': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
      case 'contribution': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'other': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Layout userRole="System Admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading ticket details...</div>
        </div>
      </Layout>
    )
  }

  if (!ticket) {
    return (
      <Layout userRole="System Admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Ticket not found</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/system-admin/support')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ticket #{ticket.id}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{ticket.subject}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {(ticket.status === 'open' || ticket.status === 'in_progress') && (
              <>
                <button
                  onClick={() => setShowSolveModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle size={20} /> Solve Issue
                </button>
                <button
                  onClick={handleChat}
                  className="btn-secondary flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle size={20} /> Chat
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ticket Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Subject</label>
                  <p className="text-gray-800 dark:text-white mt-1">{ticket.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-gray-800 dark:text-white mt-1 whitespace-pre-wrap">{ticket.message}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Category</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(ticket.category)}`}>
                        {ticket.category?.charAt(0).toUpperCase() + ticket.category?.slice(1) || 'Other'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Priority</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1) || 'Medium'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                        {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1).replace('_', ' ') || 'Open'}
                      </span>
                    </div>
                  </div>
                </div>
                {ticket.resolution && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Solution</label>
                    <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-gray-800 dark:text-white whitespace-pre-wrap">{ticket.resolution}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Status Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">Created</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(ticket.createdAt)}</p>
                  </div>
                </div>
                {ticket.assignedAgent && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <User size={16} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white">Assigned to {ticket.assignedAgent.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Agent</p>
                    </div>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white">Solved</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(ticket.resolvedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Information */}
            {ticket.user && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">User Information</h2>
                <div className="space-y-3">
                  <div>
                    <button
                      onClick={() => handleUserClick(ticket.user.id)}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                    >
                      {ticket.user.name}
                    </button>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-800 dark:text-white">{ticket.user.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Role</label>
                    <p className="text-gray-800 dark:text-white">{ticket.user.role || 'N/A'}</p>
                  </div>
                  {ticket.user.group && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Group</label>
                      <p className="text-gray-800 dark:text-white">{ticket.user.group.name || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned To */}
            {ticket.assignedAgent && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Assigned To</h2>
                <button
                  onClick={() => handleUserClick(ticket.assignedAgent.id)}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {ticket.assignedAgent.name}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ticket.assignedAgent.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Solve Ticket Modal */}
        {showSolveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Solve Ticket</h2>
                <button
                  onClick={() => setShowSolveModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Solution Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={solution.category}
                    onChange={(e) => setSolution({ ...solution, category: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Contribution Issue">Contribution Issue</option>
                    <option value="System Bug">System Bug</option>
                    <option value="Permission Issue">Permission Issue</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Solution Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows={6}
                    value={solution.description}
                    onChange={(e) => setSolution({ ...solution, description: e.target.value })}
                    placeholder="Describe the solution provided..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowSolveModal(false)}
                  className="btn-secondary"
                  disabled={solving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSolveTicket}
                  className="btn-primary"
                  disabled={solving}
                >
                  {solving ? 'Solving...' : 'Solve Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default TicketDetailsPage

