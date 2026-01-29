import { useState, useEffect } from 'react'
import { BookOpen, Upload, Eye, Download, Plus, Users, MessageCircle, Video, FileText, Image, FileQuestion, RefreshCw, Bell, X, Send } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'

function SecretaryTraining() {
  const { t } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('materials')
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [nonLearners, setNonLearners] = useState([])
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [categoryFilter, typeFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = {}
      if (categoryFilter !== 'all') params.category = categoryFilter
      if (typeFilter !== 'all') params.type = typeFilter
      
      const response = await api.get('/learn-grow', { params })
      if (response.data.success) {
        const coursesData = response.data.data || []
        console.log(`[SecretaryTraining] Loaded ${coursesData.length} courses`)
        setCourses(coursesData)
      } else {
        console.warn('[SecretaryTraining] Failed to fetch courses:', response.data.message)
        setCourses([])
      }
    } catch (error) {
      console.error('[SecretaryTraining] Error fetching courses:', error)
      alert('Failed to load learning content. Please refresh the page.')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video size={20} />
      case 'pdf': return <FileText size={20} />
      case 'article': return <BookOpen size={20} />
      case 'quiz': return <FileQuestion size={20} />
      case 'infographic': return <Image size={20} />
      default: return <FileText size={20} />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const handleDownload = (course) => {
    if (course.fileUrl) {
      window.open(course.fileUrl, '_blank')
    } else {
      alert('No file available for download')
    }
  }

  const handleTrackMembers = async (course) => {
    try {
      setSelectedCourse(course)
      setTrackingLoading(true)
      setShowTrackingModal(true)
      setNonLearners([]) // Clear previous data
      
      const response = await api.get(`/learn-grow/${course.id}/non-learners`)
      if (response.data.success) {
        const data = response.data.data
        console.log(`[SecretaryTraining] Found ${data.nonLearnerCount} non-learners out of ${data.totalMembers} total members`)
        setNonLearners(data.nonLearners || [])
      } else {
        console.error('[SecretaryTraining] Failed to fetch tracking data:', response.data.message)
        alert('Failed to fetch member tracking data: ' + (response.data.message || 'Unknown error'))
        setNonLearners([])
      }
    } catch (error) {
      console.error('[SecretaryTraining] Error tracking members:', error)
      alert('Failed to track members: ' + (error.response?.data?.message || error.message))
      setNonLearners([])
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleSendReminder = async (memberIds = null) => {
    if (!selectedCourse) return

    const targetMembers = memberIds || nonLearners.map(m => m.id)
    if (targetMembers.length === 0) {
      alert('No members selected to send reminder')
      return
    }

    const memberNames = memberIds 
      ? nonLearners.filter(m => memberIds.includes(m.id)).map(m => m.name).join(', ')
      : 'all selected members'

    if (!confirm(`Send reminder to ${targetMembers.length} member(s) (${memberNames}) about "${selectedCourse.title}"?\n\nThis will send a chat message and notification to each member.`)) {
      return
    }

    try {
      setSendingReminder(true)
      const response = await api.post(`/learn-grow/${selectedCourse.id}/send-reminder`, {
        memberIds: targetMembers
      })

      if (response.data.success) {
        const result = response.data.data
        alert(`✅ Reminder sent successfully!\n\n- Sent to: ${result.sentCount} member(s)\n- Chat messages: ${result.chatMessagesCount}\n- Notifications: ${result.notificationsCount}`)
        // Refresh the tracking data to update the list
        await handleTrackMembers(selectedCourse)
      } else {
        alert('Failed to send reminder: ' + (response.data.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('[SecretaryTraining] Error sending reminder:', error)
      alert('Failed to send reminder: ' + (error.response?.data?.message || error.message))
    } finally {
      setSendingReminder(false)
    }
  }

  const handleView = async (course) => {
    try {
      // If course has fileUrl, open it directly
      if (course.fileUrl) {
        // Check if it's a relative path or absolute URL
        if (course.fileUrl.startsWith('http://') || course.fileUrl.startsWith('https://')) {
          window.open(course.fileUrl, '_blank')
        } else {
          // Relative path - construct full URL
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
          window.open(`${baseUrl}${course.fileUrl}`, '_blank')
        }
        return
      }

      // If course has content, fetch full details and display
      if (course.id) {
        try {
          const response = await api.get(`/learn-grow/${course.id}`)
          if (response.data.success) {
            const fullCourse = response.data.data
            
            // If full course has fileUrl, use it
            if (fullCourse.fileUrl) {
              if (fullCourse.fileUrl.startsWith('http://') || fullCourse.fileUrl.startsWith('https://')) {
                window.open(fullCourse.fileUrl, '_blank')
              } else {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
                window.open(`${baseUrl}${fullCourse.fileUrl}`, '_blank')
              }
              return
            }

            // Otherwise, show content in a modal or new window
            const content = fullCourse.content || fullCourse.description || 'No content available'
            const newWindow = window.open('', '_blank')
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${fullCourse.title}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
                    h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
                    .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .content { line-height: 1.6; margin-top: 20px; }
                    .content img { max-width: 100%; height: auto; }
                    .content video { max-width: 100%; height: auto; }
                  </style>
                </head>
                <body>
                  <h1>${fullCourse.title}</h1>
                  <div class="meta">
                    <p><strong>Category:</strong> ${fullCourse.category || 'N/A'}</p>
                    <p><strong>Type:</strong> ${fullCourse.type}</p>
                    ${fullCourse.duration ? `<p><strong>Duration:</strong> ${fullCourse.duration} minutes</p>` : ''}
                    ${fullCourse.description ? `<p><strong>Description:</strong> ${fullCourse.description}</p>` : ''}
                  </div>
                  <div class="content">${content}</div>
                </body>
              </html>
            `)
            newWindow.document.close()
            return
          }
        } catch (error) {
          console.error('Error fetching course details:', error)
        }
      }

      // Fallback: show content if available
      if (course.content) {
        const newWindow = window.open('', '_blank')
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${course.title}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h1>${course.title}</h1>
              <p><strong>Category:</strong> ${course.category || 'N/A'}</p>
              <p><strong>Type:</strong> ${course.type}</p>
              <div style="margin-top: 20px;">${course.content || course.description || 'No content available'}</div>
            </body>
          </html>
        `)
        newWindow.document.close()
        return
      }

      alert('No content available to view for this course')
    } catch (error) {
      console.error('Error viewing course:', error)
      alert('Failed to open course. Please try again.')
    }
  }

  if (loading) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {tSecretary('learningAndGrowth', { defaultValue: 'Learning & Growth' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tSecretary('viewContentAndTrackMembers', { defaultValue: 'View learn-grow content uploaded by System Admin and track member learning progress' })}
            </p>
          </div>
          <button
            onClick={fetchCourses}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['materials', 'support', 'policies'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'materials' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {tSecretary('educationalMaterials', { defaultValue: 'Training Courses' })}
                  </h2>
                  <div className="flex gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="Saving">Saving</option>
                      <option value="Budgeting">Budgeting</option>
                      <option value="Loans">Loans</option>
                      <option value="Investment">Investment</option>
                      <option value="Finance">Finance</option>
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="quiz">Quiz</option>
                      <option value="infographic">Infographic</option>
                    </select>
                  </div>
                </div>
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BookOpen className="mx-auto mb-2" size={48} />
                    <p>No training courses available</p>
                  </div>
                ) : (
                <div className="space-y-3">
                    {courses.map((course) => (
                      <div key={course.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors">
                      <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1 text-primary-600 dark:text-primary-400">
                              {getTypeIcon(course.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 dark:text-white">{course.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {course.description || 'No description available'}
                              </p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                <span>{course.type.toUpperCase()}</span>
                                {course.category && <span>• {course.category}</span>}
                                {course.duration && <span>• {course.duration} min</span>}
                                <span>• Uploaded: {formatDate(course.createdAt)}</span>
                                {course.creator && <span>• By: {course.creator.name}</span>}
                                {course.views > 0 && <span>• {course.views} views</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleView(course)}
                              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                            >
                              <Eye size={16} /> View
                            </button>
                            <button
                              onClick={() => handleTrackMembers(course)}
                              className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                            >
                              <Users size={16} /> Track Members
                            </button>
                            {course.fileUrl && (
                              <button
                                onClick={() => handleDownload(course)}
                                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                              >
                                <Download size={16} /> Download
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {tSecretary('memberSupport', { defaultValue: 'Member Support' })}
                </h2>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="mx-auto mb-2" size={48} />
                  <p>{tSecretary('memberSupportChatHelp', { defaultValue: 'Member support chat and help system' })}</p>
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {tSecretary('policyUpdates', { defaultValue: 'Policy Updates' })}
                </h2>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="mx-auto mb-2" size={48} />
                  <p>Policy updates and announcements will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Track Members - {selectedCourse.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Members who haven't completed this training
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTrackingModal(false)
                  setSelectedCourse(null)
                  setNonLearners([])
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {trackingLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading member data...</p>
                </div>
              ) : nonLearners.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto mb-4 text-gray-300 dark:text-gray-600" size={64} />
                  <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    All members have completed this training!
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Great job! All members in your group have completed this training.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total members who haven't completed: <span className="font-bold text-gray-800 dark:text-white">{nonLearners.length}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendReminder()}
                      disabled={sendingReminder}
                      className="btn-primary flex items-center gap-2"
                    >
                      {sendingReminder ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send Reminder to All
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {nonLearners.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.name[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{member.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {member.phone !== 'N/A' && member.phone} {member.email !== 'N/A' && member.email && `• ${member.email}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendReminder([member.id])}
                          disabled={sendingReminder}
                          className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                        >
                          <Bell size={14} /> Send Reminder
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default SecretaryTraining
