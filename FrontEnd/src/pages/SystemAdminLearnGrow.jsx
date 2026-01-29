import { useState, useEffect } from 'react'
import { BookOpen, Plus, Edit, Eye, Search, XCircle, AlertCircle, Upload, Users, BarChart3, FileText, Video, Image, Volume2, Download, ExternalLink, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminLearnGrow() {
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAccess, setFilterAccess] = useState('all')
  const [showAddContent, setShowAddContent] = useState(false)
  const [showEditContent, setShowEditContent] = useState(false)
  const [showContentDetails, setShowContentDetails] = useState(false)
  const [selectedContent, setSelectedContent] = useState(null)
  const [editingContent, setEditingContent] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [documentLoadError, setDocumentLoadError] = useState(false)

  const [newContent, setNewContent] = useState({
    title: '',
    category: 'Financial Education',
    type: 'video',
    targetAudience: 'members',
    description: '',
    content: '',
    fileUrl: '',
    linkUrl: '',
    uploadType: 'link', // 'file' or 'link'
    thumbnailUrl: '',
    duration: '',
    file: null
  })
  const [uploading, setUploading] = useState(false)

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

  const handleFileUpload = async (file) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await api.post('/upload/learn-grow', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (data?.success) {
        setNewContent(prev => ({ ...prev, fileUrl: data.data.fileUrl }))
        return data.data.fileUrl
      }
      return null
    } catch (error) {
      console.error('[handleFileUpload] Error:', error)
      alert('Failed to upload file: ' + (error?.response?.data?.message || error?.message))
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.type) {
      alert(tSystemAdmin('fillAllRequiredFields', { defaultValue: 'Please fill in all required fields.' }))
      return
    }
    
    // Validate that either fileUrl or linkUrl is provided
    if (newContent.uploadType === 'file' && !newContent.fileUrl && !newContent.file) {
      alert('Please upload a file or provide a link')
      return
    }
    
    if (newContent.uploadType === 'link' && !newContent.linkUrl && !newContent.fileUrl) {
      alert('Please provide a link or upload a file')
      return
    }
    
    try {
      setUploading(true)
      
      // If file is selected, upload it first
      let finalFileUrl = newContent.fileUrl
      if (newContent.file && newContent.uploadType === 'file') {
        finalFileUrl = await handleFileUpload(newContent.file)
        if (!finalFileUrl) {
          setUploading(false)
          return
        }
      } else if (newContent.uploadType === 'link' && newContent.linkUrl) {
        finalFileUrl = newContent.linkUrl
      }
      
      // Map frontend type to backend type
      const typeMap = {
        'video': 'video',
        'pdf': 'pdf',
        'infographic': 'infographic',
        'article': 'article',
        'quiz': 'quiz'
      }
      const backendType = typeMap[newContent.type] || newContent.type.toLowerCase()
      
      const payload = {
        title: newContent.title,
        description: newContent.description,
        content: newContent.content,
        type: backendType,
        category: newContent.category,
        targetAudience: newContent.targetAudience,
        fileUrl: finalFileUrl,
        thumbnailUrl: newContent.thumbnailUrl,
        duration: newContent.duration ? parseInt(newContent.duration) : null
      }
      
      const response = await api.post('/learn-grow', payload)
      if (response.data?.success) {
        // Refresh the content list
        const { data } = await api.get('/learn-grow')
        setItems(data?.data || [])
        
        // Reset form and close modal
        setShowAddContent(false)
        setNewContent({ 
          title: '', 
          category: 'Financial Education', 
          type: 'video', 
          targetAudience: 'members',
          description: '',
          content: '',
          fileUrl: '',
          linkUrl: '',
          uploadType: 'link',
          thumbnailUrl: '',
          duration: '',
          file: null
        })
        
        // Show success message
        alert('Content uploaded successfully! Notifications have been sent to the selected audience.')
      } else {
        throw new Error(response.data?.message || 'Failed to upload content')
      }
    } catch (e) {
      console.error('[handleAddContent] Error:', e)
      alert(e?.response?.data?.message || tSystemAdmin('failedToUploadContent', { defaultValue: 'Failed to upload content' }))
    } finally {
      setUploading(false)
    }
  }

  const handleViewContentDetails = async (content) => {
    setSelectedContent(content)
    setShowContentDetails(true)
    setDocumentLoadError(false)
    // Track view (increment view count)
    try {
      await api.get(`/learn-grow/${content.id}`).catch(() => {})
    } catch (e) {
      console.error('Failed to track view:', e)
    }
    
    // Set a timeout to check if document loaded (for local files that might not work with online viewers)
    if (isDocumentType(content.fileUrl, content.type)) {
      setTimeout(() => {
        // If still showing loading or error after 5 seconds, show fallback
        const iframe = document.querySelector(`iframe[title="${content.title}"]`)
        if (iframe && !iframe.contentDocument) {
          setDocumentLoadError(true)
        }
      }, 5000)
    }
  }

  const isYouTubeLink = (url) => {
    if (!url) return false
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ''
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return ''
    // If it's already a full URL (http/https), return as is
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl
    }
    // Otherwise, construct the full URL from the backend
    const baseURL = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:4000'
    return `${baseURL}${fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl}`
  }

  const isDocumentType = (fileUrl, type) => {
    if (!fileUrl) return false
    const url = fileUrl.toLowerCase()
    const typeLower = type?.toLowerCase() || ''
    
    // Check by file extension
    const docExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.txt', '.rtf']
    const hasDocExtension = docExtensions.some(ext => url.includes(ext))
    
    // Check by type
    const docTypes = ['pdf', 'article', 'document']
    const isDocType = docTypes.includes(typeLower)
    
    return hasDocExtension || isDocType
  }

  const getDocumentViewerUrl = (fileUrl) => {
    if (!fileUrl) return ''
    const fullUrl = getFileUrl(fileUrl)
    const urlLower = fileUrl.toLowerCase()
    
    // For PDFs, use direct URL with #view=FitH parameter for better display
    if (urlLower.endsWith('.pdf')) {
      return `${fullUrl}#view=FitH`
    }
    
    // For Word documents
    if (urlLower.endsWith('.doc') || urlLower.endsWith('.docx')) {
      // Try Microsoft Office Online Viewer first
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`
    }
    
    // For Excel files
    if (urlLower.endsWith('.xls') || urlLower.endsWith('.xlsx')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`
    }
    
    // For PowerPoint files
    if (urlLower.endsWith('.ppt') || urlLower.endsWith('.pptx')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`
    }
    
    // For text files and RTF, use Google Docs Viewer
    if (urlLower.endsWith('.txt') || urlLower.endsWith('.rtf')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
    }
    
    // Fallback to direct URL
    return fullUrl
  }

  const handleEditContent = (content) => {
    setEditingContent(content)
    setNewContent({
      title: content.title || '',
      category: content.category || 'Financial Education',
      type: content.type || 'video',
      targetAudience: content.targetAudience || 'members',
      description: content.description || '',
      content: content.content || '',
      fileUrl: content.fileUrl || '',
      linkUrl: content.fileUrl || '',
      uploadType: content.fileUrl && content.fileUrl.startsWith('http') ? 'link' : 'file',
      thumbnailUrl: content.thumbnailUrl || '',
      duration: content.duration || '',
      file: null
    })
    setShowEditContent(true)
  }

  const handleUpdateContent = async () => {
    if (!editingContent || !newContent.title || !newContent.type) {
      alert(tSystemAdmin('fillAllRequiredFields', { defaultValue: 'Please fill in all required fields.' }))
      return
    }
    
    try {
      setUploading(true)
      
      // If file is selected, upload it first
      let finalFileUrl = newContent.fileUrl
      if (newContent.file && newContent.uploadType === 'file') {
        finalFileUrl = await handleFileUpload(newContent.file)
        if (!finalFileUrl) {
          setUploading(false)
          return
        }
      } else if (newContent.uploadType === 'link' && newContent.linkUrl) {
        finalFileUrl = newContent.linkUrl
      }
      
      // Map frontend type to backend type
      const typeMap = {
        'video': 'video',
        'pdf': 'pdf',
        'infographic': 'infographic',
        'article': 'article',
        'quiz': 'quiz'
      }
      const backendType = typeMap[newContent.type] || newContent.type.toLowerCase()
      
      const payload = {
        title: newContent.title,
        description: newContent.description,
        content: newContent.content,
        type: backendType,
        category: newContent.category,
        targetAudience: newContent.targetAudience,
        fileUrl: finalFileUrl,
        thumbnailUrl: newContent.thumbnailUrl,
        duration: newContent.duration ? parseInt(newContent.duration) : null,
        status: editingContent.status || 'published'
      }
      
      const response = await api.put(`/learn-grow/${editingContent.id}`, payload)
      if (response.data?.success) {
        // Refresh the content list
        const { data } = await api.get('/learn-grow')
        setItems(data?.data || [])
        
        // Reset form and close modal
        setShowEditContent(false)
        setEditingContent(null)
        setNewContent({ 
          title: '', 
          category: 'Financial Education', 
          type: 'video', 
          targetAudience: 'members',
          description: '',
          content: '',
          fileUrl: '',
          linkUrl: '',
          uploadType: 'link',
          thumbnailUrl: '',
          duration: '',
          file: null
        })
        
        // Show success message
        alert('Content updated successfully!')
      } else {
        throw new Error(response.data?.message || 'Failed to update content')
      }
    } catch (e) {
      console.error('[handleUpdateContent] Error:', e)
      alert(e?.response?.data?.message || tSystemAdmin('failedToUpdateContent', { defaultValue: 'Failed to update content' }))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteContent = async (content) => {
    if (!window.confirm(`Are you sure you want to delete "${content.title}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await api.delete(`/learn-grow/${content.id}`)
      const { data } = await api.get('/learn-grow')
      setItems(data?.data || [])
      alert('Content deleted successfully!')
    } catch (e) {
      console.error('[handleDeleteContent] Error:', e)
      alert(e?.response?.data?.message || 'Failed to delete content')
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('learnGrowContentManagement', { defaultValue: 'Learn & Grow Content Management' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('educateAndEmpowerUsers', { defaultValue: 'Educate and empower users on digital finance, savings, and responsible borrowing' })}</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalContent', { defaultValue: 'Total Content' })}</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items?.length || 0)}</p>
              </div>
              <BookOpen className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalViews', { defaultValue: 'Total Views' })}</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items||[]).reduce((sum, i) => sum + (i.views||0), 0)}</p>
              </div>
              <Eye className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('pendingReview', { defaultValue: 'Pending Review' })}</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (items||[]).filter(i => i.status === 'Pending').length}</p>
              </div>
              <AlertCircle className="text-orange-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('published', { defaultValue: 'Published' })}</p>
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
            <input type="text" placeholder={tSystemAdmin('searchContent', { defaultValue: 'Search content...' })} className="input-field pl-10" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
              <option value="all">{tSystemAdmin('allCategories', { defaultValue: 'All Categories' })}</option>
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
                <div className="flex items-center gap-2">
                  <button onClick={()=>handleViewContentDetails(content)} className="btn-secondary">View</button>
                  <button onClick={()=>handleEditContent(content)} className="btn-secondary flex items-center gap-1">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={()=>handleDeleteContent(content)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 transition-colors">
                    <XCircle size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Content Modal */}
        {showAddContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Upload New Content</h2>
                <button 
                  onClick={() => {
                    if (!uploading) {
                      setShowAddContent(false)
                      setNewContent({ 
                        title: '', 
                        category: 'Financial Education', 
                        type: 'video', 
                        targetAudience: 'members',
                        description: '',
                        content: '',
                        fileUrl: '',
                        linkUrl: '',
                        uploadType: 'link',
                        thumbnailUrl: '',
                        duration: '',
                        file: null
                      })
                    }
                  }} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={uploading}
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                    <input 
                      className="input-field text-sm py-2" 
                      value={newContent.title} 
                      onChange={(e)=>setNewContent({...newContent,title:e.target.value})} 
                      placeholder="Financial Literacy Basics" 
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={newContent.category} 
                      onChange={(e)=>setNewContent({...newContent,category:e.target.value})}
                      disabled={uploading}
                    >
                      <option>Financial Education</option>
                      <option>Agent Training</option>
                      <option>Savings Tips</option>
                      <option>Loan Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Type <span className="text-red-500">*</span></label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={newContent.type} 
                      onChange={(e)=>setNewContent({...newContent,type:e.target.value})}
                      disabled={uploading}
                    >
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="article">Article</option>
                      <option value="quiz">Quiz</option>
                      <option value="infographic">Infographic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience <span className="text-red-500">*</span></label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={newContent.targetAudience} 
                      onChange={(e)=>setNewContent({...newContent,targetAudience:e.target.value})}
                      disabled={uploading}
                    >
                      <option value="members">Members Only</option>
                      <option value="secretary">Secretary Only</option>
                      <option value="agent">Agents Only</option>
                      <option value="both">Both (Members & Secretary)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Content Source <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="uploadType" 
                        value="link" 
                        checked={newContent.uploadType === 'link'}
                        onChange={(e)=>setNewContent({...newContent,uploadType:e.target.value, file: null})}
                        disabled={uploading}
                      />
                      <span>Share Link</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="uploadType" 
                        value="file" 
                        checked={newContent.uploadType === 'file'}
                        onChange={(e)=>setNewContent({...newContent,uploadType:e.target.value, linkUrl: ''})}
                        disabled={uploading}
                      />
                      <span>Upload File</span>
                    </label>
                  </div>
                  {newContent.uploadType === 'link' ? (
                    <input 
                      className="input-field text-sm py-2" 
                      value={newContent.linkUrl || newContent.fileUrl} 
                      onChange={(e)=>setNewContent({...newContent,linkUrl:e.target.value, fileUrl: e.target.value})} 
                      placeholder="https://youtube.com/watch?v=... or https://..." 
                      disabled={uploading}
                    />
                  ) : (
                    <div className="space-y-1">
                      <input 
                        type="file" 
                        className="input-field text-sm py-1.5" 
                        accept="video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                        onChange={(e)=>setNewContent({...newContent,file:e.target.files[0], fileUrl: ''})}
                        disabled={uploading}
                      />
                      {newContent.file && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Selected: {newContent.file.name} ({(newContent.file.size / 1024 / 1024).toFixed(2)} MB)</p>
                      )}
                      {newContent.fileUrl && (
                        <p className="text-xs text-green-600 dark:text-green-400">Uploaded: {newContent.fileUrl}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
                    <input 
                      type="number" 
                      className="input-field text-sm py-2" 
                      value={newContent.duration} 
                      onChange={(e)=>setNewContent({...newContent,duration:e.target.value})} 
                      placeholder="Optional" 
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Thumbnail URL</label>
                    <input 
                      className="input-field text-sm py-2" 
                      value={newContent.thumbnailUrl} 
                      onChange={(e)=>setNewContent({...newContent,thumbnailUrl:e.target.value})} 
                      placeholder="Optional thumbnail image URL" 
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea 
                    className="input-field text-sm py-2" 
                    rows={2} 
                    value={newContent.description} 
                    onChange={(e)=>setNewContent({...newContent,description:e.target.value})} 
                    placeholder="Write a short description..." 
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Content (Full Text/HTML) - Optional</label>
                  <textarea 
                    className="input-field text-sm py-2" 
                    rows={3} 
                    value={newContent.content} 
                    onChange={(e)=>setNewContent({...newContent,content:e.target.value})} 
                    placeholder="Full content text or HTML (optional)..." 
                    disabled={uploading}
                  />
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button 
                  onClick={() => {
                    if (!uploading) {
                      setShowAddContent(false)
                      setNewContent({ 
                        title: '', 
                        category: 'Financial Education', 
                        type: 'video', 
                        targetAudience: 'members',
                        description: '',
                        content: '',
                        fileUrl: '',
                        linkUrl: '',
                        uploadType: 'link',
                        thumbnailUrl: '',
                        duration: '',
                        file: null
                      })
                    }
                  }} 
                  className="btn-secondary flex-1 text-sm py-2" 
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddContent} 
                  className="btn-primary flex-1 text-sm py-2" 
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Uploading...
                    </span>
                  ) : (
                    'Upload & Notify'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Content Modal */}
        {showEditContent && editingContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Content</h2>
                <button 
                  onClick={() => {
                    if (!uploading) {
                      setShowEditContent(false)
                      setEditingContent(null)
                      setNewContent({ 
                        title: '', 
                        category: 'Financial Education', 
                        type: 'video', 
                        targetAudience: 'members',
                        description: '',
                        content: '',
                        fileUrl: '',
                        linkUrl: '',
                        uploadType: 'link',
                        thumbnailUrl: '',
                        duration: '',
                        file: null
                      })
                    }
                  }} 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={uploading}
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                    <input 
                      className="input-field text-sm py-2" 
                      value={newContent.title} 
                      onChange={(e)=>setNewContent({...newContent,title:e.target.value})} 
                      placeholder="Financial Literacy Basics" 
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={newContent.category} 
                      onChange={(e)=>setNewContent({...newContent,category:e.target.value})}
                      disabled={uploading}
                    >
                      <option>Financial Education</option>
                      <option>Agent Training</option>
                      <option>Savings Tips</option>
                      <option>Loan Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Type <span className="text-red-500">*</span></label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={newContent.type} 
                      onChange={(e)=>setNewContent({...newContent,type:e.target.value})}
                      disabled={uploading}
                    >
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="article">Article</option>
                      <option value="quiz">Quiz</option>
                      <option value="infographic">Infographic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience <span className="text-red-500">*</span></label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={newContent.targetAudience} 
                      onChange={(e)=>setNewContent({...newContent,targetAudience:e.target.value})}
                      disabled={uploading}
                    >
                      <option value="members">Members Only</option>
                      <option value="secretary">Secretary Only</option>
                      <option value="agent">Agents Only</option>
                      <option value="both">Both (Members & Secretary)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select 
                      className="input-field text-sm py-2" 
                      value={editingContent.status || 'published'} 
                      onChange={(e)=>setEditingContent({...editingContent,status:e.target.value})}
                      disabled={uploading}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Content Source</label>
                  <div className="flex gap-3 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="editUploadType" 
                        value="link" 
                        checked={newContent.uploadType === 'link'}
                        onChange={(e)=>setNewContent({...newContent,uploadType:e.target.value, file: null})}
                        disabled={uploading}
                      />
                      <span>Share Link</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="editUploadType" 
                        value="file" 
                        checked={newContent.uploadType === 'file'}
                        onChange={(e)=>setNewContent({...newContent,uploadType:e.target.value, linkUrl: ''})}
                        disabled={uploading}
                      />
                      <span>Upload File</span>
                    </label>
                  </div>
                  {newContent.uploadType === 'link' ? (
                    <input 
                      className="input-field text-sm py-2" 
                      value={newContent.linkUrl || newContent.fileUrl} 
                      onChange={(e)=>setNewContent({...newContent,linkUrl:e.target.value, fileUrl: e.target.value})} 
                      placeholder="https://youtube.com/watch?v=... or https://..." 
                      disabled={uploading}
                    />
                  ) : (
                    <div className="space-y-1">
                      <input 
                        type="file" 
                        className="input-field text-sm py-1.5" 
                        accept="video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                        onChange={(e)=>setNewContent({...newContent,file:e.target.files[0], fileUrl: ''})}
                        disabled={uploading}
                      />
                      {newContent.file && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Selected: {newContent.file.name} ({(newContent.file.size / 1024 / 1024).toFixed(2)} MB)</p>
                      )}
                      {newContent.fileUrl && (
                        <p className="text-xs text-green-600 dark:text-green-400">Current: {newContent.fileUrl}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
                    <input 
                      type="number" 
                      className="input-field text-sm py-2" 
                      value={newContent.duration} 
                      onChange={(e)=>setNewContent({...newContent,duration:e.target.value})} 
                      placeholder="Optional" 
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Thumbnail URL</label>
                    <input 
                      className="input-field text-sm py-2" 
                      value={newContent.thumbnailUrl} 
                      onChange={(e)=>setNewContent({...newContent,thumbnailUrl:e.target.value})} 
                      placeholder="Optional thumbnail image URL" 
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea 
                    className="input-field text-sm py-2" 
                    rows={2} 
                    value={newContent.description} 
                    onChange={(e)=>setNewContent({...newContent,description:e.target.value})} 
                    placeholder="Write a short description..." 
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Content (Full Text/HTML) - Optional</label>
                  <textarea 
                    className="input-field text-sm py-2" 
                    rows={3} 
                    value={newContent.content} 
                    onChange={(e)=>setNewContent({...newContent,content:e.target.value})} 
                    placeholder="Full content text or HTML (optional)..." 
                    disabled={uploading}
                  />
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button 
                  onClick={() => {
                    if (!uploading) {
                      setShowEditContent(false)
                      setEditingContent(null)
                      setNewContent({ 
                        title: '', 
                        category: 'Financial Education', 
                        type: 'video', 
                        targetAudience: 'members',
                        description: '',
                        content: '',
                        fileUrl: '',
                        linkUrl: '',
                        uploadType: 'link',
                        thumbnailUrl: '',
                        duration: '',
                        file: null
                      })
                    }
                  }} 
                  className="btn-secondary flex-1 text-sm py-2" 
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateContent} 
                  className="btn-primary flex-1 text-sm py-2" 
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Updating...
                    </span>
                  ) : (
                    'Update Content'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Details Modal */}
        {showContentDetails && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl p-6 space-y-4 my-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedContent.title}</h2>
                <button onClick={() => setShowContentDetails(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedContent.description && (
                  <p className="text-gray-700 dark:text-gray-300">{selectedContent.description}</p>
                )}
                
                {/* Video/Content Display */}
                {selectedContent.fileUrl && (
                  <div className="space-y-2">
                    {selectedContent.type?.toLowerCase() === 'video' || isYouTubeLink(selectedContent.fileUrl) ? (
                      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                        {isYouTubeLink(selectedContent.fileUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(selectedContent.fileUrl)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={selectedContent.title}
                          />
                        ) : (
                          <video
                            src={getFileUrl(selectedContent.fileUrl)}
                            controls
                            className="w-full h-full"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    ) : selectedContent.type?.toLowerCase() === 'pdf' || isDocumentType(selectedContent.fileUrl, selectedContent.type) ? (
                      <div className="w-full space-y-2">
                        {documentLoadError ? (
                          <div className="border rounded-lg bg-gray-50 dark:bg-gray-900 p-8 text-center" style={{ minHeight: '600px' }}>
                            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                              Unable to load document viewer. This may be because the file is hosted locally or the viewer service is unavailable.
                            </p>
                            <div className="flex gap-3 justify-center">
                              <a
                                href={getFileUrl(selectedContent.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary flex items-center gap-2"
                              >
                                <Download size={18} />
                                Download Document
                              </a>
                              <button
                                onClick={() => {
                                  const url = getFileUrl(selectedContent.fileUrl)
                                  window.open(url, '_blank')
                                }}
                                className="btn-secondary flex items-center gap-2"
                              >
                                <ExternalLink size={18} />
                                Open in New Tab
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden" style={{ height: '80vh', minHeight: '600px' }}>
                              <iframe
                                src={getDocumentViewerUrl(selectedContent.fileUrl)}
                                className="w-full h-full"
                                title={selectedContent.title}
                                style={{ border: 'none' }}
                                onLoad={() => setDocumentLoadError(false)}
                              />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <FileText size={16} />
                              <span>Reading document online. If it doesn't load, try downloading the file.</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : selectedContent.type?.toLowerCase() === 'audio' ? (
                      <div className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <audio
                          src={getFileUrl(selectedContent.fileUrl)}
                          controls
                          className="w-full"
                        >
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    ) : selectedContent.type?.toLowerCase() === 'image' || selectedContent.type?.toLowerCase() === 'infographic' ? (
                      <div className="w-full">
                        <img
                          src={getFileUrl(selectedContent.fileUrl)}
                          alt={selectedContent.title}
                          className="w-full rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-300 mb-2">Content available for download</p>
                        <a
                          href={getFileUrl(selectedContent.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Open in new tab
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content Text */}
                {selectedContent.content && (
                  <div className="prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye size={16} /> {selectedContent.views || 0} views
                  </span>
                  {selectedContent.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={16} /> {selectedContent.duration} min
                    </span>
                  )}
                  {selectedContent.category && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      {selectedContent.category}
                    </span>
                  )}
                  {selectedContent.status && (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedContent.status)}`}>
                      {selectedContent.status}
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                  {selectedContent.fileUrl && (
                    <button
                      onClick={() => {
                        const url = selectedContent.fileUrl.startsWith('http') 
                          ? selectedContent.fileUrl 
                          : `${api.defaults.baseURL.replace('/api', '')}${selectedContent.fileUrl}`
                        window.open(url, '_blank')
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  )}
                  {selectedContent.fileUrl && isYouTubeLink(selectedContent.fileUrl) && (
                    <a
                      href={selectedContent.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Open on YouTube
                    </a>
                  )}
                  <button
                    onClick={() => setShowContentDetails(false)}
                    className="btn-primary flex-1"
                  >
                    Close
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

export default SystemAdminLearnGrow
