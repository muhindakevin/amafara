import { useState, useEffect } from 'react'
import { MessageCircle, Send, Users, Globe, Bell, FileText, Plus, Eye, XCircle, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminCommunications() {
  const [activeTab, setActiveTab] = useState('broadcast')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'General',
    priority: 'Medium',
    target: 'All',
  })

  useEffect(() => {
    let mounted = true
    ;(async ()=>{
      try { setLoading(true); const { data } = await api.get('/announcements'); if (mounted) setAnnouncements(data?.data || []) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  const handleComposeAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('Please fill in all required fields.')
      return
    }
    try {
      await api.post('/announcements', { 
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        priority: newAnnouncement.priority,
        target: newAnnouncement.target
      })
      const { data } = await api.get('/announcements')
      setAnnouncements(data?.data || [])
    setShowComposeModal(false)
      setNewAnnouncement({ title: '', content: '', type: 'General', priority: 'Medium', target: 'All' })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create announcement')
    }
  }

  const handleViewAnnouncementDetails = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowAnnouncementDetails(true)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'Low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-700'
      case 'Draft': return 'bg-gray-100 text-gray-700'
      case 'Scheduled': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'System': return 'bg-red-100 text-red-700'
      case 'Product': return 'bg-blue-100 text-blue-700'
      case 'Training': return 'bg-purple-100 text-purple-700'
      case 'General': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Communication & Announcements</h1>
        <p className="text-gray-600">Broadcast messages and send targeted notifications to users</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Announcements</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.length}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Published</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.filter(a => a.status === 'Published').length}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Views</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.reduce((sum, a) => sum + (a.views||0), 0)}</p>
              </div>
              <Eye className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-800">{announcements.reduce((sum, a) => sum + (a.recipients||0), 0)}</p>
              </div>
              <Users className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['broadcast', 'targeted', 'history'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 rounded-lg font-medium transition-all ${ activeTab === tab ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100' }`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'broadcast' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">System-Wide Announcements</h2>
                  <button onClick={() => setShowComposeModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Create Announcement
                  </button>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center text-sm text-gray-500">Loading…</div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center text-sm text-gray-500">No announcements yet.</div>
                  ) : announcements.map(announcement => (
                    <div key={announcement.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(announcement.type)}`}>{announcement.type}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>{announcement.priority}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(announcement.status || 'Published')}`}>{announcement.status || 'Published'}</span>
                          </div>
                          <p className="text-gray-600 mb-3">{announcement.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Target: {announcement.target || 'All'}</span>
                            <span>Views: {announcement.views || 0}</span>
                            <span>Recipients: {announcement.recipients || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create Announcement</h2>
                <button onClick={() => setShowComposeModal(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter announcement details and choose target audience.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input className="input-field" value={newAnnouncement.title} onChange={(e)=>setNewAnnouncement({...newAnnouncement,title:e.target.value})} placeholder="System Maintenance Notice" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                  <textarea className="input-field" rows={4} value={newAnnouncement.content} onChange={(e)=>setNewAnnouncement({...newAnnouncement,content:e.target.value})} placeholder="Write your message..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select className="input-field" value={newAnnouncement.type} onChange={(e)=>setNewAnnouncement({...newAnnouncement,type:e.target.value})}>
                      <option>General</option>
                      <option>System</option>
                      <option>Product</option>
                      <option>Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select className="input-field" value={newAnnouncement.priority} onChange={(e)=>setNewAnnouncement({...newAnnouncement,priority:e.target.value})}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                    <select className="input-field" value={newAnnouncement.target} onChange={(e)=>setNewAnnouncement({...newAnnouncement,target:e.target.value})}>
                      <option value="All">All</option>
                      <option value="Agents">Agents</option>
                      <option value="Group Admins">Group Admins</option>
                      <option value="Secretaries">Secretaries</option>
                      <option value="Cashiers">Cashiers</option>
                      <option value="Members">Members</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowComposeModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleComposeAnnouncement} className="btn-primary flex-1">Create Announcement</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminCommunications

