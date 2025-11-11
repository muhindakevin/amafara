import { useState, useEffect } from 'react'
import { FileCheck, Search, Filter, Download, Eye, AlertCircle, Shield, Clock, User, CreditCard, Building2, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminAudit() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [showAuditDetails, setShowAuditDetails] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [activeTab, setActiveTab] = useState('trail')
  const [loading, setLoading] = useState(true)

  const [auditLogs, setAuditLogs] = useState([])
  const [complianceReports, setComplianceReports] = useState([])
  const [fraudAlerts, setFraudAlerts] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const auditRes = await api.get('/audit-logs').catch(() => ({ data: { data: [] } }))
        if (mounted) {
          setAuditLogs(auditRes?.data?.data || [])
          setComplianceReports([])
          setFraudAlerts([])
        }
      } catch (e) {
        console.error('Failed to load audit logs:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleExportAuditLog = async () => {
    try {
      const response = await api.get('/audit-logs/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to export audit log')
    }
  }

  const filteredAuditLogs = (auditLogs || []).filter(log => {
    const matchesType = filterType === 'all' || (log.action || '').toLowerCase().includes(filterType.toLowerCase())
    const matchesUser = filterUser === 'all' || (log.user || '').toLowerCase().includes(filterUser.toLowerCase())
    const matchesSearch = 
      (log.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())

    return matchesType && matchesUser && matchesSearch
  })

  const handleViewAuditDetails = (audit) => {
    setSelectedAudit(audit)
    setShowAuditDetails(true)
  }

  const handleGenerateComplianceReport = () => {
    alert('Generating compliance report...')
  }

  const handleInvestigateFraud = (alertId) => {
    alert(`Investigating fraud alert ${alertId}...`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Success': return 'bg-green-100 text-green-700'
      case 'Failed': return 'bg-red-100 text-red-700'
      case 'Completed': return 'bg-green-100 text-green-700'
      case 'In Progress': return 'bg-yellow-100 text-yellow-700'
      case 'Investigation': return 'bg-orange-100 text-orange-700'
      case 'Monitoring': return 'bg-blue-100 text-blue-700'
      case 'Resolved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'High': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'High': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit & Compliance</h1>
        <p className="text-gray-600">Access audit trails, monitor compliance, and detect fraudulent activities</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Audit Logs</p>
                <p className="text-2xl font-bold text-gray-800">{auditLogs.length}</p>
              </div>
              <FileCheck className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Compliance Score</p>
                <p className="text-2xl font-bold text-gray-800">0%</p>
              </div>
              <Shield className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-800">{fraudAlerts.filter(a => a.status !== 'Resolved' && a.status !== 'resolved').length}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Violations</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <XCircle className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['trail', 'compliance', 'fraud'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'trail' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Audit Trail</h2>
                  <button
                    onClick={handleExportAuditLog}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={20} /> Export Log
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search audit logs..."
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Actions</option>
                      <option value="login">Login</option>
                      <option value="transaction">Transaction</option>
                      <option value="user">User Management</option>
                      <option value="system">System Configuration</option>
                      <option value="loan">Loan</option>
                    </select>
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                    >
                      <option value="all">All Users</option>
                      <option value="System Admin">System Admin</option>
                      <option value="Agent">Agent</option>
                      <option value="Client">Client</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Table */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                              No audit logs found
                            </td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map(log => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.user}</p>
                              <p className="text-xs text-gray-500">{log.userId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.target}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ipAddress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(log.riskLevel)}`}>
                              {log.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewAuditDetails(log)}
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <Eye size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Compliance Reports</h2>
                  <button
                    onClick={handleGenerateComplianceReport}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FileCheck size={20} /> Generate Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {complianceReports.length === 0 ? (
                    <div className="col-span-3 text-center py-8 text-gray-500">No compliance reports available</div>
                  ) : (
                    complianceReports.map(report => (
                    <div key={report.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{report.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600"><span className="font-semibold">Period:</span> {report.period}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Generated:</span> {report.generatedDate}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Violations:</span> {report.violations}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">Recommendations:</span> {report.recommendations}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Score:</span>
                          <span className={`ml-1 font-bold ${getScoreColor(report.score)}`}>
                            {report.score}%
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="btn-secondary flex-1 text-sm">View</button>
                        <button className="btn-primary flex-1 text-sm">Download</button>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fraud' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Fraud Detection</h2>
                <p className="text-gray-600">Monitor suspicious activities and potential fraud patterns</p>

                <div className="space-y-4">
                  {fraudAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No fraud alerts detected</div>
                  ) : (
                    fraudAlerts.map(alert => (
                    <div key={alert.id} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-red-600" size={24} />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{alert.type}</h3>
                            <p className="text-sm text-gray-600">{alert.description}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600"><span className="font-semibold">Detected:</span> {alert.detectedAt}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span>
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(alert.status)}`}>
                              {alert.status}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600"><span className="font-semibold">Risk Score:</span> {alert.riskScore}/100</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600"><span className="font-semibold">Affected Users:</span> {alert.affectedUsers.join(', ')}</p>
                        </div>
                        <button
                          onClick={() => handleInvestigateFraud(alert.id)}
                          className="btn-secondary"
                        >
                          Investigate
                        </button>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Details Modal */}
        {showAuditDetails && selectedAudit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Audit Details</h2>
                <button onClick={() => setShowAuditDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedAudit.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Timestamp:</span> {selectedAudit.timestamp}</p>
                <p className="text-gray-700"><span className="font-semibold">User:</span> {selectedAudit.user} ({selectedAudit.userId})</p>
                <p className="text-gray-700"><span className="font-semibold">Action:</span> {selectedAudit.action}</p>
                <p className="text-gray-700"><span className="font-semibold">Target:</span> {selectedAudit.target}</p>
                <p className="text-gray-700"><span className="font-semibold">Details:</span> {selectedAudit.details}</p>
                <p className="text-gray-700"><span className="font-semibold">IP Address:</span> {selectedAudit.ipAddress}</p>
                <p className="text-gray-700"><span className="font-semibold">User Agent:</span> {selectedAudit.userAgent}</p>
                <p className="text-gray-700"><span className="font-semibold">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedAudit.status)}`}>
                    {selectedAudit.status}
                  </span>
                </p>
                <p className="text-gray-700"><span className="font-semibold">Risk Level:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(selectedAudit.riskLevel)}`}>
                    {selectedAudit.riskLevel}
                  </span>
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAuditDetails(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminAudit


