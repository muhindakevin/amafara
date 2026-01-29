import { useState, useEffect } from 'react'
import { Headphones, MessageCircle, AlertCircle, CheckCircle, Clock, User, Building, ArrowUp, Send, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function AgentSupport() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [supportRequests, setSupportRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')
  const [escalateReason, setEscalateReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all') // all, open, in_progress, resolved

  useEffect(() => {
    loadSupportRequests()
  }, [])

  const loadSupportRequests = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/support')
      if (data?.success) {
        setSupportRequests(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load support requests:', error)
      alert(t('failedToLoadSupportRequests', { defaultValue: 'Failed to load support requests. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket)
    setShowResponseModal(true)
  }

  const handleResolveTicket = async (ticketId) => {
    if (!confirm(t('confirmMarkTicketResolved', { defaultValue: 'Are you sure you want to mark this ticket as resolved?' }))) {
      return
    }

    try {
      setSubmitting(true)
      const { data } = await api.put(`/support/${ticketId}`, {
        status: 'resolved',
        resolution: 'Resolved by agent'
      })

      if (data?.success) {
        alert(t('ticketMarkedResolved', { defaultValue: 'Ticket marked as resolved successfully!' }))
        loadSupportRequests()
        if (selectedTicket?.id === ticketId) {
          setShowResponseModal(false)
          setSelectedTicket(null)
        }
      } else {
        alert(t('failedToResolveTicket', { defaultValue: 'Failed to resolve ticket. Please try again.' }))
      }
    } catch (error) {
      console.error('Failed to resolve ticket:', error)
      alert(error?.response?.data?.message || t('failedToResolveTicket', { defaultValue: 'Failed to resolve ticket. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setSubmitting(true)
      const { data } = await api.put(`/support/${ticketId}`, {
        status: newStatus
      })

      if (data?.success) {
        alert(t('ticketStatusUpdatedSuccessfully', { defaultValue: 'Ticket status updated successfully!' }))
        loadSupportRequests()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.data)
        }
      } else {
        alert(t('failedToUpdateTicketStatus', { defaultValue: 'Failed to update ticket status. Please try again.' }))
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error)
      alert(error?.response?.data?.message || t('failedToUpdateTicketStatus', { defaultValue: 'Failed to update ticket status. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) {
      alert(t('enterResponseMessage', { defaultValue: 'Please enter a response message.' }))
      return
    }

    if (!selectedTicket) return

    try {
      setSubmitting(true)
      
      // Send message via chat
      await api.post('/chat/user', {
        message: `Agent Response:\n\n${responseMessage}`,
        recipientIds: [selectedTicket.userId],
        type: 'text'
      })

      // Update ticket status to in_progress if it's open
      if (selectedTicket.status === 'open') {
        await api.put(`/support/${selectedTicket.id}`, {
          status: 'in_progress'
        })
      }

      alert(t('responseSentSuccessfully', { defaultValue: 'Response sent successfully!' }))
      setResponseMessage('')
      setShowResponseModal(false)
      loadSupportRequests()
    } catch (error) {
      console.error('Failed to send response:', error)
      alert(error?.response?.data?.message || t('failedToSendResponse', { defaultValue: 'Failed to send response. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEscalateTicket = async () => {
    if (!selectedTicket) return

    if (!confirm(t('confirmEscalateTicket', { defaultValue: 'Are you sure you want to escalate this ticket to System Admin? This will transfer the ticket and you will no longer be able to manage it.' }))) {
      return
    }

    try {
      setSubmitting(true)
      const { data } = await api.post(`/support/${selectedTicket.id}/escalate`, {
        reason: escalateReason
      })

      if (data?.success) {
        alert(t('ticketEscalatedSuccessfully', { defaultValue: 'Ticket escalated to System Admin successfully!' }))
        setShowEscalateModal(false)
        setShowResponseModal(false)
        setSelectedTicket(null)
        setEscalateReason('')
        loadSupportRequests()
      } else {
        alert(t('failedToEscalateTicket', { defaultValue: 'Failed to escalate ticket. Please try again.' }))
      }
    } catch (error) {
      console.error('Failed to escalate ticket:', error)
      alert(error?.response?.data?.message || t('failedToEscalateTicket', { defaultValue: 'Failed to escalate ticket. Please try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'open':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredRequests = supportRequests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
  })

  const stats = {
    total: supportRequests.length,
    open: supportRequests.filter(r => r.status === 'open').length,
    in_progress: supportRequests.filter(r => r.status === 'in_progress').length,
    resolved: supportRequests.filter(r => r.status === 'resolved' || r.status === 'closed').length
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Headphones className="text-primary-600" size={32} />
            {t('supportRequests', { defaultValue: 'Support Requests' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageRespondSupportRequests', { defaultValue: 'Manage and respond to support requests from group admins' })}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalRequests', { defaultValue: 'Total Requests' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tCommon('open', { defaultValue: 'Open' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.open}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('inProgress', { defaultValue: 'In Progress' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.in_progress}</p>
              </div>
              <AlertCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('resolved', { defaultValue: 'Resolved' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.resolved}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card">
          <div className="flex gap-2 border-b border-gray-200 pb-4 mb-4">
            {[
              { id: 'all', label: t('allRequests', { defaultValue: 'All Requests' }), count: stats.total },
              { id: 'open', label: tCommon('open'), count: stats.open },
              { id: 'in_progress', label: t('inProgress'), count: stats.in_progress },
              { id: 'resolved', label: t('resolved'), count: stats.resolved }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Support Requests List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">{t('loadingSupportRequests', { defaultValue: 'Loading support requests...' })}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Headphones className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-semibold">{t('noSupportRequestsFound', { defaultValue: 'No support requests found' })}</p>
              <p className="text-sm">{t('supportRequestsAssignedWillAppear', { defaultValue: 'Support requests assigned to you will appear here' })}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const groupInfo = request.user?.group
                return (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{request.subject}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                            {request.priority || 'medium'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {request.status || 'open'}
                          </span>
                        </div>
                        
                        {/* Group Information */}
                        {groupInfo && (
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <Building size={16} />
                              <span className="font-semibold">{t('group')}:</span>
                              <span>{groupInfo.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{t('groupId', { defaultValue: 'Group ID' })}:</span>
                              <span>{groupInfo.id}</span>
                            </div>
                            {groupInfo.code && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{t('code', { defaultValue: 'Code' })}:</span>
                                <span>{groupInfo.code}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Requester Information */}
                        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span className="font-semibold">{t('requestedBy', { defaultValue: 'Requested by' })}:</span>
                            <span>{request.user?.name || t('unknown', { defaultValue: 'Unknown' })}</span>
                            {request.user?.email && (
                              <span className="text-gray-500 dark:text-gray-400">({request.user.email})</span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{request.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{t('created', { defaultValue: 'Created' })}: {formatDate(request.createdAt)}</span>
                          {request.resolvedAt && (
                            <span>{t('resolved')}: {formatDate(request.resolvedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleViewTicket(request)}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        <MessageCircle size={16} /> {t('viewRespond', { defaultValue: 'View & Respond' })}
                      </button>
                      
                      {request.status === 'open' && (
                        <button
                          onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                          className="btn-secondary flex items-center gap-2 text-sm"
                          disabled={submitting}
                        >
                          <Clock size={16} /> {t('markInProgress', { defaultValue: 'Mark In Progress' })}
                        </button>
                      )}
                      
                      {request.status !== 'resolved' && request.status !== 'closed' && (
                        <>
                          <button
                            onClick={() => handleResolveTicket(request.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                            disabled={submitting}
                          >
                            <CheckCircle size={16} /> {t('resolve', { defaultValue: 'Resolve' })}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTicket(request)
                              setShowEscalateModal(true)
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                            disabled={submitting}
                          >
                            <ArrowUp size={16} /> Escalate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('ticketDetailsResponse', { defaultValue: 'Ticket Details & Response' })}</h2>
                <button
                  onClick={() => {
                    setShowResponseModal(false)
                    setSelectedTicket(null)
                    setResponseMessage('')
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  
                  {selectedTicket.user?.group && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <Building size={16} />
                        <span className="font-semibold">{t('group')}:</span>
                        <span>{selectedTicket.user.group.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                        <span className="font-semibold">{t('groupId')}:</span> {selectedTicket.user.group.id}
                        {selectedTicket.user.group.code && (
                          <> • <span className="font-semibold">{t('code')}:</span> {selectedTicket.user.group.code}</>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="font-semibold">{t('requestedBy')}:</span> {selectedTicket.user?.name || t('unknown')}
                    {selectedTicket.user?.email && ` (${selectedTicket.user.email})`}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  {selectedTicket.resolution && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">{t('resolution')}:</p>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.resolution}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('yourResponse', { defaultValue: 'Your Response' })}
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows="4"
                    placeholder={t('typeResponseToGroupAdmin', { defaultValue: 'Type your response to the group admin...' })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowResponseModal(false)
                      setSelectedTicket(null)
                      setResponseMessage('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    {tCommon('close')}
                  </button>
                  <button
                    onClick={handleSendResponse}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={submitting || !responseMessage.trim()}
                  >
                    <Send size={18} />
                    {submitting ? t('sending', { defaultValue: 'Sending...' }) : t('sendResponse')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escalate Modal */}
        {showEscalateModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('escalateTicket', { defaultValue: 'Escalate Ticket' })}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('escalateTicketDescription', { defaultValue: "Escalate this ticket to System Admin if it's beyond your privileges" })}</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>{t('ticket', { defaultValue: 'Ticket' })}:</strong> {selectedTicket.subject}
                  </p>
                  {selectedTicket.user?.group && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      <strong>{t('group')}:</strong> {selectedTicket.user.group.name} ({t('id', { defaultValue: 'ID' })}: {selectedTicket.user.group.id})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('reasonForEscalation', { defaultValue: 'Reason for Escalation' })} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows="4"
                    placeholder={t('explainEscalationReason', { defaultValue: 'Explain why this ticket needs to be escalated to System Admin...' })}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEscalateModal(false)
                      setEscalateReason('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    onClick={handleEscalateTicket}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex-1 flex items-center justify-center gap-2 transition-colors"
                    disabled={submitting || !escalateReason.trim()}
                  >
                    <ArrowUp size={18} />
                    {submitting ? t('escalating', { defaultValue: 'Escalating...' }) : t('escalateToSystemAdmin', { defaultValue: 'Escalate to System Admin' })}
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

export default AgentSupport

