import { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter, Calendar, DollarSign, Users, TrendingUp, Database, Plus, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { formatCurrency, formatDate, formatDateTime, formatDateTimeFull, exportToExcel, exportToCSV } from '../utils/pdfExport'

function SecretaryTransactions() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [transactions, setTransactions] = useState([])
  const [recordedTransactions, setRecordedTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'recorded'
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadTransactions() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) {
          console.warn('[SecretaryTransactions] No groupId found for user')
          setLoading(false)
          return
        }

        // Load group info
        const groupRes = await api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } }))
        if (groupRes.data?.success && mounted) {
          setGroupInfo(groupRes.data.data)
        }

        // Load ALL transactions for the group - use report endpoint for comprehensive data
        const response = await api.get('/transactions/report', {
          params: { groupId }
        })
        
        if (mounted && response.data?.success) {
          const transactionData = response.data.data || []
          console.log(`[SecretaryTransactions] Loaded ${transactionData.length} transactions for group ${groupId}`)
          
          const items = transactionData.map(t => ({
            id: t.transactionId || t.id,
            transactionId: t.transactionId || t.id,
            memberName: t.memberName || 'Unknown Member',
            memberId: t.memberId || t.userId,
            transactionType: t.transactionType || formatTransactionType(t.rawType || t.type),
            rawType: t.rawType || t.type,
            amount: Number(t.amount || 0),
            date: t.date || (t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : ''),
            time: t.transactionDate ? new Date(t.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: t.status || 'completed',
            paymentMethod: t.paymentMethod || formatPaymentMethod(t.rawPaymentMethod),
            rawPaymentMethod: t.rawPaymentMethod || t.paymentMethod,
            description: t.description || `${t.transactionType || formatTransactionType(t.rawType || t.type)} - ${t.referenceId || ''}`,
            referenceId: t.referenceId,
            isRecorded: false
          }))
          
          setTransactions(items)
          
          // Calculate and log totals
          const totalAmount = items.reduce((sum, t) => sum + Math.abs(t.amount), 0)
          console.log(`[SecretaryTransactions] Total transactions: ${items.length}, Total amount: ${totalAmount.toLocaleString()} RWF`)
        } else if (mounted) {
          console.warn('[SecretaryTransactions] Failed to load transactions:', response.data?.message)
          setTransactions([])
        }

        // Load recorded transactions from localStorage
        const recorded = JSON.parse(localStorage.getItem('secretaryRecordedTransactions') || '[]')
        if (mounted) {
          setRecordedTransactions(recorded)
          // Mark transactions as recorded
          setTransactions(prev => prev.map(t => {
            const isRecorded = recorded.some(r => r.transactionId === t.transactionId)
            return { ...t, isRecorded }
          }))
        }
      } catch (error) {
        console.error('[SecretaryTransactions] Error loading transactions:', error)
        if (mounted) {
          setTransactions([])
          alert('Failed to load transactions. Please refresh the page.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadTransactions()
    return () => { mounted = false }
  }, [])

  const formatTransactionType = (type) => {
    const typeMap = {
      'contribution': t('contribution', { defaultValue: 'Contribution' }),
      'loan_payment': t('loanPayment', { defaultValue: 'Loan Payment' }),
      'loan_disbursement': t('loanRequest', { defaultValue: 'Loan Request' }),
      'fine_payment': t('finePayment', { defaultValue: 'Fine Payment' }),
      'interest': t('interest', { defaultValue: 'Interest' }),
      'refund': t('refund', { defaultValue: 'Refund' }),
      'fee': t('fee', { defaultValue: 'Fee' })
    }
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatPaymentMethod = (method) => {
    if (!method) return tCommon('nA', { defaultValue: 'N/A' })
    const methodMap = {
      'cash': t('paymentMethods.cash', { defaultValue: 'Cash' }),
      'mtn_mobile_money': t('paymentMethods.mtnMobileMoney', { defaultValue: 'MTN Mobile Money' }),
      'airtel_money': t('paymentMethods.airtelMoney', { defaultValue: 'Airtel Money' }),
      'bank_transfer': t('paymentMethods.bankTransfer', { defaultValue: 'Bank Transfer' })
    }
    return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const handleRecordTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setShowRecordModal(true)
  }

  const confirmRecordTransaction = () => {
    if (!selectedTransaction) return

    if (!confirm(t('confirmRecordTransaction', { defaultValue: 'Are you sure you want to record this transaction?' }))) {
      return
    }

    const record = {
      id: selectedTransaction.id,
      transactionId: selectedTransaction.transactionId,
      type: selectedTransaction.rawType,
      memberName: selectedTransaction.memberName,
      memberId: selectedTransaction.memberId,
      amount: selectedTransaction.amount,
      paymentMethod: selectedTransaction.rawPaymentMethod,
      description: selectedTransaction.description,
      purpose: selectedTransaction.description,
      recordedDate: new Date().toISOString(),
      recordedBy: 'Secretary',
      referenceId: selectedTransaction.referenceId
    }

    const existing = JSON.parse(localStorage.getItem('secretaryRecordedTransactions') || '[]')
    // Check if already recorded
    if (existing.some(r => r.transactionId === record.transactionId)) {
      alert(t('transactionAlreadyRecorded', { defaultValue: 'This transaction has already been recorded.' }))
      setShowRecordModal(false)
      return
    }

    const updated = [...existing, record]
    localStorage.setItem('secretaryRecordedTransactions', JSON.stringify(updated))
    setRecordedTransactions(updated)
    
    // Update transaction to show as recorded
    setTransactions(prev => prev.map(t => 
      t.transactionId === record.transactionId ? { ...t, isRecorded: true } : t
    ))

    alert(t('transactionRecordedSuccessfully', { defaultValue: 'Transaction recorded successfully!' }))
    setShowRecordModal(false)
    setSelectedTransaction(null)
  }

  const getDisplayTransactions = () => {
    return activeTab === 'recorded' ? recordedTransactions : transactions
  }

  const filteredTransactions = getDisplayTransactions().filter(transaction => {
    const matchesType = filterType === 'all' || transaction.rawType === filterType || transaction.type === filterType
    const matchesSearch = transaction.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId?.toString().includes(searchTerm)
    
    let matchesDate = true
    if (startDate) {
      matchesDate = matchesDate && transaction.date >= startDate
    }
    if (endDate) {
      matchesDate = matchesDate && transaction.date <= endDate
    }
    
    return matchesType && matchesSearch && matchesDate
  })

  // Calculate summary - use FILTERED transactions to match export
  const calculateSummary = () => {
    // Use filtered transactions for summary to match what's displayed and exported
    const summary = {
      totalTransactions: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0),
      byType: {},
      byStatus: {},
      byPaymentMethod: {}
    }

    filteredTransactions.forEach(t => {
      const type = t.rawType || t.type
      // Count by type
      if (!summary.byType[type]) {
        summary.byType[type] = { count: 0, totalAmount: 0 }
      }
      summary.byType[type].count++
      summary.byType[type].totalAmount += Math.abs(t.amount || 0)

      // Count by status
      if (t.status) {
        if (!summary.byStatus[t.status]) {
          summary.byStatus[t.status] = 0
        }
        summary.byStatus[t.status]++
      }

      // Count by payment method
      const method = t.paymentMethod || t.rawPaymentMethod || 'N/A'
      if (!summary.byPaymentMethod[method]) {
        summary.byPaymentMethod[method] = 0
      }
      summary.byPaymentMethod[method]++
    })

    return summary
  }

  const summary = calculateSummary()

  const generateReport = (format = 'excel') => {
    try {
      const transactionsToExport = filteredTransactions || []
      
      if (transactionsToExport.length === 0) {
        alert(t('noTransactionsToExport', { defaultValue: 'No transactions to export. Please adjust your filters.' }))
        return
      }
      
      const headers = [
        'Transaction ID',
        'Member Name',
        'Date',
        'Time',
        'Transaction Type',
        'Amount (RWF)',
        'Payment Method',
        'Status',
        'Description / Notes',
        'Reference ID',
        ...(activeTab === 'recorded' ? ['Recorded Date', 'Recorded By'] : [])
      ]
      
      const rows = transactionsToExport.map(t => {
        const transDate = t.date ? new Date(t.date) : null
        let dateStr = 'N/A'
        let timeStr = 'N/A'
        
        if (transDate && !isNaN(transDate.getTime())) {
          dateStr = transDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
          timeStr = t.time || transDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })
        } else if (t.date) {
          dateStr = t.date
          timeStr = t.time || 'N/A'
        }
        
        const baseRow = [
          t.transactionId || t.id || '',
          t.memberName || '',
          dateStr,
          timeStr,
          t.transactionType || formatTransactionType(t.type) || '',
          parseFloat(t.amount || 0),
          t.paymentMethod || formatPaymentMethod(t.rawPaymentMethod) || 'N/A',
          (t.status || '').toUpperCase(),
          t.description || '',
          t.referenceId || ''
        ]

        if (activeTab === 'recorded') {
          baseRow.push(
            t.recordedDate ? new Date(t.recordedDate).toLocaleString() : '',
            t.recordedBy || 'Secretary'
          )
        }

        return baseRow
      })
      
      const exportSummary = {
        totalTransactions: summary.totalTransactions,
        totalAmount: summary.totalAmount,
        byType: Object.keys(summary.byType).reduce((acc, type) => {
          acc[formatTransactionType(type)] = {
            count: summary.byType[type].count,
            totalAmount: summary.byType[type].totalAmount
          }
          return acc
        }, {}),
        byStatus: summary.byStatus,
        byPaymentMethod: summary.byPaymentMethod
      }
      
      const filterInfo = []
      if (filterType !== 'all') filterInfo.push(filterType.replace(/_/g, '-'))
      if (searchTerm) filterInfo.push('search')
      if (startDate) filterInfo.push(`from-${startDate}`)
      if (endDate) filterInfo.push(`to-${endDate}`)
      if (activeTab === 'recorded') filterInfo.push('recorded')
      const filterSuffix = filterInfo.length > 0 ? `_${filterInfo.join('_')}` : ''
      const filename = `${activeTab === 'recorded' ? 'Recorded_' : ''}Transaction_Report_${groupInfo?.name || 'Group'}${filterSuffix}`
      
      const dateRange = {}
      if (startDate) dateRange.startDate = startDate
      if (endDate) dateRange.endDate = endDate
      
      const options = {
        title: `${activeTab === 'recorded' ? 'Recorded ' : ''}Transaction Report - ${groupInfo?.name || 'Group'}`,
        groupName: groupInfo?.name || 'N/A',
        dateRange: Object.keys(dateRange).length > 0 ? dateRange : undefined,
        summary: exportSummary
      }
      
      if (filterType !== 'all' || searchTerm) {
        options.filters = []
        if (filterType !== 'all') options.filters.push(`Type: ${formatTransactionType(filterType)}`)
        if (searchTerm) options.filters.push(`Search: ${searchTerm}`)
      }
      
      if (format === 'excel') {
        exportToExcel(rows, headers, filename, options)
      } else {
        exportToCSV(rows, headers, filename, options)
      }
    } catch (error) {
      console.error('[SecretaryTransactions] Export error:', error)
      alert(t('exportFailed', { defaultValue: 'Failed to export transactions. Please try again.' }))
    }
  }

  const exportCSV = () => {
    generateReport('csv')
  }

  const exportExcel = () => {
    generateReport('excel')
  }


  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'recorded' 
                ? t('recordedTransactions', { defaultValue: 'Recorded Transactions' })
                : t('transactionsReport', { defaultValue: 'Transactions Report' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {activeTab === 'recorded'
                ? t('viewAllRecordedTransactions', { defaultValue: 'View and export all recorded transactions' })
                : t('viewGenerateTransactionReports', { defaultValue: 'View and generate comprehensive transaction reports' })}
            </p>
            {groupInfo && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-1 font-semibold">
                {t('group', { defaultValue: 'Group' })}: {groupInfo.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {activeTab === 'recorded' && (
              <button
                onClick={() => setActiveTab('all')}
                className="btn-secondary flex items-center gap-2"
              >
                <FileText size={18} /> {t('viewAllTransactions', { defaultValue: 'View All Transactions' })}
              </button>
            )}
            {activeTab === 'all' && (
              <button
                onClick={() => setActiveTab('recorded')}
                className="btn-secondary flex items-center gap-2"
              >
                <Database size={18} /> {t('recordedData', { defaultValue: 'Recorded Data' })} ({recordedTransactions.length})
              </button>
            )}
            <button
              onClick={exportCSV}
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              <Download size={18} /> {t('exportCSV', { defaultValue: 'Export CSV' })}
            </button>
            <button
              onClick={exportExcel}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <Download size={18} /> {t('exportExcel', { defaultValue: 'Export Excel' })}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {activeTab === 'recorded' ? 'Recorded Transactions' : 'Total Transactions'}
                  {(startDate || endDate || searchTerm || filterType !== 'all') && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">(Filtered)</span>
                  )}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {summary.totalTransactions}
                </p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Total Amount
                  {(startDate || endDate || searchTerm || filterType !== 'all') && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">(Filtered)</span>
                  )}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.totalAmount.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Completed</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.byStatus.completed || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Pending: {summary.byStatus.pending || 0}
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Members</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {new Set(filteredTransactions.map(t => t.memberName || t.memberId)).size}
                </p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Search Transactions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member, type, or transaction ID..."
                  className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">All Types</option>
                <option value="contribution">Contributions</option>
                <option value="loan_payment">Loan Payments</option>
                <option value="loan_disbursement">Loan Requests</option>
                <option value="fine_payment">Fine Payments</option>
                <option value="interest">Interest</option>
                <option value="refund">Refunds</option>
                <option value="fee">Fees</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'recorded' ? 'Recorded ' : ''}Transaction History ({filteredTransactions.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto mb-4 text-gray-300 dark:text-gray-600" size={64} />
              <p className="text-lg font-semibold mb-2">No Transactions Found</p>
              <p className="text-sm">No transactions match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Member Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Transaction Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Payment Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    {activeTab === 'recorded' && (
                      <>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Recorded Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Recorded By</th>
                      </>
                    )}
                    {activeTab === 'all' && (
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id || transaction.transactionId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                        #{transaction.transactionId || transaction.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {transaction.memberName?.[0] || '?'}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-white">{transaction.memberName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (transaction.rawType || transaction.type) === 'contribution' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          (transaction.rawType || transaction.type) === 'loan_payment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          (transaction.rawType || transaction.type) === 'loan_disbursement' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                          (transaction.rawType || transaction.type) === 'fine_payment' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {transaction.transactionType || formatTransactionType(transaction.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {Math.abs(transaction.amount || 0).toLocaleString()} RWF
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-800 dark:text-white">{transaction.date || 'N/A'}</p>
                          {transaction.time && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.time}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.paymentMethod || formatPaymentMethod(transaction.rawPaymentMethod) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          transaction.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {(transaction.status || 'completed').toUpperCase()}
                        </span>
                      </td>
                      {activeTab === 'recorded' && (
                        <>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {transaction.recordedDate ? new Date(transaction.recordedDate).toLocaleString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {transaction.recordedBy || 'Secretary'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'all' && (
                        <td className="py-3 px-4">
                          {transaction.isRecorded ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                              <CheckCircle size={16} /> Recorded
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRecordTransaction(transaction)}
                              className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                            >
                              <Database size={14} /> Record
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 font-bold text-gray-800 dark:text-white text-right">TOTAL:</td>
                    <td className="py-3 px-4 font-bold text-green-600 dark:text-green-400">
                      {summary.totalAmount.toLocaleString()} RWF
                    </td>
                    <td colSpan={activeTab === 'recorded' ? 5 : 4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        {filteredTransactions.length > 0 && (
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-2 border-primary-200 dark:border-primary-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Transaction Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">By Transaction Type</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(summary.byType).map(type => (
                    <li key={type}>
                      {formatTransactionType(type)}: {summary.byType[type].count} transactions, {summary.byType[type].totalAmount.toLocaleString()} RWF
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">By Payment Method</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(summary.byPaymentMethod).map(method => (
                    <li key={method}>
                      {method}: {summary.byPaymentMethod[method]} transactions
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">By Status</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(summary.byStatus).map(status => (
                    <li key={status}>
                      {status.toUpperCase()}: {summary.byStatus[status]} transactions
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      {showRecordModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {t('recordTransaction', { defaultValue: 'Record Transaction' })}
            </h2>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member:</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.memberName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type:</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.transactionType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount:</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.amount.toLocaleString()} RWF</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date:</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.date}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRecordModal(false)
                  setSelectedTransaction(null)
                }}
                className="btn-secondary"
              >
                {tCommon('cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                onClick={confirmRecordTransaction}
                className="btn-primary"
              >
                {t('confirmRecord', { defaultValue: 'Confirm Record' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default SecretaryTransactions

