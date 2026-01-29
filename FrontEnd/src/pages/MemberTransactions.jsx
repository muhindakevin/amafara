import { useEffect, useState } from 'react'
import { Download, Filter, Search, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, FileText, TrendingUp, Printer } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { createPDFDocument, addTable, addFormattedTable, addSummarySection, addFooter, savePDF, formatCurrency, formatDate, formatDateTimeFull, exportToExcel } from '../utils/pdfExport'

function MemberTransactions() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' })
  const [searchTerm, setSearchTerm] = useState('')

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [memberBalance, setMemberBalance] = useState(0) // Actual balance (savings - loans)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        // Get current user first to verify userId
        const meRes = await api.get('/auth/me').catch(() => ({ data: { success: false } }))
        const userId = meRes.data?.success ? meRes.data.data.id : null

        if (!userId) {
          console.error('[MemberTransactions] User ID not found')
          if (mounted) setLoading(false)
          return
        }

        console.log(`[MemberTransactions] Loading transactions for userId: ${userId}`)

        // Fetch transactions and member data in parallel
        // Fetch with a high limit to get all transactions (or use pagination)
        const [transRes, dashRes] = await Promise.all([
          api.get('/transactions?limit=1000'), // Get all transactions for the user
          api.get('/members/dashboard').catch(() => ({ data: { success: false } }))
        ])

        if (mounted && transRes.data?.success) {
          const rawTransactions = transRes.data.data || []

          // STRICT verification: ALL transactions MUST belong to the current user
          const userTransactions = rawTransactions.filter(t => {
            const transactionUserId = t.userId || t.user?.id
            const matches = transactionUserId === userId
            if (!matches && transactionUserId) {
              console.error(`[MemberTransactions] SECURITY: Transaction ${t.id} belongs to userId ${transactionUserId}, not current user ${userId}. Filtering out.`)
            }
            return matches
          })

          console.log(`[MemberTransactions] userId: ${userId}, Total received: ${rawTransactions.length}, After userId filter: ${userTransactions.length}`)

          // If user has zero transactions, that's valid - they just haven't made any transactions yet
          if (userTransactions.length === 0) {
            console.log(`[MemberTransactions] User ${userId} has no transactions in database - this is valid if they have zero amount`)
          }

          // Calculate actual amounts: loan_disbursement is negative (money out), loan_payment is positive (reduces debt)
          const mapped = userTransactions.map(t => {
            const rawAmount = Number(t.amount || 0)
            let displayAmount = rawAmount

            // Loan disbursement = negative (money borrowed, debt increases)
            if (t.type === 'loan_disbursement') {
              displayAmount = -rawAmount
            }
            // Loan payment = positive (paying back, debt decreases)
            else if (t.type === 'loan_payment') {
              displayAmount = rawAmount // Already positive
            }
            // Contributions, interest = positive (money in)
            else if (['contribution', 'interest', 'refund'].includes(t.type)) {
              displayAmount = rawAmount
            }
            // Fines, fees = negative (money out)
            else if (['fine_payment', 'fee'].includes(t.type)) {
              displayAmount = -rawAmount
            }

            return {
              id: t.id,
              type: t.type,
              description: t.description || t.type,
              amount: displayAmount,
              rawAmount: rawAmount, // Keep original for calculations
              date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
              time: t.transactionDate ? new Date(t.transactionDate).toLocaleTimeString() : '',
              status: t.status,
              method: t.paymentMethod || t.method || 'System',
              reference: t.referenceId || t.reference || `TXN-${t.id}`
            }
          })
          setTransactions(mapped)
        }

        // Calculate actual member balance (savings - outstanding loans)
        if (mounted && dashRes.data?.success) {
          const stats = dashRes.data.data.stats || {}
          const totalSavings = Number(stats.totalSavings || 0)

          // Get outstanding loan balance
          const loansRes = await api.get('/loans/member').catch(() => ({ data: { success: false, data: [] } }))
          let outstandingLoans = 0
          if (loansRes.data?.success) {
            const activeLoans = (loansRes.data.data || []).filter(l =>
              ['approved', 'disbursed', 'active'].includes(l.status)
            )
            outstandingLoans = activeLoans.reduce((sum, loan) => {
              return sum + Number(loan.remainingAmount || loan.amount || 0)
            }, 0)
          }

          // Actual balance = savings - outstanding loans
          const actualBalance = totalSavings - outstandingLoans
          setMemberBalance(actualBalance)

          // Data consistency check: If user has zero savings and zero transactions, that's correct
          // If user has transactions but zero savings, log a warning (data might be inconsistent)
          if (userTransactions.length > 0 && totalSavings === 0) {
            console.warn(`[MemberTransactions] Data consistency check: User ${userId} has ${userTransactions.length} transactions but totalSavings is 0. This might indicate data inconsistency.`)
          }

          // If user has zero transactions, they should have zero savings (or only loan disbursements)
          if (userTransactions.length === 0 && totalSavings > 0) {
            console.warn(`[MemberTransactions] Data consistency check: User ${userId} has zero transactions but totalSavings is ${totalSavings}. This might indicate data inconsistency.`)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'contribution': return <DollarSign className="text-green-600" size={20} />
      case 'loan_payment': return <CheckCircle className="text-blue-600" size={20} />
      case 'loan_disbursement': return <FileText className="text-purple-600" size={20} />
      case 'interest': return <TrendingUp className="text-yellow-600" size={20} />
      case 'fine': return <AlertCircle className="text-red-600" size={20} />
      default: return <Clock className="text-gray-600" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    // Type filter
    const matchesType = filterType === 'all' || transaction.type === filterType

    // Search filter
    const matchesSearch = !searchTerm || (
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Date range filter
    let matchesDate = true
    if (filterDate !== 'all') {
      const transactionDate = new Date(transaction.date)
      transactionDate.setHours(0, 0, 0, 0)

      if (filterDate === 'custom') {
        // Custom date range
        if (customDateRange.startDate) {
          const startDate = new Date(customDateRange.startDate)
          startDate.setHours(0, 0, 0, 0)
          if (transactionDate < startDate) {
            matchesDate = false
          }
        }
        if (customDateRange.endDate) {
          const endDate = new Date(customDateRange.endDate)
          endDate.setHours(23, 59, 59, 999)
          if (transactionDate > endDate) {
            matchesDate = false
          }
        }
      } else {
        // Predefined ranges
        const dateRange = getDateRange(filterDate)
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(dateRange.end)
          endDate.setHours(23, 59, 59, 999)

          if (transactionDate < startDate || transactionDate > endDate) {
            matchesDate = false
          }
        }
      }
    }

    return matchesType && matchesSearch && matchesDate
  })

  // Calculate net amount from transactions (for display) - only from REAL transactions
  const netAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  // Total Amount should be ONLY contributions (savings) - loans don't affect savings
  // Calculate from contributions only, not including loan transactions
  const totalSavingsFromContributions = transactions
    .filter(t => t.type === 'contribution')
    .reduce((sum, t) => sum + Math.max(0, t.amount), 0)

  // Per user request: Total Savings card must show REAL TOTAL SAVINGS (equal to total contributions)
  // We do NOT subtract outstanding loans here anymore.
  const totalAmount = totalSavingsFromContributions

  const generateReport = async (format = 'pdf') => {
    try {
      // Get user info for the report
      const meRes = await api.get('/auth/me').catch(() => ({ data: { success: false } }))
      if (!meRes.data?.success) {
        alert(tCommon('failedToGetUserInfo', { defaultValue: 'Failed to get user information. Please try again.' }))
        return
      }

      const userId = meRes.data.data.id
      const userName = meRes.data.data.name || 'Member'
      const userPhone = meRes.data.data.phone || 'N/A'
      const userEmail = meRes.data.data.email || 'N/A'

      // Use filtered transactions for export (respects all filters)
      const transactionsToExport = filteredTransactions

      // Get date range for report header
      let dateRange = { start: null, end: null }
      if (filterDate !== 'all') {
        if (filterDate === 'custom') {
          dateRange = {
            start: customDateRange.startDate || null,
            end: customDateRange.endDate || null
          }
        } else {
          dateRange = getDateRange(filterDate)
        }
      }

      // Process transactions for export
      const reportData = transactionsToExport.map(trans => {
        const transDate = trans.date ? new Date(trans.date) : new Date()
        return {
          transactionId: trans.id,
          transactionDate: transDate,
          date: trans.date,
          transactionType: formatTransactionType(trans.type),
          type: trans.type,
          amount: trans.amount,
          paymentMethod: trans.method || 'System',
          status: trans.status,
          description: trans.description || 'N/A',
          reference: trans.reference
        }
      })

      // Calculate summary from filtered transactions
      const reportSummary = {
        totalTransactions: transactionsToExport.length,
        totalAmount: transactionsToExport.reduce((sum, t) => sum + t.amount, 0),
        byType: {},
        byStatus: {
          completed: transactionsToExport.filter(t => t.status === 'completed').length,
          pending: transactionsToExport.filter(t => t.status === 'pending').length,
          failed: transactionsToExport.filter(t => t.status === 'failed').length
        },
        byPaymentMethod: {}
      }

      // Calculate by type
      transactionsToExport.forEach(t => {
        if (!reportSummary.byType[t.type]) {
          reportSummary.byType[t.type] = { count: 0, totalAmount: 0 }
        }
        reportSummary.byType[t.type].count++
        reportSummary.byType[t.type].totalAmount += t.amount
      })

      // Calculate by payment method
      transactionsToExport.forEach(t => {
        const method = t.method || 'System'
        if (!reportSummary.byPaymentMethod[method]) {
          reportSummary.byPaymentMethod[method] = { count: 0, totalAmount: 0 }
        }
        reportSummary.byPaymentMethod[method].count++
        reportSummary.byPaymentMethod[method].totalAmount += t.amount
      })

      // reportData and reportSummary are already calculated from filteredTransactions above
      // No need to fetch from API - we use the filteredTransactions directly

      if (format === 'excel') {
        // Export to Excel - Full table with all columns including Date & Time
        const headers = [t('transactionId', { defaultValue: 'Transaction ID' }), t('dateAndTime', { defaultValue: 'Date & Time' }), t('transactionType', { defaultValue: 'Transaction Type' }), t('amount', { defaultValue: 'Amount' }), t('paymentMethod', { defaultValue: 'Payment Method' }), t('status', { defaultValue: 'Status' }), t('descriptionNotes', { defaultValue: 'Description / Notes' })]
        // If no transactions, create a row with zero/empty values
        const rows = reportData.length === 0
          ? [['No transactions', 'N/A', 'N/A', 0, 'N/A', 'N/A', 'You have not made any transactions yet.']]
          : reportData.map(t => {
            // Format date and time for Excel
            let dateTimeStr = 'N/A'
            if (t.date) {
              const transDate = t.transactionDate ? new Date(t.transactionDate) : new Date(t.date)
              if (!isNaN(transDate.getTime())) {
                const dateStr = transDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })
                const timeStr = transDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })
                dateTimeStr = `${dateStr} ${timeStr}`
              } else {
                dateTimeStr = t.date
              }
            }

            return [
              t.transactionId,
              dateTimeStr,
              t.transactionType || 'N/A',
              t.amount,
              t.paymentMethod || 'N/A',
              t.status.toUpperCase(),
              t.description || 'N/A' // Full description
            ]
          })

        exportToExcel(rows, headers, `Transaction_History_${userName.replace(/\s+/g, '_')}`, {
          title: `Transaction History - ${userName}`,
          groupName: null,
          dateRange,
          summary: {
            ...reportSummary,
            memberInfo: {
              name: userName,
              phone: userPhone,
              email: userEmail,
              userId: userId
            }
          }
        })
      } else {
        // Export to PDF
        const { doc, pageWidth, pageHeight } = createPDFDocument(
          `Transaction History - ${userName}`,
          t('personalTransactionReport', { defaultValue: 'Personal Transaction Report' })
        )

        // User information section
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...[30, 64, 175])
        let infoY = 60
        doc.text(t('memberInformation', { defaultValue: 'Member Information' }), 15, infoY)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...[31, 41, 55])
        infoY += 7
        doc.text(`Name: ${userName}`, 15, infoY)
        infoY += 7
        doc.text(`Phone: ${userPhone}`, 15, infoY)
        infoY += 7
        doc.text(`Email: ${userEmail}`, 15, infoY)
        infoY += 7
        doc.text(`User ID: ${userId}`, 15, infoY)
        infoY += 7
        // Add filter information
        if (filterDate !== 'all') {
          const dateRangeText = filterDate === 'custom'
            ? `${customDateRange.startDate || 'N/A'} to ${customDateRange.endDate || 'N/A'}`
            : filterDate === 'today' ? 'Today'
              : filterDate === 'week' ? 'Last 7 Days'
                : filterDate === 'month' ? 'Last Month'
                  : filterDate
          doc.text(`Date Range: ${dateRangeText}`, 15, infoY)
          infoY += 7
        }
        if (filterType !== 'all') {
          doc.text(`Transaction Type: ${formatTransactionType(filterType)}`, 15, infoY)
          infoY += 7
        }
        doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 15, infoY)
        infoY += 15

        // Summary section
        const summaries = [
          { label: t('totalTransactions', { defaultValue: 'Total Transactions' }), value: reportSummary.totalTransactions || 0 },
          { label: t('totalAmount', { defaultValue: 'Total Amount' }), value: formatCurrency(reportSummary.totalAmount || 0) },
          { label: t('completed', { defaultValue: 'Completed' }), value: reportSummary.byStatus?.completed || 0 },
          { label: t('pending', { defaultValue: 'Pending' }), value: reportSummary.byStatus?.pending || 0 }
        ]

        let currentY = addSummarySection(doc, summaries, infoY, pageWidth)
        currentY += 15

        // Transaction History Table
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...[30, 64, 175])
        doc.text('Transaction History', 15, currentY)
        currentY += 10

        // Full transaction table with all required columns including Date & Time
        const headers = [t('transactionId', { defaultValue: 'Transaction ID' }), t('dateAndTime', { defaultValue: 'Date & Time' }), t('transactionType', { defaultValue: 'Transaction Type' }), t('amount', { defaultValue: 'Amount' }), t('paymentMethod', { defaultValue: 'Payment Method' }), t('status', { defaultValue: 'Status' }), t('descriptionNotes', { defaultValue: 'Description / Notes' })]
        // If no transactions, create a row with zero/empty values
        const tableRows = reportData.length === 0
          ? [['No transactions', 'N/A', 'N/A', '0.00 RWF', 'N/A', 'N/A', 'You have not made any transactions yet.']]
          : reportData.map(trans => {
            // Format date and time properly
            let dateTimeStr = 'N/A'
            if (trans.date) {
              const transDate = trans.transactionDate ? new Date(trans.transactionDate) : new Date(trans.date)
              if (!isNaN(transDate.getTime())) {
                const dateStr = transDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })
                const timeStr = transDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })
                dateTimeStr = `${dateStr} ${timeStr}`
              } else {
                dateTimeStr = trans.date
              }
            }

            return [
              trans.transactionId.toString(),
              dateTimeStr,
              trans.transactionType || 'N/A',
              formatCurrency(trans.amount),
              trans.paymentMethod || 'N/A',
              trans.status.toUpperCase(),
              trans.description || 'N/A' // Full description, auto-wraps
            ]
          })

        // Always show the table, even with zero transactions
        // Use formatted table with borders and grid lines (Google Forms style)
        currentY = addFormattedTable(doc, { headers, rows: tableRows }, currentY, pageWidth, {
          columnWidths: [10, 18, 18, 12, 15, 10, 17], // Adjusted for Date & Time column
          fontSize: 8,
          cellPadding: 3
        })

        // Add summary breakdown
        currentY += 10
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...[30, 64, 175])
        doc.text('Transaction Summary', 15, currentY)
        currentY += 8

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...[31, 41, 55])

        if (reportSummary.byType) {
          Object.keys(reportSummary.byType).forEach(type => {
            const typeInfo = reportSummary.byType[type]
            const typeName = formatTransactionType(type)
            doc.text(`${typeName}: ${typeInfo.count} transactions, ${formatCurrency(typeInfo.totalAmount)}`, 15, currentY)
            currentY += 6
          })
        }

        // Add footer to all pages
        const totalPages = doc.internal.pages.length - 1
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i)
          addFooter(doc, pageWidth, pageHeight, i, totalPages)
        }

        savePDF(doc, `Transaction_History_${userName.replace(/\s+/g, '_')}`)
      }
    } catch (error) {
      console.error('[MemberTransactions] Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    }
  }

  const formatTransactionType = (type) => {
    const typeMap = {
      'contribution': 'Contribution',
      'loan_payment': 'Loan Payment',
      'loan_disbursement': 'Loan Request',
      'fine_payment': 'Fine Payment',
      'interest': 'Interest',
      'refund': 'Refund',
      'fee': 'Fee'
    }
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDateRange = (range) => {
    const today = new Date()
    const start = new Date()
    const end = new Date(today)

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        start.setDate(today.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'month':
        start.setMonth(today.getMonth() - 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'year':
        start.setFullYear(today.getFullYear() - 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'custom':
        // Use custom date range
        return {
          start: customDateRange.startDate || null,
          end: customDateRange.endDate || null
        }
      default:
        return { start: null, end: null }
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const handleExport = () => {
    generateReport('pdf')
  }

  const handleExportExcel = () => {
    generateReport('excel')
  }

  const handlePrint = () => {
    // Create a print-friendly version with filtered transactions
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction History - Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .positive { color: green; }
            .negative { color: red; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Transaction History</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          ${filterDate !== 'all' ? `<p><strong>Date Range:</strong> ${filterDate === 'custom' ? `${customDateRange.startDate || 'N/A'} to ${customDateRange.endDate || 'N/A'}` : filterDate}</p>` : ''}
          ${filterType !== 'all' ? `<p><strong>Type:</strong> ${formatTransactionType(filterType)}</p>` : ''}
          <p><strong>Total Transactions:</strong> ${filteredTransactions.length}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.length === 0
        ? '<tr><td colspan="6" style="text-align: center;">No transactions found</td></tr>'
        : filteredTransactions.map(t => `
                  <tr>
                    <td>${t.date} ${t.time}</td>
                    <td>${formatTransactionType(t.type)}</td>
                    <td>${t.description}</td>
                    <td class="${t.amount >= 0 ? 'positive' : 'negative'}">${t.amount >= 0 ? '+' : ''}${t.amount.toLocaleString()} RWF</td>
                    <td>${t.status}</td>
                    <td>${t.reference}</td>
                  </tr>
                `).join('')
      }
            </tbody>
          </table>
        </body>
      </html>
    `
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('transactionHistory', { defaultValue: 'Transaction History' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('viewManageAllTransactions', { defaultValue: 'View and manage all your transactions' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} /> {t('exportPDF')}
            </button>
            <button
              onClick={handleExportExcel}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> {t('exportExcel')}
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2"
            >
              <Printer size={18} /> {t('print')}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredTransactions.length}
                </p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Savings</p>
                <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalAmount >= 0 ? '+' : ''}{totalAmount.toLocaleString()} RWF
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transactions.length === 0
                    ? 'No transactions yet'
                    : 'From contributions only (loans separate)'}
                </p>
              </div>
              <DollarSign className={totalAmount >= 0 ? 'text-green-600' : 'text-red-600'} size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">This Month</p>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions.length}
                </p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Last Transaction</p>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions[0]?.date || 'N/A'}
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
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
                  placeholder="Search by description or reference..."
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
                <option value="loan_disbursement">Loan Disbursements</option>
                <option value="fine_payment">Fine Payments</option>
                <option value="interest">Interest</option>
                <option value="refund">Refunds</option>
                <option value="fee">Fees</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  if (e.target.value !== 'custom') {
                    setCustomDateRange({ startDate: '', endDate: '' })
                  }
                }}
                className="input-field"
              >
                <option value="all">{t('allTime', { defaultValue: 'All Time' })}</option>
                <option value="today">{t('today', { defaultValue: 'Today' })}</option>
                <option value="week">{t('thisWeek', { defaultValue: 'This Week' })}</option>
                <option value="month">{t('thisMonth', { defaultValue: 'This Month' })}</option>
                <option value="custom">{t('custom', { defaultValue: 'Custom Range' })}</option>
              </select>
            </div>

            {/* Custom Date Range Picker */}
            {filterDate === 'custom' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('startDate', { defaultValue: 'Start Date' })}
                  </label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                    className="input-field"
                    max={customDateRange.endDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('endDate', { defaultValue: 'End Date' })}
                  </label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                    className="input-field"
                    min={customDateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Transactions ({filteredTransactions.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="dark:text-gray-400">{t('loadingTransactions', { defaultValue: 'Loading transactions...' })}</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.date} at {transaction.time} • {transaction.method}
                      </p>
                      <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} RWF
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto mb-4 text-gray-300" size={64} />
                <p className="text-lg font-semibold mb-2 dark:text-gray-300">{t('noTransactionsYet', { defaultValue: 'No Transactions Yet' })}</p>
                <p className="text-sm dark:text-gray-400">{t('noTransactionsMessage', { defaultValue: "You haven't made any transactions yet." })}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('transactionsWillAppear', { defaultValue: 'Transactions will appear here when you make contributions, loan payments, or other financial activities.' })}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="mx-auto mb-4" size={48} />
                <p>{t('noTransactionsMatchFilters', { defaultValue: 'No transactions match your filters' })}</p>
                <p className="text-sm">{t('tryAdjustingFilters', { defaultValue: 'Try adjusting your search or filter criteria' })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Summary - Only show if user has transactions */}
        {transactions.length > 0 && (
          <div className="card bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">{t('transactionSummary', { defaultValue: 'Transaction Summary' })}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t('totalContributions')}</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  +{transactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + Math.max(0, t.amount), 0).toLocaleString()} RWF
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t('totalLoanPayments', { defaultValue: 'Total Loan Payments' })}</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  +{transactions.filter(t => t.type === 'loan_payment').reduce((sum, t) => sum + Math.max(0, t.amount), 0).toLocaleString()} RWF
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">{t('loanDisbursements', { defaultValue: 'Loan Disbursements' })}</p>
                <p className="font-semibold text-red-600">
                  -{transactions.filter(t => t.type === 'loan_disbursement').reduce((sum, t) => sum + Math.abs(t.amount), 0).toLocaleString()} RWF
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Interest Earned</p>
                <p className="font-semibold text-yellow-600">
                  +{transactions.filter(t => t.type === 'interest').reduce((sum, t) => sum + Math.max(0, t.amount), 0).toLocaleString()} RWF
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MemberTransactions


