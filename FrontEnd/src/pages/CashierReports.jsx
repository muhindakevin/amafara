import { useState, useEffect } from 'react'
import { BarChart3, Download, TrendingUp, DollarSign, Users, Calendar, FileText, Filter, Search, Eye, Printer, AlertTriangle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { formatCurrency, formatDate, formatDateTimeFull, exportToExcel, exportToCSV } from '../utils/pdfExport'

function CashierReports() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tCashier } = useTranslation('cashier')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [dateRange, setDateRange] = useState('today')
  const [selectedMember, setSelectedMember] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [reportData, setReportData] = useState({
    daily: {
      title: tCashier('dailyFinancialSummary', { defaultValue: 'Daily Financial Summary' }),
      date: new Date().toISOString().split('T')[0],
      data: {
        totalContributions: 0,
        totalLoanPayments: 0,
        totalFines: 0,
        newLoans: 0,
        activeMembers: 0,
        transactions: 0
      }
    }
  })
  const [memberPerformance, setMemberPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupMembers, setGroupMembers] = useState([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [transactionReportLoading, setTransactionReportLoading] = useState(false)
  const [groupInfo, setGroupInfo] = useState(null)
  const [allTransactions, setAllTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])

  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let startDate, endDate

    switch (dateRange) {
      case 'today':
        startDate = new Date(today)
        endDate = new Date(today)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 1)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisWeek':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay())
        endDate = new Date(today)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'lastWeek':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay() - 7)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(customEndDate)
          endDate.setHours(23, 59, 59, 999)
        } else {
          startDate = new Date(today)
          endDate = new Date(today)
          endDate.setHours(23, 59, 59, 999)
        }
        break
      default:
        startDate = new Date(today)
        endDate = new Date(today)
        endDate.setHours(23, 59, 59, 999)
    }

    return { startDate, endDate }
  }

  useEffect(() => {
    let mounted = true
    async function loadReportData() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        // Calculate date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let startDate, endDate

        switch (dateRange) {
          case 'today':
            startDate = new Date(today)
            endDate = new Date(today)
            endDate.setHours(23, 59, 59, 999)
            break
          case 'yesterday':
            startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 1)
            endDate = new Date(startDate)
            endDate.setHours(23, 59, 59, 999)
            break
          case 'thisWeek':
            startDate = new Date(today)
            startDate.setDate(today.getDate() - today.getDay())
            endDate = new Date(today)
            endDate.setHours(23, 59, 59, 999)
            break
          case 'lastWeek':
            startDate = new Date(today)
            startDate.setDate(today.getDate() - today.getDay() - 7)
            endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + 6)
            endDate.setHours(23, 59, 59, 999)
            break
          case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1)
            endDate = new Date(today)
            endDate.setHours(23, 59, 59, 999)
            break
          case 'lastMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            endDate = new Date(today.getFullYear(), today.getMonth(), 0)
            endDate.setHours(23, 59, 59, 999)
            break
          case 'custom':
            if (customStartDate && customEndDate) {
              startDate = new Date(customStartDate)
              startDate.setHours(0, 0, 0, 0)
              endDate = new Date(customEndDate)
              endDate.setHours(23, 59, 59, 999)
            } else {
              // Default to today if custom dates not set
              startDate = new Date(today)
              endDate = new Date(today)
              endDate.setHours(23, 59, 59, 999)
            }
            break
          default:
            startDate = new Date(today)
            endDate = new Date(today)
            endDate.setHours(23, 59, 59, 999)
        }

        // Date range is now only controlled by dateRange selector, not reportType

        // Fetch all data in parallel with date range filters
        const [contributionsRes, loansRes, finesRes, transactionsRes, membersRes] = await Promise.all([
          api.get('/contributions', { params: { groupId, status: 'all' } }).catch(() => ({ data: { success: false, data: [] } })),
          api.get('/loans/requests', { params: { status: 'all', groupId } }).catch(() => ({ data: { success: false, data: [] } })),
          api.get('/fines', { params: { status: 'all', groupId } }).catch(() => ({ data: { success: false, data: [] } })),
          api.get('/transactions/report', { 
            params: { 
              groupId, 
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            } 
          }).catch(() => ({ data: { success: false, data: [], summary: {} } })),
          api.get(`/groups/${groupId}/members`).catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (!mounted) return

        // Filter data by date range and groupId
        const filterByDate = (item) => {
          const itemDate = new Date(item.createdAt || item.issuedDate || item.requestDate || item.transactionDate || item.approvalDate)
          return itemDate >= startDate && itemDate <= endDate
        }

        // Filter contributions by groupId and date range
        const allContributions = Array.isArray(contributionsRes.data?.data) 
          ? contributionsRes.data.data.filter(c => {
              const matchesGroup = (c.groupId === groupId || c.groupId === parseInt(groupId))
              const matchesDate = filterByDate(c)
              return matchesGroup && matchesDate
            })
          : []
        
        // Filter loans by groupId and date range
        const allLoans = Array.isArray(loansRes.data?.data) 
          ? loansRes.data.data.filter(l => {
              const matchesGroup = (l.groupId === groupId || l.groupId === parseInt(groupId))
              const matchesDate = filterByDate(l)
              return matchesGroup && matchesDate
            })
          : []

        // Filter fines by groupId and date range (use issuedDate or createdAt)
        const allFines = Array.isArray(finesRes.data?.data) 
          ? finesRes.data.data.filter(f => {
              const matchesGroup = (f.groupId === groupId || f.groupId === parseInt(groupId))
              const matchesDate = filterByDate(f)
              return matchesGroup && matchesDate
            })
          : []

        // Transactions are already filtered by date range from the API, but double-check on frontend
        const transactions = Array.isArray(transactionsRes.data?.data) 
          ? transactionsRes.data.data.filter(t => {
              // Additional frontend filtering to ensure accuracy
              const transDate = t.transactionDate ? new Date(t.transactionDate) : (t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : null))
              if (!transDate || isNaN(transDate.getTime())) return false
              return transDate >= startDate && transDate <= endDate
            })
          : []

        // Get all members in the group (for total count)
        const allMembers = Array.isArray(membersRes.data?.data) 
          ? membersRes.data.data.filter(m => (m.groupId === groupId || m.groupId === parseInt(groupId)))
          : []
        
        // Filter active members by groupId (for filtering member performance)
        const activeMembers = allMembers.filter(m => m.status === 'active' && (m.groupId === groupId || m.groupId === parseInt(groupId)))

        // Calculate member performance first
        const memberStats = {}
        
        // Contributions by member (only for date range)
        allContributions.forEach(c => {
          const memberId = c.memberId || c.member?.id
          if (!memberStats[memberId]) {
            memberStats[memberId] = {
              memberId,
              memberName: c.member?.name || 'Unknown',
              contributions: 0,
              loanPayments: 0,
              fines: 0
            }
          }
          if (c.status === 'approved' || c.status === 'completed') {
            memberStats[memberId].contributions += Number(c.amount || 0)
          }
        })

        // Loan payments by member (only for date range - already filtered by transactions endpoint)
        transactions.filter(t => t.rawType === 'loan_payment').forEach(t => {
          const memberId = t.memberId || t.userId
          if (!memberStats[memberId]) {
            memberStats[memberId] = {
              memberId,
              memberName: t.memberName || 'Unknown',
              contributions: 0,
              loanPayments: 0,
              fines: 0
            }
          }
          memberStats[memberId].loanPayments += Math.abs(Number(t.amount || 0))
        })

        // Fines by member (only for date range)
        allFines.forEach(f => {
          const memberId = f.memberId || f.member?.id
          if (!memberStats[memberId]) {
            memberStats[memberId] = {
              memberId,
              memberName: f.member?.name || 'Unknown',
              contributions: 0,
              loanPayments: 0,
              fines: 0
            }
          }
          if (f.status === 'paid' || f.status === 'approved') {
            memberStats[memberId].fines += Number(f.amount || 0)
          }
        })

        // Calculate summary (only for date range)
        const totalContributions = allContributions
          .filter(c => c.status === 'approved' || c.status === 'completed')
          .reduce((sum, c) => sum + Number(c.amount || 0), 0)

        const totalLoanPayments = transactions
          .filter(t => t.rawType === 'loan_payment')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

        const totalFines = allFines
          .filter(f => f.status === 'paid' || f.status === 'approved')
          .reduce((sum, f) => sum + Number(f.amount || 0), 0)

        const newLoans = allLoans.filter(l => 
          (l.status === 'approved' || l.status === 'disbursed') && 
          filterByDate(l)
        ).length

        // Apply member filter
        let filteredMemberStats = memberStats
        if (selectedMember === 'topContributors') {
          // Show only top contributors (top 50% by contributions)
          const sortedByContributions = Object.values(memberStats)
            .sort((a, b) => b.contributions - a.contributions)
          const threshold = sortedByContributions.length > 0 
            ? sortedByContributions[Math.floor(sortedByContributions.length / 2)].contributions
            : 0
          filteredMemberStats = Object.fromEntries(
            Object.entries(memberStats).filter(([_, stats]) => stats.contributions >= threshold)
          )
        } else if (selectedMember === 'defaulters') {
          // Show members with fines or overdue payments
          filteredMemberStats = Object.fromEntries(
            Object.entries(memberStats).filter(([_, stats]) => stats.fines > 0)
          )
        } else if (selectedMember === 'active') {
          // Show only active members
          const activeMemberIds = new Set(activeMembers.map(m => m.id))
          filteredMemberStats = Object.fromEntries(
            Object.entries(memberStats).filter(([id, _]) => activeMemberIds.has(parseInt(id)))
          )
        }

        // Sort by total performance (contributions + loan payments - fines)
        const performanceList = Object.values(filteredMemberStats)
          .map((m, index) => ({
            ...m,
            rank: index + 1,
            total: m.contributions + m.loanPayments - m.fines
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
          .map((m, index) => ({ ...m, rank: index + 1 }))

        // Format date for display
        let dateDisplay = ''
        if (dateRange === 'today') {
          dateDisplay = today.toISOString().split('T')[0]
        } else if (dateRange === 'yesterday') {
          dateDisplay = new Date(today.getTime() - 86400000).toISOString().split('T')[0]
        } else if (dateRange === 'thisWeek' || dateRange === 'lastWeek') {
          dateDisplay = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        } else if (dateRange === 'thisMonth' || dateRange === 'lastMonth') {
          dateDisplay = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        } else if (dateRange === 'custom' && customStartDate && customEndDate) {
          dateDisplay = `${customStartDate} to ${customEndDate}`
        }

        // Calculate total amount from all transactions (real amount)
        const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

        const currentReportData = {
          title: tCashier('dailyFinancialSummary', { defaultValue: 'Daily Financial Summary' }),
          date: dateDisplay,
          data: {
            totalContributions,
            totalLoanPayments,
            totalFines,
            newLoans,
            activeMembers: allMembers.length, // Show total members in the group
            transactions: transactions.length,
            totalAmount: totalAmount // Real total amount from transactions
          }
        }

        // Apply member filter to transactions
        let filteredTrans = transactions
        if (selectedMember !== 'all' && memberStats) {
          let memberIds = []
          if (selectedMember === 'topContributors') {
            const topContributorIds = performanceList.slice(0, Math.ceil(performanceList.length / 2)).map(m => m.memberId)
            memberIds = topContributorIds
          } else if (selectedMember === 'defaulters') {
            const defaulterIds = performanceList.filter(m => m.fines > 0).map(m => m.memberId)
            memberIds = defaulterIds
          } else if (selectedMember === 'active') {
            const activeMemberIds = activeMembers.map(m => m.id)
            memberIds = activeMemberIds
          }
          
          if (memberIds.length > 0) {
            filteredTrans = transactions.filter(t => {
              const userId = t.userId || t.user?.id || t.memberId
              return memberIds.includes(userId)
            })
          }
        }

        if (mounted) {
          setReportData({ daily: currentReportData })
          setMemberPerformance(performanceList)
          setGroupMembers(activeMembers)
          setAllTransactions(transactions)
          setFilteredTransactions(filteredTrans)
        }
      } catch (error) {
        console.error('[CashierReports] Error loading report data:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadReportData()
    return () => { mounted = false }
  }, [dateRange, selectedMember, customStartDate, customEndDate])

  const currentReport = reportData.daily || {
    title: tCashier('dailyFinancialSummary', { defaultValue: 'Daily Financial Summary' }),
    date: new Date().toISOString().split('T')[0],
    data: {
      totalContributions: 0,
      totalLoanPayments: 0,
      totalFines: 0,
      newLoans: 0,
      activeMembers: 0,
      transactions: 0,
      totalAmount: 0
    }
  }

  useEffect(() => {
    let mounted = true
    async function loadGroupInfo() {
      try {
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (groupId && mounted) {
          const groupRes = await api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } }))
          if (groupRes.data?.success && mounted) {
            setGroupInfo(groupRes.data.data)
          }
        }
      } catch (error) {
        console.error('[CashierReports] Error loading group info:', error)
      }
    }
    loadGroupInfo()
    return () => { mounted = false }
  }, [])

  // PDF exports removed - use exportFromPreview() instead which uses previewData
  // This function has been completely removed and replaced with exportFromPreview()

  const handleExportExcel = () => {
    handleDownload('excel')
  }

  const handleExportCSV = () => {
    handleDownload('csv')
  }

  const handlePrintReport = () => {
    // Create a printable version of the report
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert(t('popupBlocked', { defaultValue: 'Please allow popups to print the report' }))
      return
    }

    const { startDate, endDate } = getDateRange()
    const dateRangeStr = dateRange === 'today' 
      ? new Date().toISOString().split('T')[0]
      : `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${groupInfo?.name || 'Group'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1e40af; color: white; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Financial Report - ${groupInfo?.name || 'Group'}</h1>
          <p><strong>Date Range:</strong> ${dateRangeStr}</p>
          
          <div class="summary">
            <div class="summary-card">
              <h3>Contributions</h3>
              <p>${currentReport.data.totalContributions.toLocaleString()} RWF</p>
            </div>
            <div class="summary-card">
              <h3>Loan Payments</h3>
              <p>${currentReport.data.totalLoanPayments.toLocaleString()} RWF</p>
            </div>
            <div class="summary-card">
              <h3>Fines</h3>
              <p>${currentReport.data.totalFines.toLocaleString()} RWF</p>
            </div>
            <div class="summary-card">
              <h3>New Loans</h3>
              <p>${currentReport.data.newLoans}</p>
            </div>
            <div class="summary-card">
              <h3>Active Members</h3>
              <p>${currentReport.data.activeMembers}</p>
            </div>
            <div class="summary-card">
              <h3>Transactions</h3>
              <p>${currentReport.data.transactions}</p>
            </div>
          </div>

          <h2>Top Performing Members</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Member Name</th>
                <th>Contributions</th>
                <th>Loan Payments</th>
                <th>Fines</th>
              </tr>
            </thead>
            <tbody>
              ${memberPerformance.map(m => `
                <tr>
                  <td>${m.rank}</td>
                  <td>${m.memberName || m.member}</td>
                  <td>${m.contributions.toLocaleString()} RWF</td>
                  <td>${m.loanPayments.toLocaleString()} RWF</td>
                  <td>${m.fines.toLocaleString()} RWF</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleString()} | IKIMINA WALLET
          </p>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const handlePreview = async () => {
    // Preview should show modal with filteredTransactions (same data shown in Financial Reports table)
    try {
      if (filteredTransactions.length === 0) {
        alert(t('noTransactionsToPreview', { defaultValue: 'No transactions to preview. Please adjust your filters.' }))
        return
      }

      setTransactionReportLoading(true)

      const { startDate, endDate } = getDateRange()

      // Use filteredTransactions directly (already filtered by date range and member filter)
      const transactions = filteredTransactions

      // Calculate summary based on filtered transactions
      const summary = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0),
        byType: {},
        byStatus: {},
        byPaymentMethod: {}
      }

      transactions.forEach(t => {
        const type = t.rawType || t.type || t.transactionType
        if (!summary.byType[type]) {
          summary.byType[type] = { count: 0, totalAmount: 0 }
        }
        summary.byType[type].count++
        summary.byType[type].totalAmount += Math.abs(Number(t.amount || 0))

        const status = t.status || 'N/A'
        if (!summary.byStatus[status]) {
          summary.byStatus[status] = 0
        }
        summary.byStatus[status]++

        if (t.paymentMethod) {
          if (!summary.byPaymentMethod[t.paymentMethod]) {
            summary.byPaymentMethod[t.paymentMethod] = 0
          }
          summary.byPaymentMethod[t.paymentMethod]++
        }
      })

      setPreviewData({
        transactions: transactions,
        summary: summary,
        groupInfo: groupInfo,
        dateRange: { startDate, endDate },
        filters: {
          dateRange: dateRange,
          selectedMember,
          customStartDate,
          customEndDate
        }
      })
      setShowPreviewModal(true)
    } catch (error) {
      console.error('Error loading preview:', error)
      alert(t('failedToLoadPreview', { defaultValue: 'Failed to load preview' }))
    } finally {
      setTransactionReportLoading(false)
    }
  }

  const handleDownload = async (format = 'excel') => {
    // Export filtered transactions directly (from Financial Reports table)
    if (filteredTransactions.length === 0) {
      alert(t('noTransactionsToExport', { defaultValue: 'No transactions to export. Please adjust your filters.' }))
      return
    }
    
    // Use filteredTransactions directly
    exportFilteredTransactions(filteredTransactions, format)
  }

  const exportFilteredTransactions = (transactions, format = 'excel') => {
    if (!transactions || transactions.length === 0) {
      alert(t('noTransactionsToExport', { defaultValue: 'No transactions to export' }))
      return
    }

    const { startDate, endDate } = getDateRange()
    const dateRange = { startDate, endDate }

    // Calculate summary from filtered transactions
    const summary = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0),
      byType: {},
      byStatus: {},
      byPaymentMethod: {}
    }

    transactions.forEach(t => {
      const type = t.rawType || t.type || t.transactionType
      if (!summary.byType[type]) {
        summary.byType[type] = { count: 0, totalAmount: 0 }
      }
      summary.byType[type].count++
      summary.byType[type].totalAmount += Math.abs(Number(t.amount || 0))

      const status = t.status || 'N/A'
      if (!summary.byStatus[status]) {
        summary.byStatus[status] = 0
      }
      summary.byStatus[status]++

      if (t.paymentMethod) {
        if (!summary.byPaymentMethod[t.paymentMethod]) {
          summary.byPaymentMethod[t.paymentMethod] = 0
        }
        summary.byPaymentMethod[t.paymentMethod]++
      }
    })

    // Format report type for title
    const reportTypeTitle = 'Financial'

    // Prepare headers and rows
    const headers = ['Transaction ID', 'Member Name', 'Date & Time', 'Transaction Type', 'Amount', 'Payment Method', 'Status', 'Description / Notes']
    
    // Format date range for display
    const startDateStr = dateRange.startDate instanceof Date 
      ? dateRange.startDate.toISOString().split('T')[0]
      : dateRange.startDate
    const endDateStr = dateRange.endDate instanceof Date
      ? dateRange.endDate.toISOString().split('T')[0]
      : dateRange.endDate

    const rows = transactions.length === 0
      ? [['No transactions', 'N/A', `${startDateStr} to ${endDateStr}`, 'N/A', 0, 'N/A', 'N/A', `No transactions found for the selected filters`]]
      : transactions.map(t => {
          let dateTimeStr = 'N/A'
          if (t.transactionDate || t.date || t.createdAt) {
            const transDate = t.transactionDate ? new Date(t.transactionDate) : (t.date ? new Date(t.date) : new Date(t.createdAt))
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
              dateTimeStr = t.date || 'N/A'
            }
          }
          
          const transactionType = t.transactionType || t.rawType || t.type || 'N/A'
          const formattedType = transactionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          
          return [
            t.transactionId || t.id || 'N/A',
            t.memberName || t.user?.name || 'N/A',
            dateTimeStr,
            formattedType,
            Math.abs(Number(t.amount || 0)),
            t.paymentMethod ? t.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
            (t.status || 'N/A').toUpperCase(),
            t.description || ''
          ]
        })

    // Generate filename
    const dateStr = `${startDateStr}_to_${endDateStr}`
    const memberFilterStr = selectedMember !== 'all' ? `_${selectedMember}` : ''
    const filename = `${reportTypeTitle}_Financial_Report_${groupInfo?.name?.replace(/\s+/g, '_') || 'Group'}_${dateStr}${memberFilterStr}`

    const exportOptions = {
      title: `${reportTypeTitle} Financial Report - ${groupInfo?.name || 'Group'}`,
      groupName: groupInfo?.name || 'N/A',
      reportType: reportTypeTitle,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr
      },
      filters: {
        dateRange: dateRange,
        selectedMember: selectedMember
      },
      summary: {
        totalTransactions: summary.totalTransactions,
        totalAmount: summary.totalAmount,
        byType: summary.byType,
        byStatus: summary.byStatus,
        byPaymentMethod: summary.byPaymentMethod
      }
    }

    if (format === 'csv') {
      exportToCSV(rows, headers, filename, exportOptions)
    } else {
      exportToExcel(rows, headers, filename, exportOptions)
    }
  }

  const exportFromPreview = (format = 'excel') => {
    // Also support exporting from preview modal using filteredTransactions
    if (filteredTransactions.length > 0) {
      exportFilteredTransactions(filteredTransactions, format)
      return
    }
    
    if (!previewData || !previewData.transactions) {
      alert(t('noPreviewData', { defaultValue: 'Please preview the report first' }))
      return
    }

    exportFilteredTransactions(previewData.transactions, format)
  }

  const handleViewFullReport = () => {
    // Navigate to a detailed member performance page or show modal
    setShowPreviewModal(true)
    setPreviewData({
      memberPerformance,
      groupInfo,
      dateRange: getDateRange()
    })
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{tCashier('financialReportsAnalytics', { defaultValue: 'Financial Reports & Analytics' })}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{tCashier('generateComprehensiveFinancialReports', { defaultValue: 'Generate comprehensive financial reports and insights' })}</p>
        </div>

        {/* Report Controls */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {tSystemAdmin('dateRange')}
              </label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value)
                  if (e.target.value === 'custom') {
                    setShowCustomDatePicker(true)
                  } else {
                    setShowCustomDatePicker(false)
                  }
                }}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="today">{t('today')}</option>
                <option value="yesterday">{tCashier('yesterday', { defaultValue: 'Yesterday' })}</option>
                <option value="thisWeek">{t('thisWeek')}</option>
                <option value="lastWeek">{tCashier('lastWeek', { defaultValue: 'Last Week' })}</option>
                <option value="thisMonth">{t('thisMonth')}</option>
                <option value="lastMonth">{tCashier('lastMonth', { defaultValue: 'Last Month' })}</option>
                <option value="custom">{tSystemAdmin('customRange')}</option>
              </select>
              {showCustomDatePicker && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {t('startDate', { defaultValue: 'Start Date' })}
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {t('endDate', { defaultValue: 'End Date' })}
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {tCashier('memberFilter', { defaultValue: 'Member Filter' })}
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">{tCashier('allMembers', { defaultValue: 'All Members' })}</option>
                <option value="topContributors">{tCashier('topContributors', { defaultValue: 'Top Contributors' })}</option>
                <option value="defaulters">{tCashier('defaulters', { defaultValue: 'Defaulters' })}</option>
                <option value="active">{tCashier('activeOnly', { defaultValue: 'Active Only' })}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handlePrintReport}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Printer size={18} /> {tCashier('printReport', { defaultValue: 'Print Report' })}
              </button>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{currentReport.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{tCashier('reportDate', { defaultValue: 'Report Date' })}: {currentReport.date}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePreview}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Eye size={16} /> {tCashier('preview', { defaultValue: 'Preview' })}
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDownload('csv')}
                  className="btn-primary text-sm flex items-center gap-2"
                  disabled={filteredTransactions.length === 0}
                >
                  <Download size={16} /> CSV
                </button>
                <button 
                  onClick={() => handleDownload('excel')}
                  className="btn-secondary text-sm flex items-center gap-2"
                  disabled={filteredTransactions.length === 0}
                >
                  <Download size={16} /> Excel
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <DollarSign className="text-blue-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('contributions')}</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? '...' : currentReport.data.totalContributions.toLocaleString()} RWF
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <TrendingUp className="text-green-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{tCashier('loanPayments', { defaultValue: 'Loan Payments' })}</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : currentReport.data.totalLoanPayments.toLocaleString()} RWF
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
              <AlertTriangle className="text-orange-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('fines')}</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {loading ? '...' : currentReport.data.totalFines.toLocaleString()} RWF
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <FileText className="text-purple-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{tCashier('newLoans', { defaultValue: 'New Loans' })}</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {loading ? '...' : currentReport.data.newLoans}
              </p>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Users className="text-indigo-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{tCashier('activeMembers')}</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {loading ? '...' : currentReport.data.activeMembers}
              </p>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
              <BarChart3 className="text-pink-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('transactions')}</p>
              <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                {loading ? '...' : currentReport.data.transactions}
              </p>
            </div>
            <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
              <DollarSign className="text-teal-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalAmount', { defaultValue: 'Total Amount' })}</p>
              <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
                {loading ? '...' : (currentReport.data.totalAmount || 0).toLocaleString()} RWF
              </p>
            </div>
          </div>
        </div>

        {/* Member Performance */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tCashier('topPerformingMembers', { defaultValue: 'Top Performing Members' })}</h2>
            <button 
              onClick={handleViewFullReport}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <BarChart3 size={16} /> {tCashier('viewFullReport', { defaultValue: 'View Full Report' })}
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : memberPerformance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noDataAvailable', { defaultValue: 'No data available' })}</p>
          ) : (
            <div className="space-y-3">
              {memberPerformance.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.rank}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{member.memberName || member.member || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('contributions')}: {member.contributions.toLocaleString()} RWF • 
                      {tCashier('loanPayments')}: {member.loanPayments.toLocaleString()} RWF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('fines')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {member.fines.toLocaleString()} RWF
                    </p>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                    {tCashier('rank', { defaultValue: 'Rank' })} #{member.rank}
                  </span>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary Insights */}
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tCashier('financialInsights', { defaultValue: 'Financial Insights' })}</h2>
          </div>
          <div className="space-y-4">
            {currentReport.data.totalContributions > 0 && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{tCashier('totalContributions', { defaultValue: 'Total Contributions' })}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tCashier('groupCollected', { defaultValue: 'Group collected' })} {currentReport.data.totalContributions.toLocaleString()} RWF {tCashier('inContributions', { defaultValue: 'in contributions' })}
                </p>
              </div>
            )}
            {currentReport.data.totalLoanPayments > 0 && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{tCashier('loanPayments', { defaultValue: 'Loan Payments' })}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tCashier('membersPaid', { defaultValue: 'Members paid' })} {currentReport.data.totalLoanPayments.toLocaleString()} RWF {tCashier('inLoanPayments', { defaultValue: 'in loan payments' })}
                </p>
              </div>
            )}
            {currentReport.data.totalFines > 0 && (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{tCashier('finesCollected', { defaultValue: 'Fines Collected' })}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tCashier('totalFinesCollected', { defaultValue: 'Total fines collected' })}: {currentReport.data.totalFines.toLocaleString()} RWF
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Reports List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {tCashier('financialReports', { defaultValue: 'Financial Reports' })} ({filteredTransactions.length})
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {tCashier('filteredReportsDescription', { defaultValue: 'All financial transactions based on your selected filters' })}
              </p>
              {groupInfo && (
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1 font-semibold">Group: {groupInfo.name}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">{t('noTransactionsFound', { defaultValue: 'No transactions found for the selected filters' })}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('transactionId', { defaultValue: 'ID' })}
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('memberName', { defaultValue: 'Member' })}
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('dateAndTime', { defaultValue: 'Date & Time' })}
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('type', { defaultValue: 'Type' })}
                    </th>
                    <th className="p-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('amount', { defaultValue: 'Amount' })}
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('paymentMethod', { defaultValue: 'Payment Method' })}
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('status', { defaultValue: 'Status' })}
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      {t('description', { defaultValue: 'Description' })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t, idx) => {
                    const transDate = t.transactionDate ? new Date(t.transactionDate) : (t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : new Date()))
                    const dateStr = transDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })
                    const timeStr = transDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                    const dateTimeStr = `${dateStr} ${timeStr}`
                    
                    const transactionType = t.transactionType || t.rawType || t.type || 'N/A'
                    const formattedType = transactionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    
                    return (
                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="p-3 text-gray-800 dark:text-white font-mono text-xs">
                          {t.transactionId || t.id || 'N/A'}
                        </td>
                        <td className="p-3 text-gray-800 dark:text-white">
                          {t.memberName || t.user?.name || 'N/A'}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {dateTimeStr}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {formattedType}
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800 dark:text-white">
                          {Math.abs(Number(t.amount || 0)).toLocaleString()} RWF
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {t.paymentMethod ? t.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'paid'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : (t.status || '').toLowerCase() === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {(t.status || 'N/A').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 text-xs max-w-xs truncate" title={t.description || ''}>
                          {t.description || 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Report Section */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transaction Report Export</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Generate comprehensive transaction history report</p>
              {groupInfo && (
                <p className="text-sm text-primary-600 dark:text-primary-400 mt-1 font-semibold">Group: {groupInfo.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="btn-primary flex items-center gap-2"
                disabled={transactionReportLoading || filteredTransactions.length === 0}
              >
                <Download size={18} /> Export CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="btn-secondary flex items-center gap-2"
                disabled={transactionReportLoading || filteredTransactions.length === 0}
              >
                <Download size={18} /> Export Excel
              </button>
            </div>
          </div>
          {transactionReportLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Generating report...</p>
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Transaction Report includes:</strong> All contributions, loan requests, loan payments, fine payments, interest, refunds, and fees.
              The report shows Transaction ID, Member Name, Transaction Type, Amount, Date, Payment Method, Status, and Description.
            </p>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreviewModal && previewData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {tCashier('reportPreview', { defaultValue: 'Report Preview' })}
                </h2>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewData(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {previewData.transactions ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        {tCashier('transactionReport', { defaultValue: 'Transaction Report' })}
                      </h3>
                      {previewData.groupInfo && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t('group', { defaultValue: 'Group' })}: {previewData.groupInfo.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('totalTransactions', { defaultValue: 'Total Transactions' })}: {previewData.transactions.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('totalAmount', { defaultValue: 'Total Amount' })}: {previewData.summary.totalAmount?.toLocaleString() || 0} RWF
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="p-2 text-left">{t('transactionId', { defaultValue: 'ID' })}</th>
                            <th className="p-2 text-left">{t('memberName', { defaultValue: 'Member' })}</th>
                            <th className="p-2 text-left">{t('dateAndTime', { defaultValue: 'Date' })}</th>
                            <th className="p-2 text-left">{t('type', { defaultValue: 'Type' })}</th>
                            <th className="p-2 text-right">{t('amount', { defaultValue: 'Amount' })}</th>
                            <th className="p-2 text-left">{t('status', { defaultValue: 'Status' })}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.transactions.slice(0, 20).map((t, idx) => (
                            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="p-2">{t.transactionId}</td>
                              <td className="p-2">{t.memberName}</td>
                              <td className="p-2">{t.date}</td>
                              <td className="p-2">{t.transactionType}</td>
                              <td className="p-2 text-right">{t.amount.toLocaleString()} RWF</td>
                              <td className="p-2">{t.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.transactions.length > 20 && (
                        <p className="text-sm text-gray-500 mt-4 text-center">
                          {t('showingFirst20', { defaultValue: 'Showing first 20 transactions. Export full report for complete data.' })}
                        </p>
                      )}
                    </div>
                  </>
                ) : previewData.memberPerformance ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      {tCashier('memberPerformanceReport', { defaultValue: 'Member Performance Report' })}
                    </h3>
                    <div className="space-y-3">
                      {previewData.memberPerformance.map((member, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800 dark:text-white">{member.memberName || member.member}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('contributions')}: {member.contributions.toLocaleString()} RWF • 
                                {tCashier('loanPayments')}: {member.loanPayments.toLocaleString()} RWF • 
                                {t('fines')}: {member.fines.toLocaleString()} RWF
                              </p>
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                              {tCashier('rank', { defaultValue: 'Rank' })} #{member.rank}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewData(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  {tCommon('close', { defaultValue: 'Close' })}
                </button>
                {previewData.transactions && (
                  <>
                    <button
                      onClick={() => exportFromPreview('csv')}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Download size={18} /> {t('exportCSV', { defaultValue: 'Export CSV' })}
                    </button>
                    <button
                      onClick={() => exportFromPreview('excel')}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      <Download size={18} /> {t('exportExcel', { defaultValue: 'Export Excel' })}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default CashierReports
