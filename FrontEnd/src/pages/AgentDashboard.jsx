import { useState, useEffect } from 'react'
import { Users, Building2, UserCheck, Shield, BarChart3, BookOpen, FileCheck, MessageCircle, Plus, Eye, Edit, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../utils/api'

function AgentDashboard() {
  const { language } = useLanguage()
  const [selectedTab, setSelectedTab] = useState('overview')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    pendingApprovals: 0,
    complianceScore: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [topGroups, setTopGroups] = useState([])

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const [groupsRes, analyticsRes, auditRes] = await Promise.all([
          api.get('/groups'),
          api.get('/analytics'),
          api.get('/audit-logs?limit=10').catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (!mounted) return

        const groups = groupsRes.data?.data || []
        const analytics = analyticsRes.data?.data || {}
        const audits = auditRes.data?.data || []

        // Map audit logs to activities
        const activities = audits.slice(0, 5).map(audit => ({
          type: audit.action.toLowerCase().includes('group') ? 'group' :
                audit.action.toLowerCase().includes('member') ? 'member' :
                audit.action.toLowerCase().includes('compliance') ? 'compliance' : 'training',
          title: audit.action.replace(/_/g, ' '),
          group: audit.entityType || 'System',
          time: audit.createdAt ? new Date(audit.createdAt).toLocaleString() : '',
          status: 'completed'
        }))

        // Calculate top groups by total savings
        const topGroupsData = groups
          .filter(g => g.status === 'active')
          .sort((a, b) => (b.totalSavings || 0) - (a.totalSavings || 0))
          .slice(0, 3)
          .map(g => ({
            name: g.name,
            district: g.district || 'N/A',
            members: g.totalMembers || 0,
            contributions: Number(g.totalSavings || 0),
            score: g.totalMembers > 0 ? Math.min(100, Math.round(((g.totalSavings || 0) / (g.totalMembers * 1000)) * 100)) : 0
          }))

        // Get pending member applications
        const pendingRes = await api.get('/member-applications?status=pending').catch(() => ({ data: { success: false, data: [] } }))
        const pendingCount = pendingRes.data?.data?.length || 0

        setStats({
          totalGroups: groups.length,
          totalMembers: analytics.totalMembers || 0,
          pendingApprovals: pendingCount,
          complianceScore: groups.length > 0 ? Math.round((groups.filter(g => g.status === 'active').length / groups.length) * 100) : 0
        })
        setRecentActivities(activities)
        setTopGroups(topGroupsData)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const agentStats = [
    { label: 'Total Groups', value: stats.totalGroups.toString(), icon: Building2, color: 'text-blue-600', change: '' },
    { label: t('dashboard.members', language), value: stats.totalMembers.toLocaleString(), icon: Users, color: 'text-green-600', change: '' },
    { label: t('dashboard.pending', language), value: stats.pendingApprovals.toString(), icon: UserCheck, color: 'text-yellow-600', change: '' },
    { label: 'Compliance Score', value: `${stats.complianceScore}%`, icon: Shield, color: 'text-purple-600', change: '' },
  ]

  const upcomingTasks = [] // Tasks can be added later when task management is implemented

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

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agent Dashboard</h1>
          <p className="text-gray-600 mt-1">Field operator and regional coordinator for UMURENGE WALLET</p>
        </div>

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
              {['overview', 'groups', 'members', 'roles', 'compliance', 'reports', 'training', 'audit', 'communications'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activities */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
                  <div className="space-y-3">
                    {recentActivities.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent activities. Activities will appear here as they occur.</p>
                    ) : (
                      recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="font-semibold text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.group}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
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
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Tasks</h2>
                  <div className="space-y-3">
                    {upcomingTasks.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No upcoming tasks.</p>
                    ) : (
                      upcomingTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="text-yellow-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-800">{task.task}</p>
                            <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <button className="btn-primary text-sm px-3 py-1">
                            Start Task
                          </button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Performing Groups */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performing Groups</h2>
                  <div className="space-y-3">
                    {topGroups.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No groups available. Register groups to see performance metrics.</p>
                    ) : (
                      topGroups.map((group, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{group.name}</p>
                            <p className="text-sm text-gray-600">{group.district} • {group.members} members</p>
                            <p className="text-sm text-gray-500">{group.contributions.toLocaleString()} RWF contributions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Performance Score</p>
                          <p className="text-xl font-bold text-green-600">{group.score}%</p>
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
                    onClick={() => navigate('/agent/training')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <MessageCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Support</h3>
                    <p className="text-sm text-gray-600">Troubleshooting and assistance</p>
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
            <button 
              onClick={() => navigate('/agent/groups')}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Plus size={20} /> Register Group
            </button>
            <button 
              onClick={() => navigate('/agent/members')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Users size={20} /> Add Member
            </button>
            <button 
              onClick={() => navigate('/agent/reports')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <BarChart3 size={20} /> Generate Report
            </button>
            <button 
              onClick={() => navigate('/agent/communications')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <MessageCircle size={20} /> Send Message
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AgentDashboard