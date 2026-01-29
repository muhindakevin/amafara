import { useState, useEffect } from 'react'
import { Headphones, Plus, Send, Clock, CheckCircle, XCircle, AlertCircle, FileText, MessageCircle, Search, Filter, User } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function MemberSupport() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [activeTab, setActiveTab] = useState('faq')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketCategory, setTicketCategory] = useState('other')
  const [ticketPriority, setTicketPriority] = useState('medium')
  const [myTickets, setMyTickets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [filteredFaqs, setFilteredFaqs] = useState([])
  const [faqSearchTerm, setFaqSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [faqLoading, setFaqLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)

  // Fetch FAQs from API
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setFaqLoading(true)
        const response = await api.get('/support/faqs')
        if (response.data?.success) {
          setFaqs(response.data.data || [])
          setFilteredFaqs(response.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error)
        setFaqs([])
        setFilteredFaqs([])
      } finally {
        setFaqLoading(false)
      }
    }
    
    if (activeTab === 'faq') {
      fetchFAQs()
    }
  }, [activeTab])

  // Filter FAQs based on search term
  useEffect(() => {
    if (!faqSearchTerm.trim()) {
      setFilteredFaqs(faqs)
    } else {
      const searchLower = faqSearchTerm.toLowerCase()
      const filtered = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.category.toLowerCase().includes(searchLower)
      )
      setFilteredFaqs(filtered)
    }
  }, [faqSearchTerm, faqs])

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        const response = await api.get('/support')
        if (response.data?.success) {
          setMyTickets(response.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching tickets:', error)
        setMyTickets([])
      } finally {
        setLoading(false)
      }
    }
    
    if (activeTab === 'tickets') {
      fetchTickets()
    }
  }, [activeTab])

  const handleCreateTicket = async () => {
    if (!ticketSubject || !ticketDescription) {
      const { t: tForms } = useTranslation('forms')
      alert(tForms('fillRequiredFields', { defaultValue: 'Please fill in all required fields.' }))
      return
    }
    
    try {
      setSending(true)
      // Map frontend category to backend category
      const categoryMap = {
        'general': 'other',
        'technical': 'technical',
        'loan': 'loan',
        'contribution': 'contribution',
        'account': 'account',
        'feedback': 'other'
      }
      
      const response = await api.post('/support', {
        subject: ticketSubject,
        message: ticketDescription,
        category: categoryMap[ticketCategory] || 'other',
        priority: ticketPriority || 'medium'
      })
      
      if (response.data?.success) {
        alert(t('supportTicketCreated', { defaultValue: 'Support ticket created successfully!' }))
        setShowTicketModal(false)
        setTicketSubject('')
        setTicketDescription('')
        setTicketCategory('other')
        setTicketPriority('medium')
        // Refresh tickets list
        const ticketsResponse = await api.get('/support')
        if (ticketsResponse.data?.success) {
          setMyTickets(ticketsResponse.data.data || [])
        }
        // Switch to tickets tab to show the new ticket
        setActiveTab('tickets')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert(error?.response?.data?.message || t('failedToCreateTicket', { defaultValue: 'Failed to create ticket. Please try again.' }))
    } finally {
      setSending(false)
    }
  }

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket)
    setShowReplyModal(true)
  }

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) {
      alert('Please enter a reply message')
      return
    }

    try {
      setReplying(true)
      const response = await api.post(`/support/${selectedTicket.id}/reply`, {
        message: replyMessage.trim()
      })

      if (response.data?.success) {
        alert(response.data.message || 'Reply sent successfully!')
        setShowReplyModal(false)
        setReplyMessage('')
        setSelectedTicket(null)
        // Refresh tickets list
        try {
          const ticketsResponse = await api.get('/support')
          if (ticketsResponse.data?.success) {
            setMyTickets(ticketsResponse.data.data || [])
          }
        } catch (refreshError) {
          console.error('Error refreshing tickets:', refreshError)
          // Don't show error to user, just log it
        }
      } else {
        alert(response.data?.message || 'Failed to send reply. Please try again.')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to send reply. Please try again.'
      alert(errorMessage)
    } finally {
      setReplying(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-yellow-100 text-yellow-700'
      case 'closed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': 
      case 'urgent': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  
  const getCategoryDisplay = (category) => {
    const categoryMap = {
      'technical': 'Technical',
      'account': 'Account',
      'loan': 'Loan',
      'contribution': 'Contribution',
      'other': 'General'
    }
    return categoryMap[category?.toLowerCase()] || category || 'General'
  }

  const formatFAQAnswer = (answer) => {
    // If answer contains [category] prefix, remove it
    if (answer && answer.includes(']\n')) {
      return answer.split(']\n')[1] || answer
    }
    return answer
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('supportCenter', { defaultValue: 'Support Center' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('getHelpSubmitFeedback', { defaultValue: 'Get help, submit feedback, or report issues' })}</p>
          </div>
          <button
            onClick={() => setShowTicketModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> {t('createSupportTicket', { defaultValue: 'Create Support Ticket' })}
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/chat')}>
            <MessageCircle className="mx-auto text-blue-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('liveChat', { defaultValue: 'Live Chat' })}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('chatWithSupport', { defaultValue: 'Chat with support team' })}</p>
          </div>
          <div className="card text-center cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/member/learn-grow')}>
            <FileText className="mx-auto text-green-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('learnGrow')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('educationalResources', { defaultValue: 'Educational resources' })}</p>
          </div>
          <div className="card text-center cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/member/group')}>
            <User className="mx-auto text-purple-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Leaders</h3>
            <p className="text-sm text-gray-600">Message group admin</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['faq', 'tickets'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
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
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Headphones className="text-primary-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Frequently Asked Questions</h2>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search FAQ..."
                      value={faqSearchTerm}
                      onChange={(e) => setFaqSearchTerm(e.target.value)}
                      className="input-field flex-1 pl-10"
                    />
                  </div>
                </div>

                {faqLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="mx-auto mb-4 text-gray-400 animate-spin" size={48} />
                    <p className="font-semibold">Loading FAQs...</p>
                  </div>
                ) : filteredFaqs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFaqs.map((faq) => (
                      <div key={faq.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{faq.question}</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">{formatFAQAnswer(faq.answer)}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                {getCategoryDisplay(faq.category)}
                              </span>
                              {faq.frequency > 0 && (
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                                  Asked {faq.frequency} {faq.frequency === 1 ? 'time' : 'times'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="font-semibold">No FAQs found</p>
                    <p className="text-sm">
                      {faqSearchTerm ? 'Try a different search term' : 'No frequently asked questions available yet'}
                    </p>
                  </div>
                )}

                <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="text-primary-600" size={20} />
                    Still need help?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    If you couldn't find the answer to your question, feel free to create a support ticket or chat with our support team.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowTicketModal(true)}
                      className="btn-primary"
                    >
                      Create Ticket
                    </button>
                    <button
                      onClick={() => navigate('/chat')}
                      className="btn-secondary"
                    >
                      Start Live Chat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-primary-600" size={24} />
                    My Support Tickets
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Search size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="mx-auto mb-4 text-gray-400 animate-spin" size={48} />
                    <p className="font-semibold">Loading tickets...</p>
                  </div>
                ) : myTickets.length > 0 ? (
                  <div className="space-y-4">
                    {myTickets.map((ticket) => (
                      <div key={ticket.id} className="card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{ticket.subject}</h3>
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Question:</p>
                              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-3">{ticket.message}</p>
                              {ticket.resolution && (
                                <>
                                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Response:</p>
                                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                    {ticket.resolution}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                {ticket.status === 'open' ? 'Open' : 
                                 ticket.status === 'in_progress' ? 'In Progress' :
                                 ticket.status === 'resolved' ? 'Resolved' : 'Closed'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1) || 'Medium'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                {getCategoryDisplay(ticket.category)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>Created: {formatDate(ticket.createdAt)}</span>
                              {ticket.resolvedAt && (
                                <>
                                  <span>•</span>
                                  <span>Resolved: {formatDate(ticket.resolvedAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewTicket(ticket)}
                            className="btn-primary text-sm"
                          >
                            View Details
                          </button>
                          {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                            <button
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setShowReplyModal(true)
                              }}
                              className="btn-secondary text-sm"
                            >
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="font-semibold">No support tickets</p>
                    <p className="text-sm">Create a ticket if you need assistance</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Modal */}
        {showReplyModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reply to Ticket #{selectedTicket.id}</h2>
                  <button
                    onClick={() => {
                      setShowReplyModal(false)
                      setSelectedTicket(null)
                      setReplyMessage('')
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <div className="input-field bg-gray-50 dark:bg-gray-700">
                      {selectedTicket.subject}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Your Question
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTicket.message}
                    </div>
                  </div>

                  {selectedTicket.resolution && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Response
                      </label>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedTicket.resolution}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Your Reply *
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows="5"
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowReplyModal(false)
                      setSelectedTicket(null)
                      setReplyMessage('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyMessage.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} className="inline mr-2" />
                    {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        {showTicketModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Create Support Ticket</h2>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="input-field"
                    >
                      <option value="other">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="loan">Loan Related</option>
                      <option value="contribution">Contribution Issue</option>
                      <option value="account">Account Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Provide detailed information about your issue"
                      rows="5"
                      className="input-field"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Provide as much detail as possible to help us assist you better. Include any error messages, steps to reproduce, or relevant information.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTicket}
                    disabled={sending}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} className="inline mr-2" />
                    {sending ? 'Submitting...' : 'Submit Ticket'}
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

export default MemberSupport
