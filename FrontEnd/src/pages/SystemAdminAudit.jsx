import { useState, useEffect } from 'react'
import { FileCheck, Search, Filter, Download, Eye, AlertCircle, Shield, Clock, User, CreditCard, Building2, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminAudit() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [showAuditDetails, setShowAuditDetails] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [activeTab, setActiveTab] = useState('trail')
  const [loading, setLoading] = useState(true)

  const [auditLogs, setAuditLogs] = useState([])
  const [summary, setSummary] = useState({
    totalLogs: 0,
    successfulLogs: 0,
    failedLogs: 0,
    totalTransactions: 0
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (filterType !== 'all') params.append('filterType', filterType)
        if (filterUser !== 'all') params.append('userId', filterUser)
        if (filterDate !== 'all') params.append('filterDate', filterDate)
        
        const auditRes = await api.get(`/audit-logs?${params.toString()}`).catch(() => ({ data: { data: [], summary: {} } }))                                                                     
        if (mounted) {
          setAuditLogs(auditRes?.data?.data || [])
          if (auditRes?.data?.summary) {
            setSummary(auditRes.data.summary)
          }
        }
      } catch (e) {
        console.error('Failed to load audit logs:', e)
        if (mounted) {
          setAuditLogs([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [searchTerm, filterType, filterUser, filterDate])

  const handleExportAuditLog = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)
      if (filterUser !== 'all') params.append('userId', filterUser)
      if (filterDate !== 'all') params.append('filterDate', filterDate)
      
      const response = await api.get(`/audit-logs/export/excel?${params.toString()}`, { responseType: 'blob' })                                                                            
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-log-${new Date().toISOString().split('T')[0]}.xlsx`)                                                                  
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e?.response?.data?.message || tSystemAdmin('failedToExportAuditLog', { defaultValue: 'Failed to export audit log' }))                               
    }
  }

  // Filtering is done on backend, but we can do additional client-side filtering if needed
  const filteredAuditLogs = auditLogs || []

  const handleViewAuditDetails = (audit) => {
    setSelectedAudit(audit)
    setShowAuditDetails(true)
  }

  const handleGenerateComplianceReport = () => {
    alert(tSystemAdmin('generatingComplianceReport', { defaultValue: 'Generating compliance report...' }))
  }

  const handleInvestigateFraud = (alertId) => {
    alert(tSystemAdmin('investigatingFraudAlert', { defaultValue: `Investigating fraud alert ${alertId}...` }))
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('auditCompliance', { defaultValue: 'Audit & Compliance' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('accessAuditTrailsMonitorCompliance', { defaultValue: 'Access audit trails, monitor compliance, and detect fraudulent activities' })}</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalAuditLogs', { defaultValue: 'Total Audit Logs' })}</p>         
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.totalLogs || 0}</p>                                                          
              </div>
              <FileCheck className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('successfulActions', { defaultValue: 'Successful Actions' })}</p>                                                         
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.successfulLogs || 0}</p>                                                                          
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('failedActions', { defaultValue: 'Failed Actions' })}</p>              
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.failedLogs || 0}</p>                                                                        
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalTransactions', { defaultValue: 'Total Transactions' })}</p>                   
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.totalTransactions || 0}</p>                                                                           
              </div>
              <CreditCard className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['trail', 'compliance', 'fraud'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tSystemAdmin(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'trail' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('auditTrail', { defaultValue: 'Audit Trail' })}</h2>
                  <button
                    onClick={handleExportAuditLog}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download size={20} /> {tSystemAdmin('exportLog', { defaultValue: 'Export Log' })}
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                    <input
                      type="text"
                      placeholder={tSystemAdmin('searchAuditLogs', { defaultValue: 'Search audit logs...' })}
                      className="input-field pl-9 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">{tSystemAdmin('allActions', { defaultValue: 'All Actions' })}</option>
                      <option value="login">{tCommon('login')}</option>
                      <option value="transaction">{t('transactions')}</option>
                      <option value="user">{tSystemAdmin('userManagement', { defaultValue: 'User Management' })}</option>
                      <option value="system">{tSystemAdmin('systemConfiguration', { defaultValue: 'System Configuration' })}</option>
                      <option value="loan">{t('loans')}</option>
                    </select>
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                    >
                      <option value="all">{tSystemAdmin('allUsers', { defaultValue: 'All Users' })}</option>
                      <option value="System Admin">{tSystemAdmin('systemAdmin', { defaultValue: 'System Admin' })}</option>
                      <option value="Agent">{tSystemAdmin('agent', { defaultValue: 'Agent' })}</option>
                      <option value="Client">{tSystemAdmin('client', { defaultValue: 'Client' })}</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Table */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">{tSystemAdmin('loadingAuditLogs', { defaultValue: 'Loading audit logs...' })}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('timestamp', { defaultValue: 'Timestamp' })}</th>                                     
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tCommon('user')}</th>                                                                              
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('action', { defaultValue: 'Action' })}</th>                                           
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('entityType', { defaultValue: 'Entity Type' })}</th>                                           
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('ipAddress', { defaultValue: 'IP Address' })}</th>                                    
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tCommon('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">                                                 
                              {tSystemAdmin('noAuditLogsFound', { defaultValue: 'No audit logs found' })}                                                       
                            </td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map(log => {
                            const logUser = log.user || {}
                            const createdAt = log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'
                            return (
                              <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{createdAt}</td>                             
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{logUser.name || 'Unknown'}</p>                                                   
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{logUser.role || 'N/A'}</p>                                                          
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.action}</td>                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.entityType || 'N/A'}</td>                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.ipAddress || 'N/A'}</td>                             
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">                                                           
                                  <button
                                    onClick={() => handleViewAuditDetails(log)}       
                                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"                             
                                    title={tCommon('view')}
                                  >
                                    <Eye size={20} />
                                  </button>
                                </td>
                              </tr>
                            )
                          })
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
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('complianceReports', { defaultValue: 'Compliance Reports' })}</h2>                                                                              
                  <button
                    onClick={handleGenerateComplianceReport}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FileCheck size={20} /> {tSystemAdmin('generateReport', { defaultValue: 'Generate Report' })}                                               
                  </button>
                </div>

                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {tSystemAdmin('complianceReportsComingSoon', { defaultValue: 'Compliance reports feature coming soon' })}
                </div>
              </div>
            )}

            {activeTab === 'fraud' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('fraudDetection', { defaultValue: 'Fraud Detection' })}</h2>                                                                            
                <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('monitorSuspiciousActivities', { defaultValue: 'Monitor suspicious activities and potential fraud patterns' })}</p>                                                     

                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {tSystemAdmin('fraudDetectionComingSoon', { defaultValue: 'Fraud detection feature coming soon' })}
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
                <p className="text-gray-700"><span className="font-semibold">Timestamp:</span> {selectedAudit.createdAt ? new Date(selectedAudit.createdAt).toLocaleString() : 'N/A'}</p>                                    
                <p className="text-gray-700"><span className="font-semibold">User:</span> {selectedAudit.user?.name || 'Unknown'} ({selectedAudit.user?.role || 'N/A'})</p>                     
                <p className="text-gray-700"><span className="font-semibold">Action:</span> {selectedAudit.action}</p>                                          
                <p className="text-gray-700"><span className="font-semibold">Entity Type:</span> {selectedAudit.entityType || 'N/A'}</p>                                          
                <p className="text-gray-700"><span className="font-semibold">Entity ID:</span> {selectedAudit.entityId || 'N/A'}</p>                                        
                <p className="text-gray-700"><span className="font-semibold">IP Address:</span> {selectedAudit.ipAddress || 'N/A'}</p>                                   
                <p className="text-gray-700"><span className="font-semibold">User Agent:</span> {selectedAudit.userAgent || 'N/A'}</p>                                   
                {selectedAudit.details && (
                  <div className="text-gray-700">
                    <span className="font-semibold">Details:</span>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(selectedAudit.details, null, 2)}
                    </pre>
                  </div>
                )}
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


