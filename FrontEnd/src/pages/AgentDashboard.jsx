import { useState, useEffect, useContext } from 'react'
import { Users, Building2, UserCheck, Shield, BarChart3, BookOpen, FileCheck, MessageCircle, Plus, Eye, Edit, Download, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function AgentDashboard() {
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [selectedTab, setSelectedTab] = useState('overview')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    pendingApprovals: 0,
    complianceScore: 0
  })
  const [error, setError] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [topGroups, setTopGroups] = useState([])
  const [upcomingTasks, setUpcomingTasks] = useState([])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all dashboard data from new endpoints
      const [statsRes, activitiesRes, tasksRes, topGroupsRes] = await Promise.all([
        api.get('/agent/dashboard/stats').catch((err) => {
          console.error('[AgentDashboard] Failed to fetch stats:', err)
          console.error('[AgentDashboard] Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
          })
          // Return error response structure
          return {
            data: {
              success: false,
              data: {},
              message: err.response?.data?.message || err.message || 'Failed to fetch statistics'
            },
            isError: true
          }
        }),
        api.get('/agent/dashboard/activities?limit=10').catch((err) => {
          console.error('[AgentDashboard] Failed to fetch activities:', err)
          return { data: { success: false, data: [] } }
        }),
        api.get('/agent/dashboard/tasks').catch((err) => {
          console.error('[AgentDashboard] Failed to fetch tasks:', err)
          return { data: { success: false, data: [] } }
        }),
        api.get('/agent/dashboard/top-groups?limit=5').catch((err) => {
          console.error('[AgentDashboard] Failed to fetch top groups:', err)
          return { data: { success: false, data: [] } }
        })
      ])

      // Log the responses for debugging
      console.log('[AgentDashboard] Stats response:', statsRes.data)
      console.log('[AgentDashboard] Activities response:', activitiesRes.data)
      console.log('[AgentDashboard] Tasks response:', tasksRes.data)
      console.log('[AgentDashboard] Top groups response:', topGroupsRes.data)

      // Set stats
      if (statsRes.isError) {
        // API call failed
        const errorMsg = statsRes.data?.message || 'Failed to load dashboard statistics'
        console.error('[AgentDashboard] Stats API call failed:', errorMsg)
        setError(errorMsg)
      } else if (statsRes.data?.success && statsRes.data.data) {
        console.log('[AgentDashboard] Setting stats:', statsRes.data.data)
        setStats({
          totalGroups: Number(statsRes.data.data.totalGroups) || 0,
          totalMembers: Number(statsRes.data.data.totalMembers) || 0,
          pendingApprovals: Number(statsRes.data.data.pendingApprovals) || 0,
          complianceScore: Number(statsRes.data.data.complianceScore) || 0
        })
        setError(null)
      } else {
        console.warn('[AgentDashboard] Stats response was not successful:', statsRes.data)
        const errorMsg = statsRes.data?.message || statsRes.response?.data?.message || 'Failed to load dashboard statistics'
        setError(errorMsg)
      }

      // Set recent activities
      if (activitiesRes.data?.success) {
        setRecentActivities(activitiesRes.data.data)
      }

      // Set top groups
      if (topGroupsRes.data?.success) {
        setTopGroups(topGroupsRes.data.data)
      }

      // Set upcoming tasks
      if (tasksRes.data?.success) {
        setUpcomingTasks(tasksRes.data.data)
      }
    } catch (err) {
      console.error('[AgentDashboard] Failed to load dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    loadDashboardData().then(() => {
      if (!mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const agentStats = [
    { label: t('totalGroups'), value: stats.totalGroups.toString(), icon: Building2, color: 'text-blue-600', change: '' },
    { label: t('members'), value: stats.totalMembers.toLocaleString(), icon: Users, color: 'text-green-600', change: '' },
    { label: t('pendingApprovals'), value: stats.pendingApprovals.toString(), icon: UserCheck, color: 'text-yellow-600', change: '' },
    { label: t('complianceScore'), value: `${stats.complianceScore}%`, icon: Shield, color: 'text-purple-600', change: '' },
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'group': return <Building2 className="text-blue-600" size={20} />
      case 'member': return <Users className="text-green-600" size={20} />
      case 'compliance': return <Shield className="text-purple-600" size={20} />
      case 'training': return <BookOpen className="text-orange-600" size={20} />
      default: return <AlertCircle className="text-gray-600" size={20} />
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

  if (loading) {
    return (
      <Layout userRole="Agent">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" text="Loading dashboard..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('agentDashboard')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('fieldOperator')}</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} /> Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold">Error loading dashboard data</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-2 text-sm underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {agentStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['overview', 'groups', 'members', 'roles', 'compliance', 'reports', 'training', 'audit', 'communications'].map((tab) => {
                const tabPermissions = {
                  groups: PERMISSIONS.MANAGE_GROUPS,
                  members: PERMISSIONS.MANAGE_USERS,
                  roles: PERMISSIONS.MANAGE_USERS,
                  compliance: PERMISSIONS.MANAGE_GROUPS,
                  reports: PERMISSIONS.VIEW_REPORTS,
                  audit: PERMISSIONS.MANAGE_GROUPS,
                  communications: PERMISSIONS.SEND_NOTIFICATIONS
                }

                if (tabPermissions[tab] && !hasPermission(user, tabPermissions[tab])) return null

                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${selectedTab === tab
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {t(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activities */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('recentActivities')}</h2>
                  <div className="space-y-3">
                    {recentActivities.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('noRecentActivities', { defaultValue: 'No recent activities. Activities will appear here as they occur.' })}</p>
                    ) : (
                      recentActivities.map((activity, index) => (
                        <div
                          key={activity.id || index}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {getActivityIcon(activity.type)}
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{activity.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{activity.entityType}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                            {activity.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Tasks */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('upcomingTasks', { defaultValue: 'Upcoming Tasks' })}</h2>
                  <div className="space-y-3">
                    {upcomingTasks.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('noUpcomingTasks', { defaultValue: 'No upcoming tasks.' })}</p>
                    ) : (
                      upcomingTasks.map((task, index) => (
                        <div
                          key={task.id || index}
                          className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-center gap-4">
                            <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{task.task}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Due: {task.dueDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <button
                              onClick={() => {
                                if (task.id === 'pending-applications') {
                                  navigate('/agent/members')
                                } else if (task.id === 'compliance-review') {
                                  navigate('/agent/compliance')
                                } else if (task.id === 'upcoming-meetings') {
                                  // Navigate to meetings if that page exists
                                  navigate('/agent/groups')
                                }
                              }}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Performing Groups */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Top Performing Groups</h2>
                  <div className="space-y-3">
                    {topGroups.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No groups available. Register groups to see performance metrics.</p>
                    ) : (
                      topGroups.map((group, index) => (
                        <div
                          key={group.id || index}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{group.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{group.district} • {group.members} members</p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">{group.contributions.toLocaleString()} RWF contributions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Performance Score</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">{group.score}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'groups' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Group (Ikimina) Registration & Management</h2>
                <p className="text-gray-600">Register new Ibimina and manage existing groups</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/groups')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Building2 className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Register New Group</h3>
                    <p className="text-sm text-gray-600">Create new Ikimina saving group</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/groups')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Manage Groups</h3>
                    <p className="text-sm text-gray-600">View and update group information</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/roles')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Edit className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Assign Roles</h3>
                    <p className="text-sm text-gray-600">Create Admin, Cashier, Secretary accounts</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Member Management Assistance</h2>
                <p className="text-gray-600">Assist with member registration and management</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/members')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <UserCheck className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Add Member</h3>
                    <p className="text-sm text-gray-600">Manual member registration</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/members')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Eye className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">View Members</h3>
                    <p className="text-sm text-gray-600">All members under supervision</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/members')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Edit className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Edit Information</h3>
                    <p className="text-sm text-gray-600">Correct member details</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'roles' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">User Role & Privilege Management</h2>
                <p className="text-gray-600">Manage user roles and permissions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/roles')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Assign Roles</h3>
                    <p className="text-sm text-gray-600">Admin, Cashier, Secretary</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/roles')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Shield className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Manage Privileges</h3>
                    <p className="text-sm text-gray-600">Suspend or reinstate users</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/roles')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Edit className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Transfer Users</h3>
                    <p className="text-sm text-gray-600">Move between groups</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'compliance' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Monitoring & Compliance</h2>
                <p className="text-gray-600">Monitor group activities and ensure compliance</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/compliance')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Shield className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Monitor Activities</h3>
                    <p className="text-sm text-gray-600">Financial and operational monitoring</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/compliance')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BarChart3 className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Performance Metrics</h3>
                    <p className="text-sm text-gray-600">Track group performance</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/compliance')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <AlertCircle className="text-red-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Detect Fraud</h3>
                    <p className="text-sm text-gray-600">Identify suspicious activities</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Reporting & Analytics</h2>
                <p className="text-gray-600">Generate comprehensive reports and insights</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/reports')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BarChart3 className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Performance Reports</h3>
                    <p className="text-sm text-gray-600">Daily, weekly, monthly reports</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/reports')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Download className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Export Data</h3>
                    <p className="text-sm text-gray-600">Detailed analytics export</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/reports')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Eye className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">AI Analytics</h3>
                    <p className="text-sm text-gray-600">Top performers and risk analysis</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'training' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Training & Support</h2>
                <p className="text-gray-600">Provide training and support to groups</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/training')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BookOpen className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Onboarding Training</h3>
                    <p className="text-sm text-gray-600">New group training</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/training')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Refresher Sessions</h3>
                    <p className="text-sm text-gray-600">Regular training updates</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/support')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <MessageCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Support Requests</h3>
                    <p className="text-sm text-gray-600">View and manage support requests</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'audit' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Audit & Verification</h2>
                <p className="text-gray-600">Verify groups and conduct audits</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/audit')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <FileCheck className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Verify Groups</h3>
                    <p className="text-sm text-gray-600">Authenticate new groups</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/audit')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Eye className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Check Records</h3>
                    <p className="text-sm text-gray-600">Financial record verification</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/audit')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Audit Reports</h3>
                    <p className="text-sm text-gray-600">Generate audit documentation</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'communications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Communication & Notifications</h2>
                <p className="text-gray-600">Communicate with groups and send notifications</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/agent/communications')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <MessageCircle className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Broadcast Messages</h3>
                    <p className="text-sm text-gray-600">Send to all groups</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/communications')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Bell className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Policy Updates</h3>
                    <p className="text-sm text-gray-600">Communicate changes</p>
                  </button>
                  <button
                    onClick={() => navigate('/agent/communications')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Group Chat</h3>
                    <p className="text-sm text-gray-600">Direct communication</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasPermission(user, PERMISSIONS.MANAGE_GROUPS) && (
              <button
                onClick={() => navigate('/agent/groups')}
                className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
              >
                <Plus size={20} /> Register Group
              </button>
            )}
            {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
              <button
                onClick={() => navigate('/agent/members')}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
              >
                <Users size={20} /> Add Member
              </button>
            )}
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={() => navigate('/agent/reports')}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
              >
                <BarChart3 size={20} /> Generate Report
              </button>
            )}
            {hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
              <button
                onClick={() => navigate('/agent/communications')}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
              >
                <MessageCircle size={20} /> Send Message
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AgentDashboard