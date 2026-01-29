import { useState, useEffect } from 'react'
import { BarChart3, Users, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Eye, Download, Calendar, Target, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

function CashierOverview() {
  const { t } = useTranslation('common')
  const { t: tCashier } = useTranslation('cashier')
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('monthly')
  const [selectedMetric, setSelectedMetric] = useState('contributions')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [overviewData, setOverviewData] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [showRankingsModal, setShowRankingsModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'daily',
    scheduledDate: '',
    email: ''
  })
  const [allMembers, setAllMembers] = useState([])

  // Fetch overview data
  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      
      // The backend endpoint will automatically use the logged-in user's groupId
      // So we can call it without needing to know the groupId first
      // But we still try to get it for the export function
      let userGroupId = null
      
      try {
        // Try to get groupId for export functionality
        const meResponse = await api.get('/auth/me')
        userGroupId = meResponse.data?.data?.groupId || meResponse.data?.groupId || meResponse.data?.data?.group?.id
        if (userGroupId) {
          setGroupId(userGroupId)
          console.log('[CashierOverview] Got groupId from /auth/me:', userGroupId)
        }
      } catch (authError) {
        console.warn('[CashierOverview] Could not get groupId from /auth/me (this is OK, backend will use user.groupId):', authError)
      }

      // Fetch overview data using the my-group route (backend will use logged-in user's groupId)
      console.log('[CashierOverview] Fetching overview with timeRange:', timeRange)
      
      let response
      try {
        response = await api.get('/groups/my-group/overview', {
          params: { timeRange }
        })
        console.log('[CashierOverview] Successfully fetched overview data')
      } catch (apiError) {
        console.error('[CashierOverview] API error:', apiError)
        // If my-group route fails, try to get groupId and use the regular route
        if (!userGroupId) {
          try {
            const myGroupResponse = await api.get('/groups/my-group/data')
            userGroupId = myGroupResponse.data?.data?.group?.id
            if (userGroupId) {
              setGroupId(userGroupId)
              console.log('[CashierOverview] Got groupId, trying regular route:', userGroupId)
              response = await api.get(`/groups/${userGroupId}/overview`, {
                params: { timeRange }
              })
            } else {
              throw new Error('No groupId available')
            }
          } catch (fallbackError) {
            console.error('[CashierOverview] Fallback also failed:', fallbackError)
            throw apiError // Throw original error
          }
        } else {
          // We have groupId, try regular route
          response = await api.get(`/groups/${userGroupId}/overview`, {
            params: { timeRange }
          })
        }
      }
      
      // Also get groupId for export functionality if we don't have it
      if (!userGroupId) {
        try {
          const myGroupResponse = await api.get('/groups/my-group/data')
          userGroupId = myGroupResponse.data?.data?.group?.id
          if (userGroupId) {
            setGroupId(userGroupId)
          }
        } catch (err) {
          console.warn('[CashierOverview] Could not get groupId for export:', err)
        }
      }

      console.log('[CashierOverview] Overview response:', response.data)

      if (response.data?.success) {
        // Always set data, even if some fields are empty
        const data = response.data.data || {}
        setOverviewData({
          timeRange: data.timeRange || timeRange,
          dateRange: data.dateRange || {},
          members: data.members || { total: 0, active: 0, suspended: 0, defaulters: 0 },
          savings: data.savings || { total: 0, growthPercentage: 0 },
          loans: data.loans || { total: 0, outstanding: 0, percentage: 0 },
          targets: data.targets || { monthly: 0, achieved: 0, percentage: 0 },
          performance: data.performance || {
            contributions: { amount: 0, percentage: 0 },
            loanPayments: { amount: 0, percentage: 0 },
            fines: { amount: 0, percentage: 0 }
          },
          topPerformers: data.topPerformers || [],
          recentActivities: data.recentActivities || []
        })
      } else {
        console.error('[CashierOverview] Invalid response from overview endpoint:', response.data)
        // Set empty data structure instead of null
        setOverviewData({
          timeRange: timeRange,
          dateRange: {},
          members: { total: 0, active: 0, suspended: 0, defaulters: 0 },
          savings: { total: 0, growthPercentage: 0 },
          loans: { total: 0, outstanding: 0, percentage: 0 },
          targets: { monthly: 0, achieved: 0, percentage: 0 },
          performance: {
            contributions: { amount: 0, percentage: 0 },
            loanPayments: { amount: 0, percentage: 0 },
            fines: { amount: 0, percentage: 0 }
          },
          topPerformers: [],
          recentActivities: []
        })
      }
    } catch (error) {
      console.error('[CashierOverview] Failed to fetch overview data:', error)
      console.error('[CashierOverview] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // Even on error, try to set basic empty structure so page doesn't show "no data"
      // The backend should have returned basic data in error fallback, but if not, set empty structure
      if (error.response?.data?.success && error.response?.data?.data) {
        setOverviewData(error.response.data.data)
      } else {
        // Set minimal structure so UI can still render
        setOverviewData({
          timeRange: timeRange,
          dateRange: {},
          members: { total: 0, active: 0, suspended: 0, defaulters: 0 },
          savings: { total: 0, growthPercentage: 0 },
          loans: { total: 0, outstanding: 0, percentage: 0 },
          targets: { monthly: 0, achieved: 0, percentage: 0 },
          performance: {
            contributions: { amount: 0, percentage: 0 },
            loanPayments: { amount: 0, percentage: 0 },
            fines: { amount: 0, percentage: 0 }
          },
          topPerformers: [],
          recentActivities: []
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Export to Excel
  const handleExport = async () => {
    try {
      setExporting(true)
      // Use my-group route - backend will use logged-in user's groupId
      const response = await api.get('/groups/my-group/overview/export', {
        params: { timeRange },
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const filename = `group_overview_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('Report exported successfully!')
    } catch (error) {
      console.error('Failed to export report:', error)
      alert('Failed to export report: ' + (error.response?.data?.message || error.message))
    } finally {
      setExporting(false)
    }
  }

  // Schedule report
  const handleScheduleReport = async () => {
    try {
      // Validate form
      if (!scheduleForm.scheduledDate) {
        alert('Please select a scheduled date and time')
        return
      }

      // Validate date is in the future
      const scheduledDateTime = new Date(scheduleForm.scheduledDate)
      if (scheduledDateTime <= new Date()) {
        alert('Scheduled date must be in the future')
        return
      }

      setScheduling(true)
      const response = await api.post('/groups/my-group/overview/schedule', {
        timeRange,
        frequency: scheduleForm.frequency,
        scheduledDate: scheduleForm.scheduledDate,
        email: scheduleForm.email || undefined
      })

      if (response.data?.success) {
        alert(`Report scheduled successfully! The ${timeRange} overview report will be sent ${scheduleForm.frequency === 'daily' ? 'daily' : scheduleForm.frequency === 'weekly' ? 'weekly' : 'monthly'} starting from ${new Date(scheduleForm.scheduledDate).toLocaleString()}.`)
        setShowScheduleModal(false)
        setScheduleForm({
          frequency: 'daily',
          scheduledDate: '',
          email: ''
        })
      } else {
        throw new Error(response.data?.message || 'Failed to schedule report')
      }
    } catch (error) {
      console.error('Failed to schedule report:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule report. Please try again.'
      alert(`Failed to schedule report: ${errorMessage}`)
    } finally {
      setScheduling(false)
    }
  }

  // Fetch all members for member status modal
  const fetchAllMembers = async () => {
    try {
      if (!groupId) return
      const response = await api.get(`/groups/${groupId}/members?allMembers=true`)
      if (response.data.success) {
        setAllMembers(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  useEffect(() => {
    fetchOverviewData()
  }, [timeRange])

  useEffect(() => {
    if (showMembersModal && groupId) {
      fetchAllMembers()
    }
  }, [showMembersModal, groupId])

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'fair': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'poor': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <Layout userRole="Cashier">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading overview data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!overviewData) {
    return (
      <Layout userRole="Cashier">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {tCashier('groupOverviewAndPerformance', { defaultValue: 'Group Overview & Performance' })}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {tCashier('monitorGroupPerformance', { defaultValue: 'Monitor group performance and member activities' })}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {!groupId 
                  ? 'You do not belong to a group. Please contact your administrator.'
                  : 'Unable to load overview data. Please try refreshing the page or contact support if the issue persists.'}
              </p>
              <button
                onClick={fetchOverviewData}
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const achievementRate = overviewData.targets?.percentage || 0
  const growthPercentage = overviewData.savings?.growthPercentage || 0

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {tCashier('groupOverviewAndPerformance', { defaultValue: 'Group Overview & Performance' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tCashier('monitorGroupPerformance', { defaultValue: 'Monitor group performance and member activities' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={18} /> {exporting ? 'Exporting...' : t('exportReport', { defaultValue: 'Export Report' })}
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar size={18} /> {t('scheduleReport', { defaultValue: 'Schedule Report' })}
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="card">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('timeRange', { defaultValue: 'Time Range' })}:
            </label>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'quarterly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('totalMembers', { defaultValue: 'Total Members' })}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {overviewData.members?.total || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {overviewData.members?.active || 0} active
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tCashier('groupSavings', { defaultValue: 'Group Savings' })}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {parseFloat(overviewData.savings?.total || 0).toLocaleString()} RWF
                </p>
                <p className={`text-xs mt-1 ${growthPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {growthPercentage >= 0 ? '+' : ''}{growthPercentage}% {timeRange === 'monthly' ? 'this month' : 'this period'}
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('outstandingLoans', { defaultValue: 'Outstanding Loans' })}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {parseFloat(overviewData.loans?.outstanding || 0).toLocaleString()} RWF
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {overviewData.loans?.percentage || 0}% of total
                </p>
              </div>
              <TrendingUp className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t('monthlyTarget', { defaultValue: 'Monthly Target' })}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {parseFloat(overviewData.targets?.achieved || 0).toLocaleString()} RWF
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {achievementRate}% achieved
                </p>
              </div>
              <Target className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Achievement */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Monthly Achievement</h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Target: {parseFloat(overviewData.targets?.monthly || 0).toLocaleString()} RWF
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Contributions</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {parseFloat(overviewData.performance?.contributions?.amount || 0).toLocaleString()} RWF
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${achievementRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {achievementRate}% of target achieved
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contributions</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">
                    {overviewData.performance?.contributions?.percentage || 0}%
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loan Payments</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    {overviewData.performance?.loanPayments?.percentage || 0}%
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fines</p>
                  <p className="font-bold text-orange-600 dark:text-orange-400">
                    {overviewData.performance?.fines?.percentage || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Status */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Member Status</h2>
              <button
                onClick={() => setShowMembersModal(true)}
                className="btn-secondary text-sm"
              >
                <Eye size={16} /> View All
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold text-gray-800 dark:text-white">Active Members</span>
                </div>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {overviewData.members?.active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="text-yellow-600" size={20} />
                  <span className="font-semibold text-gray-800 dark:text-white">Suspended Members</span>
                </div>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  {overviewData.members?.suspended || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="font-semibold text-gray-800 dark:text-white">Defaulters</span>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {overviewData.members?.defaulters || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Members */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Top Performing Members</h2>
            <button
              onClick={() => setShowRankingsModal(true)}
              className="btn-secondary text-sm"
            >
              <BarChart3 size={16} /> View Rankings
            </button>
          </div>
          <div className="space-y-3">
            {overviewData.topPerformers && overviewData.topPerformers.length > 0 ? (
              overviewData.topPerformers.slice(0, 5).map((member) => (
              <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.rank}
                  </div>
                  <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{member.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Contributions: {parseFloat(member.contributions || 0).toLocaleString()} RWF • 
                        Loan Payments: {parseFloat(member.loanPayments || 0).toLocaleString()} RWF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Consistency</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{member.consistency}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                </div>
              </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No performance data available</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Activities</h2>
            <button
              onClick={() => navigate('/cashier/audit')}
              className="btn-secondary text-sm"
            >
              <Clock size={16} /> View All
            </button>
          </div>
          <div className="space-y-3">
            {overviewData.recentActivities && overviewData.recentActivities.length > 0 ? (
              overviewData.recentActivities.map((activity, index) => (
              <div
                  key={activity.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {activity.member?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{activity.member || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatTimeAgo(activity.time)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {parseFloat(activity.amount || 0).toLocaleString()} RWF
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No recent activities</p>
            )}
          </div>
          </div>
        </div>

      {/* Rankings Modal */}
      {showRankingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Member Rankings</h2>
              <button
                onClick={() => setShowRankingsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {overviewData.topPerformers && overviewData.topPerformers.length > 0 ? (
                  overviewData.topPerformers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {member.rank}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{member.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contributions: {parseFloat(member.contributions || 0).toLocaleString()} RWF
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Loan Payments: {parseFloat(member.loanPayments || 0).toLocaleString()} RWF
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Consistency</p>
                        <p className="font-bold text-gray-800 dark:text-white text-xl">{member.consistency}%</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${getStatusColor(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No rankings available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">All Members Status</h2>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {allMembers.filter(m => m.status === 'active').length}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-center">
                  <Clock className="text-yellow-600 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Suspended Members</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {allMembers.filter(m => m.status === 'suspended').length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <AlertCircle className="text-red-600 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Burned Members</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {allMembers.filter(m => m.status === 'burned').length}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.length > 0 ? (
                      allMembers.map((member) => (
                        <tr key={member.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">{member.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{member.phone || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{member.email || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{member.role || 'Member'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              member.status === 'active' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : member.status === 'suspended'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {member.status || 'active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                          No members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Schedule Overview Report</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Automatically generate and send reports</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Report Type Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Report Type</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Overview Report
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      This report includes: Members, Savings, Loans, Contributions, and Performance metrics
                    </p>
                  </div>
                </div>
              </div>

              {/* Frequency Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  How often should this report be generated?
                </label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="daily">Daily - Every day at the scheduled time</option>
                  <option value="weekly">Weekly - Every week on the scheduled day</option>
                  <option value="monthly">Monthly - Every month on the scheduled date</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  The report will be automatically generated and sent based on your selection
                </p>
              </div>

              {/* Start Date & Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  When should the first report be sent? <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Select a date and time in the future. Reports will be sent at this time based on your frequency setting.
                </p>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email address to receive reports
                </label>
                <input
                  type="email"
                  value={scheduleForm.email}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Leave empty to use your account email address. Reports will be sent as Excel files.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowScheduleModal(false)
                    setScheduleForm({
                      frequency: 'daily',
                      scheduledDate: '',
                      email: ''
                    })
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleReport}
                  disabled={scheduling || !scheduleForm.scheduledDate}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {scheduling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar size={18} />
                      Schedule Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default CashierOverview
