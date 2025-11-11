import { useState } from 'react'
import { MessageCircle, Send, FileText, AlertCircle, CheckCircle, Clock, User, Phone, Mail, Headphones, Database } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminAgent() {
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueType, setIssueType] = useState('technical')

  const agentInfo = {
    name: 'Mutabazi Paul',
    role: 'Assigned Agent',
    phone: '+250788567890',
    email: 'mutabazi.paul@umurengewallet.com',
    branch: 'Kigali Central Branch',
    assignedDate: '2023-01-15',
    status: 'active'
  }

  const messages = [
    {
      id: 1,
      sender: 'Agent',
      message: 'Hello! How can I assist you today?',
      timestamp: '2024-01-20 10:00 AM',
      read: true
    },
    {
      id: 2,
      sender: 'Group Admin',
      message: 'We need help registering a new group officer. Can you assist?',
      timestamp: '2024-01-20 10:15 AM',
      read: true
    },
    {
      id: 3,
      sender: 'Agent',
      message: 'Of course! Please provide the details and I\'ll help you set it up.',
      timestamp: '2024-01-20 10:16 AM',
      read: true
    },
    {
      id: 4,
      sender: 'Group Admin',
      message: 'Thank you. Also, one member is having trouble accessing their account. Can we restore it?',
      timestamp: '2024-01-20 11:30 AM',
      read: false
    }
  ]

  const reportedIssues = [
    {
      id: 1,
      type: 'technical',
      title: 'Member Account Access Issue',
      description: 'Member M003 unable to log in. Shows "account locked" error.',
      status: 'open',
      priority: 'high',
      reportedDate: '2024-01-20',
      resolvedDate: null,
      agentResponse: null
    },
    {
      id: 2,
      type: 'financial',
      title: 'Loan Disbursement Delay',
      description: 'Approved loan for member M001 not reflecting in their account after 3 days.',
      status: 'resolved',
      priority: 'medium',
      reportedDate: '2024-01-18',
      resolvedDate: '2024-01-19',
      agentResponse: 'Issue resolved. Loan disbursed successfully. Transaction ID: TXN123456'
    },
    {
      id: 3,
      type: 'technical',
      title: 'Group Settings Not Saving',
      description: 'When updating contribution settings, changes are not being saved properly.',
      status: 'in-progress',
      priority: 'medium',
      reportedDate: '2024-01-19',
      resolvedDate: null,
      agentResponse: 'Investigating the issue. Will update you soon.'
    },
    {
      id: 4,
      type: 'financial',
      title: 'Payment Gateway Error',
      description: 'Members reporting error when trying to make MTN Mobile Money payments.',
      status: 'resolved',
      priority: 'high',
      reportedDate: '2024-01-17',
      resolvedDate: '2024-01-17',
      agentResponse: 'Payment gateway issue resolved. All systems operational.'
    }
  ]

  const feedbackReports = [
    {
      id: 1,
      category: 'Performance Review',
      period: 'Q4 2023',
      submittedDate: '2024-01-10',
      summary: 'Group achieved 95% of savings target. Strong member participation.',
      status: 'submitted'
    },
    {
      id: 2,
      category: 'Training Request',
      title: 'Need training on new features',
      submittedDate: '2024-01-15',
      summary: 'Request for training session on loan management features.',
      status: 'pending'
    }
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      alert('Message sent to agent!')
      setMessage('')
    }
  }

  const handleSubmitIssue = () => {
    alert('Issue reported successfully! The agent will respond soon.')
    setShowIssueForm(false)
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
          <h1 className="text-3xl font-bold text-gray-800">Collaboration with Agent</h1>
          <p className="text-gray-600 mt-1">Communicate with your assigned agent and report issues</p>
        </div>

        {/* Agent Info Card */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {agentInfo.name[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">{agentInfo.name}</h2>
              <p className="text-gray-600">{agentInfo.role}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Phone size={16} /> {agentInfo.phone}
                </div>
                <div className="flex items-center gap-1">
                  <Mail size={16} /> {agentInfo.email}
                </div>
                <div className="flex items-center gap-1">
                  <Database size={16} /> {agentInfo.branch}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              agentInfo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {agentInfo.status}
            </span>
          </div>
        </div>

        {/* Tabs */}
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
                {messages.map((msg) => (
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
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="input-field flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage()
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send size={18} /> Send
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

              <div className="space-y-3">
                {reportedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-800">{issue.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                            {issue.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                        <p className="text-xs text-gray-500">Reported: {issue.reportedDate}</p>
                        {issue.resolvedDate && (
                          <p className="text-xs text-green-600">Resolved: {issue.resolvedDate}</p>
                        )}
                      </div>
                    </div>

                    {issue.agentResponse && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="text-sm font-semibold text-blue-800 mb-1">Agent Response:</p>
                        <p className="text-sm text-blue-700">{issue.agentResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Feedback & Reports</h3>
                <button
                  onClick={() => alert('Opening feedback form...')}
                  className="btn-primary flex items-center gap-2"
                >
                  <FileText size={18} /> Submit Feedback
                </button>
              </div>

              <div className="space-y-3">
                {feedbackReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{report.category}</h4>
                        <p className="text-sm text-gray-600 mt-1">{report.summary}</p>
                        <p className="text-xs text-gray-500 mt-2">Submitted: {report.submittedDate}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">Periodic Reviews</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Submit quarterly performance reviews and participate in periodic training sessions with your agent.
                </p>
                <button className="btn-primary text-sm">
                  Schedule Review Meeting
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Headphones className="text-purple-600" size={24} />
            Quick Support Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow text-left">
              <User className="text-blue-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800 mb-1">Register New Officer</h3>
              <p className="text-sm text-gray-600">Request help registering Secretary or Cashier</p>
            </button>
            <button className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow text-left">
              <AlertCircle className="text-red-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800 mb-1">Restore Account</h3>
              <p className="text-sm text-gray-600">Request account restoration for members</p>
            </button>
            <button className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow text-left">
              <FileText className="text-green-600 mb-2" size={24} />
              <h3 className="font-semibold text-gray-800 mb-1">Performance Review</h3>
              <p className="text-sm text-gray-600">Submit quarterly group performance feedback</p>
            </button>
          </div>
        </div>

        {/* Issue Report Modal */}
        {showIssueForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
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
                    <option value="behavioral">Behavioral Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Brief description of the issue"
                    id="issueTitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Provide details about the issue..."
                    id="issueDescription"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowIssueForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitIssue}
                    className="btn-primary flex-1"
                  >
                    Submit Issue
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

