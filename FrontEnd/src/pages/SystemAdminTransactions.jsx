import { useState, useEffect } from 'react'
import { CreditCard, Eye, Search, XCircle, AlertCircle, Shield, Clock, Download, ArrowUpDown } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { exportToExcel, exportToCSV } from '../utils/pdfExport'

function SystemAdminTransactions() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try { setLoading(true); const { data } = await api.get('/transactions'); if (mounted) setTransactions(data?.data || []) }
      finally { if (mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  }, [])

  const filteredTransactions = (transactions||[]).filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'flagged' && transaction.flagged) ||
      (activeTab === 'pending' && transaction.status === 'Pending')
    const matchesSearch = [transaction.clientName, transaction.id, transaction.reference, transaction.agentName]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesStatus && matchesTab && matchesSearch
  })

  const handleViewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionDetails(true)
  }

  const handleExportTransactions = (format = 'csv') => {
    try {
      // Use filteredTransactions - this respects all filters, search, and transaction type selections
      const transactionsToExport = filteredTransactions || []
      
      if (transactionsToExport.length === 0) {
        alert(tSystemAdmin('noTransactionsToExport', { defaultValue: 'No transactions to export. Please adjust your filters.' }))
        return
      }
      
      // Prepare headers
      const headers = [
        'ID',
        'Type',
        'Amount (RWF)',
        'Status',
        'Reference',
        'Client Name',
        'Agent Name',
        'Created At',
        'Flagged'
      ]
      
      // Prepare data rows
      const rows = transactionsToExport.map(t => [
        t.id || '',
        t.type || '',
        parseFloat(t.amount || 0),
        t.status || '',
        t.reference || '',
        t.clientName || '',
        t.agentName || '',
        t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
        t.flagged ? 'Yes' : 'No'
      ])
      
      // Calculate summary
      const totalAmount = transactionsToExport.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      const summary = {
        totalTransactions: transactionsToExport.length,
        totalAmount: totalAmount,
        byType: transactionsToExport.reduce((acc, t) => {
          const type = t.type || 'Unknown'
          if (!acc[type]) {
            acc[type] = { count: 0, totalAmount: 0 }
          }
          acc[type].count++
          acc[type].totalAmount += parseFloat(t.amount || 0)
          return acc
        }, {})
      }
      
      // Generate filename with filters info
      const filterInfo = []
      if (filterType !== 'all') filterInfo.push(filterType)
      if (filterStatus !== 'all') filterInfo.push(filterStatus)
      if (searchTerm) filterInfo.push('search')
      const filterSuffix = filterInfo.length > 0 ? `_${filterInfo.join('_')}` : ''
      const filename = `System_Transactions${filterSuffix}`
      
      // Export options
      const options = {
        title: 'System Admin Transactions Report',
        summary: summary,
        dateRange: {
          generated: new Date().toLocaleString()
        }
      }
      
      // Add filter information to options
      if (filterType !== 'all' || filterStatus !== 'all' || searchTerm) {
        options.filters = []
        if (filterType !== 'all') options.filters.push(`Type: ${filterType}`)
        if (filterStatus !== 'all') options.filters.push(`Status: ${filterStatus}`)
        if (searchTerm) options.filters.push(`Search: ${searchTerm}`)
      }
      
      // Export based on format
      if (format === 'excel') {
        exportToExcel(rows, headers, filename, options)
      } else {
        exportToCSV(rows, headers, filename, options)
      }
    } catch (error) {
      console.error('[SystemAdminTransactions] Export error:', error)
      alert(tSystemAdmin('exportFailed', { defaultValue: 'Failed to export transactions. Please try again.' }))
    }
  }
  
  const handleExportCSV = () => {
    handleExportTransactions('csv')
  }
  
  const handleExportExcel = () => {
    handleExportTransactions('excel')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Pending Approval': return 'bg-orange-100 text-orange-700'
      case 'Flagged': return 'bg-red-100 text-red-700'
      case 'Rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Deposit': return <ArrowUpDown className="text-green-600" size={20} />
      case 'Withdrawal': return <ArrowUpDown className="text-red-600" size={20} />
      case 'Loan Payment': return <CreditCard className="text-blue-600" size={20} />
      case 'Transfer': return <ArrowUpDown className="text-purple-600" size={20} />
      default: return <CreditCard className="text-gray-600" size={20} />
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('transactionManagement', { defaultValue: 'Transaction Management' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('viewApproveManageAllTransactions', { defaultValue: 'View, approve, and manage all transactions across the system' })}</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('totalTransactions', { defaultValue: 'Total Transactions' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '0' : (transactions?.length || 0)}</p>
              </div>
              <CreditCard className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('pendingApprovals')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '0' : (transactions||[]).filter(t => t.status === 'Pending Approval').length}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('flagged', { defaultValue: 'Flagged' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '0' : (transactions||[]).filter(t => t.flagged).length}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('disputes', { defaultValue: 'Disputes' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">0</p>
              </div>
              <Shield className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input type="text" placeholder={tSystemAdmin('searchTransactions', { defaultValue: 'Search transactions...' })} className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={filterType} onChange={(e)=>setFilterType(e.target.value)}>
              <option value="all">{tSystemAdmin('allTypes', { defaultValue: 'All Types' })}</option>
              <option>{tSystemAdmin('deposit', { defaultValue: 'Deposit' })}</option>
              <option>{tSystemAdmin('withdrawal', { defaultValue: 'Withdrawal' })}</option>
              <option>{tSystemAdmin('loanPayment', { defaultValue: 'Loan Payment' })}</option>
              <option>{tSystemAdmin('transfer', { defaultValue: 'Transfer' })}</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">{tSystemAdmin('allStatuses', { defaultValue: 'All Statuses' })}</option>
              <option>{t('completed')}</option>
              <option>{tCommon('pending')}</option>
              <option>{tSystemAdmin('pendingApproval', { defaultValue: 'Pending Approval' })}</option>
              <option>{tSystemAdmin('flagged')}</option>
              <option>{t('rejected')}</option>
            </select>
          </div>
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 w-full md:w-auto">
            <Download size={20} /> {tSystemAdmin('exportCsv', { defaultValue: 'Export CSV' })}
          </button>
          <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 w-full md:w-auto">
            <Download size={20} /> {tSystemAdmin('exportExcel', { defaultValue: 'Export Excel' })}
          </button>
        </div>

        {/* List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('id')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('type')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tCommon('amount')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('reference', { defaultValue: 'Reference' })}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{tCommon('loading')}</td></tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">{getTypeIcon(t.type)} <span className="dark:text-gray-300">{t.type}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.amount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(t.status)}`}>{t.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.reference || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={()=>handleViewTransactionDetails(t)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300" title={tCommon('view')}><Eye size={20} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{t('noTransactions')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details */}
        {showTransactionDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('transaction', { defaultValue: 'Transaction' })} {selectedTransaction.id}</h2>
                <button onClick={()=>setShowTransactionDetails(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">{tCommon('close')}</button>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <p><span className="font-semibold">{t('type')}:</span> {selectedTransaction.type}</p>
                <p><span className="font-semibold">{tCommon('amount')}:</span> {selectedTransaction.amount || 0}</p>
                <p><span className="font-semibold">{t('status')}:</span> {selectedTransaction.status}</p>
                <p><span className="font-semibold">{tSystemAdmin('reference')}:</span> {selectedTransaction.reference || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminTransactions
