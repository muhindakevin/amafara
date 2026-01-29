import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, TrendingUp, FileText, Megaphone, BarChart3, Eye, Plus, Settings, Bell, MessageCircle, FileCheck, Calendar, Vote, AlertCircle, Headphones, BookOpen, CheckCircle, XCircle, CreditCard, UserPlus, UserMinus } from 'lucide-react'
import Layout from '../components/Layout'
import BalanceCard from '../components/cards/BalanceCard'
import TransactionList from '../components/TransactionList'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminDashboard() {
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tGroupAdmin } = useTranslation('dashboard')
  const [selectedTab, setSelectedTab] = useState('overview')

  const { data: overview, setData: setOverview, loading, wrap } = useApiState({
    totalMembers: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    totalSavings: 0,
    groupName: '',
    secretary: null,
    cashier: null
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [dashboardMembers, setDashboardMembers] = useState([])
  const [dashboardApplications, setDashboardApplications] = useState([])
  const [dashboardLoans, setDashboardLoans] = useState([])
  const [dashboardAnnouncements, setDashboardAnnouncements] = useState([])

  useEffect(() => {
    let mounted = true
    wrap(async () => {
      // Get my group and stats
      const me = await api.get('/auth/me')
      const groupId = me.data?.data?.groupId
      if (!groupId || !mounted) return

      // Fetch all data in parallel with proper error handling
      const [group, stats, membersRes, applicationsRes, loansRes, announcementsRes, activitiesRes, usersRes] = await Promise.all([
        api.get(`/groups/${groupId}`).catch(err => {
          console.error('[GroupAdminDashboard] Error fetching group:', err)
          return { data: { success: false, data: null } }
        }),
        api.get(`/groups/${groupId}/stats`).catch(err => {
          console.error('[GroupAdminDashboard] Error fetching stats:', err)
          return { data: { success: false, data: {} } }
        }),
        api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false, data: { members: [] } } })),
        api.get(`/member-applications?groupId=${groupId}&status=all`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/loans/requests?status=all`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/announcements?groupId=${groupId}`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/groups/${groupId}/activities?limit=50`).catch(err => {
          console.error('[GroupAdminDashboard] Error fetching activities:', err)
          console.error('[GroupAdminDashboard] Error details:', err.response?.data || err.message)
          return { data: { success: false, data: [], error: err.message } }
        }),
        // Try to get users - if system-admin endpoint fails, get from group members
        api.get(`/system-admin/users`).catch(async () => {
          // Fallback: get users from group endpoint
          try {
            const groupData = await api.get(`/groups/${groupId}`)
            const members = groupData.data?.data?.members || []
            return { data: { success: true, data: members } }
          } catch {
            return { data: { success: false, data: [] } }
          }
        })
      ])

      if (!mounted) return

      // Get group name - try multiple sources with better extraction
      let name = ''
      if (group.data?.success && group.data?.data) {
        name = group.data.data.name ||
          group.data.data.groupInfo?.name ||
          group.data.name ||
          ''
      } else if (group.data?.name) {
        name = group.data.name
      }

      // If still no name, try to get it from the members response
      if (!name && membersRes.data?.success && membersRes.data?.data) {
        name = membersRes.data.data.name || ''
      }

      // Get stats with fallback
      const s = stats.data?.data || stats.data || {}

      // Log for debugging
      console.log('[GroupAdminDashboard] Group data:', {
        groupId,
        groupName: name,
        stats: s,
        groupResponse: group.data,
        membersResponse: membersRes.data
      })

      // Get secretary and cashier for this group
      const allUsers = usersRes.data?.data || []
      const secretary = allUsers.find(u => u.role === 'Secretary' && u.groupId === groupId)
      const cashier = allUsers.find(u => u.role === 'Cashier' && u.groupId === groupId)

      // Get members from group
      const groupMembers = membersRes.data?.data?.members || []

      // Get comprehensive activities from the new endpoint
      let activities = []
      if (activitiesRes.data?.success && Array.isArray(activitiesRes.data?.data)) {
        activities = activitiesRes.data.data.map(activity => ({
          ...activity,
          time: activity.time ? new Date(activity.time).toLocaleString() : ''
        }))
      } else if (Array.isArray(activitiesRes.data?.data)) {
        activities = activitiesRes.data.data.map(activity => ({
          ...activity,
          time: activity.time ? new Date(activity.time).toLocaleString() : ''
        }))
      } else if (Array.isArray(activitiesRes.data)) {
        activities = activitiesRes.data.map(activity => ({
          ...activity,
          time: activity.time ? new Date(activity.time).toLocaleString() : ''
        }))
      }

      // Log activities for debugging
      console.log('[GroupAdminDashboard] Activities received:', {
        count: activities.length,
        activities: activities.slice(0, 5), // Log first 5
        response: activitiesRes.data,
        success: activitiesRes.data?.success,
        hasData: !!activitiesRes.data?.data,
        isArray: Array.isArray(activitiesRes.data?.data)
      })

      // Get dashboard members (only from this group)
      const membersList = groupMembers
        .filter(m => m.role === 'Member')
        .slice(0, 5)
        .map(m => ({
          name: m.name,
          status: m.status || 'active',
          savings: `RWF ${Number(m.totalSavings || 0).toLocaleString()}`
        }))

      // Get applications
      const applications = (applicationsRes.data?.data || [])
        .slice(0, 4)
        .map(a => ({
          name: a.user?.name || 'Unknown',
          date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
          status: a.status,
          occupation: a.occupation || 'N/A'
        }))

      // Get loan requests
      const loans = (loansRes.data?.data || [])
        .filter(l => l.groupId === groupId)
        .slice(0, 3)
        .map(l => ({
          id: l.id,
          member: l.member?.name || 'Member',
          amount: `RWF ${Number(l.amount || 0).toLocaleString()}`,
          status: l.status,
          purpose: l.purpose || ''
        }))

      // Get announcements
      const announcements = (announcementsRes.data?.data || [])
        .slice(0, 3)
        .map(a => ({
          title: a.title,
          date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
          status: a.status === 'sent' ? 'sent' : 'draft',
          priority: a.priority || 'medium'
        }))

      // Calculate pending approvals from applications if not in stats
      const pendingApprovalsCount = s.pendingApprovals !== undefined && s.pendingApprovals !== null
        ? s.pendingApprovals
        : applications.filter(a => a.status === 'pending').length

      // Ensure we have a group name - if not, try one more time from me response
      let finalGroupName = name
      if (!finalGroupName || finalGroupName.trim() === '') {
        // Try to get from user's group info
        const userGroup = me.data?.data?.group
        if (userGroup?.name) {
          finalGroupName = userGroup.name
        }
      }

      // If still no name, show a placeholder but log warning
      if (!finalGroupName || finalGroupName.trim() === '') {
        console.warn('[GroupAdminDashboard] Could not fetch group name for groupId:', groupId)
        finalGroupName = t('myGroup', { defaultValue: 'My Group' }) // Fallback placeholder
      }

      setOverview({
        totalMembers: Number(s.totalMembers) || 0,
        activeLoans: Number(s.activeLoans) || 0,
        pendingApprovals: Number(pendingApprovalsCount) || 0,
        totalSavings: Number(s.totalSavings) || 0,
        groupName: finalGroupName.trim(),
        secretary: secretary ? { name: secretary.name, id: secretary.id } : null,
        cashier: cashier ? { name: cashier.name, id: cashier.id } : null
      })

      setRecentActivities(activities)
      setDashboardMembers(membersList)
      setDashboardApplications(applications)
      setDashboardLoans(loans)
      setDashboardAnnouncements(announcements)
    })

    return () => { mounted = false }
  }, [])

  const groupStats = [
    { label: t('totalMembers'), value: `${overview.totalMembers}`, icon: Users, color: 'text-blue-600' },
    { label: t('activeLoans'), value: `${overview.activeLoans}`, icon: DollarSign, color: 'text-green-600' },
    { label: t('pendingApprovals'), value: `${overview.pendingApprovals}`, icon: FileCheck, color: 'text-yellow-600' },
    { label: t('groupSavings'), value: `RWF ${Number(overview.totalSavings || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
  ]

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('groupAdminDashboard')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {loading ? tCommon('loading') : (
              overview.groupName
                ? overview.groupName
                : t('loadingGroupInfo', { defaultValue: 'Loading group information...' })
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {groupStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? tCommon('loading') : stat.value}</p>
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
              {['overview', 'members', 'applications', 'loans', 'announcements'].map((tab) => {
                const tabLabels = {
                  overview: t('recentActivities'),
                  members: t('members'),
                  applications: t('applications', { defaultValue: 'Applications' }),
                  loans: t('loanRequests', { defaultValue: 'Loan Requests' }),
                  announcements: t('announcements', { defaultValue: 'Announcements' })
                }
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${selectedTab === tab
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {tabLabels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('recentActivities')}</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>{t('loadingActivities', { defaultValue: 'Loading activities...' })}</p>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>{t('noRecentActivities')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => {
                      // Get icon based on activity type
                      const getActivityIcon = () => {
                        switch (activity.type) {
                          case 'contribution':
                            return <DollarSign className="text-green-600" size={20} />
                          case 'loan':
                            return <CreditCard className="text-blue-600" size={20} />
                          case 'announcement':
                            return <Megaphone className="text-purple-600" size={20} />
                          case 'application':
                            return activity.status === 'approved'
                              ? <UserPlus className="text-green-600" size={20} />
                              : <UserMinus className="text-red-600" size={20} />
                          case 'admin_action':
                            return <Settings className="text-gray-600" size={20} />
                          default:
                            return <FileText className="text-gray-600" size={20} />
                        }
                      }

                      // Get status badge color
                      const getStatusColor = () => {
                        if (activity.status === 'completed' || activity.status === 'approved') {
                          return 'bg-green-100 text-green-700'
                        } else if (activity.status === 'rejected') {
                          return 'bg-red-100 text-red-700'
                        } else if (activity.status === 'pending') {
                          return 'bg-yellow-100 text-yellow-700'
                        }
                        return 'bg-gray-100 text-gray-700'
                      }

                      // Format payment method
                      const formatPaymentMethod = (method) => {
                        if (!method) return ''
                        const methods = {
                          'cash': t('cash', { defaultValue: 'Cash' }),
                          'mtn_mobile_money': t('mtnMobileMoney', { defaultValue: 'MTN Mobile Money' }),
                          'airtel_money': t('airtelMoney', { defaultValue: 'Airtel Money' }),
                          'bank_transfer': t('bankTransfer', { defaultValue: 'Bank Transfer' })
                        }
                        return methods[method] || method
                      }

                      return (
                        <div
                          key={activity.id || index}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors border border-gray-100"
                        >
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border-2 border-gray-100">
                            {getActivityIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 mb-1">{activity.title}</p>
                            <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                            {activity.paymentMethod && (
                              <p className="text-xs text-gray-500 mb-1">
                                Payment Method: <span className="font-semibold">{formatPaymentMethod(activity.paymentMethod)}</span>
                                {activity.receiptNumber && ` | Receipt: ${activity.receiptNumber}`}
                              </p>
                            )}
                            {activity.createdBy && (
                              <p className="text-xs text-gray-500 mb-1">
                                Created by: <span className="font-semibold">{activity.createdBy}</span>
                              </p>
                            )}
                            {activity.reviewedBy && (
                              <p className="text-xs text-gray-500 mb-1">
                                Reviewed by: <span className="font-semibold">{activity.reviewedBy}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor()}`}>
                            {activity.status === 'completed' ? 'Completed' :
                              activity.status === 'approved' ? 'Approved' :
                                activity.status === 'rejected' ? 'Rejected' :
                                  activity.status === 'pending' ? 'Pending' :
                                    activity.status || 'Active'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="btn-primary w-full"
                >
                  {t('dashboard.viewAll', { defaultValue: 'View All' })} {t('groupAdmin.analytics', { defaultValue: 'Analytics' })}
                </button>
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">{t('dashboard.members', { defaultValue: 'Members' })}</h2>
                  {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => navigate('/admin/members')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} /> {t('groupAdmin.addMember', { defaultValue: 'Add Member' })}
                    </button>
                  )}
                </div>
                {dashboardMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No members found in your group yet. Add members to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.name[0]}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.savings}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${member.status === 'active' ? 'bg-green-100 text-green-700' :
                              member.status === 'burned' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'applications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('applications', { defaultValue: 'Applications' })}</h2>
                  {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                    <button
                      onClick={() => navigate('/admin/applications')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Users size={18} /> {tCommon('view')} {t('applications', { defaultValue: 'Applications' })}
                    </button>
                  )}
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingApplications', { defaultValue: 'Loading applications...' })}</p>
                ) : dashboardApplications.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noApplicationsFound', { defaultValue: 'No applications found. Applications will appear here when new members apply to join your group.' })}</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {dashboardApplications.map((applicant, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800">{applicant.name}</h3>
                              <p className="text-sm text-gray-600">{applicant.occupation}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('applied', { defaultValue: 'Applied' })}: {applicant.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${applicant.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  applicant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {applicant.status}
                              </span>
                              {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
                                <button
                                  onClick={() => navigate('/admin/applications')}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                                >
                                  {t('review', { defaultValue: 'Review' })}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/admin/applications')}
                      className="btn-secondary w-full"
                    >
                      {tCommon('view')} {t('applications', { defaultValue: 'Applications' })}
                    </button>
                  </>
                )}
              </div>
            )}

            {selectedTab === 'loans' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('loanRequests', { defaultValue: 'Loan Requests' })}</h2>
                  {hasPermission(user, PERMISSIONS.MANAGE_LOANS) && (
                    <button
                      onClick={() => navigate('/admin/loan-requests')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Eye size={18} /> {t('viewAllLoans')}
                    </button>
                  )}
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingLoanRequests', { defaultValue: 'Loading loan requests...' })}</p>
                ) : dashboardLoans.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noLoanRequestsFound', { defaultValue: 'No loan requests found. Loan requests from your group members will appear here.' })}</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {dashboardLoans.map((loan, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800">{loan.member}</h3>
                              <p className="text-sm text-gray-600">{loan.purpose}</p>
                              <p className="text-sm font-semibold text-primary-600">{loan.amount}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${loan.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {loan.status}
                              </span>
                              {hasPermission(user, PERMISSIONS.MANAGE_LOANS) && (
                                <button
                                  onClick={() => navigate('/admin/loan-requests')}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                                >
                                  {t('review', { defaultValue: 'Review' })}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/admin/loan-requests')}
                      className="btn-secondary w-full"
                    >
                      {t('viewAllLoans')}
                    </button>
                  </>
                )}
              </div>
            )}

            {selectedTab === 'announcements' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('announcements', { defaultValue: 'Announcements' })}</h2>
                  {hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                    <button
                      onClick={() => navigate('/admin/announcements')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} /> {t('createAnnouncement')}
                    </button>
                  )}
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingAnnouncements', { defaultValue: 'Loading announcements...' })}</p>
                ) : dashboardAnnouncements.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noAnnouncementsFound', { defaultValue: 'No announcements found. Create an announcement to communicate with your group members.' })}</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {dashboardAnnouncements.map((announcement, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                              <p className="text-sm text-gray-600">{announcement.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${announcement.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {announcement.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${announcement.status === 'sent' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                {announcement.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/admin/announcements')}
                        className="btn-secondary flex-1"
                      >
                        {t('common.view', { defaultValue: 'View' })} {t('groupAdmin.announcements', { defaultValue: 'Announcements' })}
                      </button>
                      {hasPermission(user, PERMISSIONS.MANAGE_CONTRIBUTIONS) && (
                        <button
                          onClick={() => navigate('/admin/contributions')}
                          className="btn-primary flex-1"
                        >
                          {t('common.edit', { defaultValue: 'Edit' })} {t('groupAdmin.contributions', { defaultValue: 'Contributions' })}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/loan-requests')}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <DollarSign size={20} /> {t('loanRequests', { defaultValue: 'Loan Requests' })}
            </button>
            <button
              onClick={() => navigate('/admin/members')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Users size={20} /> {t('manageMembers', { defaultValue: 'Manage Members' })}
            </button>
            <button
              onClick={() => navigate('/admin/contributions')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <DollarSign size={20} /> {t('contributions', { defaultValue: 'Contributions' })}
            </button>
            <button
              onClick={() => navigate('/admin/fines')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <AlertCircle size={20} /> {t('fines')}
            </button>
            <button
              onClick={() => navigate('/admin/meetings')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Calendar size={20} /> {t('meetings', { defaultValue: 'Meetings' })}
            </button>
            <button
              onClick={() => navigate('/admin/voting')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Vote size={20} /> {t('voting')}
            </button>
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={() => navigate('/admin/analytics')}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
              >
                <BarChart3 size={20} /> {t('analytics', { defaultValue: 'Analytics' })}
              </button>
            )}
            <button
              onClick={() => navigate('/admin/announcements')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Megaphone size={20} /> {t('groupAdmin.announcements', { defaultValue: 'Announcements' })}
            </button>
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={() => navigate('/admin/transactions')}
                className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
              >
                <FileText size={20} /> {t('dashboard.transactions', { defaultValue: 'Transactions' })}
              </button>
            )}
            <button
              onClick={() => navigate('/admin/agent')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Headphones size={20} /> {t('groupAdmin.agentSupport', { defaultValue: 'Agent Support' })}
            </button>
            <button
              onClick={() => navigate('/admin/learn-grow')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <BookOpen size={20} /> {t('dashboard.learnGrow', { defaultValue: 'Learn & Grow' })}
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Settings size={20} /> {t('common.settings', { defaultValue: 'Settings' })}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminDashboard


