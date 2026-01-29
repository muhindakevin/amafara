import { useState, useEffect } from 'react'
import { BookOpen, Users, TrendingUp, Award, Calendar, Eye, Download, CheckCircle, Clock, AlertCircle, X, FileText, ExternalLink, Bell } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { exportToExcel } from '../utils/pdfExport'

function GroupAdminLearnGrow() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('progress')
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  
  // Real data states
  const [memberProgress, setMemberProgress] = useState([])
  const [modules, setModules] = useState([])
  const [weeklyChallenges, setWeeklyChallenges] = useState([])
  const [overallStats, setOverallStats] = useState({
    totalMembers: 0,
    enrolledMembers: 0,
    completionRate: 0,
    totalCertificates: 0,
    activeLearners: 0,
    availableModules: 0
  })
  const [groupId, setGroupId] = useState(null)
  const [groupName, setGroupName] = useState('')
  
  // Challenge form state
  const [challengeData, setChallengeData] = useState({
    title: '',
    description: '',
    week: '',
    deadline: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  // Document viewer states
  const [selectedModule, setSelectedModule] = useState(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [documentLoadError, setDocumentLoadError] = useState(false)
  
  // Challenge participants states
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [showParticipants, setShowParticipants] = useState(false)
  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  
  // Send reminder states
  const [sendingReminder, setSendingReminder] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current user's group
      const me = await api.get('/auth/me')
      const currentGroupId = me.data?.data?.groupId
      if (!currentGroupId) {
        setLoading(false)
        return
      }
      
      setGroupId(currentGroupId)
      
      // Get group name
      try {
        const groupRes = await api.get(`/groups/${currentGroupId}`)
        if (groupRes.data?.success) {
          setGroupName(groupRes.data.data.name || '')
        }
      } catch (err) {
        console.error('Error fetching group name:', err)
      }
      
      // Get member progress and content
      const progressRes = await api.get('/learn-grow/progress')
      if (progressRes.data?.success) {
        const data = progressRes.data.data
        setMemberProgress(data.members || [])
        setModules(data.content || [])
        setOverallStats(data.stats || {
          totalMembers: 0,
          enrolledMembers: 0,
          completionRate: 0,
          totalCertificates: 0,
          activeLearners: 0,
          availableModules: 0
        })
      }
      
      // Get challenges (announcements with challenge type)
      await loadChallenges(currentGroupId)
    } catch (error) {
      console.error('Error loading learn-grow data:', error)
      setMemberProgress([])
      setModules([])
      setWeeklyChallenges([])
    } finally {
      setLoading(false)
    }
  }

  const loadChallenges = async (groupId) => {
    try {
      const res = await api.get('/announcements', {
        params: { groupId, status: 'sent' }
      })
      if (res.data?.success) {
        // Filter announcements that are challenges (title contains "Challenge" or similar)
        const challenges = (res.data.data || [])
          .filter(ann => 
            ann.title.toLowerCase().includes('challenge') || 
            ann.content.toLowerCase().includes('challenge')
          )
          .map(ann => ({
            id: ann.id,
            title: ann.title,
            week: ann.createdAt ? `Week of ${new Date(ann.createdAt).toLocaleDateString()}` : 'Unknown',
            participants: 0, // Will calculate from group members
            completed: 0, // No tracking yet
            status: new Date(ann.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'active' : 'completed',
            content: ann.content,
            createdAt: ann.createdAt
          }))
        setWeeklyChallenges(challenges)
      }
    } catch (error) {
      console.error('Error loading challenges:', error)
      setWeeklyChallenges([])
    }
  }

  const handleCreateChallenge = async () => {
    if (!challengeData.title || !challengeData.description) {
      alert(tCommon('fillTitleAndDescription', { defaultValue: 'Please fill in title and description.' }))
      return
    }

    if (!groupId) {
      alert(t('groupInformationNotAvailable', { defaultValue: 'Group information not available.' }))
      return
    }

    try {
      setSubmitting(true)
      
      const challengeContent = `📚 Learning Challenge: ${challengeData.title}\n\n${challengeData.description}${challengeData.deadline ? `\n\nDeadline: ${challengeData.deadline}` : ''}\n\n${challengeData.week ? `Week: ${challengeData.week}` : ''}\n\nPlease complete this challenge and track your progress!`
      
      // Create announcement as challenge
      const announcementRes = await api.post('/announcements', {
        groupId: groupId,
        title: `Challenge: ${challengeData.title}`,
        content: challengeContent,
        priority: 'high'
      })
      
      if (announcementRes.data?.success) {
        // Send announcement to all members
        await api.put(`/announcements/${announcementRes.data.data.id}/send`)
        
        alert('Challenge created and sent to all group members!')
        setShowCreateChallenge(false)
        setChallengeData({
          title: '',
          description: '',
          week: '',
          deadline: ''
        })
        await loadChallenges(groupId)
      } else {
        alert('Failed to create challenge. Please try again.')
      }
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert(error?.response?.data?.message || 'Failed to create challenge. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExportProgress = () => {
    if (memberProgress.length === 0) {
      alert('No data to export.')
      return
    }

    try {
      const headers = [
        'Member Name',
        'Phone',
        'Email',
        'Total Modules',
        'Completed Modules',
        'In Progress',
        'Completion %',
        'Certificates',
        'Current Module',
        'Last Activity'
      ]

      const data = memberProgress.map(member => [
        member.memberName || '',
        member.phone || '',
        member.email || '',
        member.totalModules || 0,
        member.completedModules || 0,
        member.inProgress || 0,
        `${member.completionPercentage || 0}%`,
        member.certificates || 0,
        member.currentModule || 'Not Started',
        member.lastActivity || 'N/A'
      ])

      exportToExcel(data, headers, 'Learn_Grow_Progress_Report', {
        title: 'Learn & Grow Progress Report',
        groupName: groupName,
        summary: {
          totalMembers: overallStats.totalMembers,
          enrolledMembers: overallStats.enrolledMembers,
          completionRate: overallStats.completionRate,
          availableModules: overallStats.availableModules
        }
      })

      alert('Progress report exported successfully!')
    } catch (error) {
      console.error('Error exporting progress:', error)
      alert('Failed to export progress report. Please try again.')
    }
  }

  const getCompletionColor = (percentage) => {
    if (percentage === 100) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    if (percentage >= 70) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    if (percentage >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  }

  // Document viewing functions
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

  const handleViewModule = (module) => {
    setSelectedModule(module)
    setDocumentLoadError(false)
    setShowDocumentViewer(true)
    
    // Set a timeout to check if document loaded (for local files that might not work with online viewers)
    if (isDocumentType(module.fileUrl, module.type)) {
      setTimeout(() => {
        const iframe = document.querySelector(`iframe[title="${module.title}"]`)
        if (iframe && !iframe.contentDocument) {
          setDocumentLoadError(true)
        }
      }, 5000)
    }
  }

  const handleDownloadModule = (module) => {
    if (module.fileUrl) {
      const url = getFileUrl(module.fileUrl)
      window.open(url, '_blank')
    }
  }

  // Challenge participants functions
  const handleViewParticipants = async (challenge) => {
    setSelectedChallenge(challenge)
    setShowParticipants(true)
    setLoadingParticipants(true)
    setParticipants([])
    
    try {
      // Get all group members
      const membersRes = await api.get(`/groups/${groupId}/members`)
      const allMembers = membersRes.data?.data?.members || []
      
      // Get notifications for this announcement/challenge
      const notificationsRes = await api.get('/notifications', {
        params: {
          limit: 1000,
          type: 'announcement'
        }
      })
      
      const notifications = notificationsRes.data?.data || []
      // Filter notifications related to this challenge (by title or content matching)
      const challengeNotifications = notifications.filter(notif => 
        notif.title?.includes(challenge.title.replace('Challenge: ', '')) ||
        notif.content?.includes(challenge.title.replace('Challenge: ', ''))
      )
      
      // Get unique user IDs who received the notification
      const notifiedUserIds = [...new Set(challengeNotifications.map(n => n.userId).filter(Boolean))]
      
      // Map members with their participation status
      const participantsList = allMembers.map(member => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        received: notifiedUserIds.includes(member.id),
        viewed: challengeNotifications.some(n => n.userId === member.id && n.status === 'read')
      }))
      
      setParticipants(participantsList)
    } catch (error) {
      console.error('Error loading participants:', error)
      alert('Failed to load participants. Please try again.')
    } finally {
      setLoadingParticipants(false)
    }
  }

  // Send reminder function
  const handleSendReminder = async (challenge) => {
    if (!groupId) {
      alert('Group information not available')
      return
    }
    
    if (!window.confirm(`Send a reminder about "${challenge.title}" to all group members?`)) {
      return
    }
    
    try {
      setSendingReminder(true)
      
      // Get all group members
      const membersRes = await api.get(`/groups/${groupId}/members`)
      const members = membersRes.data?.data?.members || []
      
      if (members.length === 0) {
        alert('No members found in this group')
        return
      }
      
      // Create a reminder announcement
      const reminderContent = `🔔 Reminder: ${challenge.title}\n\n${challenge.content}\n\nThis is a reminder to complete the challenge. Don't forget to track your progress!`
      
      const announcementRes = await api.post('/announcements', {
        groupId: groupId,
        title: `Reminder: ${challenge.title}`,
        content: reminderContent,
        priority: 'high'
      })
      
      if (!announcementRes.data?.success) {
        throw new Error('Failed to create reminder announcement')
      }
      
      // Send the announcement (this automatically creates notifications for all group members)
      await api.put(`/announcements/${announcementRes.data.data.id}/send`)
      
      alert('Reminder sent successfully! All group members will receive it as a notification.')
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Failed to send reminder. Please try again.')
    } finally {
      setSendingReminder(false)
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('learnGrowManagement', { defaultValue: 'Learn & Grow Management' })}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{t('trackMemberLearningProgress', { defaultValue: 'Track member learning progress and educational participation' })}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportProgress}
              className="btn-secondary flex items-center gap-2"
              disabled={loading || memberProgress.length === 0}
            >
              <Download size={18} /> {t('exportProgressReport', { defaultValue: 'Export Progress Report' })}
            </button>
            <button 
              onClick={() => setShowCreateChallenge(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Calendar size={18} /> {t('createChallenge', { defaultValue: 'Create Challenge' })}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('enrolledMembers', { defaultValue: 'Enrolled Members' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {overallStats.enrolledMembers}/{overallStats.totalMembers}
                </p>
              </div>
              <Users className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('avgCompletion', { defaultValue: 'Avg Completion' })}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {overallStats.completionRate}%
                </p>
              </div>
              <TrendingUp className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('totalCertificates', { defaultValue: 'Total Certificates' })}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {overallStats.totalCertificates}
                </p>
              </div>
              <Award className="text-green-600 dark:text-green-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('activeLearners', { defaultValue: 'Active Learners' })}</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {overallStats.activeLearners}
                </p>
              </div>
              <BookOpen className="text-yellow-600 dark:text-yellow-400" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('availableModules', { defaultValue: 'Available Modules' })}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {overallStats.availableModules}
                </p>
              </div>
              <BookOpen className="text-purple-600 dark:text-purple-400" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex gap-2">
              {[
                { id: 'progress', label: 'Member Progress', icon: TrendingUp },
                { id: 'modules', label: 'Learning Modules', icon: BookOpen },
                { id: 'challenges', label: 'Weekly Challenges', icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={18} /> {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Member Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Member Learning Progress</h3>
                <button
                  onClick={() => alert('Reminder feature coming soon!')}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <AlertCircle size={16} /> Send Reminders
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading member progress...</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BookOpen className="mx-auto mb-4 text-gray-400 dark:text-gray-600" size={48} />
                  <p className="text-lg font-semibold">No Learning Content Available</p>
                  <p className="text-sm">System Admin needs to add Learn & Grow content first.</p>
                  <p className="text-sm mt-2">Once content is available, member progress will appear here.</p>
                </div>
              ) : memberProgress.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="mx-auto mb-4 text-gray-400 dark:text-gray-600" size={48} />
                  <p className="text-lg font-semibold">No Members Found</p>
                  <p className="text-sm">No active members in your group.</p>
                </div>
              ) : (
              <div className="space-y-3">
                {memberProgress.map((member) => (
                  <div
                    key={member.memberId}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {member.memberName?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white">{member.memberName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone} {member.email ? `• ${member.email}` : ''}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                            {member.lastActivity ? `Last Activity: ${member.lastActivity}` : 'No activity yet'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompletionColor(member.completionPercentage)}`}>
                        {member.completionPercentage}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">{member.completedModules}/{member.totalModules}</p>
                      </div>
                      <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">{member.inProgress}</p>
                      </div>
                      <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Certificates</p>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">{member.certificates}</p>
                      </div>
                      <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Current Module</p>
                          <p className="font-semibold text-gray-800 dark:text-white text-xs">{member.currentModule}</p>
                      </div>
                    </div>

                    <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{member.completionPercentage}%</span>
                      </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            member.completionPercentage === 100 ? 'bg-green-500' :
                            member.completionPercentage >= 70 ? 'bg-blue-500' :
                            member.completionPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMember(member)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* Learning Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Available Learning Modules</h3>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading modules...</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BookOpen className="mx-auto mb-4 text-gray-400 dark:text-gray-600" size={48} />
                  <p className="text-lg font-semibold">No Learning Modules Available</p>
                  <p className="text-sm">System Admin needs to add Learn & Grow content first.</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-white">{module.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{module.category || 'General'}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {module.duration && (
                          <div className="flex items-center gap-1">
                                <Clock size={14} /> {module.duration} min
                          </div>
                            )}
                          <span className={`px-2 py-1 rounded-full ${
                              module.type === 'article' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              module.type === 'video' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              module.type === 'pdf' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {module.type}
                          </span>
                        </div>
                      </div>
                    </div>

                      {module.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{module.description}</p>
                      )}

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {module.views || 0} views
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewModule(module)}
                          className="btn-secondary text-sm flex items-center gap-1"
                        >
                          <Eye size={14} /> View
                        </button>
                        {module.fileUrl && (
                          <button 
                            onClick={() => handleDownloadModule(module)}
                            className="btn-secondary text-sm flex items-center gap-1"
                          >
                            <Download size={14} /> Download
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

          {/* Weekly Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Weekly Learning Challenges</h3>
                <button
                  onClick={() => setShowCreateChallenge(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Calendar size={16} /> Create Challenge
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading challenges...</p>
                </div>
              ) : weeklyChallenges.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calendar className="mx-auto mb-4 text-gray-400 dark:text-gray-600" size={48} />
                  <p className="text-lg font-semibold">No Challenges Created</p>
                  <p className="text-sm">Create a weekly learning challenge to motivate members.</p>
                </div>
              ) : (
              <div className="space-y-3">
                {weeklyChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-white">{challenge.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.week}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {challenge.completed}/{challenge.participants} members completed
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          challenge.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          challenge.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {challenge.status}
                      </span>
                    </div>

                      {challenge.content && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{challenge.content}</p>
                      )}

                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => handleViewParticipants(challenge)}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <Users size={14} /> View Participants
                      </button>
                      {challenge.status === 'active' && (
                        <button
                          onClick={() => handleSendReminder(challenge)}
                          className="btn-primary text-sm flex items-center gap-1"
                          disabled={sendingReminder}
                        >
                          <Bell size={14} /> {sendingReminder ? 'Sending...' : 'Send Reminder'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}
              </div>

        {/* Create Challenge Modal */}
        {showCreateChallenge && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Create Learning Challenge</h2>
                <button
                  onClick={() => {
                    setShowCreateChallenge(false)
                    setChallengeData({ title: '', description: '', week: '', deadline: '' })
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Challenge Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Complete Financial Planning Module"
                    value={challengeData.title}
                    onChange={(e) => setChallengeData({...challengeData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Describe the challenge and what members need to do..."
                    value={challengeData.description}
                    onChange={(e) => setChallengeData({...challengeData, description: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Week (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Week of Jan 15-21"
                    value={challengeData.week}
                    onChange={(e) => setChallengeData({...challengeData, week: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={challengeData.deadline}
                    onChange={(e) => setChallengeData({...challengeData, deadline: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateChallenge(false)
                      setChallengeData({ title: '', description: '', week: '', deadline: '' })
                    }}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChallenge}
                    className="btn-primary flex-1"
                    disabled={submitting || !challengeData.title || !challengeData.description}
                  >
                    {submitting ? 'Creating...' : 'Create & Send Challenge'}
                  </button>
                </div>
              </div>
              </div>
            </div>
          )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Member Details</h2>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                  {selectedMember.memberName?.[0]?.toUpperCase() || 'M'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedMember.memberName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMember.phone || 'N/A'}</p>
                  {selectedMember.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMember.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Modules</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{selectedMember.totalModules || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedMember.completedModules || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedMember.inProgress || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Certificates</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedMember.certificates || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Completion Progress</h4>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      selectedMember.completionPercentage === 100 ? 'bg-green-500' :
                      selectedMember.completionPercentage >= 70 ? 'bg-blue-500' :
                      selectedMember.completionPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${selectedMember.completionPercentage || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedMember.completionPercentage || 0}% Complete</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Current Module</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedMember.currentModule || 'Not Started'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Last Activity</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedMember.lastActivity || 'No activity yet'}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Performance Summary</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{selectedMember.completionPercentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Modules Completed:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{selectedMember.completedModules || 0} / {selectedMember.totalModules || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Certificates Earned:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{selectedMember.certificates || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentViewer && selectedModule && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedModule.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedModule.category || 'General'}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedModule.fileUrl && (
                  <button
                    onClick={() => handleDownloadModule(selectedModule)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={18} /> Download
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDocumentViewer(false)
                    setSelectedModule(null)
                    setDocumentLoadError(false)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {selectedModule.description && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{selectedModule.description}</p>
                </div>
              )}

              {selectedModule.type?.toLowerCase() === 'pdf' || isDocumentType(selectedModule.fileUrl, selectedModule.type) ? (
                <div className="w-full space-y-2">
                  {documentLoadError ? (
                    <div className="border rounded-lg bg-gray-50 dark:bg-gray-900 p-8 text-center" style={{ minHeight: '600px' }}>
                      <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Unable to load document viewer. This may be because the file is hosted locally or the viewer service is unavailable.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <a
                          href={getFileUrl(selectedModule.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary flex items-center gap-2"
                        >
                          <Download size={18} />
                          Download Document
                        </a>
                        <button
                          onClick={() => {
                            const url = getFileUrl(selectedModule.fileUrl)
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
                    <iframe
                      src={getDocumentViewerUrl(selectedModule.fileUrl)}
                      className="w-full border rounded-lg"
                      style={{ minHeight: '600px' }}
                      title={selectedModule.title}
                      onError={() => setDocumentLoadError(true)}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>This content type cannot be viewed in the document viewer.</p>
                  {selectedModule.fileUrl && (
                    <button
                      onClick={() => handleDownloadModule(selectedModule)}
                      className="btn-primary mt-4 flex items-center gap-2 mx-auto"
                    >
                      <Download size={18} /> Download Content
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipants && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Challenge Participants</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedChallenge.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowParticipants(false)
                  setSelectedChallenge(null)
                  setParticipants([])
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-6">
              {loadingParticipants ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-lg font-semibold">No Participants Found</p>
                  <p className="text-sm">No members have received this challenge yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Total Participants:</strong> {participants.length} | 
                      <strong> Received:</strong> {participants.filter(p => p.received).length} | 
                      <strong> Viewed:</strong> {participants.filter(p => p.viewed).length}
                    </p>
                  </div>
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {participant.name?.[0]?.toUpperCase() || 'M'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white">{participant.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {participant.phone || 'N/A'} {participant.email ? `• ${participant.email}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {participant.received ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              Received
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              Not Received
                            </span>
                          )}
                          {participant.viewed && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              Viewed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default GroupAdminLearnGrow
