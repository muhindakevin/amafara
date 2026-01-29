import { useState, useEffect } from 'react'
import { DollarSign, AlertTriangle, Clock, CheckCircle, XCircle, Search, Filter, Users, Calendar, Bell, FileText, Save, Database, Download, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { exportToExcel } from '../utils/pdfExport'
import * as XLSX from 'xlsx'

function CashierLoans() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState(null)
  const [recordedLoans, setRecordedLoans] = useState([]) // Track recorded loans
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false)
  const [selectedLoans, setSelectedLoans] = useState([])
  const [sendingReminders, setSendingReminders] = useState(false)
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false)
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        // Load recorded transactions from localStorage
        const recorded = JSON.parse(localStorage.getItem('cashierRecordedTransactions') || '[]')
        setRecordedLoans(recorded)

        const [groupRes, loansRes] = await Promise.all([
          api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } })),
          api.get('/loans/requests', { params: { status: 'all' } }).catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (!mounted) return

        if (groupRes.data?.success) {
          setGroupInfo(groupRes.data.data)
        }

        const allLoans = Array.isArray(loansRes.data?.data) 
          ? loansRes.data.data.filter(l => l.groupId === groupId || l.groupId === parseInt(groupId))
          : []

        const today = new Date()
        const formattedLoans = allLoans.map(loan => {
          const user = loan.user || loan.member || {}
          const nextPayment = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null
          const daysOverdue = nextPayment && nextPayment < today 
            ? Math.floor((today - nextPayment) / (1000 * 60 * 60 * 24))
            : 0
          
          const status = loan.status || 'pending'
          let displayStatus = status
          if ((status === 'approved' || status === 'disbursed' || status === 'active') && daysOverdue > 0) {
            displayStatus = 'overdue'
          } else if (status === 'approved' || status === 'disbursed' || status === 'active') {
            displayStatus = 'current'
          }

          const guarantor = loan.guarantor || {}
          
          return {
            id: loan.id,
            memberId: loan.memberId || user.id,
            memberName: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            phone: user.phone || '',
            loanAmount: Number(loan.amount || 0),
            remainingAmount: Number(loan.remainingAmount || loan.amount || 0),
            monthlyPayment: Number(loan.monthlyPayment || 0),
            dueDate: nextPayment ? nextPayment.toISOString().split('T')[0] : '',
            status: displayStatus,
            rawStatus: status,
            daysOverdue: daysOverdue,
            lastPayment: loan.lastPaymentDate ? new Date(loan.lastPaymentDate).toISOString().split('T')[0] : '',
            totalPayments: loan.paymentsMade || 0,
            paymentMethod: loan.paymentMethod || '',
            purpose: loan.purpose || '',
            duration: loan.duration || 0,
            interestRate: loan.interestRate || 0,
            approvedDate: loan.approvalDate ? new Date(loan.approvalDate).toISOString().split('T')[0] : null,
            disbursementDate: loan.disbursementDate ? new Date(loan.disbursementDate).toISOString().split('T')[0] : null,
            guarantorId: loan.guarantorId || guarantor.id || null,
            guarantorName: loan.guarantorName || guarantor.name || null,
            guarantorPhone: loan.guarantorPhone || guarantor.phone || null,
            guarantorNationalId: loan.guarantorNationalId || guarantor.nationalId || null,
            guarantorRelationship: loan.guarantorRelationship || null
          }
        })

        setLoans(formattedLoans)
      } catch (error) {
        console.error('[CashierLoans] Error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const filteredLoans = loans.filter(loan => {
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus
    const matchesSearch = 
      loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.memberId?.toString().includes(searchTerm) ||
      loan.phone.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'paid': case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'approved': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const handleRecordLoan = async (loanId) => {
    if (!confirm(t('confirmRecordLoan', { defaultValue: 'Are you sure you want to record this loan transaction?' }))) {
      return
    }

    try {
      // Mark loan as recorded (store in localStorage for now, or create a backend endpoint)
      const loan = loans.find(l => l.id === loanId)
      if (loan) {
        const recordedLoan = {
          id: loanId,
          loanId: loanId,
          memberName: loan.memberName,
          memberId: loan.memberId,
          amount: loan.loanAmount,
          purpose: loan.purpose,
          recordedDate: new Date().toISOString(),
          recordedBy: 'Cashier',
          type: 'loan_disbursement'
        }
        
        // Save to localStorage (or call backend API if available)
        const existing = JSON.parse(localStorage.getItem('cashierRecordedTransactions') || '[]')
        const updated = [...existing.filter(r => r.loanId !== loanId), recordedLoan]
        localStorage.setItem('cashierRecordedTransactions', JSON.stringify(updated))
        setRecordedLoans(updated)
        
        alert(t('loanRecordedSuccessfully', { defaultValue: 'Loan transaction recorded successfully!' }))
        
        // Also try to disburse the loan if it's approved
        if (loan.rawStatus === 'approved') {
          try {
            const disbursementDate = new Date().toISOString().split('T')[0]
            await api.put(`/loans/${loanId}/approve`, { disbursementDate }).catch(() => {})
          } catch (err) {
            console.log('Loan already disbursed or error:', err)
          }
        }
        
        // Reload to update UI
        window.location.reload()
      }
    } catch (error) {
      console.error('Error recording loan:', error)
      alert(error.response?.data?.message || t('loanRecordFailed', { defaultValue: 'Failed to record loan' }))
    }
  }

  const handleMarkPaymentReceived = async (loanId) => {
    const amount = prompt(t('enterPaymentAmount', { defaultValue: 'Enter payment amount (RWF):' }))
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert(t('invalidAmount', { defaultValue: 'Invalid amount' }))
      return
    }

    try {
      const response = await api.post(`/loans/${loanId}/pay`, {
        amount: parseFloat(amount),
        paymentMethod: 'cash'
      })

      if (response.data?.success) {
        alert(t('paymentMarkedAsReceived', { defaultValue: 'Payment marked as received successfully!' }))
        window.location.reload()
      } else {
        alert(t('paymentFailed', { defaultValue: 'Failed to record payment' }))
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert(error.response?.data?.message || t('paymentFailed', { defaultValue: 'Failed to record payment' }))
    }
  }

  const handleSendReminder = async (loanId) => {
    try {
      const loan = loans.find(l => l.id === loanId)
      if (!loan) {
        alert(t('loanNotFound', { defaultValue: 'Loan not found' }))
        return
      }

      const reminderMessage = loan.status === 'overdue'
        ? `Reminder: Your loan payment of ${loan.monthlyPayment.toLocaleString()} RWF is overdue by ${loan.daysOverdue} days. Please make payment as soon as possible.`
        : `Reminder: Your loan payment of ${loan.monthlyPayment.toLocaleString()} RWF is due on ${loan.dueDate}. Please ensure payment is made on time.`

      await api.post('/notifications', {
        userId: loan.memberId,
        type: 'loan_reminder',
        title: 'Loan Payment Reminder',
        content: reminderMessage
      })

      alert(t('reminderSentSuccessfully', { defaultValue: 'Reminder sent successfully!' }))
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert(error.response?.data?.message || t('reminderFailed', { defaultValue: 'Failed to send reminder' }))
    }
  }

  const handleGenerateReport = () => {
    try {
      // Prepare data for Excel export
      const reportData = loans.map(loan => ({
        'Member Name': loan.memberName,
        'Member ID': loan.memberId,
        'Phone': loan.phone,
        'Loan Amount (RWF)': loan.loanAmount,
        'Remaining Amount (RWF)': loan.remainingAmount,
        'Monthly Payment (RWF)': loan.monthlyPayment,
        'Due Date': loan.dueDate || 'N/A',
        'Status': loan.status,
        'Days Overdue': loan.daysOverdue || 0,
        'Payments Made': loan.totalPayments,
        'Last Payment': loan.lastPayment || 'None',
        'Purpose': loan.purpose || 'N/A',
        'Progress (%)': loan.loanAmount > 0 
          ? Math.round(((loan.loanAmount - loan.remainingAmount) / loan.loanAmount) * 100)
          : 0
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(reportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Loan Report')

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0]
      const filename = `Loan_Report_${date}.xlsx`

      // Write file
      XLSX.writeFile(wb, filename)

      alert(t('reportGeneratedSuccessfully', { defaultValue: 'Report generated successfully!' }))
    } catch (error) {
      console.error('Error generating report:', error)
      alert(t('reportGenerationFailed', { defaultValue: 'Failed to generate report' }))
    }
  }

  const handleBulkReminder = () => {
    // Show modal with all loans that can receive reminders (current or overdue)
    const eligibleLoans = loans.filter(l => l.status === 'current' || l.status === 'overdue')
    if (eligibleLoans.length === 0) {
      alert(t('noEligibleLoans', { defaultValue: 'No loans eligible for reminders' }))
      return
    }
    setSelectedLoans([])
    setShowBulkReminderModal(true)
  }

  const handleSendBulkReminders = async () => {
    if (selectedLoans.length === 0) {
      alert(t('selectLoansFirst', { defaultValue: 'Please select at least one loan' }))
      return
    }

    setSendingReminders(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const loanId of selectedLoans) {
        try {
          const loan = loans.find(l => l.id === loanId)
          if (!loan) continue

          const reminderMessage = loan.status === 'overdue'
            ? `Reminder: Your loan payment of ${loan.monthlyPayment.toLocaleString()} RWF is overdue by ${loan.daysOverdue} days. Please make payment as soon as possible.`
            : `Reminder: Your loan payment of ${loan.monthlyPayment.toLocaleString()} RWF is due on ${loan.dueDate}. Please ensure payment is made on time.`

          await api.post('/notifications', {
            userId: loan.memberId,
            type: 'loan_reminder',
            title: 'Loan Payment Reminder',
            content: reminderMessage
          })
          successCount++
        } catch (error) {
          console.error(`Error sending reminder for loan ${loanId}:`, error)
          failCount++
        }
      }

      alert(t('bulkRemindersSent', { 
        defaultValue: `Reminders sent: ${successCount} successful, ${failCount} failed` 
      }))
      setShowBulkReminderModal(false)
      setSelectedLoans([])
    } catch (error) {
      console.error('Error sending bulk reminders:', error)
      alert(t('bulkRemindersFailed', { defaultValue: 'Failed to send bulk reminders' }))
    } finally {
      setSendingReminders(false)
    }
  }

  const handleViewDetails = (loan) => {
    setSelectedLoanDetails(loan)
    setShowLoanDetailsModal(true)
  }

  const toggleLoanSelection = (loanId) => {
    setSelectedLoans(prev => 
      prev.includes(loanId) 
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    )
  }

  const selectAllEligibleLoans = () => {
    const eligibleLoans = loans.filter(l => l.status === 'current' || l.status === 'overdue')
    setSelectedLoans(eligibleLoans.map(l => l.id))
  }

  const deselectAllLoans = () => {
    setSelectedLoans([])
  }

  const activeLoans = loans.filter(l => l.status === 'current' || l.status === 'overdue')
  const overdueLoans = loans.filter(l => l.status === 'overdue')
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0)
  const avgDaysOverdue = overdueLoans.length > 0
    ? Math.round(overdueLoans.reduce((sum, l) => sum + l.daysOverdue, 0) / overdueLoans.length)
    : 0

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('loanRepaymentTracking', { defaultValue: 'Loan Repayment Tracking' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('monitorLoanRepayments', { defaultValue: 'Monitor loan repayments and overdue payments' })}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.href = '/cashier/records'}
              className="btn-primary flex items-center gap-2"
            >
              <Database size={18} /> {t('viewAllRecords', { defaultValue: 'View All Records' })}
            </button>
            <button 
              onClick={handleBulkReminder}
              className="btn-secondary flex items-center gap-2"
            >
              <Bell size={18} /> {t('sendBulkReminders', { defaultValue: 'Send Bulk Reminders' })}
            </button>
            <button 
              onClick={handleGenerateReport}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText size={18} /> {t('generateReport', { defaultValue: 'Generate Report' })}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeLoans')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeLoans.length}</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('overdueLoans', { defaultValue: 'Overdue Loans' })}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueLoans.length}</p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalOutstanding', { defaultValue: 'Total Outstanding' })}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalOutstanding.toLocaleString()} RWF</p>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('avgDaysOverdue', { defaultValue: 'Avg Days Overdue' })}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgDaysOverdue}</p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('searchLoans', { defaultValue: 'Search Loans' })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchByMemberNameIdPhone', { defaultValue: 'Search by member name, ID, or phone...' })}
                  className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('filterByStatus', { defaultValue: 'Filter by Status' })}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">{t('allLoans', { defaultValue: 'All Loans' })}</option>
                <option value="pending">{t('pending', { defaultValue: 'Pending' })}</option>
                <option value="approved">{t('approved', { defaultValue: 'Approved' })}</option>
                <option value="current">{t('current', { defaultValue: 'Current' })}</option>
                <option value="overdue">{t('overdue', { defaultValue: 'Overdue' })}</option>
                <option value="completed">{t('completed', { defaultValue: 'Completed' })}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('loanRepaymentStatus', { defaultValue: 'Loan Repayment Status' })} ({filteredLoans.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noLoansFound', { defaultValue: 'No loans found' })}</p>
          ) : (
            <div className="space-y-4">
              {filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {loan.memberName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{loan.memberName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{loan.phone} • ID: {loan.memberId}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {t('lastPayment', { defaultValue: 'Last Payment' })}: {loan.lastPayment || t('none', { defaultValue: 'None' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                        {loan.status === 'current' ? t('current', { defaultValue: 'Current' }) : 
                         loan.status === 'overdue' ? `${loan.daysOverdue} ${t('daysOverdue', { defaultValue: 'days overdue' })}` :
                         loan.status}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {loan.remainingAmount.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('loanAmount', { defaultValue: 'Loan Amount' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{loan.loanAmount.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('monthlyPayment', { defaultValue: 'Monthly Payment' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{loan.monthlyPayment.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('dueDate', { defaultValue: 'Due Date' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{loan.dueDate || t('none', { defaultValue: 'N/A' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('paymentsMade', { defaultValue: 'Payments Made' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{loan.totalPayments}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('progress', { defaultValue: 'Progress' })}: </span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {loan.loanAmount > 0 
                            ? Math.round(((loan.loanAmount - loan.remainingAmount) / loan.loanAmount) * 100)
                            : 0}%
                        </span>
                      </div>
                      {loan.purpose && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('purpose', { defaultValue: 'Purpose' })}: </span>
                          <span className="font-semibold text-gray-800 dark:text-white">{loan.purpose}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(loan.rawStatus === 'approved' || loan.rawStatus === 'disbursed') && !recordedLoans.find(r => r.loanId === loan.id) && (
                        <button
                          onClick={() => handleRecordLoan(loan.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Database size={16} /> {t('recordTransaction', { defaultValue: 'Record Transaction' })}
                        </button>
                      )}
                      {(loan.rawStatus === 'approved' || loan.rawStatus === 'disbursed') && recordedLoans.find(r => r.loanId === loan.id) && (
                        <span className="text-sm text-green-600 dark:text-green-400 px-3 py-2 flex items-center gap-2">
                          <CheckCircle size={16} /> {t('recorded', { defaultValue: 'Recorded' })}
                        </span>
                      )}
                      {(loan.status === 'current' || loan.status === 'overdue') && (
                        <button
                          onClick={() => handleMarkPaymentReceived(loan.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> {t('markReceived', { defaultValue: 'Mark Received' })}
                        </button>
                      )}
                      {loan.status === 'overdue' && (
                        <button
                          onClick={() => handleSendReminder(loan.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Bell size={16} /> {t('sendReminder', { defaultValue: 'Send Reminder' })}
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewDetails(loan)}
                        className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <FileText size={16} /> {t('viewDetails', { defaultValue: 'View Details' })}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {overdueLoans.length > 0 && (
          <div className="card bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('defaultersAlert', { defaultValue: 'Defaulters Alert' })}</h2>
            </div>
            <div className="space-y-3">
              {overdueLoans.map((defaulter) => (
                <div key={defaulter.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {defaulter.memberName[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{defaulter.memberName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{defaulter.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {defaulter.remainingAmount.toLocaleString()} RWF
                    </span>
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-semibold">
                      {defaulter.daysOverdue} {t('daysOverdue', { defaultValue: 'days overdue' })}
                    </span>
                    <button 
                      onClick={() => window.location.href = `/cashier/fines?loanId=${defaulter.id}`}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {t('chargeFine', { defaultValue: 'Charge Fine' })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Reminder Modal */}
        {showBulkReminderModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {t('sendBulkReminders', { defaultValue: 'Send Bulk Reminders' })}
                </h2>
                <button
                  onClick={() => {
                    setShowBulkReminderModal(false)
                    setSelectedLoans([])
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={selectAllEligibleLoans}
                    className="btn-secondary text-sm"
                  >
                    {t('selectAll', { defaultValue: 'Select All' })}
                  </button>
                  <button
                    onClick={deselectAllLoans}
                    className="btn-secondary text-sm"
                  >
                    {t('deselectAll', { defaultValue: 'Deselect All' })}
                  </button>
                  <span className="ml-auto text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    {t('selected', { defaultValue: 'Selected' })}: {selectedLoans.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loans.filter(l => l.status === 'current' || l.status === 'overdue').map((loan) => (
                    <div
                      key={loan.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedLoans.includes(loan.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleLoanSelection(loan.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedLoans.includes(loan.id)}
                          onChange={() => toggleLoanSelection(loan.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 dark:text-white">{loan.memberName}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              loan.status === 'overdue' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {loan.status === 'overdue' 
                                ? `${loan.daysOverdue} ${t('daysOverdue', { defaultValue: 'days overdue' })}`
                                : t('current', { defaultValue: 'Current' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {loan.phone} • {t('amount', { defaultValue: 'Amount' })}: {loan.remainingAmount.toLocaleString()} RWF
                            {loan.dueDate && ` • ${t('dueDate', { defaultValue: 'Due' })}: ${loan.dueDate}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkReminderModal(false)
                      setSelectedLoans([])
                    }}
                    className="btn-secondary flex-1"
                    disabled={sendingReminders}
                  >
                    {tCommon('cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    onClick={handleSendBulkReminders}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={sendingReminders || selectedLoans.length === 0}
                  >
                    {sendingReminders ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('sending', { defaultValue: 'Sending...' })}
                      </>
                    ) : (
                      <>
                        <Bell size={18} />
                        {t('sendReminders', { defaultValue: 'Send Reminders' })} ({selectedLoans.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {showLoanDetailsModal && selectedLoanDetails && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {t('loanDetails', { defaultValue: 'Loan Details' })}
                </h2>
                <button
                  onClick={() => {
                    setShowLoanDetailsModal(false)
                    setSelectedLoanDetails(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Borrower Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    {t('borrowerInformation', { defaultValue: 'Borrower Information' })}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('name', { defaultValue: 'Name' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.memberName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('memberId', { defaultValue: 'Member ID' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.memberId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('phone', { defaultValue: 'Phone' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Loan Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    {t('loanInformation', { defaultValue: 'Loan Information' })}
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{t('loanAmount', { defaultValue: 'Loan Amount' })}:</span>
                      <span className="font-bold text-lg text-gray-800 dark:text-white">
                        {selectedLoanDetails.loanAmount.toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{t('remainingAmount', { defaultValue: 'Remaining Amount' })}:</span>
                      <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                        {selectedLoanDetails.remainingAmount.toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{t('monthlyPayment', { defaultValue: 'Monthly Payment' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {selectedLoanDetails.monthlyPayment.toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{t('dueDate', { defaultValue: 'Due Date' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {selectedLoanDetails.dueDate || t('none', { defaultValue: 'N/A' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{t('status', { defaultValue: 'Status' })}:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedLoanDetails.status)}`}>
                        {selectedLoanDetails.status === 'current' ? t('current', { defaultValue: 'Current' }) : 
                         selectedLoanDetails.status === 'overdue' ? `${selectedLoanDetails.daysOverdue} ${t('daysOverdue', { defaultValue: 'days overdue' })}` :
                         selectedLoanDetails.status}
                      </span>
                    </div>
                    {selectedLoanDetails.purpose && (
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{t('purpose', { defaultValue: 'Purpose' })}:</span>
                        <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.purpose}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    {t('paymentInformation', { defaultValue: 'Payment Information' })}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('paymentsMade', { defaultValue: 'Payments Made' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.totalPayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('lastPayment', { defaultValue: 'Last Payment' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {selectedLoanDetails.lastPayment || t('none', { defaultValue: 'None' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('progress', { defaultValue: 'Progress' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {selectedLoanDetails.loanAmount > 0 
                          ? Math.round(((selectedLoanDetails.loanAmount - selectedLoanDetails.remainingAmount) / selectedLoanDetails.loanAmount) * 100)
                          : 0}%
                      </span>
                    </div>
                    {selectedLoanDetails.status === 'overdue' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('daysOverdue', { defaultValue: 'Days Overdue' })}:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{selectedLoanDetails.daysOverdue}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guarantor Information */}
                {selectedLoanDetails.guarantorName && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      {t('guarantorInformation', { defaultValue: 'Guarantor Information' })}
                    </h3>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('name', { defaultValue: 'Name' })}:</span>
                        <span className="font-bold text-gray-800 dark:text-white">{selectedLoanDetails.guarantorName}</span>
                      </div>
                      {selectedLoanDetails.guarantorPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('phone', { defaultValue: 'Phone' })}:</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.guarantorPhone}</span>
                        </div>
                      )}
                      {selectedLoanDetails.guarantorNationalId && (
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('nationalId', { defaultValue: 'National ID' })}:</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.guarantorNationalId}</span>
                        </div>
                      )}
                      {selectedLoanDetails.guarantorRelationship && (
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('relationship', { defaultValue: 'Relationship' })}:</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.guarantorRelationship}</span>
                        </div>
                      )}
                      {selectedLoanDetails.guarantorId && (
                        <div className="flex justify-between">
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('memberId', { defaultValue: 'Member ID' })}:</span>
                          <span className="font-semibold text-gray-800 dark:text-white">{selectedLoanDetails.guarantorId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowLoanDetailsModal(false)
                      setSelectedLoanDetails(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    {tCommon('close', { defaultValue: 'Close' })}
                  </button>
                  {selectedLoanDetails.status === 'overdue' && (
                    <button
                      onClick={() => {
                        setShowLoanDetailsModal(false)
                        handleSendReminder(selectedLoanDetails.id)
                        setSelectedLoanDetails(null)
                      }}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Bell size={18} />
                      {t('sendReminder', { defaultValue: 'Send Reminder' })}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CashierLoans
