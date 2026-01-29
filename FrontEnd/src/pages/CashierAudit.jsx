import { useState, useEffect } from 'react'
import { Shield, FileText, Clock, CheckCircle, XCircle, Search, Filter, Users, Calendar, Download, Eye, AlertCircle, X, DollarSign } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { exportToExcel } from '../utils/pdfExport'

function CashierAudit() {
  const { t } = useTranslation('common')
  const { t: tCashier } = useTranslation('cashier')
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [transactionRecords, setTransactionRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalLogs: 0,
    successfulLogs: 0,
    failedLogs: 0,
    totalTransactions: 0,
    totalAmount: 0
  })
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  // Fetch summary (always shows total counts, not filtered)
  const fetchSummary = async () => {
    try {
      // Fetch without any filters to get total summary
      const response = await api.get('/audit-logs?page=1&limit=1')
      if (response.data?.success && response.data.summary) {
        // Also fetch total amount from all transactions
        const transactionsRes = await api.get('/audit-logs/transactions')
        let totalAmount = 0
        if (transactionsRes.data?.success && transactionsRes.data.data) {
          totalAmount = transactionsRes.data.data.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)
        }
        
        setSummary({
          totalLogs: response.data.summary.totalLogs || 0,
          successfulLogs: response.data.summary.successfulLogs || 0,
          failedLogs: response.data.summary.failedLogs || 0,
          totalTransactions: response.data.summary.totalTransactions || 0,
          totalAmount: totalAmount
        })
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: '1',
        limit: '1000'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)
      if (filterDate !== 'all') params.append('filterDate', filterDate)

      console.log('[CashierAudit] Fetching audit logs with params:', params.toString())
      const response = await api.get(`/audit-logs?${params.toString()}`)
      console.log('[CashierAudit] Audit logs response:', response.data)
      
      if (response.data?.success) {
        const logs = response.data.data || []
        console.log('[CashierAudit] Setting audit logs:', logs.length)
        setAuditLogs(logs)
        // Update summary if provided (it should always be the total, not filtered)
        if (response.data.summary) {
          setSummary(prev => ({
            ...prev,
            totalLogs: response.data.summary.totalLogs || prev.totalLogs,
            successfulLogs: response.data.summary.successfulLogs || prev.successfulLogs,
            failedLogs: response.data.summary.failedLogs || prev.failedLogs,
            totalTransactions: response.data.summary.totalTransactions || prev.totalTransactions
          }))
        }
      } else {
        console.warn('[CashierAudit] Response not successful:', response.data)
        setError(response.data?.message || 'Failed to fetch audit logs')
      }
    } catch (error) {
      console.error('[CashierAudit] Failed to fetch audit logs:', error)
      console.error('[CashierAudit] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.response?.data?.message || error.message || 'Failed to fetch audit logs')
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch transaction records
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)
      if (filterDate !== 'all') params.append('filterDate', filterDate)

      console.log('[CashierAudit] Fetching transactions with params:', params.toString())
      const response = await api.get(`/audit-logs/transactions?${params.toString()}`)
      console.log('[CashierAudit] Transactions response:', response.data)
      
      if (response.data?.success) {
        const transactions = response.data.data || []
        console.log('[CashierAudit] Setting transactions:', transactions.length)
        setTransactionRecords(transactions)
        // Don't update totalAmount here - it should remain the total from all transactions
      } else {
        console.warn('[CashierAudit] Transactions response not successful:', response.data)
        setError(response.data?.message || 'Failed to fetch transactions')
        setTransactionRecords([])
      }
    } catch (error) {
      console.error('[CashierAudit] Failed to fetch transactions:', error)
      console.error('[CashierAudit] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.response?.data?.message || error.message || 'Failed to fetch transactions')
      setTransactionRecords([])
    } finally {
      setTransactionsLoading(false)
    }
  }

  // Fetch audit log details
  const fetchLogDetails = async (logId) => {
    try {
      const response = await api.get(`/audit-logs/${logId}`)
      if (response.data?.success) {
        setSelectedLog(response.data.data)
        setShowDetailsModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch log details:', error)
      alert('Failed to fetch log details: ' + (error.response?.data?.message || error.message))
    }
  }

  // Export audit logs to Excel
  const handleExportAuditLog = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)
      if (filterDate !== 'all') params.append('filterDate', filterDate)

      const response = await api.get(`/audit-logs/export/excel?${params.toString()}`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('Audit log exported successfully!')
    } catch (error) {
      console.error('Failed to export audit log:', error)
      alert('Failed to export audit log: ' + (error.response?.data?.message || error.message))
    } finally {
      setExporting(false)
    }
  }

  // Export transactions to Excel
  const handleExportTransactions = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('filterType', filterType)
      if (filterDate !== 'all') params.append('filterDate', filterDate)

      // Fetch filtered transactions
      const response = await api.get(`/audit-logs/transactions?${params.toString()}`)
      if (!response.data?.success || !response.data.data) {
        alert('No transactions to export')
        return
      }

      const transactions = response.data.data

      // Prepare headers and data for export
      const headers = [
        'Transaction ID',
        'Member Name',
        'Type',
        'Amount (RWF)',
        'Payment Method',
        'Status',
        'Reference ID',
        'Date & Time',
        'Description'
      ]

      const rows = transactions.map((t) => [
        t.id || 'N/A',
        t.user?.name || 'Unknown',
        (t.type || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        Math.abs(Number(t.amount || 0)),
        (t.paymentMethod || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        (t.status || 'N/A').toUpperCase(),
        t.referenceId || 'N/A',
        formatDate(t.createdAt || t.transactionDate),
        t.description || 'N/A'
      ])

      // Calculate summary
      const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)
      const byType = {}
      transactions.forEach(t => {
        const type = t.type || 'unknown'
        if (!byType[type]) {
          byType[type] = { count: 0, totalAmount: 0 }
        }
        byType[type].count++
        byType[type].totalAmount += Math.abs(Number(t.amount || 0))
      })

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `transactions_${dateStr}`

      // Export using the utility function
      exportToExcel(rows, headers, filename, {
        title: 'Transaction Records Export',
        dateRange: {
          startDate: filterDate !== 'all' ? filterDate : undefined
        },
        summary: {
          totalTransactions: transactions.length,
          totalAmount: totalAmount,
          byType: byType
        }
      })

      alert(`Exported ${transactions.length} transaction(s) successfully!`)
    } catch (error) {
      console.error('Failed to export transactions:', error)
      alert('Failed to export transactions: ' + (error.response?.data?.message || error.message))
    } finally {
      setExporting(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Get status from action
  const getStatusFromAction = (action) => {
    if (!action) return 'unknown'
    const actionUpper = action.toUpperCase()
    if (actionUpper.includes('APPROVED') || actionUpper.includes('COMPLETED') || actionUpper.includes('SUBMITTED')) {
      return 'success'
    }
    if (actionUpper.includes('REJECTED') || actionUpper.includes('FAILED')) {
      return 'failed'
    }
    if (actionUpper.includes('PENDING')) {
      return 'pending'
    }
    return 'success'
  }

  // Get amount from details or entity
  const getAmount = (log) => {
    if (log.details && typeof log.details === 'object') {
      if (log.details.amount) return parseFloat(log.details.amount)
    }
    if (log.entityDetails) {
      if (log.entityDetails.amount) return parseFloat(log.entityDetails.amount)
    }
    return 0
  }

  // Get member name from log
  const getMemberName = (log) => {
    if (log.entityDetails) {
      if (log.entityDetails.member?.name) return log.entityDetails.member.name
      if (log.entityDetails.memberId) {
        // Try to get from user if available
        if (log.user?.name) return log.user.name
      }
    }
    if (log.user?.name) return log.user.name
    return 'Unknown'
  }

  // Get action description - format as readable message instead of JSON
  const getActionDescription = (log) => {
    if (!log.details || typeof log.details !== 'object') {
      return log.action || 'No details available'
    }
    
    const details = log.details
    const action = log.action || ''
    const actionUpper = action.toUpperCase()
    
    // Format based on action type
    if (actionUpper.includes('LOAN_REJECTED')) {
      const reason = details.reason || 'Not specified'
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Loan request rejected for ${memberName}. Reason: ${reason}`
    }
    
    if (actionUpper.includes('LOAN_APPROVED')) {
      const amount = details.amount ? `${parseFloat(details.amount).toLocaleString()} RWF` : 'amount not specified'
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Loan request approved for ${memberName}. Amount: ${amount}`
    }
    
    if (actionUpper.includes('MEMBER_REJECTED') || actionUpper.includes('MEMBER_APPLICATION_REJECTED')) {
      const reason = details.reason || details.rejectionReason || 'Not specified'
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Member application rejected for ${memberName}. Reason: ${reason}`
    }
    
    if (actionUpper.includes('MEMBER_APPROVED') || actionUpper.includes('MEMBER_APPLICATION_APPROVED')) {
      const memberName = details.memberName || (details.memberId ? `Member ID: ${details.memberId}` : 'Member')
      return `Member application approved for ${memberName}`
    }
    
    if (actionUpper.includes('CONTRIBUTION')) {
      const amount = details.amount ? `${parseFloat(details.amount).toLocaleString()} RWF` : 'amount not specified'
      const paymentMethod = details.paymentMethod || 'payment method not specified'
      const status = details.status || 'recorded'
      return `Contribution of ${amount} via ${paymentMethod} - ${status}`
    }
    
    if (actionUpper.includes('CONTRIBUTION_APPROVED')) {
      const amount = details.amount ? `${parseFloat(details.amount).toLocaleString()} RWF` : 'amount not specified'
      return `Contribution of ${amount} approved`
    }
    
    if (actionUpper.includes('CONTRIBUTION_REJECTED')) {
      const reason = details.reason || 'Not specified'
      return `Contribution rejected. Reason: ${reason}`
    }
    
    if (details.paymentMethod) {
      return `${details.paymentMethod} payment ${actionUpper.includes('APPROVED') ? 'verified and approved' : 'recorded'}`
    }
    
    if (details.reason) {
      return details.reason
    }
    
    if (details.amount) {
      const amount = `${parseFloat(details.amount).toLocaleString()} RWF`
      if (details.memberName) {
        return `${details.memberName} - ${amount}`
      }
      return `Amount: ${amount}`
    }
    
    if (details.memberName) {
      return details.memberName
    }
    
    if (details.memberId) {
      return `Member ID: ${details.memberId}`
    }
    
    // If we have multiple fields, format them nicely
    const keys = Object.keys(details)
    if (keys.length > 0) {
      const parts = []
      if (details.amount) parts.push(`Amount: ${parseFloat(details.amount).toLocaleString()} RWF`)
      if (details.reason) parts.push(`Reason: ${details.reason}`)
      if (details.memberName) parts.push(`Member: ${details.memberName}`)
      if (details.paymentMethod) parts.push(`Payment: ${details.paymentMethod}`)
      if (details.status) parts.push(`Status: ${details.status}`)
      
      if (parts.length > 0) {
        return parts.join(' | ')
      }
    }
    
    // Last resort: return action name formatted nicely
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Fetch all data on initial load
  useEffect(() => {
    fetchSummary()
    fetchAuditLogs()
    fetchTransactions()
  }, [])

  // Fetch audit logs and transactions when filters change
  useEffect(() => {
    fetchAuditLogs()
    fetchTransactions()
  }, [searchTerm, filterType, filterDate])
  
  // Refresh summary periodically (every 30 seconds) to get updated totals
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSummary()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getActionIcon = (action) => {
    if (!action) return <Clock className="text-gray-600" size={20} />
    const actionUpper = action.toUpperCase()
    if (actionUpper.includes('APPROVED') || actionUpper.includes('COMPLETED')) {
      return <CheckCircle className="text-green-600" size={20} />
    }
    if (actionUpper.includes('REJECTED') || actionUpper.includes('FAILED')) {
      return <XCircle className="text-red-600" size={20} />
    }
    if (actionUpper.includes('APPLIED') || actionUpper.includes('RECORDED') || actionUpper.includes('SUBMITTED')) {
      return <FileText className="text-blue-600" size={20} />
    }
    return <Clock className="text-gray-600" size={20} />
  }

  const handleViewDetails = async (logId) => {
    await fetchLogDetails(logId)
  }

  // Format action text to be human-readable
  const formatActionText = (action) => {
    if (!action) return 'N/A'
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Contribution/g, 'Contribution')
      .replace(/Loan/g, 'Loan')
      .replace(/Fine/g, 'Fine')
      .replace(/Approved/g, 'Approved')
      .replace(/Rejected/g, 'Rejected')
      .replace(/Pending/g, 'Pending')
      .replace(/Recorded/g, 'Recorded')
      .replace(/Payment/g, 'Payment')
  }

  // Format entity type
  const formatEntityType = (entityType) => {
    if (!entityType) return 'N/A'
    return entityType.replace(/_/g, ' ')
  }

  // Format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A'
    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Mobile Money/g, 'Mobile Money')
      .replace(/Bank Transfer/g, 'Bank Transfer')
  }

  // Format transaction type
  const formatTransactionType = (type) => {
    if (!type) return 'N/A'
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  // Format details object to readable text
  const formatDetails = (details) => {
    if (!details || typeof details !== 'object') return null
    
    const formatted = []
    
    // Handle common fields
    if (details.amount) {
      formatted.push({ label: 'Amount', value: `${parseFloat(details.amount).toLocaleString()} RWF` })
    }
    if (details.memberName) {
      formatted.push({ label: 'Member', value: details.memberName })
    }
    if (details.paymentMethod) {
      formatted.push({ label: 'Payment Method', value: formatPaymentMethod(details.paymentMethod) })
    }
    if (details.status) {
      formatted.push({ label: 'Status', value: formatActionText(details.status) })
    }
    if (details.reason) {
      formatted.push({ label: 'Reason', value: details.reason })
    }
    if (details.description) {
      formatted.push({ label: 'Description', value: details.description })
    }
    if (details.referenceId) {
      formatted.push({ label: 'Reference ID', value: details.referenceId })
    }
    if (details.referenceType) {
      formatted.push({ label: 'Reference Type', value: formatEntityType(details.referenceType) })
    }
    
    // Handle other fields
    Object.keys(details).forEach(key => {
      if (!['amount', 'memberName', 'paymentMethod', 'status', 'reason', 'description', 'referenceId', 'referenceType'].includes(key)) {
        const value = details[key]
        if (value !== null && value !== undefined && typeof value !== 'object') {
          formatted.push({ 
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
            value: String(value) 
          })
        }
      }
    })
    
    return formatted
  }

  const handleViewTransactionDetails = (transaction) => {
    // Show transaction details in modal
    setSelectedLog({
      ...transaction,
      modalType: 'transaction', // Use modalType to differentiate, keep original transactionType
      transactionType: transaction.type, // Preserve original transaction type
      action: `${formatTransactionType(transaction.type)} - ${formatActionText(transaction.status)}`,
      details: {
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
        referenceId: transaction.referenceId,
        referenceType: transaction.referenceType
      }
    })
    setShowDetailsModal(true)
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Record and Audit Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track all financial transactions and system activities</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportAuditLog}
              disabled={exporting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={18} /> {exporting ? 'Exporting...' : 'Export Audit Log'}
            </button>
            <button 
              onClick={handleExportTransactions}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Shield size={18} /> Export Transactions
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Transactions</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {summary.totalTransactions}
                </p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Amount</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {summary.totalAmount.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Audit Logs</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {summary.totalLogs}
                </p>
              </div>
              <Shield className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Successful Actions</p>
                <p className="text-xl font-bold text-green-600">
                  {summary.successfulLogs}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Failed Actions</p>
                <p className="text-xl font-bold text-red-600">
                  {summary.failedLogs}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Search Records
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member, action, or user..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Actions</option>
                <option value="contribution">Contributions</option>
                <option value="loan">Loan Payments</option>
                <option value="fine">Fines</option>
                <option value="cash">Cash Payments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Audit Logs */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Audit Log ({auditLogs.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {auditLogs.map((log) => {
                const status = getStatusFromAction(log.action)
                const amount = getAmount(log)
                const memberName = getMemberName(log)
                const description = getActionDescription(log)

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        {getActionIcon(log.action)}
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-white">{log.action}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{memberName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">{formatDate(log.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        {amount > 0 && (
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {amount.toLocaleString()} RWF
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">User</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{log.user?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">IP Address</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{log.ipAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Log ID</p>
                        <p className="font-semibold text-gray-800 dark:text-white">#{log.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Entity Type</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{log.entityType || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Details:</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 italic whitespace-pre-line">"{description}"</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(log.id)}
                        className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Transaction Records */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Transaction Records ({transactionRecords.length})
            </h2>
            <button 
              onClick={handleExportTransactions}
              disabled={exporting}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              <Download size={16} /> Export Transactions
            </button>
          </div>

          {(loading || transactionsLoading) ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : transactionRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {transactionRecords.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {transaction.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{transaction.user?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTransactionType(transaction.type)} • {formatPaymentMethod(transaction.paymentMethod)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatDate(transaction.createdAt || transaction.transactionDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {parseFloat(transaction.amount || 0).toLocaleString()} RWF
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ref: {transaction.referenceId || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status?.toLowerCase() || 'pending')}`}>
                      {transaction.status || 'Pending'}
                    </span>
                    <button
                      onClick={() => handleViewTransactionDetails(transaction)}
                      className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                    >
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
                {selectedLog.modalType === 'transaction' ? 'Transaction Details' : 'Audit Log Details'}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedLog(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedLog.modalType === 'transaction' ? (
                // Transaction Details View
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                    <p className="font-semibold text-gray-800 dark:text-white">#{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedLog.createdAt || selectedLog.transactionDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Type</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatTransactionType(selectedLog.transactionType || selectedLog.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatActionText(selectedLog.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {parseFloat(selectedLog.amount || 0).toLocaleString()} RWF
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatPaymentMethod(selectedLog.paymentMethod)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Member</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedLog.user?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reference ID</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedLog.referenceId || 'N/A'}</p>
                  </div>
                  {selectedLog.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{selectedLog.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Audit Log Details View
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Log ID</p>
                    <p className="font-semibold text-gray-800 dark:text-white">#{selectedLog.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Action</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatActionText(selectedLog.action)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Entity Type</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatEntityType(selectedLog.entityType) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedLog.user?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User Role</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedLog.user?.role || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">IP Address</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{selectedLog.ipAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User Agent</p>
                    <p className="font-semibold text-gray-800 dark:text-white text-xs break-all">{selectedLog.userAgent || 'N/A'}</p>
                  </div>
                </div>
              )}

              {selectedLog.entityDetails && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">Entity Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.entityDetails.member && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Member</p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {selectedLog.entityDetails.member.name} ({selectedLog.entityDetails.member.phone || 'N/A'})
                        </p>
                      </div>
                    )}
                    {selectedLog.entityDetails.amount && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {parseFloat(selectedLog.entityDetails.amount).toLocaleString()} RWF
                        </p>
                      </div>
                    )}
                    {selectedLog.entityDetails.status && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{formatActionText(selectedLog.entityDetails.status)}</p>
                      </div>
                    )}
                    {selectedLog.entityDetails.paymentMethod && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{formatPaymentMethod(selectedLog.entityDetails.paymentMethod)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">Additional Details</h3>
                  {formatDetails(selectedLog.details) && formatDetails(selectedLog.details).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formatDetails(selectedLog.details).map((item, index) => (
                        <div key={index}>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
                          <p className="font-semibold text-gray-800 dark:text-white break-words">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No additional details available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default CashierAudit
