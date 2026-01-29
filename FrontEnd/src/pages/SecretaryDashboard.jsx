import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, MessageCircle, Shield, Archive, BookOpen, Bell, BarChart3, Plus, Eye, Edit, Download, CheckCircle, AlertCircle, Clock, DollarSign } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SecretaryDashboard() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    stats: {
      members: { total: 0, growth: '+0' },
      meetings: { total: 0, growth: '+0' },
      announcements: { total: 0, growth: '+0' },
      documents: { total: 0, growth: '+0' }
    },
    recentActivities: [],
    upcomingTasks: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[SecretaryDashboard] Fetching dashboard data...')
      const response = await api.get('/groups/my-group/secretary-dashboard')
      console.log('[SecretaryDashboard] Response received:', response.data)
      
      if (response.data && response.data.success) {
        const data = response.data.data || {
          stats: {
            members: { total: 0, growth: '+0' },
            meetings: { total: 0, growth: '+0' },
            announcements: { total: 0, growth: '+0' },
            documents: { total: 0, growth: '+0' }
          },
          recentActivities: [],
          upcomingTasks: []
        }
        console.log('[SecretaryDashboard] Setting dashboard data:', {
          activitiesCount: data.recentActivities?.length || 0,
          tasksCount: data.upcomingTasks?.length || 0
        })
        setDashboardData(data)
      } else {
        const errorMsg = response.data?.message || 'Failed to fetch dashboard data'
        console.error('[SecretaryDashboard] Response not successful:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      console.error('[SecretaryDashboard] Error fetching dashboard data:', err)
      console.error('[SecretaryDashboard] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load dashboard data'
      setError(errorMessage)
      // Set default empty data on error to prevent crashes
      setDashboardData({
        stats: {
          members: { total: 0, growth: '+0' },
          meetings: { total: 0, growth: '+0' },
          announcements: { total: 0, growth: '+0' },
          documents: { total: 0, growth: '+0' }
        },
        recentActivities: [],
        upcomingTasks: []
      })
    } finally {
      setLoading(false)
    }
  }

  const secretaryStats = [
    { 
      label: t('members'), 
      value: dashboardData.stats.members.total.toString(), 
      icon: Users, 
      color: 'text-blue-600', 
      change: dashboardData.stats.members.growth 
    },
    { 
      label: t('meetings', { defaultValue: 'Meetings' }), 
      value: dashboardData.stats.meetings.total.toString(), 
      icon: FileText, 
      color: 'text-green-600', 
      change: dashboardData.stats.meetings.growth 
    },
    { 
      label: t('announcements', { defaultValue: 'Announcements' }), 
      value: dashboardData.stats.announcements.total.toString(), 
      icon: MessageCircle, 
      color: 'text-yellow-600', 
      change: dashboardData.stats.announcements.growth 
    },
    { 
      label: t('documentsArchived', { defaultValue: 'Documents Archived' }), 
      value: dashboardData.stats.documents.total.toString(), 
      icon: Archive, 
      color: 'text-purple-600', 
      change: dashboardData.stats.documents.growth 
    },
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting': return <FileText className="text-green-600" size={20} />
      case 'announcement': return <MessageCircle className="text-blue-600" size={20} />
      case 'member': return <Users className="text-purple-600" size={20} />
      case 'document': return <Archive className="text-orange-600" size={20} />
      case 'attendance': return <CheckCircle className="text-green-600" size={20} />
      case 'contribution': return <DollarSign className="text-blue-600" size={20} />
      case 'vote': return <Shield className="text-purple-600" size={20} />
      case 'vote_response': return <Users className="text-yellow-600" size={20} />
      default: return <Bell className="text-gray-600" size={20} />
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

  const handleTabClick = (tab) => {
    setSelectedTab(tab)
    // Navigate to specific pages for some tabs
    if (tab === 'members') {
      navigate('/secretary/members')
    } else if (tab === 'meetings') {
      navigate('/secretary/meetings')
    } else if (tab === 'announcements') {
      navigate('/secretary/communications')
    } else if (tab === 'compliance') {
      navigate('/secretary/compliance')
    } else if (tab === 'support') {
      navigate('/secretary/support')
    } else if (tab === 'archive') {
      navigate('/secretary/archive')
    } else if (tab === 'training') {
      navigate('/secretary/learning')
    } else if (tab === 'notifications') {
      navigate('/secretary/notifications')
    } else if (tab === 'reports') {
      navigate('/secretary/reports')
    }
  }

  const handleQuickAction = (action) => {
    if (action === 'new-meeting') {
      navigate('/secretary/meetings')
    } else if (action === 'send-announcement') {
      navigate('/secretary/communications')
    } else if (action === 'view-members') {
      navigate('/secretary/members')
    } else if (action === 'generate-report') {
      navigate('/secretary/reports')
    }
  }

  if (loading) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button onClick={fetchDashboardData} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('secretaryDashboard', { defaultValue: 'Secretary Dashboard' })}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('members')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {secretaryStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                    <p className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1.5 p-1.5 overflow-x-auto scrollbar-hide">
              {['overview', 'members', 'meetings', 'announcements', 'compliance', 'support', 'archive', 'training', 'notifications', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 overflow-x-auto max-w-full">
            {selectedTab === 'overview' && (
              <div className="space-y-6 max-w-full">
                {/* Recent Activities */}
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('recentActivities', { defaultValue: 'Recent Activities' })}</h2>
                  {dashboardData.recentActivities.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {dashboardData.recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {getActivityIcon(activity.type)}
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{activity.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{t('by', { defaultValue: 'By' })} {activity.member} ({activity.role})</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            activity.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            activity.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            activity.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            activity.status === 'archived' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                            activity.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                            'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Bell className="mx-auto mb-2" size={32} />
                      <p>No recent activities</p>
                    </div>
                  )}
                </div>

                {/* Upcoming Tasks */}
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('upcomingTasks', { defaultValue: 'Upcoming Tasks' })}</h2>
                  {dashboardData.upcomingTasks.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {dashboardData.upcomingTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-center gap-4">
                            <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{task.task || task.meetingTitle}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('due', { defaultValue: 'Due' })}: {task.dueDate} {task.scheduledTime ? `at ${task.scheduledTime}` : ''}
                              </p>
                              {task.location && task.location !== 'Not specified' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Location: {task.location}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <button 
                              onClick={() => navigate(`/secretary/meetings?meetingId=${task.meetingId}`)}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              View Meeting
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="mx-auto mb-2" size={32} />
                      <p>No upcoming tasks</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('memberRecordsManagement')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('maintainMemberRecords')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{t('viewAllMembers')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('accessMemberDatabase')}</p>
                  </div>
                  <div className="card text-center">
                    <Edit className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{t('updateRecords')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('modifyMemberInfo')}</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{t('exportData')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('generateMemberReports')}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'meetings' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('meetingDocumentation')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('recordArchiveMinutes')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <FileText className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{t('recordMinutes')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('documentMeetingProceedings')}</p>
                  </div>
                  <div className="card text-center">
                    <Archive className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{t('archiveDocuments', { defaultValue: 'Archive Documents' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('storeMeetingRecords', { defaultValue: 'Store meeting records' })}</p>
                  </div>
                  <div className="card text-center">
                    <CheckCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800 dark:text-white">{t('approveMinutes', { defaultValue: 'Approve Minutes' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('getAdminApproval', { defaultValue: 'Get admin approval' })}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'announcements' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Communication & Announcements</h2>
                <p className="text-gray-600">Manage group communications and notices</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <MessageCircle className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Create Announcements</h3>
                    <p className="text-sm text-gray-600">Post official notices</p>
                  </div>
                  <div className="card text-center">
                    <Bell className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Send Reminders</h3>
                    <p className="text-sm text-gray-600">Notify members of deadlines</p>
                  </div>
                  <div className="card text-center">
                    <Eye className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Notice Board</h3>
                    <p className="text-sm text-gray-600">Manage public notices</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'compliance' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Compliance & Transparency</h2>
                <p className="text-gray-600">Ensure group compliance and transparency</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Shield className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Rule Compliance</h3>
                    <p className="text-sm text-gray-600">Monitor group adherence</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Document Agreements</h3>
                    <p className="text-sm text-gray-600">Store signed resolutions</p>
                  </div>
                  <div className="card text-center">
                    <AlertCircle className="text-red-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Report Misconduct</h3>
                    <p className="text-sm text-gray-600">Flag violations</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'support' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Support to Group Admin & Cashier</h2>
                <p className="text-gray-600">Assist group leaders and financial team</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Member Verification</h3>
                    <p className="text-sm text-gray-600">Verify new member documents</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Loan Decisions</h3>
                    <p className="text-sm text-gray-600">Record loan outcomes</p>
                  </div>
                  <div className="card text-center">
                    <BarChart3 className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Financial Reports</h3>
                    <p className="text-sm text-gray-600">Prepare summaries</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'archive' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Documentation & Archiving</h2>
                <p className="text-gray-600">Store and organize group documents</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Archive className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Store Documents</h3>
                    <p className="text-sm text-gray-600">Archive all group data</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Categorize Archives</h3>
                    <p className="text-sm text-gray-600">Organize by date/event</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Generate Reports</h3>
                    <p className="text-sm text-gray-600">Create archive summaries</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'training' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Training & Member Education</h2>
                <p className="text-gray-600">Provide educational resources and support</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <BookOpen className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Educational Materials</h3>
                    <p className="text-sm text-gray-600">Post learning resources</p>
                  </div>
                  <div className="card text-center">
                    <MessageCircle className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Member Support</h3>
                    <p className="text-sm text-gray-600">Help with app usage</p>
                  </div>
                  <div className="card text-center">
                    <Bell className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Policy Updates</h3>
                    <p className="text-sm text-gray-600">Share official changes</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Notifications & Alerts</h2>
                <p className="text-gray-600">Manage alerts and member notifications</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Bell className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Receive Alerts</h3>
                    <p className="text-sm text-gray-600">Get system notifications</p>
                  </div>
                  <div className="card text-center">
                    <MessageCircle className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Send Notifications</h3>
                    <p className="text-sm text-gray-600">Notify members</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Activity Log</h3>
                    <p className="text-sm text-gray-600">Track all messages</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Reporting & Analytics</h2>
                <p className="text-gray-600">Generate comprehensive reports and insights</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <BarChart3 className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Meeting Statistics</h3>
                    <p className="text-sm text-gray-600">Attendance and engagement</p>
                  </div>
                  <div className="card text-center">
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Member Analytics</h3>
                    <p className="text-sm text-gray-600">Activity and status reports</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Export Reports</h3>
                    <p className="text-sm text-gray-600">Generate summaries</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('quickActions', { defaultValue: 'Quick Actions' })}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => handleQuickAction('new-meeting')}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Plus size={20} /> {t('newMeeting', { defaultValue: 'New Meeting' })}
            </button>
            <button 
              onClick={() => handleQuickAction('send-announcement')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <MessageCircle size={20} /> {t('sendAnnouncement', { defaultValue: 'Send Announcement' })}
            </button>
            <button 
              onClick={() => handleQuickAction('view-members')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Users size={20} /> {t('viewMembers', { defaultValue: 'View Members' })}
            </button>
            <button 
              onClick={() => handleQuickAction('generate-report')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Download size={20} /> {t('generateReport', { defaultValue: 'Generate Report' })}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryDashboard