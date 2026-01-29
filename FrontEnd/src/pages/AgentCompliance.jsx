import { useState, useEffect } from 'react'
import { Shield, AlertCircle, CheckCircle, Eye, BarChart3, TrendingUp, TrendingDown, Users, DollarSign, FileText, Download, Filter, Search, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

function AgentCompliance() {
  const { t } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [groups, setGroups] = useState([])
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalGroups: 0,
    highRiskGroups: 0,
    activeViolations: 0,
    avgCompliance: 0
  })
  const [violationStartDate, setViolationStartDate] = useState('')
  const [violationEndDate, setViolationEndDate] = useState('')
  const [searchedGroups, setSearchedGroups] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Load groups from database (like transfer page)
  const loadGroupsFromDB = async (searchTerm = '') => {
    try {
      const params = { viewAll: 'true' }
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      console.log('[AgentCompliance] Fetching groups with params:', params)
      const { data } = await api.get('/groups', { params })
      if (data?.success) {
        return data.data || []
      }
      return []
    } catch (err) {
      console.error('[AgentCompliance] Failed to load groups:', err)
      return []
    }
  }

  // Load compliance data for a specific group
  const loadGroupCompliance = async (groupId) => {
      try {
        setLoading(true)
      const params = {}
      
      // Add status filter
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus
      }
      
      // Add risk level filter
      if (filterRisk && filterRisk !== 'all') {
        params.riskLevel = filterRisk
      }

      // Add date range for violations
      if (violationStartDate) {
        params.startDate = violationStartDate
      }
      if (violationEndDate) {
        params.endDate = violationEndDate
      }

      // If a specific group is selected, we'll filter on the frontend
      console.log('[AgentCompliance] Fetching compliance data with params:', params)
      const { data } = await api.get('/agent/compliance/dashboard', { params })

      if (data?.success) {
        console.log('[AgentCompliance] Received data:', data.data)
        const allGroups = data.data.groups || []
        
        // If a group is selected, filter to show only that group
        const filteredGroups = groupId 
          ? allGroups.filter(g => g.id.toString() === groupId.toString())
          : allGroups

        setSummary(data.data.summary || {
          totalGroups: 0,
          highRiskGroups: 0,
          activeViolations: 0,
          avgCompliance: 0
        })
        setGroups(filteredGroups)
        setViolations(data.data.violations || [])
      } else {
        console.warn('[AgentCompliance] No success in response:', data)
        setSummary({ totalGroups: 0, highRiskGroups: 0, activeViolations: 0, avgCompliance: 0 })
        setGroups([])
        setViolations([])
      }
    } catch (err) {
      console.error('[AgentCompliance] Failed to load compliance data:', err)
      setSummary({ totalGroups: 0, highRiskGroups: 0, activeViolations: 0, avgCompliance: 0 })
      setGroups([])
      setViolations([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search button click (like transfer page)
  const handleSearchGroups = async () => {
    try {
      const groupsList = await loadGroupsFromDB(searchTerm)
      setSearchedGroups(groupsList)
      setShowSearchResults(true)
    } catch (err) {
      console.error('Search failed:', err)
      alert('Failed to search groups. Please try again.')
    }
  }

  // Handle group selection from search results
  const handleSelectGroup = (group) => {
    setSelectedGroup(group)
    setShowSearchResults(false)
    setSearchTerm(group.name) // Show selected group name in search box
    loadGroupCompliance(group.id) // Load compliance for selected group
  }

  // Load compliance data when filters change (but not when search term changes - that's handled by search button)
  useEffect(() => {
    if (!selectedGroup) {
      // Only load if no group is selected
      loadGroupCompliance(null)
    } else {
      // Reload compliance for selected group when filters change
      loadGroupCompliance(selectedGroup.id)
    }
  }, [filterStatus, filterRisk, violationStartDate, violationEndDate])

  // Groups are filtered by selected group or all groups
  const filteredGroups = groups

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
      // Generate comprehensive compliance report based on current filters and search
      let reportContent = 'IKIMINA WALLET - COMPLIANCE REPORT\n'
      reportContent += `Generated: ${new Date().toLocaleString()}\n`
      reportContent += `Filters Applied:\n`
      if (searchTerm) reportContent += `  Search: ${searchTerm}\n`
      if (filterStatus !== 'all') reportContent += `  Status: ${filterStatus}\n`
      if (filterRisk !== 'all') reportContent += `  Risk Level: ${filterRisk}\n`
      reportContent += `\n`
      reportContent += `Total Groups: ${summary.totalGroups}\n`
      reportContent += `High Risk Groups: ${summary.highRiskGroups}\n`
      reportContent += `Active Violations: ${summary.activeViolations}\n`
      reportContent += `Average Compliance Score: ${summary.avgCompliance}%\n\n`

      reportContent += 'GROUP COMPLIANCE DETAILS\n'
      reportContent += '='.repeat(80) + '\n'
      filteredGroups.forEach(group => {
        reportContent += `\nGroup: ${group.name} (ID: ${group.id})\n`
        if (group.code) reportContent += `  Code: ${group.code}\n`
        reportContent += `  District: ${group.district}\n`
        if (group.sector) reportContent += `  Sector: ${group.sector}\n`
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
      violations.forEach(v => {
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
      const dateStr = new Date().toISOString().split('T')[0]
      const filterStr = searchTerm ? `-${searchTerm.substring(0, 10)}` : ''
      a.download = `compliance-report-${dateStr}${filterStr}.txt`
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
      // Export violations based on date range if specified
      let violationsToExport = violations
      
      if (violationStartDate || violationEndDate) {
        violationsToExport = violations.filter(v => {
          const violationDate = new Date(v.date)
          if (violationStartDate && violationEndDate) {
            return violationDate >= new Date(violationStartDate) && violationDate <= new Date(violationEndDate)
          } else if (violationStartDate) {
            return violationDate >= new Date(violationStartDate)
          } else if (violationEndDate) {
            return violationDate <= new Date(violationEndDate)
          }
          return true
        })
      }
      
      let csvContent = 'IKIMINA WALLET - VIOLATIONS EXPORT\n'
      csvContent += `Generated: ${new Date().toLocaleString()}\n`
      if (violationStartDate || violationEndDate) {
        csvContent += `Date Range: ${violationStartDate || 'All'} to ${violationEndDate || 'All'}\n`
      }
      csvContent += `Total Violations: ${violationsToExport.length}\n\n`
      csvContent += 'ID\tGroup Name\tType\tDescription\tSeverity\tDate\tStatus\n'
      
      violationsToExport.forEach(v => {
        csvContent += `${v.id}\t${v.groupName}\t${v.type}\t${v.description}\t${v.severity}\t${v.date}\t${v.status}\n`
      })

      const blob = new Blob([csvContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      const rangeStr = violationStartDate || violationEndDate ? `-${violationStartDate || 'start'}-${violationEndDate || 'end'}` : ''
      a.download = `violations-export-${dateStr}${rangeStr}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert(`Violations exported successfully! (${violationsToExport.length} violations)`)
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
            <p className="text-gray-600 mt-1">Monitor group activities and ensure compliance with IKIMINA WALLET policies</p>
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

        {/* Date Range for Violations Export */}
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Export Violations Date Range (Optional)
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={violationStartDate}
                    onChange={(e) => setViolationStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={violationEndDate}
                    onChange={(e) => setViolationEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                {(violationStartDate || violationEndDate) && (
                  <button
                    onClick={() => {
                      setViolationStartDate('')
                      setViolationEndDate('')
                    }}
                    className="btn-secondary px-4"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to export all violations. Set date range to filter violations by reported date.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Groups</p>
                <p className="text-2xl font-bold text-gray-800">{summary.totalGroups}</p>
              </div>
              <Shield className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">High Risk Groups</p>
                <p className="text-2xl font-bold text-red-600">{summary.highRiskGroups}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Violations</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.activeViolations}</p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Avg Compliance</p>
                <p className="text-2xl font-bold text-green-600">{summary.avgCompliance}%</p>
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchGroups()
                      }
                    }}
                    placeholder="Search by name, district, code, or sector..."
                  className="input-field pl-10"
                />
                </div>
                <button
                  onClick={handleSearchGroups}
                  className="btn-primary px-6 whitespace-nowrap"
                >
                  <Search size={18} className="mr-2" />
                  Search
                </button>
                {selectedGroup && (
                  <button
                    onClick={() => {
                      setSelectedGroup(null)
                      setSearchTerm('')
                      setShowSearchResults(false)
                      loadGroupCompliance(null)
                    }}
                    className="btn-secondary px-4 whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* Display search results as clickable items (like transfer page) */}
              {showSearchResults && searchedGroups.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Found {searchedGroups.length} group{searchedGroups.length !== 1 ? 's' : ''}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {searchedGroups.map(group => (
                      <div
                        key={group.id}
                        onClick={() => handleSelectGroup(group)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedGroup && selectedGroup.id === group.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{group.name || 'Unknown Group'}</p>
                            {group.code && (
                              <p className="text-sm text-gray-600">Code: {group.code}</p>
                            )}
                            {group.district && (
                              <p className="text-xs text-gray-500">District: {group.district}</p>
                            )}
                            {group.sector && (
                              <p className="text-xs text-gray-500">Sector: {group.sector}</p>
                            )}
                          </div>
                          {selectedGroup && selectedGroup.id === group.id && (
                            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="text-white" size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showSearchResults && searchedGroups.length === 0 && searchTerm && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No groups found matching "{searchTerm}". Please try a different search term.
                  </p>
                </div>
              )}

              {selectedGroup && (
                <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-primary-800">Selected Group: {selectedGroup.name}</p>
                      {selectedGroup.code && (
                        <p className="text-sm text-primary-600">Code: {selectedGroup.code}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroup(null)
                        setSearchTerm('')
                        setShowSearchResults(false)
                        loadGroupCompliance(null)
                      }}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              )}
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
            <div className="text-center py-8">
              <LoadingSpinner size="default" text="Loading compliance data..." />
            </div>
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
