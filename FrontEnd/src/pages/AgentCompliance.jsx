import { useState, useEffect } from 'react'
import { Shield, AlertCircle, CheckCircle, Eye, BarChart3, TrendingUp, TrendingDown, Users, DollarSign, FileText, Download, Filter, Search, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentCompliance() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [groups, setGroups] = useState([])
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState([])

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        // Fetch groups, loans, contributions, transactions, and audit logs
        const [groupsRes, loansRes, contributionsRes, transactionsRes, auditRes] = await Promise.all([
          api.get('/groups'),
          api.get('/loans').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/contributions').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/transactions').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/audit-logs?limit=1000').catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (!mounted) return

        const groupsData = groupsRes.data?.data || []
        const loans = loansRes.data?.data || []
        const contributions = contributionsRes.data?.data || []
        const transactions = transactionsRes.data?.data || []
        const audits = auditRes.data?.data || []
        
        setAuditLogs(audits)

        // Calculate compliance metrics for each group
        const groupsWithCompliance = await Promise.all(groupsData.map(async (group) => {
          // Get group-specific data
          const groupLoans = loans.filter(l => l.groupId === group.id)
          const groupContributions = contributions.filter(c => c.groupId === group.id)
          const groupTransactions = transactions.filter(t => t.groupId === group.id)
          
          // Calculate repayment rate
          const paidLoans = groupLoans.filter(l => l.status === 'completed' || l.status === 'paid').length
          const totalActiveLoans = groupLoans.filter(l => ['approved', 'disbursed', 'active'].includes(l.status)).length
          const repaymentRate = totalActiveLoans > 0 ? Math.round((paidLoans / totalActiveLoans) * 100) : 100

          // Calculate compliance score (based on repayment rate, active status, contributions regularity)
          const overdueLoans = groupLoans.filter(l => l.status === 'overdue').length
          const activeContributions = groupContributions.filter(c => c.status === 'completed').length
          const pendingContributions = groupContributions.filter(c => c.status === 'pending').length
          
          let complianceScore = 100
          if (overdueLoans > 0) complianceScore -= (overdueLoans * 5)
          if (pendingContributions > activeContributions) complianceScore -= 10
          if (group.status !== 'active') complianceScore -= 20
          complianceScore = Math.max(0, Math.min(100, complianceScore))

          // Determine risk level
          let riskLevel = 'low'
          if (complianceScore < 70) riskLevel = 'high'
          else if (complianceScore < 85) riskLevel = 'medium'

          // Count violations from audit logs (actions that might indicate issues)
          const groupViolations = audits.filter(a => 
            a.entityType === 'Loan' && 
            a.action && 
            (a.action.includes('OVERDUE') || a.action.includes('DEFAULT') || a.action.includes('VIOLATION'))
          ).length

          // Get last audit date
          const groupAudits = audits.filter(a => a.entityType === 'Group' && a.entityId === group.id)
          const lastAudit = groupAudits.length > 0 && groupAudits[0]?.createdAt
            ? new Date(groupAudits.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0].createdAt).toISOString().split('T')[0]
            : null

          return {
            id: group.id,
            name: group.name,
            district: group.district || 'N/A',
            status: group.status || 'active',
            complianceScore,
            riskLevel,
            totalMembers: group.totalMembers || 0,
            totalContributions: Number(group.totalSavings || 0),
            totalLoans: groupLoans.reduce((sum, l) => sum + Number(l.amount || 0), 0),
            repaymentRate,
            lastAudit: lastAudit || 'Never',
            violations: groupViolations
          }
        }))

        setGroups(groupsWithCompliance)

        // Generate violations list from audit logs and overdue loans
        const violationsList = []
        groupsWithCompliance.forEach(group => {
          if (group.violations > 0) {
            violationsList.push({
              id: `V${group.id}`,
              groupId: group.id,
              groupName: group.name,
              type: 'Compliance Issue',
              description: `${group.violations} compliance issues detected`,
              severity: group.riskLevel === 'high' ? 'high' : group.riskLevel === 'medium' ? 'medium' : 'low',
              date: group.lastAudit !== 'Never' ? group.lastAudit : new Date().toISOString().split('T')[0],
              status: 'pending',
              resolvedBy: null
            })
          }
        })

        // Add overdue loans as violations
        loans.filter(l => l.status === 'overdue').forEach(loan => {
          const group = groupsWithCompliance.find(g => g.id === loan.groupId)
          if (group) {
            violationsList.push({
              id: `V-LOAN-${loan.id}`,
              groupId: loan.groupId,
              groupName: group.name,
              type: 'Loan Overdue',
              description: `Loan ID ${loan.id} is overdue. Amount: ${loan.amount} RWF`,
              severity: 'medium',
              date: loan.dueDate || new Date().toISOString().split('T')[0],
              status: 'pending',
              resolvedBy: null
            })
          }
        })

        setViolations(violationsList)
      } catch (err) {
        console.error('Failed to load compliance data:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const filteredGroups = groups.filter(group => {
    const matchesStatus = filterStatus === 'all' || group.status === filterStatus
    const matchesRisk = filterRisk === 'all' || group.riskLevel === filterRisk
    const matchesSearch = 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesRisk && matchesSearch
  })

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'inactive': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTrendIcon = (trend) => {
    if (trend === 'up') {
      return <TrendingUp className="text-green-600" size={16} />
    }
    return <TrendingDown className="text-red-600" size={16} />
  }

  const handleViewGroupDetails = (group) => {
    setSelectedGroup(group)
    setShowGroupDetails(true)
  }

  const handleGenerateComplianceReport = async () => {
    try {
      // Generate comprehensive compliance report
      let reportContent = 'UMURENGE WALLET - COMPLIANCE REPORT\n'
      reportContent += `Generated: ${new Date().toLocaleString()}\n`
      reportContent += `Total Groups: ${groups.length}\n`
      reportContent += `High Risk Groups: ${groups.filter(g => g.riskLevel === 'high').length}\n`
      reportContent += `Active Violations: ${violations.filter(v => v.status !== 'resolved').length}\n`
      reportContent += `Average Compliance Score: ${groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + g.complianceScore, 0) / groups.length) : 0}%\n\n`

      reportContent += 'GROUP COMPLIANCE DETAILS\n'
      reportContent += '='.repeat(80) + '\n'
      groups.forEach(group => {
        reportContent += `\nGroup: ${group.name} (ID: ${group.id})\n`
        reportContent += `  District: ${group.district}\n`
        reportContent += `  Status: ${group.status}\n`
        reportContent += `  Compliance Score: ${group.complianceScore}%\n`
        reportContent += `  Risk Level: ${group.riskLevel}\n`
        reportContent += `  Members: ${group.totalMembers}\n`
        reportContent += `  Total Contributions: ${(group.totalContributions || 0).toLocaleString()} RWF\n`
        reportContent += `  Total Loans: ${(group.totalLoans || 0).toLocaleString()} RWF\n`
        reportContent += `  Repayment Rate: ${group.repaymentRate}%\n`
        reportContent += `  Violations: ${group.violations}\n`
        reportContent += `  Last Audit: ${group.lastAudit}\n`
      })

      reportContent += '\n\nACTIVE VIOLATIONS\n'
      reportContent += '='.repeat(80) + '\n'
      violations.filter(v => v.status !== 'resolved').forEach(v => {
        reportContent += `\nID: ${v.id}\n`
        reportContent += `  Group: ${v.groupName}\n`
        reportContent += `  Type: ${v.type}\n`
        reportContent += `  Description: ${v.description}\n`
        reportContent += `  Severity: ${v.severity}\n`
        reportContent += `  Date: ${v.date}\n`
        reportContent += `  Status: ${v.status}\n`
      })

      // Create and download report
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Compliance report generated successfully!')
    } catch (err) {
      console.error('Failed to generate report:', err)
      alert('Failed to generate compliance report')
    }
  }

  const handleExportViolations = async () => {
    try {
      const activeViolations = violations.filter(v => v.status !== 'resolved')
      
      let csvContent = 'UMURENGE WALLET - VIOLATIONS EXPORT\n'
      csvContent += `Generated: ${new Date().toLocaleString()}\n`
      csvContent += `Total Violations: ${activeViolations.length}\n\n`
      csvContent += 'ID\tGroup Name\tType\tDescription\tSeverity\tDate\tStatus\n'
      
      activeViolations.forEach(v => {
        csvContent += `${v.id}\t${v.groupName}\t${v.type}\t${v.description}\t${v.severity}\t${v.date}\t${v.status}\n`
      })

      const blob = new Blob([csvContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `violations-export-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Violations exported successfully!')
    } catch (err) {
      console.error('Failed to export violations:', err)
      alert('Failed to export violations')
    }
  }

  const handleResolveViolation = async (violationId) => {
    try {
      // Mark violation as resolved (would need backend endpoint)
      setViolations(prev => prev.map(v => 
        v.id === violationId ? { ...v, status: 'resolved', resolvedBy: 'Agent' } : v
      ))
      alert('Violation marked as resolved!')
    } catch (err) {
      console.error('Failed to resolve violation:', err)
      alert('Failed to resolve violation')
    }
  }

  const handleInvestigateViolation = async (violationId) => {
    try {
      // Mark violation as investigating
      setViolations(prev => prev.map(v => 
        v.id === violationId ? { ...v, status: 'investigating' } : v
      ))
      alert('Investigation started!')
    } catch (err) {
      console.error('Failed to start investigation:', err)
      alert('Failed to start investigation')
    }
  }

  const handleViewGroupPerformance = async (groupId) => {
    // Fetch detailed performance data for the group
    try {
      const { data } = await api.get(`/groups/${groupId}/stats`)
      if (data?.success) {
        alert(`Group Performance:\nMembers: ${data.data.totalMembers}\nActive Loans: ${data.data.activeLoans}\nPending Contributions: ${data.data.pendingContributions}\nTotal Savings: ${data.data.totalSavings} RWF`)
      }
    } catch (err) {
      console.error('Failed to fetch group performance:', err)
      alert('Failed to load group performance data')
    }
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Monitoring & Compliance</h1>
            <p className="text-gray-600 mt-1">Monitor group activities and ensure compliance with UMURENGE WALLET policies</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateComplianceReport}
              className="btn-primary flex items-center gap-2"
            >
              <FileText size={18} /> Generate Report
            </button>
            <button
              onClick={handleExportViolations}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export Violations
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Groups</p>
                <p className="text-2xl font-bold text-gray-800">{groups.length}</p>
              </div>
              <Shield className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">High Risk Groups</p>
                <p className="text-2xl font-bold text-red-600">
                  {groups.filter(g => g.riskLevel === 'high').length}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Violations</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {violations.filter(v => v.status === 'pending' || v.status === 'investigating').length}
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Avg Compliance</p>
                <p className="text-2xl font-bold text-green-600">
                  {groups.length > 0 ? Math.round(groups.reduce((sum, g) => sum + (g.complianceScore || 0), 0) / groups.length) : 0}%
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Groups
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, district, or ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Risk
              </label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="input-field"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Groups Compliance Overview */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Groups Compliance Overview ({filteredGroups.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading compliance data...</p>
          ) : filteredGroups.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No groups found. Groups will appear here once they are registered.</p>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {group.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{group.name || 'Unknown Group'}</h3>
                      <p className="text-sm text-gray-600">{group.district || 'N/A'}</p>
                      <p className="text-sm text-gray-500">ID: {group.id} • Last Audit: {group.lastAudit || 'Never'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(group.status || 'active')}`}>
                      {group.status || 'active'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(group.riskLevel || 'medium')}`}>
                      {group.riskLevel || 'medium'} risk
                    </span>
                    <span className="text-sm text-gray-600">
                      {group.complianceScore || 0}% compliance
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Members</p>
                    <p className="font-semibold">{group.totalMembers || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contributions</p>
                    <p className="font-semibold">{(group.totalContributions || 0).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Loans</p>
                    <p className="font-semibold">{(group.totalLoans || 0).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Repayment Rate</p>
                    <p className="font-semibold">{group.repaymentRate || 0}%</p>
                  </div>
                </div>


                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewGroupDetails(group)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  <button 
                    onClick={() => handleViewGroupPerformance(group.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <BarChart3 size={16} /> Performance
                  </button>
                  {group.violations > 0 && (
                    <button className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <AlertCircle size={16} /> {group.violations} Violations
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Violations List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Active Violations ({violations.filter(v => v.status !== 'resolved').length})
            </h2>
          </div>

          {violations.filter(v => v.status !== 'resolved').length === 0 ? (
            <p className="text-center py-8 text-gray-500">No active violations. All groups are compliant.</p>
          ) : (
            violations.filter(v => v.status !== 'resolved').map((violation) => (
              <div
                key={violation.id}
                className="p-4 bg-red-50 rounded-xl border border-red-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{violation.type || 'Compliance Issue'}</h3>
                    <p className="text-sm text-gray-600">{violation.groupName || 'Unknown Group'}</p>
                    <p className="text-sm text-gray-500">ID: {violation.id} • Date: {violation.date || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(violation.severity || 'medium')}`}>
                      {violation.severity || 'medium'} severity
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      violation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      violation.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {violation.status || 'pending'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{violation.description || 'No description available'}</p>

                <div className="flex gap-2">
                  {violation.status === 'pending' && (
                    <button
                      onClick={() => handleResolveViolation(violation.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Resolve
                    </button>
                  )}
                  {violation.status === 'investigating' && (
                    <button
                      onClick={() => handleInvestigateViolation(violation.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Eye size={16} /> Continue Investigation
                    </button>
                  )}
                  <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                    <FileText size={16} /> View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Group Details Modal */}
        {showGroupDetails && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Group Compliance Details</h2>
                <button
                  onClick={() => setShowGroupDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedGroup.name?.[0]?.toUpperCase() || 'G'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedGroup.name}</h3>
                    <p className="text-gray-600">{selectedGroup.district}</p>
                    <p className="text-sm text-gray-500">Group ID: {selectedGroup.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Compliance Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compliance Score:</span>
                        <span className="font-semibold">{selectedGroup.complianceScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(selectedGroup.riskLevel)}`}>
                          {selectedGroup.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedGroup.status)}`}>
                          {selectedGroup.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Audit:</span>
                        <span className="font-semibold">{selectedGroup.lastAudit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Violations:</span>
                        <span className="font-semibold">{selectedGroup.violations}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Repayment Rate:</span>
                        <span className="font-semibold">{selectedGroup.repaymentRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Members:</span>
                        <span className="font-semibold">{selectedGroup.totalMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Contributions:</span>
                        <span className="font-semibold">{(selectedGroup.totalContributions || 0).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Loans:</span>
                        <span className="font-semibold">{(selectedGroup.totalLoans || 0).toLocaleString()} RWF</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowGroupDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button className="btn-primary flex-1">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AgentCompliance
