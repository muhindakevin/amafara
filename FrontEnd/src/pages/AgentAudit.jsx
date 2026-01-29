import { useState, useEffect } from 'react'
import { FileCheck, Eye, CheckCircle, XCircle, AlertCircle, Download, Search, Filter, Calendar, Users, DollarSign, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function AgentAudit() {
  const { t } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [showAuditDetails, setShowAuditDetails] = useState(false)
  const [showCreateAudit, setShowCreateAudit] = useState(false)
  const [showPerformAudit, setShowPerformAudit] = useState(false)
  const [auditRecords, setAuditRecords] = useState([])
  const [scheduledAudits, setScheduledAudits] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalLogs: 0,
    userActions: 0,
    entityTypes: 0,
    groupsTracked: 0
  })

  // Fetch audit logs from database with filters
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)       
      if (filterGroup !== 'all') params.append('groupId', filterGroup)        

      const { data } = await api.get(`/audit-logs?${params.toString()}`)      
      if (data?.success) {
        setAuditRecords(data.data || [])
        if (data.summary) {
          setSummary({
            totalLogs: data.summary.totalLogs || 0,
            userActions: data.summary.successfulLogs || 0,
            entityTypes: new Set((data.data || []).map(a => a.entityType).filter(Boolean)).size,                                                              
            groupsTracked: groups.length
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      setAuditRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (mounted) {
        await fetchAuditLogs()
      }
    })()
    return () => { mounted = false }
  }, [searchTerm, filterType, filterGroup, groups.length])

  // Fetch groups
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/groups', { params: { viewAll: 'true' } })
        if (mounted && data?.success) {
          setGroups(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err)
        if (mounted) {
          setGroups([])
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch scheduled audits
  const fetchScheduledAudits = async () => {
    try {
      const params = new URLSearchParams()
      if (filterGroup !== 'all') params.append('groupId', filterGroup)        
      if (filterStatus !== 'all') params.append('status', filterStatus)       

      const { data } = await api.get(`/audit-logs/scheduled?${params.toString()}`)                                                                            
      if (data?.success) {
        setScheduledAudits(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch scheduled audits:', err)
      setScheduledAudits([])
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (mounted) {
        await fetchScheduledAudits()
      }
    })()
    return () => { mounted = false }
  }, [filterGroup, filterStatus])

  const [newAudit, setNewAudit] = useState({
    groupId: '',
    type: 'compliance_check',
    description: '',
    scheduledDate: ''
  })

  const [performAudit, setPerformAudit] = useState({
    groupId: '',
    auditType: 'compliance_check',
    description: '',
    findings: '',
    recommendations: '',
    checklist: []
  })

  // Transform audit logs to match the display format
  const transformAuditLog = (log) => {
    const details = log.details || {}
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType || 'Unknown',
      entityId: log.entityId,
      user: log.user || {},
      auditor: log.user?.name || 'Unknown',
      auditDate: new Date(log.createdAt).toLocaleDateString(),
      ipAddress: log.ipAddress,
      description: `${log.action} on ${log.entityType || 'entity'} ${log.entityId || ''}`,
      status: 'completed', // All audit logs are completed
      type: log.entityType?.toLowerCase() || 'general',
      details: details
    }
  }

  const transformedAudits = auditRecords.map(transformAuditLog)

  // Filtering is done on backend, but we can do additional client-side filtering if needed
  const filteredAudits = transformedAudits

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'group_verification': return 'bg-blue-100 text-blue-700'
      case 'financial_audit': return 'bg-green-100 text-green-700'
      case 'compliance_check': return 'bg-purple-100 text-purple-700'
      case 'investigation': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateAudit = async () => {
    if (!newAudit.groupId || !newAudit.scheduledDate) {
      alert(tAgent('fillAllRequiredFields', { defaultValue: 'Please fill in all required fields.' }))
      return
    }
    try {
      const { data } = await api.post('/audit-logs/schedule', {
        groupId: parseInt(newAudit.groupId),
        auditType: newAudit.type,
        scheduledDate: newAudit.scheduledDate,
        description: newAudit.description
      })
      
      if (data?.success) {
        alert('Audit scheduled successfully!')
        setShowCreateAudit(false)
        setNewAudit({
          groupId: '',
          type: 'compliance_check',
          description: '',
          scheduledDate: ''
        })
        // Refresh scheduled audits and audit logs
        await fetchScheduledAudits()
        await fetchAuditLogs()
      } else {
        throw new Error(data?.message || 'Failed to schedule audit')
      }
    } catch (err) {
      console.error('Failed to create audit:', err)
      alert(err?.response?.data?.message || err.message || tAgent('failedToScheduleAudit', { defaultValue: 'Failed to schedule audit' }))
    }
  }

  const handleViewAuditDetails = (audit) => {
    setSelectedAudit(audit)
    setShowAuditDetails(true)
  }

  // Initialize checklist when audit type or group changes
  useEffect(() => {
    if (performAudit.groupId && performAudit.auditType) {
      // Generate checklist based on audit type
      const baseChecklist = [
        { item: 'Group registration documents verified', status: 'pending', category: 'documentation' },
        { item: 'Group admin credentials verified', status: 'pending', category: 'verification' },
        { item: 'Group compliance rules reviewed', status: 'pending', category: 'compliance' }
      ]

      let checklist = []
      switch (performAudit.auditType) {
        case 'compliance_check':
          checklist = [
            ...baseChecklist,
            { item: 'All compliance violations reviewed', status: 'pending', category: 'compliance' },
            { item: 'Compliance rules adherence verified', status: 'pending', category: 'compliance' },
            { item: 'Member compliance status checked', status: 'pending', category: 'compliance' },
            { item: 'Group meeting attendance verified', status: 'pending', category: 'compliance' },
            { item: 'Voting participation verified', status: 'pending', category: 'compliance' }
          ]
          break
        case 'financial_audit':
          checklist = [
            ...baseChecklist,
            { item: 'All contributions recorded and verified', status: 'pending', category: 'financial' },
            { item: 'Loan records accuracy verified', status: 'pending', category: 'financial' },
            { item: 'Transaction history reviewed', status: 'pending', category: 'financial' },
            { item: 'Fine records verified', status: 'pending', category: 'financial' },
            { item: 'Financial reports accuracy checked', status: 'pending', category: 'financial' },
            { item: 'Outstanding loans reviewed', status: 'pending', category: 'financial' },
            { item: 'Payment schedules verified', status: 'pending', category: 'financial' },
            { item: 'Guarantor information verified', status: 'pending', category: 'financial' }
          ]
          break
        case 'group_verification':
          checklist = [
            ...baseChecklist,
            { item: 'Group member list verified', status: 'pending', category: 'verification' },
            { item: 'Member registration documents reviewed', status: 'pending', category: 'verification' },
            { item: 'Group admin, secretary, and cashier roles verified', status: 'pending', category: 'verification' },
            { item: 'Group location and contact information verified', status: 'pending', category: 'verification' },
            { item: 'Group code and identification verified', status: 'pending', category: 'verification' },
            { item: 'Group status and activity verified', status: 'pending', category: 'verification' }
          ]
          break
        case 'investigation':
          checklist = [
            ...baseChecklist,
            { item: 'Suspicious activities identified', status: 'pending', category: 'investigation' },
            { item: 'Transaction anomalies reviewed', status: 'pending', category: 'investigation' },
            { item: 'Compliance violations investigated', status: 'pending', category: 'investigation' },
            { item: 'User activity logs reviewed', status: 'pending', category: 'investigation' },
            { item: 'Audit trail verified', status: 'pending', category: 'investigation' },
            { item: 'Evidence collected and documented', status: 'pending', category: 'investigation' }
          ]
          break
        default:
          checklist = baseChecklist
      }
      setPerformAudit({ ...performAudit, checklist })
    }
  }, [performAudit.groupId, performAudit.auditType])

  const handlePerformAudit = async () => {
    if (!performAudit.groupId || !performAudit.auditType) {
      alert('Please select a group and audit type.')
      return
    }

    // Mark all checklist items as completed for immediate audit
    const completedChecklist = performAudit.checklist.map(item => ({
      ...item,
      status: 'completed'
    }))

    try {
      // First create a scheduled audit and immediately complete it
      const scheduleData = await api.post('/audit-logs/schedule', {
        groupId: parseInt(performAudit.groupId),
        auditType: performAudit.auditType,
        scheduledDate: new Date().toISOString(),
        description: performAudit.description || `Immediate ${performAudit.auditType.replace('_', ' ')} audit`
      })

      if (scheduleData.data?.success && scheduleData.data.data?.id) {
        // Update the audit to completed with findings and recommendations
        const updateData = await api.put(`/audit-logs/scheduled/${scheduleData.data.data.id}`, {
          status: 'completed',
          checklist: completedChecklist,
          findings: performAudit.findings,
          recommendations: performAudit.recommendations
        })

        if (updateData.data?.success) {
          alert('Audit performed and submitted successfully!')
          setShowPerformAudit(false)
          setPerformAudit({
            groupId: '',
            auditType: 'compliance_check',
            description: '',
            findings: '',
            recommendations: '',
            checklist: []
          })
          // Refresh data
          await fetchScheduledAudits()
          await fetchAuditLogs()
        } else {
          throw new Error('Failed to complete audit')
        }
      } else {
        throw new Error('Failed to create audit')
      }
    } catch (err) {
      console.error('Failed to perform audit:', err)
      alert(err?.response?.data?.message || err.message || 'Failed to perform audit')
    }
  }


  const handleGenerateAuditReport = async () => {
    try {
      // Build query params for export
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)
      if (filterGroup !== 'all') params.append('groupId', filterGroup)
      
      // Export as Excel
      const response = await api.get(`/audit-logs/export/excel?${params.toString()}`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Generate filename with group name if filtered
      let filename = `audit_report_${new Date().toISOString().split('T')[0]}.xlsx`
      if (filterGroup !== 'all') {
        const selectedGroup = groups.find(g => g.id === parseInt(filterGroup))
        if (selectedGroup) {
          filename = `audit_report_${selectedGroup.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Audit report exported successfully!')
    } catch (err) {
      console.error('Failed to generate audit report:', err)
      alert('Failed to generate audit report')
    }
  }


  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Audit & Verification</h1>
            <p className="text-gray-600 mt-1">Verify groups and conduct audits for compliance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPerformAudit(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FileCheck size={18} /> Perform Audit
            </button>
            <button
              onClick={() => setShowCreateAudit(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar size={18} /> Schedule Audit
            </button>
            <button
              onClick={handleGenerateAuditReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Generate Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Audit Logs</p>
                <p className="text-2xl font-bold text-gray-800">{summary.totalLogs}</p>
              </div>
              <FileCheck className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">User Actions</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.userActions}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Entity Types</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summary.entityTypes}
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Groups Tracked</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.groupsTracked}
                </p>
              </div>
              <Shield className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Scheduled Audits */}
        {scheduledAudits.length > 0 && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Scheduled Audits ({scheduledAudits.length})
              </h2>
            </div>

            <div className="space-y-4">
              {scheduledAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {audit.group?.name || 'Unknown Group'} - {audit.auditType.replace('_', ' ').toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600">{audit.description}</p>
                      <p className="text-sm text-gray-500">
                        Scheduled: {new Date(audit.scheduledDate).toLocaleDateString()} • 
                        By: {audit.scheduler?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(audit.status)}`}>
                      {audit.status}
                    </span>
                  </div>

                  {audit.checklist && audit.checklist.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Checklist Items:</p>
                      <div className="space-y-2">
                        {audit.checklist.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === 'completed' ? 'bg-green-100 text-green-700' :
                              item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-gray-700">{item.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAudit({ ...audit, type: 'scheduled' })
                        setShowAuditDetails(true)
                      }}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                    {audit.status !== 'completed' && audit.status !== 'cancelled' && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to mark this audit as completed?')) {
                            try {
                              const { data } = await api.put(`/audit-logs/scheduled/${audit.id}`, {
                                status: 'completed'
                              })
                              if (data?.success) {
                                alert('Audit marked as completed!')
                                await fetchScheduledAudits()
                                await fetchAuditLogs()
                              }
                            } catch (err) {
                              console.error('Failed to complete audit:', err)
                              alert('Failed to complete audit')
                            }
                          }
                        }}
                        className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Complete Audit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Audits
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by group, auditor, or ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Group
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="input-field"
              >
                <option value="all">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.code ? `(${group.code})` : ''}
                  </option>
                ))}
              </select>
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
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                <option value="user">User Actions</option>
                <option value="group">Group Actions</option>
                <option value="loan">Loan Actions</option>
                <option value="contribution">Contribution Actions</option>
                <option value="fine">Fine Actions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Records */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Audit Records ({filteredAudits.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs available. Audit logs will appear here as actions are performed in the system.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {audit.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{audit.description}</h3>
                        <p className="text-sm text-gray-600">Entity: {audit.entityType} (ID: {audit.entityId || 'N/A'})</p>
                        <p className="text-sm text-gray-500">ID: {audit.id} • User: {audit.auditor} • Date: {audit.auditDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(audit.type)}`}>
                        {audit.entityType || 'General'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(audit.status)}`}>
                        {audit.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Action</p>
                      <p className="font-semibold">{audit.action}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Entity Type</p>
                      <p className="font-semibold">{audit.entityType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">User</p>
                      <p className="font-semibold">{audit.auditor}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">IP Address</p>
                      <p className="font-semibold">{audit.ipAddress || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewAuditDetails(audit)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                    <button 
                      onClick={handleGenerateAuditReport}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Download size={16} /> Export Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Audit Modal */}
        {showCreateAudit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Schedule New Audit</h2>
                <button
                  onClick={() => setShowCreateAudit(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Group
                    </label>
                    <select
                      value={newAudit.groupId}
                      onChange={(e) => setNewAudit({ ...newAudit, groupId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audit Type
                    </label>
                    <select
                      value={newAudit.type}
                      onChange={(e) => setNewAudit({ ...newAudit, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="compliance_check">Compliance Check</option>
                      <option value="financial_audit">Financial Audit</option>
                      <option value="group_verification">Group Verification</option>
                      <option value="investigation">Investigation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={newAudit.scheduledDate}
                      onChange={(e) => setNewAudit({ ...newAudit, scheduledDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newAudit.description}
                    onChange={(e) => setNewAudit({ ...newAudit, description: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter audit description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateAudit(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAudit}
                    className="btn-primary flex-1"
                  >
                    Schedule Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Perform Audit Modal */}
        {showPerformAudit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Perform Audit</h2>
                <button
                  onClick={() => setShowPerformAudit(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={performAudit.groupId}
                      onChange={(e) => setPerformAudit({ ...performAudit, groupId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audit Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={performAudit.auditType}
                      onChange={(e) => setPerformAudit({ ...performAudit, auditType: e.target.value })}
                      className="input-field"
                    >
                      <option value="compliance_check">Compliance Check</option>
                      <option value="financial_audit">Financial Audit</option>
                      <option value="group_verification">Group Verification</option>
                      <option value="investigation">Investigation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={performAudit.description}
                    onChange={(e) => setPerformAudit({ ...performAudit, description: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter audit description..."
                  />
                </div>

                {performAudit.checklist && performAudit.checklist.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Audit Checklist
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {performAudit.checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={item.status === 'completed'}
                            onChange={(e) => {
                              const updatedChecklist = [...performAudit.checklist]
                              updatedChecklist[index] = {
                                ...item,
                                status: e.target.checked ? 'completed' : 'pending'
                              }
                              setPerformAudit({ ...performAudit, checklist: updatedChecklist })
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700 flex-1">{item.item}</span>
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Findings
                  </label>
                  <textarea
                    value={performAudit.findings}
                    onChange={(e) => setPerformAudit({ ...performAudit, findings: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter audit findings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recommendations
                  </label>
                  <textarea
                    value={performAudit.recommendations}
                    onChange={(e) => setPerformAudit({ ...performAudit, recommendations: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter recommendations..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPerformAudit(false)
                      setPerformAudit({
                        groupId: '',
                        auditType: 'compliance_check',
                        description: '',
                        findings: '',
                        recommendations: '',
                        checklist: []
                      })
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePerformAudit}
                    className="btn-primary flex-1"
                  >
                    Submit Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Details Modal */}
        {showAuditDetails && selectedAudit && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Audit Details</h2>
                <button
                  onClick={() => setShowAuditDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedAudit.id}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedAudit.description}</h3>
                    <p className="text-gray-600">Entity: {selectedAudit.entityType} (ID: {selectedAudit.entityId || 'N/A'})</p>
                    <p className="text-sm text-gray-500">Audit Log ID: {selectedAudit.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Audit Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Action:</span>
                        <span className="font-semibold">{selectedAudit.action}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entity Type:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedAudit.type)}`}>
                          {selectedAudit.entityType || 'General'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entity ID:</span>
                        <span className="font-semibold">{selectedAudit.entityId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User:</span>
                        <span className="font-semibold">{selectedAudit.auditor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-semibold">{selectedAudit.auditDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP Address:</span>
                        <span className="font-semibold">{selectedAudit.ipAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {selectedAudit.type === 'scheduled' ? 'Checklist Items' : 'Additional Details'}
                    </h4>
                    {selectedAudit.type === 'scheduled' && selectedAudit.checklist ? (
                      <div className="space-y-2">
                        {selectedAudit.checklist.map((item, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.status}
                              </span>
                              <span className="text-gray-700">{item.item}</span>
                              {item.category && (
                                <span className="text-xs text-gray-500">({item.category})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedAudit.details || {}, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedAudit.findings && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Findings:</h5>
                        <p className="text-sm text-gray-600">{selectedAudit.findings}</p>
                      </div>
                    )}
                    {selectedAudit.recommendations && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Recommendations:</h5>
                        <p className="text-sm text-gray-600">{selectedAudit.recommendations}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAuditDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button className="btn-primary flex-1">
                    Export Report
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

export default AgentAudit


