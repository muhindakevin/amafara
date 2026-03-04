import { useEffect, useState } from 'react'
import { Users, Building2, UserCheck, Shield, BarChart3, BookOpen, FileCheck, MessageCircle, Plus, Eye, Edit, Download, CheckCircle, AlertCircle, Clock, Settings, Database, CreditCard, TrendingUp, Globe, Headphones, FileText, UserCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function SystemAdminDashboard() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const navigate = useNavigate()

  const { data: sys, setData: setSys, loading, wrap } = useApiState({
    totalUsers: 0,
    activeAgents: 0,
    totalBranches: 0,
    totalGroups: 0,
    totalMembers: 0,
    transactions: 0,
    totalSavings: 0,
    loans: 0
  })

  useEffect(() => {
    wrap(async () => {
      try {
        const [users, branches, agents, groupsCount, membersCount, groups, loans, transactionsCount] = await Promise.all([
          api.get('/system-admin/users/count').catch((err) => {
            console.error('[SystemAdminDashboard] Failed to fetch users count:', err)
            console.error('[SystemAdminDashboard] Error details:', {
              message: err.message,
              response: err.response?.data,
              status: err.response?.status
            })
            return { data: { success: false, data: { count: 0 } } }
          }),
          api.get('/system-admin/branches/count').catch(() => ({ data: { success: false, data: { count: 0 } } })),
          api.get('/system-admin/agents/count').catch(() => ({ data: { success: false, data: { count: 0 } } })),
          api.get('/system-admin/groups/count').catch(() => ({ data: { success: false, data: { count: 0 } } })),
          api.get('/system-admin/members/count').catch(() => ({ data: { success: false, data: { count: 0 } } })),
          api.get('/groups', { params: { viewAll: 'true' } }).catch(() => ({ data: { success: false, data: [] } })),
          api.get('/loans').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/transactions/count').catch((err) => {
            console.error('[SystemAdminDashboard] Failed to fetch transactions count:', err)
            return { data: { success: false, data: { count: 0 } } }
          })
        ])

        // Get total users count (all users including agents, group admin, secretary, cashier, members, system admin)
        // Try multiple possible response structures
        let totalUsers = 0
        if (users?.data) {
          // Standard structure: { success: true, data: { count: X } }
          if (users.data.data?.count !== undefined) {
            totalUsers = Number(users.data.data.count) || 0
          }
          // Alternative structure: { count: X }
          else if (users.data.count !== undefined) {
            totalUsers = Number(users.data.count) || 0
          }
        }

        console.log('[SystemAdminDashboard] Users API Response:', users?.data)
        console.log('[SystemAdminDashboard] Total Users Count:', totalUsers)

        // Calculate total savings from all groups
        let totalSavings = 0
        if (groups?.data?.success && groups?.data?.data) {
          totalSavings = groups.data.data.reduce((sum, group) => {
            return sum + (parseFloat(group.totalSavings) || 0)
          }, 0)
        }

        // Get total loans count
        let totalLoans = 0
        if (loans?.data?.success && loans?.data?.data) {
          totalLoans = Array.isArray(loans.data.data) ? loans.data.data.length : 0
        }

        // Get total transactions count (all transactions across all groups)
        let totalTransactions = 0
        if (transactionsCount?.data?.success && transactionsCount?.data?.data?.count !== undefined) {
          totalTransactions = transactionsCount.data.data.count
        } else if (transactionsCount?.data?.data?.count !== undefined) {
          totalTransactions = transactionsCount.data.data.count
        }
        console.log('[SystemAdminDashboard] Total Transactions:', totalTransactions, 'Response:', transactionsCount?.data)

        setSys({
          totalUsers: totalUsers,
          totalBranches: branches?.data?.data?.count || 0,
          activeAgents: agents?.data?.data?.count || 0,
          totalGroups: groupsCount?.data?.data?.count || 0,
          totalMembers: membersCount?.data?.data?.count || 0,
          transactions: totalTransactions,
          totalSavings: totalSavings,
          loans: totalLoans
        })
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      }
    })
  }, [])

  const systemStats = [
    { label: t('totalUsers', { defaultValue: 'Total Users' }), value: `${sys.totalUsers}`, icon: Users, color: 'text-blue-600', change: '' },
    { label: t('activeAgents', { defaultValue: 'Active Agents' }), value: `${sys.activeAgents}`, icon: UserCheck, color: 'text-green-600', change: '' },
    { label: t('totalBranches', { defaultValue: 'Total Branches' }), value: `${sys.totalBranches}`, icon: Building2, color: 'text-purple-600', change: '' },
    { label: t('totalGroups', { defaultValue: 'Total Groups' }), value: `${sys.totalGroups}`, icon: UserCircle, color: 'text-indigo-600', change: '' },
    { label: t('totalMembers', { defaultValue: 'Total Members' }), value: `${sys.totalMembers}`, icon: Users, color: 'text-cyan-600', change: '' },
    { label: t('totalTransactions', { defaultValue: 'Total Transactions' }), value: `${sys.transactions}`, icon: CreditCard, color: 'text-orange-600', change: '' },
    { label: t('totalSavings'), value: `${Number(sys.totalSavings || 0).toLocaleString()} RWF`, icon: TrendingUp, color: 'text-green-600', change: '' },
    { label: t('loans'), value: `${sys.loans}`, icon: Shield, color: 'text-red-600', change: '' },
  ]

  const [recentActivities, setRecentActivities] = useState([])

  // Helper function to format audit log description as readable message
  const formatAuditLogDescription = (log) => {
    if (!log.details || typeof log.details !== 'object') {
      return `${log.action || 'Activity'} on ${log.entityType || 'system'}`
    }

    const details = log.details
    const action = log.action || ''
    const actionUpper = action.toUpperCase()

    // Format based on action type
    if (actionUpper.includes('LOAN_REJECTED')) {
      const reason = details.reason || 'Not specified'
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Loan request rejected for ${memberName}. Reason: ${reason}`
    }

    if (actionUpper.includes('LOAN_APPROVED')) {
      const amount = details.amount ? `${parseFloat(details.amount).toLocaleString()} RWF` : 'amount not specified'
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Loan request approved for ${memberName}. Amount: ${amount}`
    }

    if (actionUpper.includes('MEMBER_REJECTED') || actionUpper.includes('MEMBER_APPLICATION_REJECTED')) {
      const reason = details.reason || details.rejectionReason || 'Not specified'
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Member application rejected for ${memberName}. Reason: ${reason}`
    }

    if (actionUpper.includes('MEMBER_APPROVED') || actionUpper.includes('MEMBER_APPLICATION_APPROVED')) {
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Member application approved for ${memberName}`
    }

    if (actionUpper.includes('CONTRIBUTION')) {
      const amount = details.amount ? `${parseFloat(details.amount).toLocaleString()} RWF` : 'amount not specified'
      const paymentMethod = details.paymentMethod || 'payment method not specified'
      const status = details.status || 'recorded'
      return `Contribution of ${amount} via ${paymentMethod} - ${status}`
    }

    if (details.reason) {
      return details.reason
    }

    if (details.amount) {
      const amount = `${parseFloat(details.amount).toLocaleString()} RWF`
      if (details.memberName) {
        return `${details.memberName} - ${amount}`
      }
      return `Amount: ${amount}`
    }

    if (details.memberName) {
      return details.memberName
    }

    // Default: format action name nicely
    return `${action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} on ${log.entityType || 'system'}`
  }

  // Fetch recent activities from audit logs
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const { data } = await api.get('/audit-logs', { params: { limit: 20 } })
          if (mounted && data?.success) {
            const activities = (data.data || []).map(log => {
              const user = log.user || {}
              return {
                id: log.id,
                type: log.entityType?.toLowerCase() || 'system',
                title: log.action,
                description: formatAuditLogDescription(log),
                user: user.name || 'System',
                entityType: log.entityType,
                entityId: log.entityId,
                time: log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown',
                status: 'completed',
                action: log.action,
                details: log.details
              }
            })
            setRecentActivities(activities)
          }
        } catch (err) {
          console.error('Failed to fetch recent activities:', err)
          if (mounted) setRecentActivities([])
        }
      })()
    return () => { mounted = false }
  }, [])

  // No static alerts; should be fetched from API when implemented
  const systemAlerts = []

  const getActivityIcon = (type) => {
    const normalizedType = (type || '').toLowerCase()
    if (normalizedType.includes('user')) return <Users className="text-blue-600" size={20} />
    if (normalizedType.includes('transaction') || normalizedType.includes('contribution') || normalizedType.includes('fine')) return <CreditCard className="text-green-600" size={20} />
    if (normalizedType.includes('branch') || normalizedType.includes('group')) return <Building2 className="text-purple-600" size={20} />
    if (normalizedType.includes('loan')) return <Shield className="text-orange-600" size={20} />
    if (normalizedType.includes('content') || normalizedType.includes('learn')) return <BookOpen className="text-red-600" size={20} />
    if (normalizedType.includes('audit')) return <FileCheck className="text-blue-600" size={20} />
    return <AlertCircle className="text-gray-600" size={20} />
  }

  const handleActivityClick = (activity) => {
    if (!activity.entityType || !activity.entityId) return

    const entityType = activity.entityType.toLowerCase()
    const entityId = activity.entityId

    // Navigate based on entity type
    if (entityType.includes('user')) {
      navigate(`/system-admin/users`)
    } else if (entityType.includes('group')) {
      navigate(`/system-admin/clients`)
    } else if (entityType.includes('loan')) {
      navigate(`/system-admin/loans`)
    } else if (entityType.includes('transaction') || entityType.includes('contribution') || entityType.includes('fine')) {
      navigate(`/system-admin/transactions`)
    } else if (entityType.includes('branch')) {
      navigate(`/system-admin/branches`)
    } else if (entityType.includes('audit')) {
      navigate(`/system-admin/audit`)
    } else {
      // Default to audit page for system activities
      navigate(`/system-admin/audit`)
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-700'
      case 'error': return 'bg-red-100 text-red-700'
      case 'info': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('systemAdminPortal', { defaultValue: 'System Administrator Portal' })}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('systemAdminDescription', { defaultValue: 'Superuser dashboard for managing users, system operations, and digital learning content' })}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? tCommon('loading') : stat.value}</p>
                    {stat.change && <p className="text-xs text-green-600 mt-1">{stat.change}</p>}
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('systemAlerts', { defaultValue: 'System Alerts' })}</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${alert.priority === 'high' ? 'bg-red-50 border-red-200' :
                    alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAlertColor(alert.type)}`}>
                        {alert.type}
                      </span>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                    </div>
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      {tCommon('dismiss', { defaultValue: 'Dismiss' })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-6">
            {/* Recent Activities */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent System Activities</h2>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No recent activities. Activities will appear here as system events occur.
                </div>
              ) : (
                <div className="h-96 overflow-y-auto pr-2 space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {getActivityIcon(activity.type)}
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description || activity.user || activity.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          activity.status === 'flagged' ? 'bg-red-100 text-red-700' :
                            activity.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              activity.status === 'published' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                        }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SystemAdminDashboard