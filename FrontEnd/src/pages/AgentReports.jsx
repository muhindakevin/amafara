import { useState, useEffect } from 'react'
import { BarChart3, Download, TrendingUp, TrendingDown, Users, DollarSign, Building2, FileText, Calendar, Filter, Eye, Share2 } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentReports() {
  const [selectedReport, setSelectedReport] = useState('performance')
  const [dateRange, setDateRange] = useState('monthly')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [groups, setGroups] = useState([])
  const [performanceData, setPerformanceData] = useState(null)
  const [memberAnalytics, setMemberAnalytics] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [complianceData, setComplianceData] = useState(null)
  const [riskAnalysis, setRiskAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadReportData() {
      try {
        setLoading(true)
        const [groupsRes, analyticsRes, loansRes, contributionsRes, transactionsRes, usersRes] = await Promise.all([
          api.get('/groups'),
          api.get('/analytics'),
          api.get('/loans').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/contributions').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/transactions').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/system-admin/users').catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (!mounted) return

        const groupsData = groupsRes.data?.data || []
        const analytics = analyticsRes.data?.data || {}
        const loans = loansRes.data?.data || []
        const contributions = contributionsRes.data?.data || []
        const transactions = transactionsRes.data?.data || []
        const users = usersRes.data?.data || []

        // Set groups with "All Groups" option
        setGroups([{ id: 'all', name: 'All Groups' }, ...groupsData.map(g => ({ id: g.id, name: g.name }))])

        // Calculate performance data
        const performanceGroups = groupsData.map(g => {
          const groupLoans = loans.filter(l => l.groupId === g.id)
          const groupContributions = contributions.filter(c => c.groupId === g.id)
          const totalLoans = groupLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0)
          const totalContributions = Number(g.totalSavings || 0)
          
          // Calculate performance score
          const repaymentRate = groupLoans.length > 0 
            ? Math.round((groupLoans.filter(l => l.status === 'completed' || l.status === 'paid').length / groupLoans.length) * 100)
            : 100
          const score = Math.round((repaymentRate * 0.6) + ((totalContributions > 0 ? 100 : 0) * 0.4))

          return {
            name: g.name,
            contributions: totalContributions,
            loans: totalLoans,
            members: g.totalMembers || 0,
            score
          }
        })

        setPerformanceData({
          groups: performanceGroups,
          trends: {
            contributions: { 
              current: analytics.totalSavings || 0, 
              previous: 0, 
              change: 0 
            },
            loans: { 
              current: loans.reduce((sum, l) => sum + Number(l.amount || 0), 0), 
              previous: 0, 
              change: 0 
            },
            members: { 
              current: analytics.totalMembers || 0, 
              previous: 0, 
              change: 0 
            },
            compliance: { 
              current: groupsData.length > 0 
                ? Math.round(groupsData.filter(g => g.status === 'active').length / groupsData.length * 100)
                : 0, 
              previous: 0, 
              change: 0 
            }
          }
        })

        // Member analytics
        const members = users.filter(u => u.role === 'Member' && u.role !== 'Agent' && u.role !== 'System Admin')
        setMemberAnalytics({
          totalMembers: members.length,
          activeMembers: members.filter(m => m.status === 'active').length,
          newMembers: members.filter(m => {
            const created = new Date(m.createdAt)
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return created > monthAgo
          }).length,
          suspendedMembers: members.filter(m => m.status === 'suspended').length,
          memberGrowth: [],
          topPerformingMembers: members
            .sort((a, b) => (b.totalSavings || 0) - (a.totalSavings || 0))
            .slice(0, 3)
            .map(m => ({
              name: m.name,
              group: groupsData.find(g => g.id === m.groupId)?.name || 'Unknown',
              contributions: Number(m.totalSavings || 0),
              loans: 0
            }))
        })

        // Financial data
        const totalLoans = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0)
        const totalRepayments = transactions
          .filter(t => t.type === 'loan_repayment')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0)
        const outstandingLoans = loans
          .filter(l => ['approved', 'disbursed', 'active'].includes(l.status))
          .reduce((sum, l) => sum + Number(l.amount || 0), 0) - totalRepayments

        setFinancialData({
          totalContributions: analytics.totalSavings || 0,
          totalLoans,
          totalRepayments,
          outstandingLoans,
          monthlyContributions: [],
          loanPerformance: {
            current: loans.filter(l => ['approved', 'disbursed', 'active'].includes(l.status)).length,
            overdue: loans.filter(l => l.status === 'overdue').length,
            defaulted: loans.filter(l => l.status === 'defaulted').length
          }
        })

        // Compliance data
        const activeGroups = groupsData.filter(g => g.status === 'active').length
        setComplianceData({
          overallScore: groupsData.length > 0 
            ? Math.round((activeGroups / groupsData.length) * 100)
            : 0,
          groupsCompliant: activeGroups,
          groupsAtRisk: groupsData.filter(g => g.status !== 'active').length,
          violations: 0,
          resolvedViolations: 0,
          pendingViolations: 0,
          complianceTrends: []
        })

        // Risk analysis
        const highRisk = groupsData.filter(g => g.status !== 'active').length
        setRiskAnalysis({
          highRiskGroups: highRisk,
          mediumRiskGroups: 0,
          lowRiskGroups: activeGroups,
          riskFactors: [],
          recommendations: highRisk > 0 ? [
            'Monitor inactive groups closely',
            'Review group compliance regularly',
            'Provide additional support to struggling groups'
          ] : []
        })
      } catch (err) {
        console.error('Failed to load report data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadReportData()
    return () => { mounted = false }
  }, [])

  const reportTypes = [
    { id: 'performance', name: 'Group Performance', icon: BarChart3 },
    { id: 'members', name: 'Member Analytics', icon: Users },
    { id: 'financial', name: 'Financial Reports', icon: DollarSign },
    { id: 'compliance', name: 'Compliance Reports', icon: FileText },
    { id: 'risk', name: 'Risk Analysis', icon: TrendingDown }
  ]

  const performanceData_OLD = {
    groups: [
      { name: 'Abakunzi Cooperative', contributions: 2250000, loans: 1200000, members: 45, score: 98 },
      { name: 'Twitezimbere Group', contributions: 1900000, loans: 950000, members: 38, score: 95 },
      { name: 'Umutima Wacu', contributions: 2100000, loans: 1100000, members: 42, score: 92 },
      { name: 'Abanyarwanda Cooperative', contributions: 1750000, loans: 800000, members: 35, score: 75 }
    ],
    trends: {
      contributions: { current: 8000000, previous: 7500000, change: 6.7 },
      loans: { current: 4050000, previous: 3800000, change: 6.6 },
      members: { current: 160, previous: 155, change: 3.2 },
      compliance: { current: 90, previous: 88, change: 2.3 }
    }
  }

  const memberAnalytics_OLD = {
    totalMembers: 160,
    activeMembers: 145,
    newMembers: 12,
    suspendedMembers: 3,
    memberGrowth: [
      { month: 'Jan', count: 148 },
      { month: 'Feb', count: 152 },
      { month: 'Mar', count: 155 },
      { month: 'Apr', count: 158 },
      { month: 'May', count: 160 }
    ],
    topPerformingMembers: [
      { name: 'Kamikazi Marie', group: 'Abakunzi', contributions: 500000, loans: 200000 },
      { name: 'Mukamana Alice', group: 'Abakunzi', contributions: 450000, loans: 150000 },
      { name: 'Mutabazi Paul', group: 'Twitezimbere', contributions: 480000, loans: 180000 }
    ]
  }

  const financialData_OLD = {
    totalContributions: 8000000,
    totalLoans: 4050000,
    totalRepayments: 3200000,
    outstandingLoans: 850000,
    monthlyContributions: [
      { month: 'Jan', amount: 1500000 },
      { month: 'Feb', amount: 1600000 },
      { month: 'Mar', amount: 1700000 },
      { month: 'Apr', amount: 1800000 },
      { month: 'May', amount: 1900000 }
    ],
    loanPerformance: {
      current: 85,
      overdue: 12,
      defaulted: 3
    }
  }

  const complianceData_OLD = {
    overallScore: 90,
    groupsCompliant: 3,
    groupsAtRisk: 1,
    violations: 4,
    resolvedViolations: 2,
    pendingViolations: 2,
    complianceTrends: [
      { month: 'Jan', score: 85 },
      { month: 'Feb', score: 87 },
      { month: 'Mar', score: 88 },
      { month: 'Apr', score: 89 },
      { month: 'May', score: 90 }
    ]
  }

  const riskAnalysis_OLD = {
    highRiskGroups: 1,
    mediumRiskGroups: 1,
    lowRiskGroups: 2,
    riskFactors: [
      { factor: 'Low Repayment Rate', groups: 2, severity: 'medium' },
      { factor: 'Poor Attendance', groups: 1, severity: 'high' },
      { factor: 'Financial Irregularities', groups: 1, severity: 'high' },
      { factor: 'Late Contributions', groups: 3, severity: 'low' }
    ],
    recommendations: [
      'Increase monitoring for Abanyarwanda Cooperative',
      'Implement additional training for group leaders',
      'Review loan approval processes',
      'Strengthen compliance monitoring'
    ]
  }

  const handleGenerateReport = async () => {
    try {
      let reportContent = `UMURENGE WALLET - ${selectedReport.toUpperCase()} REPORT\n`
      reportContent += `Generated: ${new Date().toLocaleString()}\n`
      reportContent += `Date Range: ${dateRange}\n`
      reportContent += `Group: ${selectedGroup === 'all' ? 'All Groups' : groups.find(g => g.id === selectedGroup)?.name || selectedGroup}\n\n`

      switch (selectedReport) {
        case 'performance':
          if (performanceData) {
            reportContent += 'GROUP PERFORMANCE\n' + '='.repeat(80) + '\n'
            performanceData.groups.forEach(g => {
              reportContent += `${g.name}: Contributions: ${g.contributions.toLocaleString()} RWF, Loans: ${g.loans.toLocaleString()} RWF, Members: ${g.members}, Score: ${g.score}%\n`
            })
          }
          break
        case 'members':
          if (memberAnalytics) {
            reportContent += `Total Members: ${memberAnalytics.totalMembers}\n`
            reportContent += `Active: ${memberAnalytics.activeMembers}\n`
            reportContent += `New This Month: ${memberAnalytics.newMembers}\n`
            reportContent += `Suspended: ${memberAnalytics.suspendedMembers}\n`
          }
          break
        case 'financial':
          if (financialData) {
            reportContent += `Total Contributions: ${financialData.totalContributions.toLocaleString()} RWF\n`
            reportContent += `Total Loans: ${financialData.totalLoans.toLocaleString()} RWF\n`
            reportContent += `Total Repayments: ${financialData.totalRepayments.toLocaleString()} RWF\n`
            reportContent += `Outstanding Loans: ${financialData.outstandingLoans.toLocaleString()} RWF\n`
          }
          break
        case 'compliance':
          if (complianceData) {
            reportContent += `Overall Score: ${complianceData.overallScore}%\n`
            reportContent += `Compliant Groups: ${complianceData.groupsCompliant}\n`
            reportContent += `At Risk Groups: ${complianceData.groupsAtRisk}\n`
          }
          break
        case 'risk':
          if (riskAnalysis) {
            reportContent += `High Risk: ${riskAnalysis.highRiskGroups}\n`
            reportContent += `Medium Risk: ${riskAnalysis.mediumRiskGroups}\n`
            reportContent += `Low Risk: ${riskAnalysis.lowRiskGroups}\n`
          }
          break
      }

      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Report generated successfully!')
    } catch (err) {
      console.error('Failed to generate report:', err)
      alert('Failed to generate report')
    }
  }

  const handleExportReport = async () => {
    handleGenerateReport() // Same functionality
  }

  const handleShareReport = () => {
    alert('Share functionality will be implemented when email/integration features are added.')
  }

  const getTrendIcon = (change) => {
    return change > 0 ? 
      <TrendingUp className="text-green-600" size={16} /> : 
      <TrendingDown className="text-red-600" size={16} />
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reporting & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive reports and view AI analytics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateReport}
              className="btn-primary flex items-center gap-2"
            >
              <BarChart3 size={18} /> Generate Report
            </button>
            <button
              onClick={handleExportReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Select Report Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedReport === type.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={24} className="mx-auto mb-2" />
                  <p className="text-sm font-semibold">{type.name}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Report Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Group Filter
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="input-field"
              >
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button className="btn-primary flex items-center gap-2">
                <Calendar size={18} /> Custom Range
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="card">
              <p className="text-center py-8 text-gray-500">Loading report data...</p>
            </div>
          ) : selectedReport === 'performance' && performanceData ? (
            <div className="space-y-6">
              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Contributions</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.contributions.current.toLocaleString()} RWF
                      </p>
                    </div>
                    <DollarSign className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Loans</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.loans.current.toLocaleString()} RWF
                      </p>
                    </div>
                    <Building2 className="text-blue-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Members</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.members.current}
                      </p>
                    </div>
                    <Users className="text-purple-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Avg Compliance</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.compliance.current}%
                      </p>
                    </div>
                    <BarChart3 className="text-orange-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Group Performance Table */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Group Performance Rankings</h3>
                {performanceData.groups.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No groups available. Groups will appear here once they are registered.</p>
                ) : (
                  <div className="space-y-4">
                    {performanceData.groups.map((group, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{group.name}</h4>
                            <p className="text-sm text-gray-600">{group.members} members</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600">Contributions</p>
                            <p className="font-semibold">{group.contributions.toLocaleString()} RWF</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Loans</p>
                            <p className="font-semibold">{group.loans.toLocaleString()} RWF</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Score</p>
                            <p className="font-semibold text-green-600">{group.score}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedReport === 'performance' && (
            <div className="card">
              <p className="text-center py-8 text-gray-500">No performance data available.</p>
            </div>
          )}

          {selectedReport === 'members' && memberAnalytics ? (
            <div className="space-y-6">
              {/* Member Analytics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Members</p>
                      <p className="text-2xl font-bold text-gray-800">{memberAnalytics.totalMembers}</p>
                    </div>
                    <Users className="text-blue-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Active Members</p>
                      <p className="text-2xl font-bold text-green-600">{memberAnalytics.activeMembers}</p>
                    </div>
                    <Users className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">New Members</p>
                      <p className="text-2xl font-bold text-purple-600">{memberAnalytics.newMembers}</p>
                    </div>
                    <Users className="text-purple-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Suspended</p>
                      <p className="text-2xl font-bold text-red-600">{memberAnalytics.suspendedMembers}</p>
                    </div>
                    <Users className="text-red-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Top Performing Members */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Top Performing Members</h3>
                <div className="space-y-4">
                  {memberAnalytics.topPerformingMembers.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No members available yet.</p>
                  ) : (
                    memberAnalytics.topPerformingMembers.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.group}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600">Contributions</p>
                            <p className="font-semibold">{member.contributions.toLocaleString()} RWF</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Loans</p>
                            <p className="font-semibold">{member.loans.toLocaleString()} RWF</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : selectedReport === 'members' && (
            <div className="card">
              <p className="text-center py-8 text-gray-500">No member analytics available.</p>
            </div>
          )}

          {selectedReport === 'financial' && financialData ? (
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Contributions</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {financialData.totalContributions.toLocaleString()} RWF
                      </p>
                    </div>
                    <DollarSign className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Total Loans</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {financialData.totalLoans.toLocaleString()} RWF
                      </p>
                    </div>
                    <Building2 className="text-blue-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Repayments</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {financialData.totalRepayments.toLocaleString()} RWF
                      </p>
                    </div>
                    <TrendingUp className="text-purple-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Outstanding</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {financialData.outstandingLoans.toLocaleString()} RWF
                      </p>
                    </div>
                    <TrendingDown className="text-red-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Loan Performance */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Loan Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-gray-600">Current Loans</p>
                    <p className="text-2xl font-bold text-green-600">{financialData.loanPerformance.current}%</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <p className="text-sm text-gray-600">Overdue Loans</p>
                    <p className="text-2xl font-bold text-yellow-600">{financialData.loanPerformance.overdue}%</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-gray-600">Defaulted Loans</p>
                    <p className="text-2xl font-bold text-red-600">{financialData.loanPerformance.defaulted}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedReport === 'financial' && (
            <div className="card">
              <p className="text-center py-8 text-gray-500">No financial data available.</p>
            </div>
          )}

          {selectedReport === 'compliance' && complianceData ? (
            <div className="space-y-6">
              {/* Compliance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Overall Score</p>
                      <p className="text-2xl font-bold text-gray-800">{complianceData.overallScore}%</p>
                    </div>
                    <BarChart3 className="text-blue-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Compliant Groups</p>
                      <p className="text-2xl font-bold text-green-600">{complianceData.groupsCompliant}</p>
                    </div>
                    <FileText className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">At Risk</p>
                      <p className="text-2xl font-bold text-yellow-600">{complianceData.groupsAtRisk}</p>
                    </div>
                    <TrendingDown className="text-yellow-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Violations</p>
                      <p className="text-2xl font-bold text-red-600">{complianceData.violations}</p>
                    </div>
                    <FileText className="text-red-600" size={32} />
                  </div>
                </div>
              </div>
            </div>
          ) : selectedReport === 'compliance' && (
            <div className="card">
              <p className="text-center py-8 text-gray-500">No compliance data available.</p>
            </div>
          )}

          {selectedReport === 'risk' && riskAnalysis ? (
            <div className="space-y-6">
              {/* Risk Analysis Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">High Risk Groups</p>
                      <p className="text-2xl font-bold text-red-600">{riskAnalysis.highRiskGroups}</p>
                    </div>
                    <TrendingDown className="text-red-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Medium Risk</p>
                      <p className="text-2xl font-bold text-yellow-600">{riskAnalysis.mediumRiskGroups}</p>
                    </div>
                    <TrendingDown className="text-yellow-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Low Risk Groups</p>
                      <p className="text-2xl font-bold text-green-600">{riskAnalysis.lowRiskGroups}</p>
                    </div>
                    <TrendingUp className="text-green-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Risk Factors</h3>
                {riskAnalysis.riskFactors.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No risk factors identified.</p>
                ) : (
                  <div className="space-y-4">
                    {riskAnalysis.riskFactors.map((factor, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-800">{factor.factor}</h4>
                          <p className="text-sm text-gray-600">{factor.groups} groups affected</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(factor.severity)}`}>
                          {factor.severity} severity
                        </span>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="card">
                <h3 className="text-xl font-bold text-gray-800 mb-4">AI Recommendations</h3>
                {riskAnalysis.recommendations.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No recommendations available.</p>
                ) : (
                  <div className="space-y-3">
                    {riskAnalysis.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 rounded-xl border border-blue-200"
                    >
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedReport === 'risk' && (
            <div className="card">
              <p className="text-center py-8 text-gray-500">No risk analysis data available.</p>
            </div>
          )}
        </div>

        {/* Report Actions */}
        <div className="card">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Report Actions</h3>
              <p className="text-sm text-gray-600">Manage and share your reports</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> Export PDF
              </button>
              <button
                onClick={handleShareReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Share2 size={18} /> Share Report
              </button>
              <button className="btn-primary flex items-center gap-2">
                <Eye size={18} /> View Full Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AgentReports
