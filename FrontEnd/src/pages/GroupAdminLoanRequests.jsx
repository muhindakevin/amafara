import { useEffect, useState, useContext } from 'react'
import { DollarSign, CheckCircle, Clock, XCircle, Eye, Filter, Search, User, TrendingUp, AlertCircle, Download, Calendar, AlertTriangle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'
import { createPDFDocument, addTable, addSummarySection, addFooter, savePDF, formatCurrency, formatDate, formatDateTime } from '../utils/pdfExport'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminLoanRequests() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { user } = useContext(UserContext)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: summary, setData: setSummary, loading, wrap } = useApiState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  const [loanRequests, setLoanRequests] = useState([])

  const loadLoanRequests = async () => {
    try {
      const res = await api.get('/loans/requests?status=all')

      // Check if response is successful
      if (!res.data || !res.data.success) {
        console.error('[GroupAdminLoanRequests] Invalid response:', res.data)
        setLoanRequests([])
        setSummary({ total: 0, pending: 0, approved: 0, rejected: 0 })
        return
      }

      const items = (res.data?.data || []).map(r => ({
        id: r.id,
        memberId: r.memberId || r.userId,
        memberName: r.member?.name || r.user?.name || 'Member',
        phone: r.member?.phone || r.user?.phone || '',
        amount: Number(r.amount || 0),
        purpose: r.purpose || '',
        status: r.status || 'pending',
        requestDate: r.requestDate || r.createdAt || '',
        duration: r.duration ? `${r.duration} months` : '-',
        durationMonths: Number(r.duration || 0),
        monthlyPayment: Number(r.monthlyPayment || 0),
        creditScore: r.member?.creditScore || r.creditScore || 0,
        hasActiveLoan: !!r.hasActiveLoan,
        totalSavings: Number(r.member?.totalSavings || r.totalSavings || 0),
        contributionHistory: '',
        aiRecommendation: r.aiRecommendation || 'review',
        guarantorName: r.guarantorName || '',
        guarantorPhone: r.guarantorPhone || '',
        interestRate: r.interestRate || 0,
        // Payment information
        paidAmount: Number(r.paidAmount || 0),
        remainingAmount: Number(r.remainingAmount || r.totalAmount || r.amount || 0),
        totalAmount: Number(r.totalAmount || r.amount || 0),
        disbursementDate: r.disbursementDate || r.approvalDate || null,
        nextPaymentDate: r.nextPaymentDate || null,
        approvalDate: r.approvalDate || null
      }))

      // Sort: pending first, then by request date (newest first)
      items.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        const dateA = new Date(a.requestDate)
        const dateB = new Date(b.requestDate)
        return dateB - dateA
      })

      setLoanRequests(items)
      setSummary({
        total: items.length,
        pending: items.filter(x => x.status === 'pending').length,
        approved: items.filter(x => x.status === 'approved').length,
        rejected: items.filter(x => x.status === 'rejected').length
      })

      console.log(`[GroupAdminLoanRequests] Loaded ${items.length} loan requests (${items.filter(x => x.status === 'pending').length} pending)`)
    } catch (error) {
      console.error('[GroupAdminLoanRequests] Error loading loans:', error)

      // Check if it's a 404 - route not found (server might need restart)
      if (error.response?.status === 404) {
        console.error('[GroupAdminLoanRequests] Route not found. Backend server may need to be restarted.')
        // Don't show alert on every retry, just set empty state
        setLoanRequests([])
        setSummary({ total: 0, pending: 0, approved: 0, rejected: 0 })
      } else {
        // Only show alert for other errors
        alert(t('failedToLoadLoans', { defaultValue: 'Failed to load loan requests. Please refresh the page.' }))
        setLoanRequests([])
        setSummary({ total: 0, pending: 0, approved: 0, rejected: 0 })
      }
    }
  }

  useEffect(() => {
    wrap(loadLoanRequests)

    // Auto-refresh every 30 seconds to get latest loan requests
    const refreshInterval = setInterval(() => {
      loadLoanRequests()
    }, 30000)

    return () => clearInterval(refreshInterval)
  }, [])

  // Auto-refresh loan details when modal is open
  useEffect(() => {
    if (!showMemberDetails || !selectedLoan) return

    const refreshInterval = setInterval(() => {
      handleViewMemberDetails(selectedLoan)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [showMemberDetails, selectedLoan?.id])


  const [unpaidLoans, setUnpaidLoans] = useState([])

  useEffect(() => {
    let mounted = true
    async function loadUnpaid() {
      try {
        // Use the requests endpoint to get all loans for the group
        const { data } = await api.get('/loans/requests?status=all')
        if (!mounted) return
        const allLoans = data?.data || []
        // Filter active loans that are overdue
        const now = new Date()
        const overdue = allLoans
          .filter(l => l.status === 'approved' || l.status === 'disbursed' || l.status === 'active')
          .filter(l => {
            if (!l.nextPaymentDate) return false
            const dueDate = new Date(l.nextPaymentDate)
            return dueDate < now && l.remainingAmount > 0
          })
          .map(l => {
            const dueDate = new Date(l.nextPaymentDate)
            const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))
            return {
              id: l.id,
              memberName: l.member?.name || 'Member',
              phone: l.member?.phone || '',
              memberId: l.memberId,
              loanAmount: Number(l.amount || 0),
              remainingAmount: Number(l.remainingAmount || 0),
              monthlyPayment: Number(l.monthlyPayment || 0),
              dueDate: l.nextPaymentDate ? new Date(l.nextPaymentDate).toISOString().split('T')[0] : '',
              daysOverdue: daysDiff,
              lastPayment: l.lastPaymentDate ? new Date(l.lastPaymentDate).toISOString().split('T')[0] : 'N/A',
              totalPayments: 0, // Will calculate from transactions
              totalPaid: Number(l.amount || 0) - Number(l.remainingAmount || 0)
            }
          })
        setUnpaidLoans(overdue)
      } catch (e) {
        console.error('Failed to load unpaid loans:', e)
        if (mounted) setUnpaidLoans([])
      }
    }
    loadUnpaid()
    return () => { mounted = false }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="text-green-600" size={20} />
      case 'pending': return <Clock className="text-yellow-600" size={20} />
      case 'rejected': return <XCircle className="text-red-600" size={20} />
      default: return <Clock className="text-gray-600" size={20} />
    }
  }

  const getAIRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'approve': return 'bg-green-100 text-green-700'
      case 'reject': return 'bg-red-100 text-red-700'
      case 'review': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getOverdueColor = (daysOverdue) => {
    if (daysOverdue === 0) return 'bg-green-100 text-green-700'
    if (daysOverdue <= 7) return 'bg-yellow-100 text-yellow-700'
    if (daysOverdue <= 30) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  const getOverdueIcon = (daysOverdue) => {
    if (daysOverdue === 0) return <CheckCircle className="text-green-600" size={20} />
    if (daysOverdue <= 7) return <Clock className="text-yellow-600" size={20} />
    if (daysOverdue <= 30) return <AlertTriangle className="text-orange-600" size={20} />
    return <AlertCircle className="text-red-600" size={20} />
  }

  const filteredLoans = (loanRequests || []).filter(loan => {
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus
    const matchesSearch = !searchTerm || loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || (loan.phone || '').includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const [processingLoan, setProcessingLoan] = useState(null)

  const handleApproveLoan = async (loanId) => {
    const loan = loanRequests.find(l => l.id === loanId)
    if (!loan) return

    if (!window.confirm(t('confirmApproveLoan', {
      defaultValue: `Are you sure you want to approve this loan?\n\nMember: {{memberName}}\nAmount: {{amount}} RWF\nDuration: {{duration}}\n\nThe member and all group members will be notified via email.`,
      memberName: loan.memberName,
      amount: loan.amount.toLocaleString(),
      duration: loan.duration
    }))) {
      return
    }

    setProcessingLoan(loanId)
    try {
      const { data } = await api.put(`/loans/${loanId}/approve`)
      if (data?.success) {
        alert(t('loanApprovedSuccessfully', { defaultValue: '✅ Loan approved successfully!\n\nThe member has been notified via email, and all group members have been informed. The Cashier has also been updated.' }))
        // Reload loan requests to show updated status
        await loadLoanRequests()
      } else {
        alert(data?.message || t('failedToApproveLoan', { defaultValue: 'Failed to approve loan' }))
      }
    } catch (err) {
      console.error('[GroupAdminLoanRequests] Failed to approve loan:', err)
      alert(err.response?.data?.message || t('failedToApproveLoanTryAgain', { defaultValue: 'Failed to approve loan. Please try again.' }))
    } finally {
      setProcessingLoan(null)
    }
  }

  const handleRejectLoan = async (loanId) => {
    const loan = loanRequests.find(l => l.id === loanId)
    if (!loan) return

    const reason = window.prompt(t('provideRejectionReason', {
      defaultValue: `Please provide a reason for rejecting this loan:\n\nMember: {{memberName}}\nAmount: {{amount}} RWF\n\nReason:`,
      memberName: loan.memberName,
      amount: loan.amount.toLocaleString()
    }))
    if (reason === null || reason.trim() === '') {
      alert(t('provideReasonRequired', { defaultValue: 'Please provide a reason for rejection.' }))
      return
    }

    if (!window.confirm(t('confirmRejectLoan', {
      defaultValue: `Are you sure you want to reject this loan?\n\nMember: {{memberName}}\nAmount: {{amount}} RWF\nReason: {{reason}}\n\nThe member will be notified via email.`,
      memberName: loan.memberName,
      amount: loan.amount.toLocaleString(),
      reason
    }))) {
      return
    }

    setProcessingLoan(loanId)
    try {
      const { data } = await api.put(`/loans/${loanId}/reject`, { reason: reason.trim() })
      if (data?.success) {
        alert(t('loanRejected', { defaultValue: '❌ Loan rejected.\n\nThe member has been notified via email with the rejection reason.' }))
        // Reload loan requests to show updated status
        await loadLoanRequests()
      } else {
        alert(data?.message || t('failedToRejectLoan', { defaultValue: 'Failed to reject loan' }))
      }
    } catch (err) {
      console.error('[GroupAdminLoanRequests] Failed to reject loan:', err)
      alert(err.response?.data?.message || t('failedToRejectLoanTryAgain', { defaultValue: 'Failed to reject loan. Please try again.' }))
    } finally {
      setProcessingLoan(null)
    }
  }

  const [loanPaymentHistory, setLoanPaymentHistory] = useState([])
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false)

  const handleViewMemberDetails = async (loan) => {
    setSelectedLoan(loan)
    setShowMemberDetails(true)

    // Fetch full loan details including payment info
    try {
      setLoadingPaymentHistory(true)
      const { data: loanData } = await api.get(`/loans/${loan.id}`)

      if (loanData?.success) {
        // Update selected loan with full details
        const fullLoanData = {
          ...loan,
          paidAmount: Number(loanData.data.paidAmount || 0),
          remainingAmount: Number(loanData.data.remainingAmount || loanData.data.totalAmount || loanData.data.amount || 0),
          totalAmount: Number(loanData.data.totalAmount || loanData.data.amount || 0),
          disbursementDate: loanData.data.disbursementDate || loanData.data.approvalDate || null,
          nextPaymentDate: loanData.data.nextPaymentDate || null,
          approvalDate: loanData.data.approvalDate || null,
          durationMonths: Number(loanData.data.duration || 0)
        }
        setSelectedLoan(fullLoanData)

        // Fetch payment history from transactions
        try {
          const { data: transactionsData } = await api.get('/transactions', {
            params: {
              type: 'loan_payment',
              limit: 100
            }
          })

          if (transactionsData?.success) {
            // Filter transactions for this specific loan
            const loanPayments = (transactionsData.data || [])
              .filter(t => t.referenceId === String(loan.id) || t.referenceId === loan.id)
              .map(t => ({
                id: t.id,
                amount: Number(t.amount || 0),
                date: t.transactionDate || t.createdAt || new Date(),
                paymentMethod: t.paymentMethod || 'cash',
                description: t.description || 'Loan payment',
                status: t.status || 'completed'
              }))
              .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first

            setLoanPaymentHistory(loanPayments)
          }
        } catch (err) {
          console.error('Failed to load payment history:', err)
          setLoanPaymentHistory([])
        }
      }
    } catch (err) {
      console.error('Failed to load loan details:', err)
    } finally {
      setLoadingPaymentHistory(false)
    }
  }

  // Calculate period left for loan
  const calculatePeriodLeft = (disbursementDate, durationMonths) => {
    if (!disbursementDate || !durationMonths) return null

    const disbursed = new Date(disbursementDate)
    const endDate = new Date(disbursed)
    endDate.setMonth(endDate.getMonth() + durationMonths)

    const now = new Date()
    const diffTime = endDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)

    if (diffDays < 0) {
      return { overdue: true, days: Math.abs(diffDays), months: 0 }
    }

    return { overdue: false, days: diffDays, months: diffMonths }
  }

  // Export loan requests report
  const exportLoanRequestsReport = () => {
    try {
      const { doc, pageWidth, pageHeight } = createPDFDocument(
        'Loan Requests Report',
        'Group Loan Management'
      )

      // Get filtered loans for export
      const loansToExport = filteredLoans.length > 0 ? filteredLoans : loanRequests

      // Summary section
      const summaries = [
        { label: 'Total Requests', value: summary.total || loansToExport.length },
        { label: 'Pending', value: summary.pending || loansToExport.filter(l => l.status === 'pending').length },
        { label: 'Approved', value: summary.approved || loansToExport.filter(l => l.status === 'approved').length },
        { label: 'Rejected', value: summary.rejected || loansToExport.filter(l => l.status === 'rejected').length }
      ]

      let currentY = addSummarySection(doc, summaries, 55, pageWidth)
      currentY += 10

      // Loan requests table - ALWAYS show this
      if (loansToExport.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...[30, 64, 175])
        doc.text('Loan Requests Details', pageWidth / 2, currentY, { align: 'center' })
        currentY += 10

        const headers = ['Member Name', 'Loan Amount', 'Purpose', 'Status', 'Request Date', 'Duration']
        const rows = loansToExport.map(loan => [
          loan.memberName || 'N/A',
          formatCurrency(loan.amount),
          (loan.purpose || '').substring(0, 25) + (loan.purpose?.length > 25 ? '...' : ''),
          loan.status.toUpperCase(),
          formatDate(loan.requestDate),
          loan.duration
        ])

        currentY = addTable(doc, { headers, rows }, currentY, pageWidth, {
          columnWidths: [25, 18, 28, 12, 17, 12],
          fontSize: 9
        })
      } else {
        doc.setFontSize(12)
        doc.setTextColor(...[107, 114, 128])
        doc.text('No loan requests found.', pageWidth / 2, currentY, { align: 'center' })
        currentY += 10
      }

      // Add payment information for active loans
      const activeLoans = loansToExport.filter(l =>
        l.status === 'approved' || l.status === 'disbursed' || l.status === 'active'
      )

      if (activeLoans.length > 0) {
        currentY += 10

        // Check if new page needed
        if (currentY > pageHeight - 50) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...[30, 64, 175])
        doc.text('Payment Information', pageWidth / 2, currentY, { align: 'center' })
        currentY += 10

        const paymentHeaders = ['Member', 'Total Amount', 'Paid', 'Remaining', 'Progress']
        const paymentRows = activeLoans.map(loan => {
          const progress = loan.totalAmount
            ? `${Math.round((loan.paidAmount / loan.totalAmount) * 100)}%`
            : '0%'
          return [
            loan.memberName || 'N/A',
            formatCurrency(loan.totalAmount || loan.amount),
            formatCurrency(loan.paidAmount || 0),
            formatCurrency(loan.remainingAmount || loan.amount),
            progress
          ]
        })

        currentY = addTable(doc, { headers: paymentHeaders, rows: paymentRows }, currentY, pageWidth, {
          columnWidths: [30, 20, 20, 20, 10],
          fontSize: 9
        })
      }

      // Add footer to all pages
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, pageWidth, pageHeight, i, totalPages)
      }

      savePDF(doc, 'Loan_Requests_Report')
    } catch (error) {
      console.error('[GroupAdminLoanRequests] Error exporting PDF:', error)
      alert(tCommon('exportFailed', { defaultValue: 'Failed to export report. Please try again.' }))
    }
  }

  // Export overdue loans report
  const exportOverdueReport = () => {
    try {
      const { doc, pageWidth, pageHeight } = createPDFDocument(
        'Overdue Loans Report',
        'Payment Collection Management'
      )

      if (unpaidLoans.length === 0) {
        doc.setFontSize(12)
        doc.setTextColor(...[107, 114, 128])
        doc.text('No overdue loans found.', pageWidth / 2, 70, { align: 'center' })
      } else {
        // Summary
        const overdueCount = unpaidLoans.filter(l => l.daysOverdue > 0).length
        const totalOutstanding = unpaidLoans.reduce((sum, l) => sum + l.remainingAmount, 0)
        const avgOverdue = Math.round(
          unpaidLoans.reduce((sum, l) => sum + l.daysOverdue, 0) / unpaidLoans.length
        )

        const summaries = [
          { label: 'Total Active Loans', value: unpaidLoans.length },
          { label: 'Overdue Loans', value: overdueCount },
          { label: 'Total Outstanding', value: formatCurrency(totalOutstanding) },
          { label: 'Avg Days Overdue', value: avgOverdue }
        ]

        let currentY = addSummarySection(doc, summaries, 55, pageWidth)
        currentY += 10

        // Overdue loans table
        const headers = ['Member', 'Loan Amount', 'Remaining', 'Monthly Payment', 'Days Overdue', 'Due Date']
        const rows = unpaidLoans.map(loan => [
          loan.memberName || 'N/A',
          formatCurrency(loan.loanAmount),
          formatCurrency(loan.remainingAmount),
          formatCurrency(loan.monthlyPayment),
          `${loan.daysOverdue || 0} days`,
          formatDate(loan.dueDate)
        ])

        currentY = addTable(doc, { headers, rows }, currentY, pageWidth, {
          columnWidths: [25, 18, 18, 18, 15, 18],
          fontSize: 9
        })
      }

      // Add footer
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, pageWidth, pageHeight, i, totalPages)
      }

      savePDF(doc, 'Overdue_Loans_Report')
    } catch (error) {
      console.error('[GroupAdminLoanRequests] Error exporting overdue report:', error)
      alert('Failed to export overdue report. Please try again.')
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('loanRequests', { defaultValue: 'Loan Requests' })}</h1>
            <p className="text-gray-600 mt-1">Review and manage member loan applications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadLoanRequests}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <Search size={18} /> Refresh
                </>
              )}
            </button>
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={exportLoanRequestsReport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> Export Report
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loanRequests.length || 0}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loanRequests.filter(l => l.status === 'pending').length || 0}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {loanRequests.filter(l => l.status === 'approved').length || 0}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {loanRequests.filter(l => l.status === 'rejected').length || 0}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loan Requests List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('loanRequests', { defaultValue: 'Loan Requests' })} ({filteredLoans?.length || 0})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Fetching data…</div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-lg font-semibold mb-1">No loan requests found</p>
                <p className="text-sm">Loan requests from your group members will appear here.</p>
              </div>
            ) : filteredLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {loan.memberName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{loan.memberName}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <User size={14} />
                        {loan.phone} • ID: {loan.memberId}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 italic">"{loan.purpose}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(loan.status)}`}>
                      {getStatusIcon(loan.status)}
                      {loan.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAIRecommendationColor(loan.aiRecommendation)}`}>
                      🤖 AI: {loan.aiRecommendation.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Loan Amount</p>
                    <p className="font-bold text-lg text-gray-800">{loan.amount.toLocaleString()} RWF</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Duration</p>
                    <p className="font-bold text-lg text-gray-800">{loan.duration}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Monthly Payment</p>
                    <p className="font-bold text-lg text-gray-800">{loan.monthlyPayment.toLocaleString()} RWF</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-xs mb-1">Credit Score</p>
                    <p className="font-bold text-lg text-gray-800">{loan.creditScore}/100</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                  {loan.requestDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Requested: {new Date(loan.requestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                  {loan.guarantorName && (
                    <div className="flex items-center gap-2">
                      <User size={14} />
                      Guarantor: {loan.guarantorName} ({loan.guarantorPhone})
                    </div>
                  )}
                  {loan.interestRate > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} />
                      Interest Rate: {loan.interestRate}%
                    </div>
                  )}
                </div>

                {/* Payment Status for Active Loans */}
                {(loan.status === 'approved' || loan.status === 'disbursed' || loan.status === 'active') && loan.paidAmount > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Paid: </span>
                        <span className="font-semibold text-green-600">{loan.paidAmount.toLocaleString()} RWF</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining: </span>
                        <span className="font-semibold text-red-600">{loan.remainingAmount.toLocaleString()} RWF</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Progress: </span>
                        <span className="font-semibold text-blue-600">
                          {loan.totalAmount ? Math.round((loan.paidAmount / loan.totalAmount) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewMemberDetails(loan)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {loan.status === 'pending' && hasPermission(user, PERMISSIONS.MANAGE_LOANS) && (
                    <>
                      <button
                        onClick={() => handleApproveLoan(loan.id)}
                        disabled={processingLoan === loan.id}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingLoan === loan.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} /> Approve Loan
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectLoan(loan.id)}
                        disabled={processingLoan === loan.id}
                        className="btn-danger text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingLoan === loan.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle size={16} /> Reject Loan
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {loan.status === 'approved' && (
                    <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <CheckCircle size={16} /> Approved
                    </span>
                  )}
                  {loan.status === 'rejected' && (
                    <span className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <XCircle size={16} /> Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Details Modal */}
        {showMemberDetails && selectedLoan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Member Details</h2>
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Member Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {selectedLoan.memberName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedLoan.memberName}</h3>
                    <p className="text-gray-600">{selectedLoan.phone}</p>
                    <p className="text-sm text-gray-500">Member ID: {selectedLoan.memberId}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-green-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Total Savings</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.totalSavings.toLocaleString()} RWF
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-blue-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Credit Score</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.creditScore}/100
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <AlertCircle className={selectedLoan.hasActiveLoan ? "text-red-600" : "text-green-600"} size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Active Loans</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.hasActiveLoan ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {(selectedLoan.status === 'approved' || selectedLoan.status === 'disbursed' || selectedLoan.status === 'active') && (
                  <div className="card bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <DollarSign className="text-blue-600" size={20} />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Total Loan Amount</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.totalAmount?.toLocaleString() || selectedLoan.amount.toLocaleString()} RWF
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                        <p className="text-xl font-bold text-green-600">
                          {selectedLoan.paidAmount?.toLocaleString() || 0} RWF
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedLoan.totalAmount ? Math.round((selectedLoan.paidAmount / selectedLoan.totalAmount) * 100) : 0}% paid
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <p className="text-sm text-gray-600 mb-1">Remaining Amount</p>
                        <p className="text-xl font-bold text-red-600">
                          {selectedLoan.remainingAmount?.toLocaleString() || selectedLoan.amount.toLocaleString()} RWF
                        </p>
                      </div>
                    </div>

                    {/* Period Left */}
                    {selectedLoan.disbursementDate && selectedLoan.durationMonths && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        {(() => {
                          const periodLeft = calculatePeriodLeft(selectedLoan.disbursementDate, selectedLoan.durationMonths)
                          if (!periodLeft) return null

                          return (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Period Left</p>
                                {periodLeft.overdue ? (
                                  <p className="text-lg font-bold text-red-600">
                                    {periodLeft.months > 0 ? `${periodLeft.months} months, ` : ''}{periodLeft.days} days overdue
                                  </p>
                                ) : (
                                  <p className="text-lg font-bold text-blue-600">
                                    {periodLeft.months > 0 ? `${periodLeft.months} months, ` : ''}{periodLeft.days} days remaining
                                  </p>
                                )}
                              </div>
                              {selectedLoan.nextPaymentDate && (
                                <div className="text-right">
                                  <p className="text-sm text-gray-600 mb-1">Next Payment Due</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {new Date(selectedLoan.nextPaymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Loan Request Details */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-4">Loan Request Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Loan Amount</p>
                      <p className="font-bold text-lg text-gray-800">{selectedLoan.amount.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-bold text-lg text-gray-800">{selectedLoan.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly Payment</p>
                      <p className="font-bold text-lg text-gray-800">{selectedLoan.monthlyPayment.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Interest Rate</p>
                      <p className="font-bold text-lg text-gray-800">{selectedLoan.interestRate || 5}%</p>
                    </div>
                    {selectedLoan.disbursementDate && (
                      <div>
                        <p className="text-gray-600">Disbursement Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(selectedLoan.disbursementDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {selectedLoan.approvalDate && (
                      <div>
                        <p className="text-gray-600">Approval Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(selectedLoan.approvalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-gray-600 mb-1">Purpose</p>
                      <p className="text-gray-800 italic">"{selectedLoan.purpose}"</p>
                    </div>
                    {selectedLoan.guarantorName && (
                      <>
                        <div>
                          <p className="text-gray-600">Guarantor Name</p>
                          <p className="font-semibold text-gray-800">{selectedLoan.guarantorName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Guarantor Phone</p>
                          <p className="font-semibold text-gray-800">{selectedLoan.guarantorPhone}</p>
                        </div>
                      </>
                    )}
                    {selectedLoan.requestDate && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Request Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(selectedLoan.requestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                {(selectedLoan.status === 'approved' || selectedLoan.status === 'disbursed' || selectedLoan.status === 'active' || selectedLoan.status === 'completed') && (
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="text-blue-600" size={20} />
                      Payment History
                    </h3>
                    {loadingPaymentHistory ? (
                      <div className="text-center py-4 text-gray-500">Loading payment history...</div>
                    ) : loanPaymentHistory.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>No payments recorded yet.</p>
                        {selectedLoan.status !== 'completed' && (
                          <p className="text-sm mt-1">Payments will appear here once the member makes a payment.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {loanPaymentHistory.map((payment) => (
                          <div key={payment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {payment.amount.toLocaleString()} RWF
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 capitalize">
                                  Method: {payment.paymentMethod} • Status: {payment.status}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                  Paid
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total Payments:</span>
                            <span className="text-lg font-bold text-green-600">
                              {loanPaymentHistory.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} RWF
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Recommendation */}
                <div className={`card border-2 ${getAIRecommendationColor(selectedLoan.aiRecommendation)}`}>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    🤖 AI Recommendation
                  </h3>
                  <p className="text-sm mb-2">
                    Based on savings history, credit score, and contribution consistency:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAIRecommendationColor(selectedLoan.aiRecommendation)}`}>
                      {selectedLoan.aiRecommendation.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      Confidence: {selectedLoan.aiRecommendation === 'approve' ? 'High' : selectedLoan.aiRecommendation === 'reject' ? 'High' : 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Contribution History */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">Contribution History</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consistency:</span>
                      <span className={`font-semibold ${selectedLoan.contributionHistory === 'excellent' ? 'text-green-600' :
                          selectedLoan.contributionHistory === 'good' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                        {selectedLoan.contributionHistory}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">On-time payments:</span>
                      <span className="font-semibold text-green-600">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late payments:</span>
                      <span className="font-semibold text-red-600">2</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowMemberDetails(false)
                      setSelectedLoan(null)
                      setLoanPaymentHistory([])
                    }}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleViewMemberDetails(selectedLoan)}
                    className="btn-secondary flex items-center gap-2"
                    title="Refresh payment information"
                  >
                    <Search size={18} /> Refresh
                  </button>
                  {selectedLoan.status === 'pending' && (
                    <>
                      <button
                        onClick={async () => {
                          await handleApproveLoan(selectedLoan.id)
                          setShowMemberDetails(false)
                        }}
                        disabled={processingLoan === selectedLoan.id}
                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingLoan === selectedLoan.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          'Approve Loan'
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          await handleRejectLoan(selectedLoan.id)
                          setShowMemberDetails(false)
                        }}
                        disabled={processingLoan === selectedLoan.id}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingLoan === selectedLoan.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          'Reject Loan'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid Loans Section */}
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={24} />
                Unpaid Loans & Overdue Payments
              </h2>
              <p className="text-gray-600 mt-1">Track active loans and payment deadlines</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm flex items-center gap-2">
                <Download size={16} /> Export Report
              </button>
              <button className="btn-primary text-sm flex items-center gap-2">
                <Calendar size={16} /> Send Reminders
              </button>
            </div>
          </div>

          {/* Unpaid Loans Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Active Loans</p>
                  <p className="text-xl font-bold text-gray-800">{unpaidLoans.length}</p>
                </div>
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Loans</p>
                  <p className="text-xl font-bold text-red-600">
                    {unpaidLoans.filter(l => l.daysOverdue > 0).length}
                  </p>
                </div>
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Outstanding</p>
                  <p className="text-xl font-bold text-orange-600">
                    {unpaidLoans.reduce((sum, l) => sum + l.remainingAmount, 0).toLocaleString()} RWF
                  </p>
                </div>
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Days Overdue</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.round(unpaidLoans.reduce((sum, l) => sum + l.daysOverdue, 0) / unpaidLoans.length)}
                  </p>
                </div>
                <Clock className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Unpaid Loans List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Active Loan Details</h3>
            {unpaidLoans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No data available. Please add new records to get started.</div>
            ) : unpaidLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {loan.memberName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{loan.memberName}</h4>
                      <p className="text-sm text-gray-600">{loan.phone} • {loan.memberId}</p>
                      <p className="text-xs text-gray-500">Last Payment: {loan.lastPayment}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getOverdueColor(loan.daysOverdue)}`}>
                      {loan.daysOverdue === 0 ? 'Current' : `${loan.daysOverdue || 0} days overdue`}
                    </span>
                    {getOverdueIcon(loan.daysOverdue)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Loan Amount</p>
                    <p className="font-semibold">{loan.loanAmount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-semibold text-red-600">{loan.remainingAmount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Payment</p>
                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{loan.dueDate}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payments Made: </span>
                      <span className="font-semibold">{loan.totalPayments}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Paid: </span>
                      <span className="font-semibold text-green-600">{loan.totalPaid.toLocaleString()} RWF</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Progress: </span>
                      <span className="font-semibold">
                        {Math.round((loan.totalPaid / loan.loanAmount) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs px-3 py-1 flex items-center gap-1">
                      <Eye size={14} /> View Details
                    </button>
                    {loan.daysOverdue > 0 && (
                      <button className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg flex items-center gap-1 transition-colors">
                        <AlertTriangle size={14} /> Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={async () => {
                try {
                  const overdue = unpaidLoans.filter(l => l.daysOverdue > 0)
                  for (const loan of overdue) {
                    try {
                      await api.post('/notifications', {
                        userId: loan.memberId,
                        type: 'loan_reminder',
                        title: 'Loan Payment Reminder',
                        message: `Dear member, your loan payment of ${loan.monthlyPayment.toLocaleString()} RWF is overdue by ${loan.daysOverdue} days. Please make your payment as soon as possible.`
                      })
                    } catch (err) {
                      console.error(`Failed to send reminder to ${loan.memberId}:`, err)
                    }
                  }
                  alert(`Payment reminders sent to ${overdue.length} members!`)
                } catch (err) {
                  console.error('Failed to send reminders:', err)
                  alert('Failed to send reminders. Please try again.')
                }
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Calendar size={18} /> Send Payment Reminders
            </button>
            <button
              onClick={exportOverdueReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export Overdue Report
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
              <AlertTriangle size={18} /> Generate Collection Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminLoanRequests


