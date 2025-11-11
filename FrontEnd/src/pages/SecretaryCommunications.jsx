import { useState } from 'react'
import { MessageCircle, Plus, Edit, Trash2, Send, Bell, Eye, Users, Calendar, FileText, XCircle } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryCommunications() {
  const [activeTab, setActiveTab] = useState('announcements')
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [showCreateNotice, setShowCreateNotice] = useState(false)

  const announcements = [
    {
      id: 'A001',
      title: 'Monthly Contribution Deadline Reminder',
      content: 'This is a reminder that monthly contributions are due by the 25th of each month. Please ensure your payments are made on time to avoid penalties.',
      date: '2024-01-20',
      status: 'published',
      recipients: 'All Members',
      priority: 'high'
    },
    {
      id: 'A002',
      title: 'Group Meeting Schedule Update',
      content: 'The monthly group meeting has been rescheduled to February 22nd at 10:00 AM. Please mark your calendars accordingly.',
      date: '2024-01-18',
      status: 'published',
      recipients: 'All Members',
      priority: 'medium'
    },
    {
      id: 'A003',
      title: 'New Member Welcome',
      content: 'Please welcome our new member Ikirezi Jane to the group. She will be joining us starting this month.',
      date: '2024-01-15',
      status: 'draft',
      recipients: 'All Members',
      priority: 'low'
    }
  ]

  const notices = [
    {
      id: 'N001',
      title: 'Contribution Rules Update',
      content: 'Effective immediately, the minimum contribution amount has been increased to RWF 5,000 per month.',
      date: '2024-01-20',
      status: 'active',
      category: 'Policy Change'
    },
    {
      id: 'N002',
      title: 'Meeting Attendance Policy',
      content: 'Members who miss more than 3 consecutive meetings will be subject to review and possible suspension.',
      date: '2024-01-18',
      status: 'active',
      category: 'Policy Change'
    },
    {
      id: 'N003',
      title: 'Loan Application Process',
      content: 'All loan applications must be submitted at least 7 days before the monthly meeting for consideration.',
      date: '2024-01-15',
      status: 'active',
      category: 'Procedure'
    }
  ]

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    recipients: 'All Members',
    priority: 'medium'
  })

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'General'
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'active': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateAnnouncement = () => {
    console.log('Creating announcement:', newAnnouncement)
    alert('Announcement created successfully!')
    setShowCreateAnnouncement(false)
    setNewAnnouncement({
      title: '',
      content: '',
      recipients: 'All Members',
      priority: 'medium'
    })
  }

  const handleCreateNotice = () => {
    console.log('Creating notice:', newNotice)
    alert('Notice created successfully!')
    setShowCreateNotice(false)
    setNewNotice({
      title: '',
      content: '',
      category: 'General'
    })
  }

  const handleSendAnnouncement = (announcementId) => {
    console.log('Sending announcement:', announcementId)
    alert('Announcement sent successfully!')
  }

  const handleEditAnnouncement = (announcementId) => {
    console.log('Editing announcement:', announcementId)
    alert('Edit announcement dialog would open here')
  }

  const handleDeleteAnnouncement = (announcementId) => {
    console.log('Deleting announcement:', announcementId)
    alert('Announcement deleted successfully!')
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Communication & Announcements</h1>
            <p className="text-gray-600 mt-1">Manage group communications and official notices</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateAnnouncement(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> New Announcement
            </button>
            <button
              onClick={() => setShowCreateNotice(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={18} /> New Notice
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Announcements</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.length}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {announcements.filter(a => a.status === 'published').length}
                </p>
              </div>
              <Send className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {announcements.filter(a => a.status === 'draft').length}
                </p>
              </div>
              <Edit className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Notices</p>
                <p className="text-2xl font-bold text-purple-600">
                  {notices.filter(n => n.status === 'active').length}
                </p>
              </div>
              <Bell className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['announcements', 'notices', 'templates', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
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
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Announcements</h2>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{announcement.title}</h3>
                          <p className="text-sm text-gray-600">{announcement.content}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {announcement.date} • Recipients: {announcement.recipients}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status)}`}>
                            {announcement.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSendAnnouncement(announcement.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Send size={16} /> Send
                        </button>
                        <button
                          onClick={() => handleEditAnnouncement(announcement.id)}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notice Board</h2>
                <div className="space-y-4">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-4 bg-blue-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{notice.title}</h3>
                          <p className="text-sm text-gray-600">{notice.content}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {notice.date} • Category: {notice.category}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>
                          {notice.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                          <Eye size={16} /> View
                        </button>
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Edit size={16} /> Edit
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Message Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Meeting Reminder</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear Members, this is a reminder that our monthly group meeting is scheduled for [Date] at [Time] at [Location]. Please ensure your attendance."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Contribution Deadline</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear Members, please note that monthly contributions are due by [Date]. Late payments will incur penalties as per group rules."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Policy Update</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Dear Members, please be informed of the following policy update: [Policy Details]. This takes effect immediately."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Welcome Message</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      "Welcome to our group! We're excited to have you join us. Please review the group rules and contribution schedule."
                    </p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Communication History</h2>
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="mx-auto mb-2" size={48} />
                  <p>Communication history will be displayed here</p>
                  <p className="text-sm">Track all sent messages and announcements</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Announcement Modal */}
        {showCreateAnnouncement && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Create Announcement</h2>
                <button
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter announcement title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipients
                  </label>
                  <select
                    value={newAnnouncement.recipients}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, recipients: e.target.value })}
                    className="input-field"
                  >
                    <option value="All Members">All Members</option>
                    <option value="Active Members Only">Active Members Only</option>
                    <option value="Group Leaders">Group Leaders</option>
                    <option value="Specific Members">Specific Members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter announcement content..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateAnnouncement(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAnnouncement}
                    className="btn-primary flex-1"
                  >
                    Create Announcement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Notice Modal */}
        {showCreateNotice && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Create Notice</h2>
                <button
                  onClick={() => setShowCreateNotice(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter notice title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newNotice.category}
                    onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="General">General</option>
                    <option value="Policy Change">Policy Change</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Important">Important</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter notice content..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateNotice(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotice}
                    className="btn-primary flex-1"
                  >
                    Create Notice
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

export default SecretaryCommunications
