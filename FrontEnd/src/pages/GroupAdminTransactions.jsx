import { useState, useEffect, useContext } from 'react'
import { FileText, Download, Search, Filter, Calendar, DollarSign, Users, TrendingUp, Printer } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { formatCurrency, formatDate, formatDateTime, formatDateTimeFull, exportToExcel, exportToCSV } from '../utils/pdfExport'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminTransactions() {
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState(null)
  const [reportSummary, setReportSummary] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadTransactions() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        // Load group info
        const groupRes = await api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } }))
        if (groupRes.data?.success) {
          setGroupInfo(groupRes.data.data)
        }

        // Load transactions
        const response = await api.get('/transactions', {
          params: { groupId, limit: 10000 }
        })

        if (mounted && response.data?.success) {
          const items = (response.data.data || []).map(t => ({
            id: t.id,
            transactionId: t.id,
            memberName: t.user?.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            memberId: t.userId,
            transactionType: formatTransactionType(t.type),
            rawType: t.type,
            amount: Number(t.amount || 0),
            date: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toISOString().split('T')[0] : '',
            time: t.transactionDate || t.createdAt ? new Date(t.transactionDate || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: t.status || 'completed',
            paymentMethod: formatPaymentMethod(t.paymentMethod),
            rawPaymentMethod: t.paymentMethod,
            description: t.description || `${formatTransactionType(t.type)} - ${t.referenceId || ''}`,
            referenceId: t.referenceId
          }))
          setTransactions(items)
        }
      } catch (error) {
        console.error('[GroupAdminTransactions] Error loading transactions:', error)
        if (mounted) setTransactions([])
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.rawType === filterType
    const matchesSearch = transaction.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId.toString().includes(searchTerm)

    let matchesDate = true
    if (startDate) {
      matchesDate = matchesDate && transaction.date >= startDate
    }
    if (endDate) {
      matchesDate = matchesDate && transaction.date <= endDate
    }

    return matchesType && matchesSearch && matchesDate
  })

  // Calculate summary
  const calculateSummary = () => {
    const summary = {
      totalTransactions: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      byType: {},
      byStatus: {},
      byPaymentMethod: {}
    }

    filteredTransactions.forEach(t => {
      // Count by type
      if (!summary.byType[t.rawType]) {
        summary.byType[t.rawType] = { count: 0, totalAmount: 0 }
      }
      summary.byType[t.rawType].count++
      summary.byType[t.rawType].totalAmount += Math.abs(t.amount)

      // Count by status
      if (!summary.byStatus[t.status]) {
        summary.byStatus[t.status] = 0
      }
      summary.byStatus[t.status]++

      // Count by payment method
      const method = t.paymentMethod || 'N/A'
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
      // Use filteredTransactions - this respects all filters, search, and transaction type selections
      const transactionsToExport = filteredTransactions || []

      if (transactionsToExport.length === 0) {
        alert(t('noTransactionsToExport', { defaultValue: 'No transactions to export. Please adjust your filters.' }))
        return
      }

      // Prepare headers
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
        'Reference ID'
      ]

      // Prepare data rows from filtered transactions
      const rows = transactionsToExport.map(t => {
        // Format date and time
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

        return [
          t.transactionId || t.id || '',
          t.memberName || '',
          dateStr,
          timeStr,
          t.transactionType || '',
          parseFloat(t.amount || 0),
          t.paymentMethod || 'N/A',
          (t.status || '').toUpperCase(),
          t.description || '',
          t.referenceId || ''
        ]
      })

      // Use the already calculated summary from filteredTransactions
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

      // Generate filename with filters info
      const filterInfo = []
      if (filterType !== 'all') filterInfo.push(filterType.replace(/_/g, '-'))
      if (searchTerm) filterInfo.push('search')
      if (startDate) filterInfo.push(`from-${startDate}`)
      if (endDate) filterInfo.push(`to-${endDate}`)
      const filterSuffix = filterInfo.length > 0 ? `_${filterInfo.join('_')}` : ''
      const filename = `Transaction_Report_${groupInfo?.name || 'Group'}${filterSuffix}`

      // Prepare date range info
      const dateRange = {}
      if (startDate) dateRange.startDate = startDate
      if (endDate) dateRange.endDate = endDate

      // Export options
      const options = {
        title: `Transaction Report - ${groupInfo?.name || 'Group'}`,
        groupName: groupInfo?.name || 'N/A',
        dateRange: Object.keys(dateRange).length > 0 ? dateRange : undefined,
        summary: exportSummary
      }

      // Add filter information to options
      if (filterType !== 'all' || searchTerm) {
        options.filters = []
        if (filterType !== 'all') options.filters.push(`Type: ${formatTransactionType(filterType)}`)
        if (searchTerm) options.filters.push(`Search: ${searchTerm}`)
      }

      // Export based on format
      if (format === 'excel') {
        exportToExcel(rows, headers, filename, options)
      } else {
        exportToCSV(rows, headers, filename, options)
      }
    } catch (error) {
      console.error('[GroupAdminTransactions] Export error:', error)
      alert(t('exportFailed', { defaultValue: 'Failed to export transactions. Please try again.' }))
    }
  }

  const exportCSV = () => {
    generateReport('csv')
  }

  const exportExcel = () => {
    generateReport('excel')
  }

  const printReport = () => {
    window.print()
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('transactionsReport', { defaultValue: 'Transactions Report' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('viewGenerateTransactionReports', { defaultValue: 'View and generate comprehensive transaction reports' })}</p>
            {groupInfo && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-1 font-semibold">{t('group', { defaultValue: 'Group' })}: {groupInfo.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <>
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
                <button
                  onClick={printReport}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Printer size={18} /> {t('print', { defaultValue: 'Print' })}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.totalTransactions}
                </p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.totalAmount.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.byStatus.completed || 0}
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Members</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(filteredTransactions.map(t => t.memberName)).size}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Transactions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member, type, or transaction ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Transaction History ({filteredTransactions.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-lg font-semibold mb-2">No Transactions Found</p>
              <p className="text-sm">No transactions match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full print:table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Member Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">
                        #{transaction.transactionId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {transaction.memberName[0]}
                          </div>
                          <span className="font-semibold text-gray-800">{transaction.memberName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.rawType === 'contribution' ? 'bg-green-100 text-green-700' :
                            transaction.rawType === 'loan_payment' ? 'bg-blue-100 text-blue-700' :
                              transaction.rawType === 'loan_disbursement' ? 'bg-purple-100 text-purple-700' :
                                transaction.rawType === 'fine_payment' ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                          }`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">
                          {transaction.amount.toLocaleString()} RWF
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-800">{transaction.date}</p>
                          <p className="text-xs text-gray-500">{transaction.time}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{transaction.paymentMethod}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              transaction.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {transaction.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{transaction.description || 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 font-bold text-gray-800 text-right">TOTAL:</td>
                    <td className="py-3 px-4 font-bold text-green-600">
                      {summary.totalAmount.toLocaleString()} RWF
                    </td>
                    <td colSpan="4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        {filteredTransactions.length > 0 && (
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">By Transaction Type</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {Object.keys(summary.byType).map(type => (
                    <li key={type}>
                      {formatTransactionType(type)}: {summary.byType[type].count} transactions, {summary.byType[type].totalAmount.toLocaleString()} RWF
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">By Payment Method</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {Object.keys(summary.byPaymentMethod).map(method => (
                    <li key={method}>
                      {method}: {summary.byPaymentMethod[method]} transactions
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">By Status</h3>
                <ul className="space-y-1 text-sm text-gray-600">
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
    </Layout>
  )
}

export default GroupAdminTransactions
