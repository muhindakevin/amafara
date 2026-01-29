import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, FileText, Download, Filter, Calendar, BarChart3, PieChart } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { formatCurrency, formatDate } from '../utils/pdfExport'
import * as XLSX from 'xlsx'

function GroupAdminAnalytics() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [dateRange, setDateRange] = useState('month')
  const [selectedChart, setSelectedChart] = useState('savings')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSavings: 0,
    activeMembers: 0,
    totalLoans: 0,
    repaymentRate: 0
  })
  const [savingsData, setSavingsData] = useState([])
  const [loanData, setLoanData] = useState([])
  const [memberStatusData, setMemberStatusData] = useState([])
  const [contributionData, setContributionData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [riskAlerts, setRiskAlerts] = useState([])
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadAnalytics() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        // Fetch stats with error handling
        let statsData = {}
        try {
          const statsRes = await api.get(`/groups/${groupId}/stats`)
          statsData = statsRes.data?.data || {}
        } catch (statsError) {
          console.error('[GroupAdminAnalytics] Error fetching stats:', statsError)
          // Continue with default values
          statsData = { totalSavings: 0, totalMembers: 0 }
        }
        
        // Fetch group data for members with error handling
        let members = []
        let groupNameValue = ''
        try {
          const groupRes = await api.get(`/groups/${groupId}`)
          const groupData = groupRes.data?.data || {}
          members = Array.isArray(groupData.members) ? groupData.members : []
          groupNameValue = groupData.name || ''
          
          // If members array is empty, try fetching from members endpoint
          if (members.length === 0) {
            try {
              const membersRes = await api.get(`/groups/${groupId}/members`)
              if (membersRes.data?.success && Array.isArray(membersRes.data.data)) {
                members = membersRes.data.data
              }
            } catch (memberError) {
              console.error('[GroupAdminAnalytics] Error fetching members:', memberError)
            }
          }
        } catch (groupError) {
          console.error('[GroupAdminAnalytics] Error fetching group:', groupError)
          // Try to fetch members directly
          try {
            const membersRes = await api.get(`/groups/${groupId}/members`)
            if (membersRes.data?.success && Array.isArray(membersRes.data.data)) {
              members = membersRes.data.data
            }
          } catch (memberError) {
            console.error('[GroupAdminAnalytics] Error fetching members:', memberError)
          }
        }
        
        setGroupName(groupNameValue)
        
        // Fetch loans with error handling
        let allLoans = []
        try {
          const loansRes = await api.get('/loans/requests?status=all')
          allLoans = Array.isArray(loansRes.data?.data) 
            ? loansRes.data.data.filter(l => l.groupId === groupId || l.groupId === parseInt(groupId))
            : []
        } catch (loansError) {
          console.error('[GroupAdminAnalytics] Error fetching loans:', loansError)
        }
        
        // Fetch contributions for chart data with error handling
        let contributions = []
        try {
          const contribsRes = await api.get('/contributions', { params: { groupId } })
          contributions = Array.isArray(contribsRes.data?.data) ? contribsRes.data.data : []
        } catch (contribsError) {
          console.error('[GroupAdminAnalytics] Error fetching contributions:', contribsError)
        }
        
        // Fetch transactions with error handling
        let transactions = []
        try {
          const transRes = await api.get('/transactions', { params: { groupId, limit: 10 } })
          transactions = Array.isArray(transRes.data?.data) ? transRes.data.data.slice(0, 4) : []
        } catch (transError) {
          console.error('[GroupAdminAnalytics] Error fetching transactions:', transError)
        }

        if (!mounted) return

        // Calculate stats
        const totalLoans = allLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0)
        const paidLoans = allLoans.filter(l => l.status === 'approved' || l.status === 'disbursed').length
        const repaymentRate = allLoans.length > 0 ? Math.round((paidLoans / allLoans.length) * 100) : 0

        setStats({
          totalSavings: Number(statsData.totalSavings) || 0,
          activeMembers: Number(statsData.totalMembers) || 0,
          totalLoans: totalLoans,
          repaymentRate: repaymentRate
        })

        // Generate savings data (last 6 months)
        const now = new Date()
        const monthlySavings = []
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
          const monthContribs = contributions.filter(c => {
            const contribDate = new Date(c.createdAt || c.contributionDate)
            return contribDate.getMonth() === monthDate.getMonth() && 
                   contribDate.getFullYear() === monthDate.getFullYear() &&
                   (c.status === 'approved' || c.status === 'completed')
          })
          const amount = monthContribs.reduce((sum, c) => sum + Number(c.amount || 0), 0)
          monthlySavings.push({ month: monthName, amount })
        }
        setSavingsData(monthlySavings)

        // Generate loan data (last 6 months)
        const monthlyLoans = []
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' })
          const monthLoansFiltered = allLoans.filter(l => {
            const loanDate = new Date(l.createdAt || l.requestDate)
            return loanDate.getMonth() === monthDate.getMonth() && 
                   loanDate.getFullYear() === monthDate.getFullYear()
          })
          monthlyLoans.push({
            month: monthName,
            approved: monthLoansFiltered.filter(l => l.status === 'approved').length,
            rejected: monthLoansFiltered.filter(l => l.status === 'rejected').length,
            pending: monthLoansFiltered.filter(l => l.status === 'pending').length
          })
        }
        setLoanData(monthlyLoans)

        // Member status data
        const activeMembers = members.filter(m => m.status === 'active' && m.role === 'Member').length
        const burnedMembers = members.filter(m => m.status === 'burned').length
        const inactiveMembers = members.filter(m => m.status === 'inactive').length
        setMemberStatusData([
          { name: 'Active', value: activeMembers, color: '#10B981' },
          { name: 'Burned', value: burnedMembers, color: '#EF4444' },
          { name: 'Inactive', value: inactiveMembers, color: '#6B7280' }
        ])

        // Contribution status data
        const onTime = contributions.filter(c => c.status === 'approved' || c.status === 'completed').length
        const late = contributions.filter(c => c.status === 'late').length
        const missed = contributions.filter(c => c.status === 'rejected' || c.status === 'cancelled').length
        const total = contributions.length || 1
        setContributionData([
          { name: 'On Time', value: Math.round((onTime / total) * 100), color: '#10B981' },
          { name: 'Late', value: Math.round((late / total) * 100), color: '#F59E0B' },
          { name: 'Missed', value: Math.round((missed / total) * 100), color: '#EF4444' }
        ])

        // Recent transactions
        setRecentTransactions(transactions.map(t => ({
          id: t.id,
          member: t.user?.name || 'Member',
          type: t.type || 'Transaction',
          amount: Number(t.amount || 0),
          date: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toISOString().split('T')[0] : '',
          status: t.status || 'completed'
        })))

        // Calculate top performers (based on total contributions)
        const memberContributions = {}
        contributions.forEach(c => {
          const memberId = c.userId || c.memberId
          if (memberId) {
            if (!memberContributions[memberId]) {
              memberContributions[memberId] = {
                memberId,
                name: c.user?.name || members.find(m => m.id === memberId)?.name || 'Unknown',
                total: 0
              }
            }
            if (c.status === 'approved' || c.status === 'completed') {
              memberContributions[memberId].total += Number(c.amount || 0)
            }
          }
        })
        
        const topPerformersList = Object.values(memberContributions)
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .map((m, index) => ({
            rank: index + 1,
            name: m.name,
            amount: m.total
          }))
        setTopPerformers(topPerformersList)

        // Calculate risk alerts
        const alerts = []
        
        // Members with late payments
        const latePayments = contributions.filter(c => c.status === 'late').length
        if (latePayments > 0) {
          alerts.push(t('latePaymentsAlert', { count: latePayments, defaultValue: `${latePayments} member${latePayments > 1 ? 's' : ''} with late payments` }))
        }
        
        // Members approaching loan limit (check loans)
        const membersWithLoans = {}
        allLoans.forEach(loan => {
          if (loan.status === 'approved' || loan.status === 'disbursed') {
            const memberId = loan.userId || loan.memberId
            if (memberId) {
              if (!membersWithLoans[memberId]) {
                membersWithLoans[memberId] = 0
              }
              membersWithLoans[memberId] += Number(loan.amount || 0)
            }
          }
        })
        
        // Check for members with high loan amounts (assuming max loan is 500,000 RWF)
        const highLoanMembers = Object.entries(membersWithLoans).filter(([_, amount]) => amount > 400000).length
        if (highLoanMembers > 0) {
          alerts.push(t('highLoanMembersAlert', { count: highLoanMembers, defaultValue: `${highLoanMembers} member${highLoanMembers > 1 ? 's' : ''} approaching loan limit` }))
        }
        
        // Members inactive for 30+ days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const inactiveMembers30Days = members.filter(m => {
          if (m.status === 'inactive') return true
          const lastActivity = m.lastActivityDate || m.updatedAt
          if (!lastActivity) return false
          return new Date(lastActivity) < thirtyDaysAgo
        }).length
        
        if (inactiveMembers30Days > 0) {
          alerts.push(t('inactiveMembersAlert', { count: inactiveMembers30Days, defaultValue: `${inactiveMembers30Days} member${inactiveMembers30Days > 1 ? 's' : ''} inactive for 30+ days` }))
        }
        
        setRiskAlerts(alerts)
      } catch (error) {
        console.error('[GroupAdminAnalytics] Error loading analytics:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAnalytics()
    return () => { mounted = false }
  }, [dateRange])

  const statsDisplay = [
    {
      title: t('totalGroupSavings', { defaultValue: 'Total Group Savings' }),
      value: `RWF ${stats.totalSavings.toLocaleString()}`,
      change: '+0%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: t('activeMembers', { defaultValue: 'Active Members' }),
      value: String(stats.activeMembers),
      change: '+0',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: t('totalLoansGiven', { defaultValue: 'Total Loans Given' }),
      value: `RWF ${stats.totalLoans.toLocaleString()}`,
      change: '+0%',
      changeType: 'positive',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      title: t('loanRepaymentRate', { defaultValue: 'Loan Repayment Rate' }),
      value: `${stats.repaymentRate}%`,
      change: '+0%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ]

  const exportReport = () => {
    try {
      const workbook = XLSX.utils.book_new()
      const worksheetData = []
      
      // Title
      worksheetData.push([t('analyticsDashboardReport', { defaultValue: 'Analytics Dashboard Report' })])
      worksheetData.push([t('groupPerformanceAnalysis', { defaultValue: 'Group Performance Analysis' })])
      worksheetData.push([])
      
      // Group info
      worksheetData.push([t('group', { defaultValue: 'Group' }), groupName || tCommon('nA', { defaultValue: 'N/A' })])
      worksheetData.push(['Report Date:', new Date().toLocaleString()])
      worksheetData.push(['Date Range:', dateRange])
      worksheetData.push([])
      
      // Summary Statistics
      worksheetData.push(['SUMMARY STATISTICS'])
      worksheetData.push([t('totalGroupSavings', { defaultValue: 'Total Group Savings' }), formatCurrency(stats.totalSavings)])
      worksheetData.push([t('activeMembers', { defaultValue: 'Active Members' }), stats.activeMembers])
      worksheetData.push(['Total Loans Given:', formatCurrency(stats.totalLoans)])
      worksheetData.push(['Loan Repayment Rate:', `${stats.repaymentRate}%`])
      worksheetData.push([])
      
      // Monthly Savings Trend
      if (savingsData.length > 0) {
        worksheetData.push(['MONTHLY SAVINGS TREND'])
        worksheetData.push(['Month', 'Amount (RWF)'])
        savingsData.forEach(d => {
          worksheetData.push([d.month, d.amount])
        })
        worksheetData.push([])
      }
      
      // Loan Status by Month
      if (loanData.length > 0) {
        worksheetData.push(['LOAN STATUS BY MONTH'])
        worksheetData.push(['Month', 'Approved', 'Rejected', 'Pending'])
        loanData.forEach(d => {
          worksheetData.push([d.month, d.approved || 0, d.rejected || 0, d.pending || 0])
        })
        worksheetData.push([])
      }
      
      // Member Status Distribution
      if (memberStatusData.length > 0) {
        worksheetData.push(['MEMBER STATUS DISTRIBUTION'])
        worksheetData.push(['Status', 'Count'])
        memberStatusData.forEach(d => {
          worksheetData.push([d.name, d.value])
        })
        worksheetData.push([])
      }
      
      // Contribution Performance
      if (contributionData.length > 0) {
        worksheetData.push(['CONTRIBUTION PERFORMANCE'])
        worksheetData.push(['Status', 'Percentage'])
        contributionData.forEach(d => {
          worksheetData.push([d.name, `${d.value}%`])
        })
        worksheetData.push([])
      }
      
      // Top Performers
      if (topPerformers.length > 0) {
        worksheetData.push(['TOP PERFORMERS'])
        worksheetData.push(['Rank', 'Member Name', 'Total Contributions (RWF)'])
        topPerformers.forEach(p => {
          worksheetData.push([p.rank, p.name, p.amount])
        })
        worksheetData.push([])
      }
      
      // Risk Alerts
      if (riskAlerts.length > 0) {
        worksheetData.push(['RISK ALERTS'])
        riskAlerts.forEach(alert => {
          worksheetData.push([alert])
        })
        worksheetData.push([])
      }
      
      // Recent Transactions
      if (recentTransactions.length > 0) {
        worksheetData.push(['RECENT TRANSACTIONS'])
        worksheetData.push(['Member', 'Type', 'Amount (RWF)', 'Date', 'Status'])
        recentTransactions.forEach(t => {
          worksheetData.push([
            t.member || 'N/A',
            t.type || 'Transaction',
            t.amount,
            t.date,
            t.status.toUpperCase()
          ])
        })
      }
      
      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Set column widths
      const colWidths = []
      for (let i = 0; i < 10; i++) {
        const maxLength = Math.max(
          ...worksheetData.map(row => {
            const cell = row[i]
            return cell ? String(cell).length : 0
          })
        )
        colWidths.push({ wch: Math.min(Math.max(maxLength + 2, 10), 50) })
      }
      worksheet['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics Report')
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const safeGroupName = (groupName || 'Group').replace(/[^a-zA-Z0-9]/g, '_')
      const finalFilename = `Analytics_Report_${safeGroupName}_${dateStr}.xlsx`
      
      // Save file
      XLSX.writeFile(workbook, finalFilename)
      
      alert('Analytics report exported successfully!')
    } catch (error) {
      console.error('[GroupAdminAnalytics] Error exporting Excel:', error)
      alert('Failed to export report. Please try again.')
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('analyticsDashboard', { defaultValue: 'Analytics Dashboard' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('comprehensiveInsights', { defaultValue: 'Comprehensive insights into group performance' })}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="week">{t('lastWeek', { defaultValue: 'Last Week' })}</option>
              <option value="month">{t('lastMonth', { defaultValue: 'Last Month' })}</option>
              <option value="quarter">{t('lastQuarter', { defaultValue: 'Last Quarter' })}</option>
              <option value="year">{t('lastYear', { defaultValue: 'Last Year' })}</option>
            </select>
            <button
              onClick={exportReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> {tCommon('exportReport')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('loadingAnalytics', { defaultValue: 'Loading analytics...' })}</p>
          </div>
        ) : (
          <>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mb-1">
                      {stat.value}
                    </p>
                    <p className={`text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from last period
                    </p>
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Savings Trend Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Savings Trend</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedChart('savings')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    selectedChart === 'savings' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Savings
                </button>
                <button
                  onClick={() => setSelectedChart('loans')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    selectedChart === 'loans' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Loans
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === 'savings' ? (
                  <BarChart data={savingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} RWF`, 'Amount']} />
                    <Bar dataKey="amount" fill="#0A84FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={loanData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="approved" stackId="a" fill="#10B981" />
                    <Bar dataKey="rejected" stackId="a" fill="#EF4444" />
                    <Bar dataKey="pending" stackId="a" fill="#F59E0B" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Status Distribution */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Member Status Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={memberStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {memberStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {memberStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contribution Performance */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Contribution Performance</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={contributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {contributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {transaction.member[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{transaction.member}</p>
                      <p className="text-xs text-gray-500">{transaction.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{transaction.amount.toLocaleString()} RWF</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={24} className="text-primary-600" />
            Performance Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Top Performers</h3>
              {topPerformers.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-600">
                  {topPerformers.map((performer, index) => (
                    <li key={index}>
                      {performer.rank}. {performer.name} - {formatCurrency(performer.amount)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No contribution data available</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Risk Alerts</h3>
              {riskAlerts.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-600">
                  {riskAlerts.map((alert, index) => (
                    <li key={index}>• {alert}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No risk alerts at this time</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Recommendations</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {stats.totalSavings < 100000 && (
                  <li>• Increase contribution targets</li>
                )}
                {stats.repaymentRate < 80 && (
                  <li>• Review loan approval criteria</li>
                )}
                {riskAlerts.some(a => a.includes('inactive')) && (
                  <li>• Implement member engagement program</li>
                )}
                {stats.activeMembers < 10 && (
                  <li>• Focus on member recruitment</li>
                )}
                {riskAlerts.length === 0 && stats.repaymentRate >= 80 && (
                  <li>• Group is performing well - maintain current strategies</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminAnalytics

