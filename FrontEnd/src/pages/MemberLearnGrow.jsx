import { useState, useEffect } from 'react'
import { BookOpen, Play, FileText, Image, Volume2, Eye, Star, MessageCircle, TrendingUp, Clock, CheckCircle, Search } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function MemberLearnGrow() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedContent, setSelectedContent] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try { setLoading(true); const { data } = await api.get('/learn-grow'); if(mounted) setItems(data?.data || []) }
      finally { if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  }, [])

  const handleViewContent = (content) => setSelectedContent(content)

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <Play className="text-red-600" size={20} />
      case 'PDF': return <FileText className="text-blue-600" size={20} />
      case 'Image': return <Image className="text-green-600" size={20} />
      case 'Audio': return <Volume2 className="text-purple-600" size={20} />
      default: return <BookOpen className="text-gray-600" size={20} />
    }
  }

  const filteredContent = (items||[]).filter(content => {
    const matchesCategory = filterCategory === 'all' || content.category === filterCategory
    const matchesSearch = [content.title, content.description].filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Learn & Grow</h1>
          <p className="text-gray-600 mt-1">Access learning materials to improve your financial knowledge</p>
        </div>

        {/* Progress Overview (zeros by default) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Content Completed</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <CheckCircle className="text-green-600" size={28} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items?.length || 0)}</p>
              </div>
              <BookOpen className="text-blue-600" size={28} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours Spent</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <Clock className="text-purple-600" size={28} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Progress</p>
                <p className="text-2xl font-bold text-gray-800">0%</p>
              </div>
              <TrendingUp className="text-orange-600" size={28} />
            </div>
          </div>
        </div>

        {/* Filters */}
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
        </div>

        {/* Content List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center text-sm text-gray-500">Loading…</div>
          ) : filteredContent.length === 0 ? (
            <div className="col-span-full text-center text-sm text-gray-500">No content available yet.</div>
          ) : filteredContent.map(content => (
            <div key={content.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="shrink-0">{getTypeIcon(content.type)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{content.title}</h3>
                  <p className="text-sm text-gray-600">{content.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span>{content.category}</span>
                    <span className="flex items-center gap-1"><Eye size={14} /> {content.views || 0}</span>
                    <span className="flex items-center gap-1"><Star size={14} /> {content.rating || 0}</span>
                  </div>
                  <button onClick={()=>handleViewContent(content)} className="btn-secondary mt-3">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Details */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{selectedContent.title}</h2>
                <button onClick={()=>setSelectedContent(null)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>
              <p className="text-gray-700">{selectedContent.description}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MemberLearnGrow
