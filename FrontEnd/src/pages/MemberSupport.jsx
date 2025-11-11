import { useState } from 'react'
import { Headphones, Plus, Send, Clock, CheckCircle, XCircle, AlertCircle, FileText, MessageCircle, Search, Filter, User } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

function MemberSupport() {
  const navigate = useNavigate()
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [activeTab, setActiveTab] = useState('faq')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketCategory, setTicketCategory] = useState('general')

  const faqs = [
    {
      id: 'FAQ001',
      question: 'How do I make a contribution?',
      answer: 'To make a contribution, go to the My Savings page and click "Make Contribution". You can pay using MTN Mobile Money, Airtel Money, or Cash.',
      category: 'Contributions'
    },
    {
      id: 'FAQ002',
      question: 'How do I apply for a loan?',
      answer: 'Navigate to the My Loans page and click "Request New Loan". Fill in the loan application form with the required details and submit for review.',
      category: 'Loans'
    },
    {
      id: 'FAQ003',
      question: 'What happens if I miss a contribution?',
      answer: 'Missing a contribution will result in a fine of 500 RWF per day until the contribution is made. Check your Fines page for details.',
      category: 'Fines'
    },
    {
      id: 'FAQ004',
      question: 'How do I vote on group decisions?',
      answer: 'Go to the Group Voting page to see active proposals. Click "Vote For" or "Vote Against" to participate in group decisions.',
      category: 'Voting'
    },
    {
      id: 'FAQ005',
      question: 'How do I contact group leaders?',
      answer: 'You can message group leaders through the Group Chat feature or go to My Group page to see leader contact information.',
      category: 'Communication'
    }
  ]

  const myTickets = [
    {
      id: 'TKT001',
      subject: 'Unable to access my savings balance',
      category: 'Technical',
      status: 'open',
      createdDate: '2024-01-15',
      lastUpdate: '2024-01-15',
      priority: 'medium',
      responses: 1
    },
    {
      id: 'TKT002',
      subject: 'Question about loan repayment schedule',
      category: 'Loan',
      status: 'closed',
      createdDate: '2024-01-10',
      lastUpdate: '2024-01-12',
      priority: 'low',
      responses: 3,
      resolvedDate: '2024-01-12'
    }
  ]

  const handleCreateTicket = () => {
    if (!ticketSubject || !ticketDescription) {
      alert('Please fill in all required fields.')
      return
    }
    console.log('Creating support ticket:', { ticketSubject, ticketDescription, ticketCategory })
    alert('Support ticket created successfully!')
    setShowTicketModal(false)
    setTicketSubject('')
    setTicketDescription('')
    setTicketCategory('general')
  }

  const handleViewTicket = (ticketId) => {
    alert(`Viewing ticket details for ${ticketId}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700'
      case 'closed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
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
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Support Center</h1>
            <p className="text-gray-600 mt-1">Get help, submit feedback, or report issues</p>
          </div>
          <button
            onClick={() => setShowTicketModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Create Support Ticket
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/chat')}>
            <MessageCircle className="mx-auto text-blue-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600">Chat with support team</p>
          </div>
          <div className="card text-center cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/member/learn-grow')}>
            <FileText className="mx-auto text-green-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Learn & Grow</h3>
            <p className="text-sm text-gray-600">Educational resources</p>
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
                  <h2 className="text-xl font-bold text-gray-800">Frequently Asked Questions</h2>
                </div>

                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search FAQ..."
                    className="input-field flex-1"
                  />
                </div>

                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">{faq.question}</h3>
                          <p className="text-gray-600 mb-3">{faq.answer}</p>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {faq.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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

                {myTickets.length > 0 ? (
                  <div className="space-y-4">
                    {myTickets.map((ticket) => (
                      <div key={ticket.id} className="card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{ticket.subject}</h3>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {ticket.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Created: {ticket.createdDate}</span>
                              <span>•</span>
                              <span>Responses: {ticket.responses}</span>
                              {ticket.resolvedDate && (
                                <>
                                  <span>•</span>
                                  <span>Resolved: {ticket.resolvedDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewTicket(ticket.id)}
                            className="btn-primary text-sm"
                          >
                            View Details
                          </button>
                          {ticket.status === 'open' && (
                            <button className="btn-secondary text-sm">
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
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="loan">Loan Related</option>
                      <option value="contribution">Contribution Issue</option>
                      <option value="account">Account Issue</option>
                      <option value="feedback">Feedback</option>
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
                    className="btn-primary flex-1"
                  >
                    <Send size={18} className="inline mr-2" />
                    Submit Ticket
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
