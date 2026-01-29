import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, CheckCircle, Clock, AlertCircle, Search, Filter, Users, TrendingUp, Download, Calendar, Eye, Edit, XCircle, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'
import { createPDFDocument, addFormattedTable, addSummarySection, addFooter, savePDF, formatCurrency, formatDate, formatDateTimeFull, exportToExcel } from '../utils/pdfExport'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminContributions() {
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContribution, setSelectedContribution] = useState(null)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)

  const [contributions, setContributions] = useState([])
  const [groupName, setGroupName] = useState('')
  const [groupId, setGroupId] = useState(null)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [sendingReminder, setSendingReminder] = useState(false)
  const { data: summary, setData: setSummary, loading, wrap } = useApiState({
    totalContributions: 0,
    pendingContributions: 0,
    lateContributions: 0,
    adjustmentRequests: 0
  })

  // Get filtered contributions (used by both export and display)
  const getFilteredContributions = () => {
    return contributions.filter(c => {
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus
      const matchesSearch = !searchTerm ||
        c.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm) ||
        String(c.memberId || '').includes(searchTerm)
      return matchesStatus && matchesSearch
    })
  }

  // Export PDF Summary Report
  const exportPDFSummary = () => {
    try {
      const filteredContribs = getFilteredContributions()
      const { doc, pageWidth, pageHeight } = createPDFDocument(
        t('contributionsSummaryReport', { defaultValue: 'Contributions Summary Report' }),
        groupName || t('groupContributions', { defaultValue: 'Group Contributions' })
      )

      const completedContribs = filteredContribs.filter(c => c.status === 'approved' || c.status === 'completed')
      const totalAmount = completedContribs.reduce((sum, c) => sum + c.amount, 0)
      const avgAmount = completedContribs.length > 0 ? Math.round(totalAmount / completedContribs.length) : 0
      const activeContributors = new Set(completedContribs.map(c => c.memberId)).size

      // Summary section
      const summaries = [
        { label: t('totalAmount', { defaultValue: 'Total Amount' }), value: formatCurrency(totalAmount) },
        { label: t('completed', { defaultValue: 'Completed' }), value: completedContribs.length },
        { label: t('pending', { defaultValue: 'Pending' }), value: filteredContribs.filter(c => c.status === 'pending').length },
        { label: t('activeMembers', { defaultValue: 'Active Members' }), value: activeContributors }
      ]

      let currentY = addSummarySection(doc, summaries, 55, pageWidth)
      currentY += 15

      // Summary table with key metrics
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...[30, 64, 175])
      doc.text(t('summaryStatistics', { defaultValue: 'Summary Statistics' }), 15, currentY)
      currentY += 10

      const summaryHeaders = ['Metric', 'Value']
      const summaryRows = [
        [t('totalContributionsAmount', { defaultValue: 'Total Contributions Amount' }), formatCurrency(totalAmount)],
        [t('numberOfCompletedContributions', { defaultValue: 'Number of Completed Contributions' }), completedContribs.length.toString()],
        [t('numberOfPendingContributions', { defaultValue: 'Number of Pending Contributions' }), filteredContribs.filter(c => c.status === 'pending').length.toString()],
        [t('averageContributionAmount', { defaultValue: 'Average Contribution Amount' }), formatCurrency(avgAmount)],
        [t('activeContributors', { defaultValue: 'Active Contributors' }), activeContributors.toString()],
        [t('totalRecords', { defaultValue: 'Total Records' }), filteredContribs.length.toString()]
      ]

      currentY = addFormattedTable(doc, { headers: summaryHeaders, rows: summaryRows }, currentY, pageWidth, {
        columnWidths: [60, 40],
        fontSize: 10
      })

      // Add footer to all pages
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, pageWidth, pageHeight, i, totalPages)
      }

      savePDF(doc, `Contributions_Summary_${groupName?.replace(/\s+/g, '_') || 'Group'}`)
    } catch (error) {
      console.error('[GroupAdminContributions] Error exporting PDF:', error)
      alert(tCommon('exportFailed', { defaultValue: 'Failed to export report. Please try again.' }))
    }
  }

  // Export Excel Full Report with all details
  const exportExcelFullReport = () => {
    try {
      const filteredContribs = getFilteredContributions()

      // Sort by date (oldest first)
      const sortedContribs = [...filteredContribs].sort((a, b) => {
        const dateA = new Date(a.date || 0)
        const dateB = new Date(b.date || 0)
        return dateA - dateB
      })

      const headers = [t('contributionId', { defaultValue: 'Contribution ID' }), t('dateAndTime', { defaultValue: 'Date & Time' }), t('memberName', { defaultValue: 'Member Name' }), t('memberId', { defaultValue: 'Member ID' }), t('phone', { defaultValue: 'Phone' }), t('amount', { defaultValue: 'Amount' }), t('paymentMethod', { defaultValue: 'Payment Method' }), t('receiptNumber', { defaultValue: 'Receipt Number' }), t('status', { defaultValue: 'Status' }), t('totalContributions', { defaultValue: 'Total Contributions' })]

      const rows = sortedContribs.length === 0
        ? [['No contributions', 'N/A', 'N/A', 'N/A', 'N/A', 0, 'N/A', 'N/A', 'N/A', 0]]
        : sortedContribs.map(contrib => {
          // Format date and time properly
          let dateTimeStr = 'N/A'
          if (contrib.date) {
            const contribDate = new Date(contrib.date)
            if (!isNaN(contribDate.getTime())) {
              const dateStr = contribDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
              const timeStr = contribDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })
              dateTimeStr = `${dateStr} ${timeStr}`
            } else {
              dateTimeStr = contrib.date
            }
          }

          return [
            contrib.id || 'N/A',
            dateTimeStr,
            contrib.memberName || 'N/A',
            contrib.memberId || 'N/A',
            contrib.phone || 'N/A',
            contrib.amount || 0,
            contrib.method || 'N/A',
            contrib.receipt || 'N/A',
            (contrib.status || 'pending').toUpperCase(),
            contrib.totalContributions || 0
          ]
        })

      const completedContribs = filteredContribs.filter(c => c.status === 'approved' || c.status === 'completed')
      const totalAmount = completedContribs.reduce((sum, c) => sum + c.amount, 0)
      const summary = {
        totalContributions: filteredContribs.length,
        totalAmount: totalAmount,
        completed: completedContribs.length,
        pending: filteredContribs.filter(c => c.status === 'pending').length
      }

      exportToExcel(rows, headers, `Contributions_Full_Report_${groupName?.replace(/\s+/g, '_') || 'Group'}`, {
        title: `Contributions Full Report - ${groupName || 'Group'}`,
        groupName: groupName || 'N/A',
        dateRange: null,
        summary
      })
    } catch (error) {
      console.error('[GroupAdminContributions] Error exporting Excel:', error)
      alert('Failed to export Excel report. Please try again.')
    }
  }

  // Handle export report button click
  const handleExportReport = (format) => {
    if (format === 'pdf') {
      exportPDFSummary()
    } else if (format === 'excel') {
      exportExcelFullReport()
    }
  }

  // Handle send reminders
  const handleSendReminders = async () => {
    if (!reminderMessage.trim()) {
      alert('Please enter a reminder message')
      return
    }

    if (!groupId) {
      alert('Group information not available')
      return
    }

    try {
      setSendingReminder(true)

      // Get all group members using the correct endpoint
      const membersRes = await api.get(`/groups/${groupId}/members`)
      const members = membersRes.data?.data || []

      if (members.length === 0) {
        alert('No members found in this group')
        return
      }

      // Create announcement
      const announcementRes = await api.post('/announcements', {
        groupId,
        title: 'Contribution Reminder',
        content: reminderMessage,
        priority: 'high'
      })

      if (!announcementRes.data?.success) {
        throw new Error('Failed to create announcement')
      }

      // Send the announcement (this automatically creates notifications for all group members)
      // The announcement controller's sendAnnouncement function creates notifications for all members
      await api.put(`/announcements/${announcementRes.data.data.id}/send`)

      console.log(`[GroupAdminContributions] Reminder sent successfully via announcement system`)

      alert('Reminder sent successfully! All group members will receive it as both a notification and an announcement.')
      setShowReminderModal(false)
      setReminderMessage('')
    } catch (error) {
      console.error('[GroupAdminContributions] Error sending reminders:', error)
      alert('Failed to send reminders. Please try again.')
    } finally {
      setSendingReminder(false)
    }
  }

  useEffect(() => {
    wrap(async () => {
      const me = await api.get('/auth/me')
      const currentGroupId = me.data?.data?.groupId
      if (!currentGroupId) return

      setGroupId(currentGroupId)

      // Fetch group name
      try {
        const groupRes = await api.get(`/groups/${currentGroupId}`)
        if (groupRes.data?.success && groupRes.data?.data) {
          setGroupName(groupRes.data.data.name || '')
        }
      } catch (err) {
        console.error('[GroupAdminContributions] Error fetching group name:', err)
      }

      const list = await api.get('/contributions', { params: {} })
      const items = (list.data?.data || []).map(c => ({
        id: c.id,
        memberId: c.memberId || c.userId,
        memberName: c.member?.name || c.user?.name || 'Member',
        phone: c.member?.phone || c.user?.phone || '',
        amount: Number(c.amount || 0),
        date: c.contributionDate || c.createdAt ? new Date(c.contributionDate || c.createdAt).toISOString().split('T')[0] : '',
        status: c.status || 'pending',
        method: c.paymentMethod || c.method || null,
        receipt: c.receiptNumber || c.receipt || null,
        contributionHistory: '',
        totalContributions: Number(c.totalForUser || 0),
        lastContribution: null
      }))
      setContributions(items)
      setSummary({
        totalContributions: items.filter(i => i.status === 'approved' || i.status === 'completed').reduce((s, i) => s + i.amount, 0),
        pendingContributions: items.filter(i => i.status === 'pending').length,
        lateContributions: items.filter(i => i.status === 'late').length,
        adjustmentRequests: 0
      })

      console.log('[GroupAdminContributions] Loaded contributions:', {
        count: items.length,
        summary: {
          totalContributions: items.filter(i => i.status === 'approved' || i.status === 'completed').reduce((s, i) => s + i.amount, 0),
          pendingContributions: items.filter(i => i.status === 'pending').length,
          lateContributions: items.filter(i => i.status === 'late').length
        }
      })
    })
  }, [])

  const [pendingAdjustments, setPendingAdjustments] = useState([])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'pending-approval': return 'bg-blue-100 text-blue-700'
      case 'late': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Use the same filtering function for consistency
  const filteredContributions = getFilteredContributions()

  const summaryStats = summary

  const handleApproveAdjustment = (adjustmentId) => {
    alert(t('adjustmentApproved', { defaultValue: `Adjustment ${adjustmentId} approved successfully!`, adjustmentId }))
  }

  const handleRejectAdjustment = (adjustmentId) => {
    alert(t('adjustmentRejected', { defaultValue: `Adjustment ${adjustmentId} rejected!`, adjustmentId }))
  }

  const handleSendReminder = (memberId) => {
    alert(t('reminderSent', { defaultValue: 'Reminder sent to member!' }))
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('contributionOversight', { defaultValue: 'Contribution Oversight' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('monitorManageContributions', { defaultValue: 'Monitor and manage all group contributions' })}</p>
          </div>
          <div className="flex gap-2">
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={() => handleExportReport('excel')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} /> {tCommon('exportReport', { defaultValue: 'Export Report' })}
              </button>
            )}
            {hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
              <button
                onClick={() => setShowReminderModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Calendar size={18} /> {t('sendReminders')}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalContributions', { defaultValue: 'Total Contributions' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {summaryStats.totalContributions.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tCommon('pending')}</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summaryStats.pendingContributions}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('latePayments', { defaultValue: 'Late Payments' })}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summaryStats.lateContributions}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('adjustmentRequests', { defaultValue: 'Adjustment Requests' })}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summaryStats.adjustmentRequests}
                </p>
              </div>
              <Edit className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('filterByStatus')}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Contributions</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="pending-approval">Pending Approval</option>
                <option value="late">Late</option>
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
                  placeholder="Search by name, phone, or ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Adjustments - Removed default data, will be fetched from DB when available */}
        {pendingAdjustments.length > 0 && (
          <div className="card bg-blue-50 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit className="text-blue-600" size={24} />
              Pending Contribution Adjustments
            </h2>
            <div className="space-y-3">
              {pendingAdjustments.map((adjustment) => (
                <div key={adjustment.id} className="bg-white rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{adjustment.memberName}</h3>
                      <p className="text-sm text-gray-600">Requested by: {adjustment.requestedBy}</p>
                      <p className="text-sm text-gray-500">Date: {adjustment.date}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      {adjustment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Original Amount</p>
                      <p className="font-semibold">{adjustment.originalAmount.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Adjusted Amount</p>
                      <p className="font-semibold text-blue-600">{adjustment.adjustedAmount.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reason</p>
                      <p className="font-semibold">{adjustment.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission(user, PERMISSIONS.MANAGE_CONTRIBUTIONS) && (
                      <>
                        <button
                          onClick={() => handleApproveAdjustment(adjustment.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> Approve Adjustment
                        </button>
                        <button
                          onClick={() => handleRejectAdjustment(adjustment.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Contribution Records ({loading ? 0 : filteredContributions.length})
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
            ) : filteredContributions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No records found</div>
            ) : filteredContributions.map((contribution) => (
              <div
                key={contribution.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {contribution.memberName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{contribution.memberName}</h3>
                      <p className="text-sm text-gray-600">{contribution.phone} • {contribution.memberId}</p>
                      <p className="text-sm text-gray-500">Date: {contribution.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contribution.status)}`}>
                    {contribution.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-semibold">{contribution.amount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-semibold">{contribution.method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Receipt</p>
                    <p className="font-semibold">{contribution.receipt || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Contributions</p>
                    <p className="font-semibold">{contribution.totalContributions.toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedContribution(contribution)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {contribution.status === 'pending' && hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                    <button
                      onClick={() => handleSendReminder(contribution.memberId)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle size={16} /> Send Reminder
                    </button>
                  )}
                  {contribution.status === 'pending-approval' && hasPermission(user, PERMISSIONS.MANAGE_CONTRIBUTIONS) && (
                    <button
                      onClick={() => alert('Contribution approved!')}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve Entry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contribution Summary Report */}
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={24} />
            Contribution Summary Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Total Contributions</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? 'Loading…' : (
                  contributions.filter(c => c.status === 'approved' || c.status === 'completed')
                    .reduce((sum, c) => sum + c.amount, 0).toLocaleString()
                )} RWF
              </p>
              <p className="text-xs text-green-600 mt-1">
                {loading ? 'Loading…' : (
                  `${contributions.filter(c => c.status === 'approved' || c.status === 'completed').length} completed contributions`
                )}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Average per Contribution</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? 'Loading…' : (() => {
                  const completed = contributions.filter(c => c.status === 'approved' || c.status === 'completed')
                  const total = completed.reduce((sum, c) => sum + c.amount, 0)
                  return completed.length > 0
                    ? Math.round(total / completed.length).toLocaleString()
                    : 0
                })()} RWF
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {loading ? 'Loading…' : (
                  `${new Set(contributions.filter(c => c.status === 'approved' || c.status === 'completed').map(c => c.memberId)).size} active contributors`
                )}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Pending Contributions</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? 'Loading…' : contributions.filter(c => c.status === 'pending').length}
              </p>
              <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleExportReport('excel')}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} /> Download Full Report
            </button>
          </div>
        </div>

        {/* Send Reminders Modal */}
        {showReminderModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Send Contribution Reminders</h2>
                  <p className="text-sm text-gray-600 mt-1">Send a reminder message to all group members</p>
                </div>
                <button
                  onClick={() => {
                    setShowReminderModal(false)
                    setReminderMessage('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reminder Message
                  </label>
                  <textarea
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    placeholder="Enter your reminder message here. This will be sent to all group members as a notification and announcement."
                    className="input-field w-full h-32 resize-none"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will appear in members' notifications and announcements.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This reminder will be sent to all active members in your group ({groupName || 'this group'}).
                    They will receive it as both a notification and an announcement.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowReminderModal(false)
                      setReminderMessage('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={sendingReminder}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReminders}
                    disabled={sendingReminder || !reminderMessage.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReminder ? 'Sending...' : 'Send Reminders'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminContributions

