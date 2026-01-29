import { useState, useEffect } from 'react'
import { Megaphone, Calendar, Users, AlertCircle, CheckCircle, Info } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function MemberAnnouncements() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        
        // Get current user's group ID
        const me = await api.get('/auth/me')
        const gid = me.data?.data?.groupId
        if (!gid) {
          if (mounted) {
            setError(t('notPartOfGroup', { defaultValue: 'You are not part of any group yet.' }))
            setLoading(false)
          }
          return
        }
        
        if (!mounted) return
        setGroupId(gid)
        
        // Fetch announcements for the group
        const res = await api.get(`/announcements?groupId=${gid}`)
        if (mounted && res.data?.success) {
          // Filter to only show sent announcements and clean content
          const sentAnnouncements = (res.data.data || [])
            .filter(a => a.status === 'sent')
            .map(a => {
              // Clean content - remove any metadata that might have slipped through
              let cleanContent = a.content || '';
              cleanContent = cleanContent.replace(/\[VOTE_METADATA_START\].*?\[VOTE_METADATA_END\]/s, '');
              cleanContent = cleanContent.replace(/<!-- METADATA:.*?-->/s, '');
              cleanContent = cleanContent.trim();
              
              return {
                id: a.id,
                title: a.title,
                content: cleanContent,
                priority: a.priority || 'medium',
                createdAt: a.createdAt,
                sentAt: a.sentAt,
                createdBy: a.createdBy || 'Group Leader'
              };
            })
            .sort((a, b) => {
              // Sort by sent date (most recent first)
              const dateA = a.sentAt ? new Date(a.sentAt) : new Date(a.createdAt)
              const dateB = b.sentAt ? new Date(b.sentAt) : new Date(b.createdAt)
              return dateB - dateA
            })
          
          setAnnouncements(sentAnnouncements)
        }
      } catch (e) {
        console.error('Failed to load announcements:', e)
        if (mounted) {
          setError(t('failedToLoadAnnouncements', { defaultValue: 'Failed to load announcements. Please try again.' }))
          setAnnouncements([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="text-red-600" size={20} />
      case 'medium':
        return <Info className="text-yellow-600" size={20} />
      case 'low':
        return <CheckCircle className="text-green-600" size={20} />
      default:
        return <Megaphone className="text-gray-600" size={20} />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('unknownDate', { defaultValue: 'Unknown date' })
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Layout userRole="Member">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('loadingAnnouncements', { defaultValue: 'Loading announcements...' })}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Megaphone className="text-primary-600" size={32} />
              {t('groupAnnouncements', { defaultValue: 'Group Announcements' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('stayUpdatedWithMessages', { defaultValue: 'Stay updated with important messages from your group leaders' })}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Megaphone className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('noAnnouncementsYet', { defaultValue: 'No Announcements Yet' })}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('noAnnouncementsMessage', { defaultValue: "Your group leaders haven't posted any announcements yet. Check back later for updates." })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${
                  announcement.priority === 'high' ? 'border-red-500' :
                  announcement.priority === 'medium' ? 'border-yellow-500' :
                  'border-green-500'
                } hover:shadow-md transition-shadow`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        announcement.priority === 'high' ? 'bg-red-50' :
                        announcement.priority === 'medium' ? 'bg-yellow-50' :
                        'bg-green-50'
                      }`}>
                        {getPriorityIcon(announcement.priority)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(announcement.sentAt || announcement.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>From: {announcement.createdBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {announcements.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">About Announcements</h4>
                <p className="text-sm text-blue-700">
                  Announcements are posted by your group leaders (Group Admin, Cashier, or Secretary) to keep all members informed about important group matters, deadlines, meetings, and updates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MemberAnnouncements

