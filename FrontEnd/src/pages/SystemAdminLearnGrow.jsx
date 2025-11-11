import { useState, useEffect } from 'react'
import { BookOpen, Plus, Edit, Eye, Search, XCircle, AlertCircle, Upload, Users, BarChart3, FileText, Video, Image, Volume2 } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminLearnGrow() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAccess, setFilterAccess] = useState('all')
  const [showAddContent, setShowAddContent] = useState(false)
  const [showContentDetails, setShowContentDetails] = useState(false)
  const [selectedContent, setSelectedContent] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [newContent, setNewContent] = useState({
    title: '',
    category: 'Financial Education',
    type: 'Video',
    access: 'Public',
    description: ''
  })

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try { setLoading(true); const { data } = await api.get('/learn-grow'); if(mounted) setItems(data?.data || []) }
      finally { if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  }, [])

  const filteredContent = (items||[]).filter(content => {
    const matchesCategory = filterCategory === 'all' || content.category === filterCategory
    const matchesAccess = filterAccess === 'all' || (content.access||'Public') === filterAccess
    const matchesSearch = [content.title, content.description, content.author, content.category]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesAccess && matchesSearch
  })

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.description) {
      alert('Please fill in all required fields.')
      return
    }
    try {
      await api.post('/learn-grow', newContent)
      const { data } = await api.get('/learn-grow')
      setItems(data?.data || [])
      setShowAddContent(false)
      setNewContent({ title: '', category: 'Financial Education', type: 'Video', access: 'Public', description: '' })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to upload content')
    }
  }

  const handleViewContentDetails = (content) => {
    setSelectedContent(content)
    setShowContentDetails(true)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <Video className="text-red-600" size={20} />
      case 'PDF': return <FileText className="text-blue-600" size={20} />
      case 'Image': return <Image className="text-green-600" size={20} />
      case 'Audio': return <Volume2 className="text-purple-600" size={20} />
      default: return <FileText className="text-gray-600" size={20} />
    }
  }

  const getAccessColor = (access) => {
    switch (access) {
      case 'Public': return 'bg-green-100 text-green-700'
      case 'Agent-only': return 'bg-blue-100 text-blue-700'
      case 'Client-only': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Draft': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Learn & Grow Content Management</h1>
        <p className="text-gray-600">Educate and empower users on digital finance, savings, and responsible borrowing</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Content</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items?.length || 0)}</p>
              </div>
              <BookOpen className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Views</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items||[]).reduce((sum, i) => sum + (i.views||0), 0)}</p>
              </div>
              <Eye className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Review</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items||[]).filter(i => i.status === 'Pending').length}</p>
              </div>
              <AlertCircle className="text-orange-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Published</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items||[]).filter(i => i.status === 'Published').length}</p>
              </div>
              <BarChart3 className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search content..." className="input-field pl-10" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option>Financial Education</option>
              <option>Agent Training</option>
              <option>Savings Tips</option>
              <option>Loan Management</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterAccess} onChange={(e)=>setFilterAccess(e.target.value)}>
              <option value="all">All Access</option>
              <option>Public</option>
              <option>Agent-only</option>
              <option>Client-only</option>
            </select>
          </div>
          <button onClick={()=>setShowAddContent(true)} className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> Upload Content
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-sm text-gray-500">Loading…</div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center text-sm text-gray-500">No content yet.</div>
          ) : filteredContent.map(content => (
            <div key={content.id} className="card">
              <div className="flex items-start gap-4">
                <div className="shrink-0">{getTypeIcon(content.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-800">{content.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getAccessColor(content.access||'Public')}`}>{content.access||'Public'}</span>
                    {content.status && <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(content.status)}`}>{content.status}</span>}
                  </div>
                  <p className="text-gray-600">{content.description}</p>
                </div>
                <button onClick={()=>handleViewContentDetails(content)} className="btn-secondary">View</button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Content Modal */}
        {showAddContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Upload New Content</h2>
                <button onClick={() => setShowAddContent(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input className="input-field" value={newContent.title} onChange={(e)=>setNewContent({...newContent,title:e.target.value})} placeholder="Financial Literacy Basics" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select className="input-field" value={newContent.category} onChange={(e)=>setNewContent({...newContent,category:e.target.value})}>
                    <option>Financial Education</option>
                    <option>Agent Training</option>
                    <option>Savings Tips</option>
                    <option>Loan Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select className="input-field" value={newContent.type} onChange={(e)=>setNewContent({...newContent,type:e.target.value})}>
                    <option>Video</option>
                    <option>PDF</option>
                    <option>Image</option>
                    <option>Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Access</label>
                  <select className="input-field" value={newContent.access} onChange={(e)=>setNewContent({...newContent,access:e.target.value})}>
                    <option>Public</option>
                    <option>Agent-only</option>
                    <option>Client-only</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea className="input-field" rows={4} value={newContent.description} onChange={(e)=>setNewContent({...newContent,description:e.target.value})} placeholder="Write a short description..." />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddContent(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddContent} className="btn-primary flex-1">Upload</button>
              </div>
            </div>
          </div>
        )}

        {/* Content Details Modal */}
        {showContentDetails && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Content Details</h2>
                <button onClick={() => setShowContentDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">Title:</span> {selectedContent.title}</p>
                <p className="text-gray-700"><span className="font-semibold">Category:</span> {selectedContent.category}</p>
                <p className="text-gray-700"><span className="font-semibold">Type:</span> {selectedContent.type}</p>
                <p className="text-gray-700"><span className="font-semibold">Access:</span> {selectedContent.access||'Public'}</p>
                <p className="text-gray-700"><span className="font-semibold">Description:</span> {selectedContent.description}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowContentDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminLearnGrow
