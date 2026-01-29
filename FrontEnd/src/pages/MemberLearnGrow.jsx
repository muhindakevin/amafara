import { useState, useEffect } from 'react'
import { BookOpen, Play, FileText, Image, Volume2, Eye, Star, MessageCircle, TrendingUp, Clock, CheckCircle, Search, Download, XCircle, ExternalLink } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function MemberLearnGrow() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedContent, setSelectedContent] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [documentLoadError, setDocumentLoadError] = useState(false)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try { setLoading(true); const { data } = await api.get('/learn-grow'); if(mounted) setItems(data?.data || []) }
      finally { if(mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  }, [])

  const handleViewContent = async (content) => {
    setSelectedContent(content)
    setDocumentLoadError(false)
    // Track view (increment view count)
    try {
      await api.get(`/learn-grow/${content.id}`).catch(() => {})
      // Refresh items to update view count
      const { data } = await api.get('/learn-grow').catch(() => ({ data: { data: [] } }))
      setItems(data?.data || [])
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

  const handleDownload = (content) => {
    if (content.fileUrl) {
      const url = content.fileUrl.startsWith('http') ? content.fileUrl : `${api.defaults.baseURL.replace('/api', '')}${content.fileUrl}`
      window.open(url, '_blank')
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

  const getTypeIcon = (type) => {
    const typeLower = type?.toLowerCase()
    switch (typeLower) {
      case 'video': return <Play className="text-red-600" size={20} />
      case 'pdf': return <FileText className="text-blue-600" size={20} />
      case 'infographic': 
      case 'image': return <Image className="text-green-600" size={20} />
      case 'audio': return <Volume2 className="text-purple-600" size={20} />
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('learnGrow')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('accessLearningMaterials', { defaultValue: 'Access learning materials to improve your financial knowledge' })}</p>
        </div>

        {/* Progress Overview (zeros by default) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('contentCompleted', { defaultValue: 'Content Completed' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">0</p>
              </div>
              <CheckCircle className="text-green-600" size={28} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalContent', { defaultValue: 'Total Content' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '0' : (items?.length || 0)}</p>
              </div>
              <BookOpen className="text-blue-600" size={28} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('hoursSpent', { defaultValue: 'Hours Spent' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">0</p>
              </div>
              <Clock className="text-purple-600" size={28} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('avgProgress', { defaultValue: 'Avg. Progress' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">0%</p>
              </div>
              <TrendingUp className="text-orange-600" size={28} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder={t('searchContent', { defaultValue: 'Search content...' })} className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)}>
              <option value="all">{t('allCategories', { defaultValue: 'All Categories' })}</option>
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

        {/* Content Details Modal */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl p-6 space-y-4 my-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedContent.title}</h2>
                <button onClick={()=>setSelectedContent(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                  {selectedContent.fileUrl && (
                    <button
                      onClick={() => handleDownload(selectedContent)}
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
                    onClick={() => setSelectedContent(null)}
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

export default MemberLearnGrow
