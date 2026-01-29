import { useState, useEffect } from 'react'
import { BarChart3, Download, TrendingUp, TrendingDown, Users, DollarSign, Building2, FileText, Calendar, Filter, Eye, Share2 } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import * as XLSX from 'xlsx'

function AgentReports() {
  const { t } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [selectedReport, setSelectedReport] = useState('performance')
  const [dateRange, setDateRange] = useState('monthly')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [groups, setGroups] = useState([])
  const [performanceData, setPerformanceData] = useState(null)
  const [memberAnalytics, setMemberAnalytics] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [complianceData, setComplianceData] = useState(null)
  const [riskAnalysis, setRiskAnalysis] = useState(null)
  const [summary, setSummary] = useState({
    totalContributions: 0,
    totalLoans: 0,
    totalMembers: 0,
    avgCompliance: 0
  })
  const [loading, setLoading] = useState(true)

  // Load groups list from database
  useEffect(() => {
    async function loadGroups() {
      try {
        // Fetch all groups with viewAll parameter to get all groups regardless of status
        const { data } = await api.get('/groups', { params: { viewAll: 'true' } })
        if (data?.success) {
          const groupsData = data.data || []
          console.log('[AgentReports] Loaded groups:', groupsData.length)
          // Set groups with "All Groups" option first, then all other groups
          setGroups([
            { id: 'all', name: 'All Groups' }, 
            ...groupsData.map(g => ({ 
              id: g.id, 
              name: g.name || `Group ${g.id}`,
              code: g.code || '',
              district: g.district || ''
            }))
          ])
        } else {
          console.warn('[AgentReports] Failed to load groups:', data)
          // Set default "All Groups" option if loading fails
          setGroups([{ id: 'all', name: 'All Groups' }])
        }
      } catch (err) {
        console.error('[AgentReports] Failed to load groups:', err)
        // Set default "All Groups" option on error
        setGroups([{ id: 'all', name: 'All Groups' }])
      }
    }
    loadGroups()
  }, [])

  // Load report data from backend
  const loadReportData = async () => {
    try {
      setLoading(true)
      const params = {
        reportType: selectedReport
      }

      // Add date range
      if (customStartDate && customEndDate) {
        params.startDate = customStartDate
        params.endDate = customEndDate
      } else {
        params.dateRange = dateRange
      }

      // Add group filter
      if (selectedGroup && selectedGroup !== 'all') {
        params.groupId = selectedGroup
      }

      console.log('[AgentReports] Fetching report data with params:', params)
      const { data } = await api.get('/agent/reports', { params })

      if (data?.success) {
        console.log('[AgentReports] Received data:', data.data)
        setSummary(data.data.summary || {
          totalContributions: 0,
          totalLoans: 0,
          totalMembers: 0,
          avgCompliance: 0
        })
        setPerformanceData(data.data.performance || null)
        setMemberAnalytics(data.data.memberAnalytics || null)
        setFinancialData(data.data.financial || null)
        setComplianceData(data.data.compliance || null)
        setRiskAnalysis(data.data.risk || null)
      } else {
        console.warn('[AgentReports] No success in response:', data)
        // Reset all data to null/empty on error
        setSummary({ totalContributions: 0, totalLoans: 0, totalMembers: 0, avgCompliance: 0 })
        setPerformanceData(null)
        setMemberAnalytics(null)
        setFinancialData(null)
        setComplianceData(null)
        setRiskAnalysis(null)
      }
      } catch (err) {
      console.error('[AgentReports] Failed to load report data:', err)
      // Reset all data to null/empty on error
      setSummary({ totalContributions: 0, totalLoans: 0, totalMembers: 0, avgCompliance: 0 })
      setPerformanceData(null)
      setMemberAnalytics(null)
      setFinancialData(null)
      setComplianceData(null)
      setRiskAnalysis(null)
      } finally {
      setLoading(false)
      }
    }

  // Load data on mount and when filters change
  useEffect(() => {
    loadReportData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, dateRange, selectedGroup, customStartDate, customEndDate])

  const reportTypes = [
    { id: 'performance', name: 'Group Performance', icon: BarChart3 },
    { id: 'members', name: 'Member Analytics', icon: Users },
    { id: 'financial', name: 'Financial Reports', icon: DollarSign },
    { id: 'compliance', name: 'Compliance Reports', icon: FileText },
    { id: 'risk', name: 'Risk Analysis', icon: TrendingDown }
  ]

  const handleExportReport = async () => {
    try {
      // Prepare data for Excel export
      const workbook = XLSX.utils.book_new()
      
      // Get report type name
      const reportTypeName = reportTypes.find(r => r.id === selectedReport)?.name || selectedReport
      const groupName = selectedGroup === 'all' ? 'All Groups' : groups.find(g => g.id === selectedGroup)?.name || 'Unknown'
      const dateRangeText = customStartDate && customEndDate 
        ? `${customStartDate} to ${customEndDate}`
        : dateRange

      // Summary sheet
      const summaryData = [
        ['IKIMINA WALLET - REPORT EXPORT'],
        [`Report Type: ${reportTypeName}`],
        [`Date Range: ${dateRangeText}`],
        [`Group: ${groupName}`],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['SUMMARY'],
        ['Total Contributions (RWF)', summary.totalContributions],
        ['Total Loans (RWF)', summary.totalLoans],
        ['Total Members', summary.totalMembers],
        ['Average Compliance (%)', summary.avgCompliance]
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

      // Report-specific sheets
      if (selectedReport === 'performance' && performanceData) {
        const perfData = [
          ['Group Name', 'Code', 'Contributions (RWF)', 'Loans (RWF)', 'Members', 'Performance Score (%)']
        ]
        performanceData.groups.forEach(g => {
          perfData.push([g.name, g.code || '', g.contributions, g.loans, g.members, g.score])
        })
        const perfSheet = XLSX.utils.aoa_to_sheet(perfData)
        XLSX.utils.book_append_sheet(workbook, perfSheet, 'Group Performance')
      }

      if (selectedReport === 'members' && memberAnalytics) {
        const memberData = [
          ['Metric', 'Value'],
          ['Total Members', memberAnalytics.totalMembers],
          ['Active Members', memberAnalytics.activeMembers],
          ['New Members', memberAnalytics.newMembers],
          ['Suspended Members', memberAnalytics.suspendedMembers],
          [],
          ['Top Performing Members'],
          ['Name', 'Group', 'Contributions (RWF)', 'Loans (RWF)']
        ]
        memberAnalytics.topPerformingMembers.forEach(m => {
          memberData.push([m.name, m.group, m.contributions, m.loans])
        })
        const memberSheet = XLSX.utils.aoa_to_sheet(memberData)
        XLSX.utils.book_append_sheet(workbook, memberSheet, 'Member Analytics')
      }

      if (selectedReport === 'financial' && financialData) {
        const financialDataSheet = [
          ['Metric', 'Value (RWF)'],
          ['Total Contributions', financialData.totalContributions],
          ['Total Loans', financialData.totalLoans],
          ['Total Repayments', financialData.totalRepayments],
          ['Outstanding Loans', financialData.outstandingLoans],
          [],
          ['Loan Performance'],
          ['Current Loans', financialData.loanPerformance.current],
          ['Overdue Loans', financialData.loanPerformance.overdue],
          ['Defaulted Loans', financialData.loanPerformance.defaulted]
        ]
        const finSheet = XLSX.utils.aoa_to_sheet(financialDataSheet)
        XLSX.utils.book_append_sheet(workbook, finSheet, 'Financial Report')
      }

      if (selectedReport === 'compliance' && complianceData) {
        const complianceDataSheet = [
          ['Metric', 'Value'],
          ['Overall Score (%)', complianceData.overallScore],
          ['Compliant Groups', complianceData.groupsCompliant],
          ['At Risk Groups', complianceData.groupsAtRisk],
          ['Total Violations', complianceData.violations],
          ['Resolved Violations', complianceData.resolvedViolations],
          ['Pending Violations', complianceData.pendingViolations]
        ]
        const compSheet = XLSX.utils.aoa_to_sheet(complianceDataSheet)
        XLSX.utils.book_append_sheet(workbook, compSheet, 'Compliance Report')
      }

      if (selectedReport === 'risk' && riskAnalysis) {
        const riskDataSheet = [
          ['Risk Level', 'Number of Groups'],
          ['High Risk', riskAnalysis.highRiskGroups],
          ['Medium Risk', riskAnalysis.mediumRiskGroups],
          ['Low Risk', riskAnalysis.lowRiskGroups],
          [],
          ['Recommendations']
        ]
        riskAnalysis.recommendations.forEach(rec => {
          riskDataSheet.push([rec])
        })
        const riskSheet = XLSX.utils.aoa_to_sheet(riskDataSheet)
        XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Analysis')
      }

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `${selectedReport}-report-${dateStr}.xlsx`

      // Write and download
      XLSX.writeFile(workbook, filename)
      alert('Report exported successfully as Excel file!')
    } catch (err) {
      console.error('Failed to export report:', err)
      alert('Failed to export report. Please try again.')
    }
  }

  const handleGenerateReport = async () => {
    // Generate report is now the same as export
    handleExportReport()
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
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Group Filter
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="input-field w-full"
              >
                {groups.length === 0 ? (
                  <option value="all">Loading groups...</option>
                ) : (
                  groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                      {group.code && ` (${group.code})`}
                      {group.district && ` - ${group.district}`}
                    </option>
                  ))
                )}
              </select>
              {groups.length > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  {groups.length - 1} group{groups.length - 1 !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <button 
                onClick={() => setShowCustomRange(!showCustomRange)}
                className="btn-primary flex items-center gap-2"
              >
                <Calendar size={18} /> Custom Range
              </button>
            </div>
          </div>
          
          {showCustomRange && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setCustomStartDate('')
                      setCustomEndDate('')
                      setShowCustomRange(false)
                    }}
                    className="btn-secondary px-4"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                When custom dates are set, they will override the date range dropdown above.
              </p>
            </div>
          )}
        </div>

        {/* Summary Cards - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.totalContributions.toLocaleString()} RWF
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
                  {summary.totalLoans.toLocaleString()} RWF
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
                  {summary.totalMembers}
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
                  {summary.avgCompliance}%
                </p>
              </div>
              <BarChart3 className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="card">
              <div className="text-center py-8">
                <LoadingSpinner size="default" text="Loading report data..." />
              </div>
            </div>
          ) : selectedReport === 'performance' && performanceData ? (
            <div className="space-y-6">
              {/* Performance Trends */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Contributions Trend</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.contributions.current.toLocaleString()} RWF
                      </p>
                      {performanceData.trends.contributions.change !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(performanceData.trends.contributions.change)}
                          <span className={`text-xs ${performanceData.trends.contributions.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(performanceData.trends.contributions.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <DollarSign className="text-green-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Loans Trend</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.loans.current.toLocaleString()} RWF
                      </p>
                      {performanceData.trends.loans.change !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(performanceData.trends.loans.change)}
                          <span className={`text-xs ${performanceData.trends.loans.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(performanceData.trends.loans.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <Building2 className="text-blue-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Members Trend</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.members.current}
                      </p>
                      {performanceData.trends.members.change !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(performanceData.trends.members.change)}
                          <span className={`text-xs ${performanceData.trends.members.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(performanceData.trends.members.change)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <Users className="text-purple-600" size={32} />
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Compliance Trend</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performanceData.trends.compliance.current}%
                      </p>
                      {performanceData.trends.compliance.change !== 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(performanceData.trends.compliance.change)}
                          <span className={`text-xs ${performanceData.trends.compliance.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(performanceData.trends.compliance.change)}%
                          </span>
                        </div>
                      )}
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
                    <p className="text-2xl font-bold text-green-600">{financialData.loanPerformance.current || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <p className="text-sm text-gray-600">Overdue Loans</p>
                    <p className="text-2xl font-bold text-yellow-600">{financialData.loanPerformance.overdue || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-gray-600">Defaulted Loans</p>
                    <p className="text-2xl font-bold text-red-600">{financialData.loanPerformance.defaulted || 0}</p>
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
