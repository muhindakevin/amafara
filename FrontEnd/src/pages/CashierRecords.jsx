import { useState, useEffect } from 'react'
import { Database, Download, FileText, Search, Filter, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { exportToExcel } from '../utils/pdfExport'
import api from '../utils/api'

function CashierRecords() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [groupInfo, setGroupInfo] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        const groupRes = await api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } }))
        if (groupRes.data?.success && mounted) {
          setGroupInfo(groupRes.data.data)
        }

        // Load recorded transactions from localStorage
        const recorded = JSON.parse(localStorage.getItem('cashierRecordedTransactions') || '[]')
        
        // Filter by groupId if we have group members
        if (mounted) {
          setRecords(recorded)
        }
      } catch (error) {
        console.error('[CashierRecords] Error loading data:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const filteredRecords = records.filter(record => {
    const matchesType = filterType === 'all' || record.type === filterType
    const matchesSearch = 
      record.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.memberId?.toString().includes(searchTerm) ||
      record.amount?.toString().includes(searchTerm)
    return matchesType && matchesSearch
  })

  const handleExportExcel = () => {
    try {
      const headers = [
        'ID',
        'Type',
        'Member Name',
        'Member ID',
        'Amount (RWF)',
        'Payment Method',
        'Purpose/Description',
        'Recorded Date',
        'Recorded By',
        'Transaction ID'
      ]

      const rows = filteredRecords.map(record => [
        record.id || record.loanId || record.contributionId || '',
        record.type === 'loan_disbursement' ? 'Loan Disbursement' : 'Contribution',
        record.memberName || '',
        record.memberId || '',
        Number(record.amount || 0).toLocaleString(),
        record.paymentMethod || '',
        record.purpose || record.description || '',
        record.recordedDate ? new Date(record.recordedDate).toLocaleString() : '',
        record.recordedBy || 'Cashier',
        record.transactionId || ''
      ])

      const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0)
      const summary = {
        totalTransactions: filteredRecords.length,
        totalAmount: totalAmount,
        byType: {
          'Loan Disbursement': {
            count: filteredRecords.filter(r => r.type === 'loan_disbursement').length,
            totalAmount: filteredRecords.filter(r => r.type === 'loan_disbursement').reduce((sum, r) => sum + Number(r.amount || 0), 0)
          },
          'Contribution': {
            count: filteredRecords.filter(r => r.type === 'contribution').length,
            totalAmount: filteredRecords.filter(r => r.type === 'contribution').reduce((sum, r) => sum + Number(r.amount || 0), 0)
          }
        }
      }

      exportToExcel(rows, headers, `Cashier_Records_${groupInfo?.name?.replace(/\s+/g, '_') || 'Group'}`, {
        title: 'Cashier Recorded Transactions',
        groupName: groupInfo?.name || '',
        summary: summary,
        dateRange: {
          startDate: filteredRecords.length > 0 ? new Date(Math.min(...filteredRecords.map(r => new Date(r.recordedDate).getTime()))).toISOString().split('T')[0] : '',
          endDate: filteredRecords.length > 0 ? new Date(Math.max(...filteredRecords.map(r => new Date(r.recordedDate).getTime()))).toISOString().split('T')[0] : ''
        }
      })

      alert(t('exportSuccessful', { defaultValue: 'Records exported to Excel successfully!' }))
    } catch (error) {
      console.error('[CashierRecords] Error exporting Excel:', error)
      alert(t('exportFailed', { defaultValue: 'Failed to export records. Please try again.' }))
    }
  }

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Type', 'Member Name', 'Member ID', 'Amount (RWF)', 'Payment Method', 'Purpose/Description', 'Recorded Date', 'Recorded By', 'Transaction ID']
      
      const csvRows = [
        headers.join(','),
        ...filteredRecords.map(record => [
          record.id || record.loanId || record.contributionId || '',
          record.type === 'loan_disbursement' ? 'Loan Disbursement' : 'Contribution',
          `"${record.memberName || ''}"`,
          record.memberId || '',
          Number(record.amount || 0),
          `"${record.paymentMethod || ''}"`,
          `"${record.purpose || record.description || ''}"`,
          record.recordedDate ? new Date(record.recordedDate).toISOString() : '',
          `"${record.recordedBy || 'Cashier'}"`,
          record.transactionId || ''
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `Cashier_Records_${groupInfo?.name?.replace(/\s+/g, '_') || 'Group'}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(t('exportSuccessful', { defaultValue: 'Records exported to CSV successfully!' }))
    } catch (error) {
      console.error('[CashierRecords] Error exporting CSV:', error)
      alert(t('exportFailed', { defaultValue: 'Failed to export records. Please try again.' }))
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'loan_disbursement': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'contribution': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const loanCount = filteredRecords.filter(r => r.type === 'loan_disbursement').length
  const contributionCount = filteredRecords.filter(r => r.type === 'contribution').length

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('recordedTransactions', { defaultValue: 'Recorded Transactions' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('viewAllRecordedTransactions', { defaultValue: 'View and export all recorded transactions' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} /> {t('exportExcel', { defaultValue: 'Export Excel' })}
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> {t('exportCSV', { defaultValue: 'Export CSV' })}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalRecords')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{filteredRecords.length}</p>
              </div>
              <Database className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('loanDisbursements', { defaultValue: 'Loan Disbursements' })}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{loanCount}</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('contributions', { defaultValue: 'Contributions' })}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{contributionCount}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalAmount', { defaultValue: 'Total Amount' })}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalAmount.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('search', { defaultValue: 'Search' })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchByMemberNameIdAmount', { defaultValue: 'Search by member name, ID, or amount...' })}
                  className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('filterByType', { defaultValue: 'Filter by Type' })}
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">{t('all', { defaultValue: 'All' })}</option>
                <option value="loan_disbursement">{t('loanDisbursements', { defaultValue: 'Loan Disbursements' })}</option>
                <option value="contribution">{t('contributions', { defaultValue: 'Contributions' })}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('allRecords', { defaultValue: 'All Records' })} ({filteredRecords.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noRecordsFound', { defaultValue: 'No records found' })}</p>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record, index) => (
                <div
                  key={record.id || index}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {record.memberName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{record.memberName || t('unknownMember', { defaultValue: 'Unknown Member' })}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {record.memberId || 'N/A'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {t('recorded', { defaultValue: 'Recorded' })}: {record.recordedDate ? new Date(record.recordedDate).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(record.type)}`}>
                        {record.type === 'loan_disbursement' ? t('loanDisbursement', { defaultValue: 'Loan Disbursement' }) : t('contribution', { defaultValue: 'Contribution' })}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {Number(record.amount || 0).toLocaleString()} RWF
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('type', { defaultValue: 'Type' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {record.type === 'loan_disbursement' ? t('loanDisbursement', { defaultValue: 'Loan Disbursement' }) : t('contribution', { defaultValue: 'Contribution' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('paymentMethod', { defaultValue: 'Payment Method' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{record.paymentMethod || t('nA', { defaultValue: 'N/A' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('purpose', { defaultValue: 'Purpose' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{record.purpose || record.description || t('nA', { defaultValue: 'N/A' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('recordedBy', { defaultValue: 'Recorded By' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{record.recordedBy || 'Cashier'}</p>
                    </div>
                  </div>

                  {record.transactionId && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('transactionId', { defaultValue: 'Transaction ID' })}: <span className="font-semibold text-gray-800 dark:text-white">{record.transactionId}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CashierRecords

