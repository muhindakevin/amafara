import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, DollarSign, TrendingUp, FileText, Megaphone, BarChart3, Eye, Plus, Settings, Bell, MessageCircle, FileCheck, Calendar, Vote, AlertCircle, Headphones, BookOpen } from 'lucide-react'
import Layout from '../components/Layout'
import BalanceCard from '../components/cards/BalanceCard'
import TransactionList from '../components/TransactionList'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function GroupAdminDashboard() {
  const navigate = useNavigate()
  const { language } = useLanguage()
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
      
      const [group, stats, membersRes, applicationsRes, loansRes, announcementsRes, auditRes, usersRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/stats`),
        api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false, data: { members: [] } } })),
        api.get(`/member-applications?groupId=${groupId}&status=all`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/loans/requests?status=pending`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/announcements?groupId=${groupId}`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/audit-logs?limit=20`).catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/system-admin/users`).catch(() => ({ data: { success: false, data: [] } }))
      ])
      
      if (!mounted) return

      const name = group.data?.data?.name || ''
      const s = stats.data?.data || {}
      
      // Get secretary and cashier for this group
      const allUsers = usersRes.data?.data || []
      const secretary = allUsers.find(u => u.role === 'Secretary' && u.groupId === groupId)
      const cashier = allUsers.find(u => u.role === 'Cashier' && u.groupId === groupId)
      
      // Get members from group
      const groupMembers = membersRes.data?.data?.members || []
      const currentUserId = me.data?.data?.id
      const memberIds = [currentUserId, secretary?.id, cashier?.id, ...groupMembers.map(m => m.id)].filter(Boolean)
      
      // Filter audit logs for recent activities (from group admin, members, secretary, cashier)
      const audits = auditRes.data?.data || []
      const groupAudits = audits.filter(a => {
        if (!a) return false
        // Filter by groupId in entityId or userId in memberIds
        const isGroupAudit = a.entityType === 'Group' && a.entityId === groupId
        const isUserAudit = a.userId && memberIds.includes(a.userId)
        const isLoanAudit = a.entityType === 'Loan' && a.entityId && loans.some(l => l.id === a.entityId)
        const isContributionAudit = a.entityType === 'Contribution' && a.entityId && groupMembers.some(m => m.id === a.entityId)
        return isGroupAudit || isUserAudit || isLoanAudit || isContributionAudit
      }).slice(0, 5)
      
      const activities = groupAudits.map(audit => ({
        type: (audit.action || '').toLowerCase().includes('loan') ? 'loan' :
              (audit.action || '').toLowerCase().includes('contribution') ? 'contribution' :
              (audit.action || '').toLowerCase().includes('member') ? 'member' :
              (audit.action || '').toLowerCase().includes('application') ? 'application' : 'general',
        title: (audit.action || 'Activity').replace(/_/g, ' '),
        member: audit.entityType === 'User' ? (audit.entityId || 'System') : 'System',
        time: audit.createdAt ? new Date(audit.createdAt).toLocaleString() : '',
        status: (audit.action || '').includes('APPROVE') ? 'completed' : 
                (audit.action || '').includes('REJECT') ? 'rejected' : 'pending'
      }))
      
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
      
      setOverview({
        totalMembers: s.totalMembers || 0,
        activeLoans: s.activeLoans || 0,
        pendingApprovals: applications.filter(a => a.status === 'pending').length,
        totalSavings: s.totalSavings || 0,
        groupName: name,
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
    { label: t('groupAdmin.totalMembers', language), value: `${overview.totalMembers}`, icon: Users, color: 'text-blue-600' },
    { label: t('groupAdmin.activeLoans', language), value: `${overview.activeLoans}`, icon: DollarSign, color: 'text-green-600' },
    { label: t('groupAdmin.pendingApprovals', language), value: `${overview.pendingApprovals}`, icon: FileCheck, color: 'text-yellow-600' },
    { label: t('groupAdmin.groupSavings', language), value: `RWF ${Number(overview.totalSavings || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
  ]

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('groupAdmin.dashboard', language)}</h1>
          <p className="text-gray-600 mt-1">{loading ? 'Loading…' : `Manage Ikimina "${overview.groupName || '—'}" - ${overview.totalMembers} ${t('dashboard.members', language)}`}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {groupStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{loading ? 'Loading…' : stat.value}</p>
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
                  overview: t('groupAdmin.recentActivities', language),
                  members: t('dashboard.members', language),
                  applications: t('groupAdmin.applications', language),
                  loans: t('groupAdmin.loanRequests', language),
                  announcements: t('groupAdmin.announcements', language)
                }
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedTab === tab
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
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
                <h2 className="text-xl font-bold text-gray-800">{t('groupAdmin.recentActivities', language)}</h2>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {activity.member[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{activity.member}</p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        activity.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => navigate('/admin/analytics')}
                  className="btn-primary w-full"
                >
                  {t('dashboard.viewAll', language)} {t('groupAdmin.analytics', language)}
                </button>
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">{t('dashboard.members', language)}</h2>
                  <button
                    onClick={() => navigate('/admin/members')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} /> {t('groupAdmin.addMember', language)}
                  </button>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            member.status === 'active' ? 'bg-green-100 text-green-700' : 
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
                  <h2 className="text-xl font-bold text-gray-800">{t('groupAdmin.applications', language)}</h2>
                  <button
                    onClick={() => navigate('/admin/applications')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Users size={18} /> {t('common.view', language)} {t('groupAdmin.applications', language)}
                  </button>
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Loading applications...</p>
                ) : dashboardApplications.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No applications found. Applications will appear here when new members apply to join your group.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {dashboardApplications.map((applicant, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800">{applicant.name}</h3>
                              <p className="text-sm text-gray-600">{applicant.occupation}</p>
                              <p className="text-sm text-gray-500">Applied: {applicant.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                applicant.status === 'approved' ? 'bg-green-100 text-green-700' :
                                applicant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {applicant.status}
                              </span>
                              <button
                                onClick={() => navigate('/admin/applications')}
                                className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/admin/applications')}
                      className="btn-secondary w-full"
                    >
                      {t('common.view', language)} {t('groupAdmin.applications', language)}
                    </button>
                  </>
                )}
              </div>
            )}

            {selectedTab === 'loans' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">{t('groupAdmin.loanRequests', language)}</h2>
                  <button
                    onClick={() => navigate('/admin/loan-requests')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Eye size={18} /> {t('groupAdmin.viewAllLoans', language)}
                  </button>
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Loading loan requests...</p>
                ) : dashboardLoans.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No loan requests found. Loan requests from your group members will appear here.</p>
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
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                loan.status === 'approved' ? 'bg-green-100 text-green-700' :
                                loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {loan.status}
                              </span>
                              <button
                                onClick={() => navigate('/admin/loan-requests')}
                                className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                              >
                                Review
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/admin/loan-requests')}
                      className="btn-secondary w-full"
                    >
                      {t('groupAdmin.viewAllLoans', language)}
                    </button>
                  </>
                )}
              </div>
            )}

            {selectedTab === 'announcements' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">{t('groupAdmin.announcements', language)}</h2>
                  <button
                    onClick={() => navigate('/admin/announcements')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} /> {t('groupAdmin.createAnnouncement', language)}
                  </button>
                </div>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Loading announcements...</p>
                ) : dashboardAnnouncements.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No announcements found. Create an announcement to communicate with your group members.</p>
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
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                announcement.priority === 'high' ? 'bg-red-100 text-red-700' :
                                announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {announcement.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                announcement.status === 'sent' ? 'bg-green-100 text-green-700' :
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
                        {t('common.view', language)} {t('groupAdmin.announcements', language)}
                      </button>
                      <button
                        onClick={() => navigate('/admin/contributions')}
                        className="btn-primary flex-1"
                      >
                        {t('common.edit', language)} {t('groupAdmin.contributions', language)}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.quickActions', language)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/loan-requests')}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <DollarSign size={20} /> {t('groupAdmin.loanRequests', language)}
            </button>
            <button
              onClick={() => navigate('/admin/members')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Users size={20} /> {t('groupAdmin.manageMembers', language)}
            </button>
            <button
              onClick={() => navigate('/admin/contributions')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <DollarSign size={20} /> {t('groupAdmin.contributions', language)}
            </button>
            <button
              onClick={() => navigate('/admin/fines')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <AlertCircle size={20} /> {t('groupAdmin.fines', language)}
            </button>
            <button
              onClick={() => navigate('/admin/meetings')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Calendar size={20} /> {t('groupAdmin.meetings', language)}
            </button>
            <button
              onClick={() => navigate('/admin/voting')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Vote size={20} /> {t('groupAdmin.voting', language)}
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <BarChart3 size={20} /> {t('groupAdmin.analytics', language)}
            </button>
            <button
              onClick={() => navigate('/admin/announcements')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Megaphone size={20} /> {t('groupAdmin.announcements', language)}
            </button>
            <button
              onClick={() => navigate('/admin/transactions')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <FileText size={20} /> {t('dashboard.transactions', language)}
            </button>
            <button
              onClick={() => navigate('/admin/agent')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Headphones size={20} /> {t('groupAdmin.agentSupport', language)}
            </button>
            <button
              onClick={() => navigate('/admin/learn-grow')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <BookOpen size={20} /> {t('dashboard.learnGrow', language)}
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Settings size={20} /> {t('common.settings', language)}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminDashboard


