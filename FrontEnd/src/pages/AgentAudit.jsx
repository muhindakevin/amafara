import { useState, useEffect } from 'react'
import { FileCheck, Eye, CheckCircle, XCircle, AlertCircle, Download, Search, Filter, Calendar, Users, DollarSign, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AgentAudit() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [showAuditDetails, setShowAuditDetails] = useState(false)
  const [showCreateAudit, setShowCreateAudit] = useState(false)
  const [auditRecords, setAuditRecords] = useState([])
  const [verificationQueue, setVerificationQueue] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch audit logs from database
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/audit-logs')
        if (mounted) {
          setAuditRecords(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
        if (mounted) {
          setAuditRecords([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch groups
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/groups')
        if (mounted) {
          setGroups(data?.data || [])
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

  // Verification queue - no backend endpoint yet

  const [newAudit, setNewAudit] = useState({
    groupId: '',
    type: 'compliance_check',
    description: '',
    scheduledDate: ''
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

  const filteredAudits = transformedAudits.filter(audit => {
    const matchesStatus = filterStatus === 'all' || audit.status === filterStatus
    const matchesType = filterType === 'all' || audit.type === filterType || 
      (filterType === 'compliance_check' && audit.action?.toLowerCase().includes('compliance')) ||
      (filterType === 'financial_audit' && audit.action?.toLowerCase().includes('financial')) ||
      (filterType === 'group_verification' && audit.action?.toLowerCase().includes('group')) ||
      (filterType === 'investigation' && audit.action?.toLowerCase().includes('investigate'))
    const matchesSearch = 
      audit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(audit.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.auditor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

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
    if (!newAudit.groupId || !newAudit.scheduledDate || !newAudit.description) {
      alert('Please fill in all required fields.')
      return
    }
    try {
      // Note: Scheduled audits endpoint doesn't exist yet
      // This would need a backend endpoint to save scheduled audits
      console.log('Creating audit:', newAudit)
      alert('Scheduled audit functionality requires backend support. Please contact system admin to implement this feature.')
      setShowCreateAudit(false)
      setNewAudit({
        groupId: '',
        type: 'compliance_check',
        description: '',
        scheduledDate: ''
      })
    } catch (err) {
      console.error('Failed to create audit:', err)
      alert(err?.response?.data?.message || 'Failed to schedule audit')
    }
  }

  const handleViewAuditDetails = (audit) => {
    setSelectedAudit(audit)
    setShowAuditDetails(true)
  }

  const handleApproveVerification = (verificationId) => {
    console.log('Approving verification:', verificationId)
    alert('Verification approved successfully!')
  }

  const handleRejectVerification = (verificationId) => {
    console.log('Rejecting verification:', verificationId)
    alert('Verification rejected successfully!')
  }

  const handleGenerateAuditReport = async () => {
    try {
      // Generate a plain text report from audit logs
      let report = 'AUDIT REPORT\n'
      report += '='.repeat(50) + '\n\n'
      report += `Generated: ${new Date().toLocaleString()}\n`
      report += `Total Audit Logs: ${auditRecords.length}\n\n`
      
      report += 'AUDIT LOGS:\n'
      report += '-'.repeat(50) + '\n'
      auditRecords.forEach((log, index) => {
        report += `\n${index + 1}. Action: ${log.action}\n`
        report += `   Entity: ${log.entityType || 'N/A'} (ID: ${log.entityId || 'N/A'})\n`
        report += `   User: ${log.user?.name || 'Unknown'} (${log.user?.email || 'N/A'})\n`
        report += `   Date: ${new Date(log.createdAt).toLocaleString()}\n`
        report += `   IP: ${log.ipAddress || 'N/A'}\n`
      })

      // Download as text file
      const blob = new Blob([report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_report_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Audit report generated successfully!')
    } catch (err) {
      console.error('Failed to generate audit report:', err)
      alert('Failed to generate audit report')
    }
  }

  const handleExportAuditData = async () => {
    try {
      // Use the backend export endpoint
      const response = await api.get('/audit-logs/export', { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('Audit data exported successfully!')
    } catch (err) {
      console.error('Failed to export audit data:', err)
      alert('Failed to export audit data')
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
              onClick={() => setShowCreateAudit(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FileCheck size={18} /> Schedule Audit
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
                <p className="text-2xl font-bold text-gray-800">{auditRecords.length}</p>
              </div>
              <FileCheck className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">User Actions</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditRecords.filter(a => a.action).length}
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
                  {new Set(auditRecords.map(a => a.entityType).filter(Boolean)).size}
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
                  {groups.length}
                </p>
              </div>
              <Shield className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Verification Queue */}
        {verificationQueue.length === 0 ? null : (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Verification Queue ({verificationQueue.filter(v => v.status === 'pending').length})
              </h2>
              <button
                onClick={handleExportAuditData}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> Export Queue
              </button>
            </div>

            <div className="space-y-4">
              {verificationQueue.filter(v => v.status === 'pending').map((verification) => (
              <div
                key={verification.id}
                className="p-4 bg-yellow-50 rounded-xl border border-yellow-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{verification.groupName}</h3>
                    <p className="text-sm text-gray-600">{verification.description}</p>
                    <p className="text-sm text-gray-500">ID: {verification.id} • Submitted: {verification.submittedDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(verification.type)}`}>
                      {verification.type.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(verification.status)}`}>
                      {verification.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Required Documents:</p>
                  <div className="flex flex-wrap gap-2">
                    {verification.documents.map((doc, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {doc.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveVerification(verification.id)}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleRejectVerification(verification.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                    <Eye size={16} /> View Documents
                  </button>
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
                <option value="group_verification">Group Verification</option>
                <option value="financial_audit">Financial Audit</option>
                <option value="compliance_check">Compliance Check</option>
                <option value="investigation">Investigation</option>
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
                      onClick={() => {
                        // Export single audit log
                        const report = `AUDIT LOG DETAILS\n${'='.repeat(50)}\n\nAction: ${audit.action}\nEntity: ${audit.entityType || 'N/A'}\nEntity ID: ${audit.entityId || 'N/A'}\nUser: ${audit.auditor}\nDate: ${audit.auditDate}\nIP: ${audit.ipAddress || 'N/A'}\n\nDetails: ${JSON.stringify(audit.details, null, 2)}`
                        const blob = new Blob([report], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `audit_${audit.id}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
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
                    <h4 className="text-lg font-semibold text-gray-800">Additional Details</h4>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedAudit.details || {}, null, 2)}
                      </pre>
                    </div>
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

