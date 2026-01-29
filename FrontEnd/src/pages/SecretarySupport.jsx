import { useState, useEffect } from 'react'
import { Users, FileText, CheckCircle, Clock, AlertCircle, Eye, XCircle, Download, RefreshCw, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'

function SecretarySupport() {
  const { t } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('verification')
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  
  // Verification state
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [showViewDocs, setShowViewDocs] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  
  // Loans state
  const [loanDecisions, setLoanDecisions] = useState([])
  const [loanStatusFilter, setLoanStatusFilter] = useState('all')
  const [showLoanDetails, setShowLoanDetails] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [loanDetails, setLoanDetails] = useState(null)
  const [loadingLoanDetails, setLoadingLoanDetails] = useState(false)
  const [approvingLoan, setApprovingLoan] = useState(false)
  const [rejectingLoan, setRejectingLoan] = useState(false)
  const [rejectLoanReason, setRejectLoanReason] = useState('')
  const [showRejectLoanModal, setShowRejectLoanModal] = useState(false)
  
  // Schedules state (meetings)
  const [schedules, setSchedules] = useState([])
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all')
  const [showMeetingDetails, setShowMeetingDetails] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [loadingMeetingDetails, setLoadingMeetingDetails] = useState(false)
  
  // Reports state
  const [reports, setReports] = useState({
    summary: {},
    transactions: [],
    contributions: [],
    loans: []
  })
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (groupId) {
      fetchData()
    }
  }, [activeTab, groupId, loanStatusFilter, meetingStatusFilter])

  // Auto-fetch reports when date range changes
  useEffect(() => {
    if (groupId && activeTab === 'reports') {
      fetchReports()
    }
  }, [reportDateRange.startDate, reportDateRange.endDate, groupId, activeTab])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success && response.data.data.groupId) {
        setGroupId(response.data.data.groupId)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'verification') {
        await fetchVerifications()
      } else if (activeTab === 'loans') {
        await fetchLoans()
      } else if (activeTab === 'schedules') {
        await fetchSchedules()
      } else if (activeTab === 'reports') {
        await fetchReports()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVerifications = async () => {
    try {
      const response = await api.get('/secretary/support/verifications')
      if (response.data.success) {
        setPendingVerifications(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching verifications:', error)
    }
  }

  const fetchLoans = async () => {
    try {
      const params = {}
      if (loanStatusFilter !== 'all') params.status = loanStatusFilter
      const response = await api.get('/secretary/support/loans', { params })
      if (response.data.success) {
        setLoanDecisions(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
    }
  }

  const handleViewLoanDetails = async (loan) => {
    try {
      setSelectedLoan(loan)
      setLoadingLoanDetails(true)
      setShowLoanDetails(true)
      
      // Fetch full loan details
      const response = await api.get(`/loans/${loan.id}`)
      if (response.data.success) {
        setLoanDetails(response.data.data)
      } else {
        // If API fails, use the loan data we have
        setLoanDetails(loan)
      }
    } catch (error) {
      console.error('Error fetching loan details:', error)
      // Use the loan data we have if API fails
      setLoanDetails(loan)
    } finally {
      setLoadingLoanDetails(false)
    }
  }

  const handleApproveLoan = async () => {
    if (!selectedLoan) return
    
    const memberName = typeof selectedLoan.member === 'object' && selectedLoan.member?.name ? selectedLoan.member.name : (selectedLoan.member || 'the member')
    if (!confirm(`Are you sure you want to approve this loan of ${selectedLoan.amount?.toLocaleString() || 'N/A'} RWF for ${memberName}?`)) {
      return
    }

    try {
      setApprovingLoan(true)
      const response = await api.put(`/loans/${selectedLoan.id}/approve`)
      if (response.data.success) {
        alert('Loan approved successfully!')
        setShowLoanDetails(false)
        setSelectedLoan(null)
        setLoanDetails(null)
        await fetchLoans()
      } else {
        alert(response.data.message || 'Failed to approve loan')
      }
    } catch (error) {
      console.error('Error approving loan:', error)
      alert(error.response?.data?.message || 'Failed to approve loan')
    } finally {
      setApprovingLoan(false)
    }
  }

  const handleRejectLoan = async () => {
    if (!selectedLoan || !rejectLoanReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      setRejectingLoan(true)
      const response = await api.put(`/loans/${selectedLoan.id}/reject`, {
        reason: rejectLoanReason
      })
      if (response.data.success) {
        alert('Loan rejected successfully!')
        setShowLoanDetails(false)
        setShowRejectLoanModal(false)
        setSelectedLoan(null)
        setLoanDetails(null)
        setRejectLoanReason('')
        await fetchLoans()
      } else {
        alert(response.data.message || 'Failed to reject loan')
      }
    } catch (error) {
      console.error('Error rejecting loan:', error)
      alert(error.response?.data?.message || 'Failed to reject loan')
    } finally {
      setRejectingLoan(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      const params = {}
      if (meetingStatusFilter !== 'all') params.status = meetingStatusFilter
      const response = await api.get('/secretary/support/schedules', { params })
      if (response.data.success) {
        setSchedules(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const handleViewMeetingDetails = async (meeting) => {
    try {
      setSelectedMeeting(meeting)
      setLoadingMeetingDetails(true)
      setShowMeetingDetails(true)
      
      // Fetch full meeting details
      const response = await api.get(`/meetings/${meeting.id}`)
      if (response.data.success) {
        setMeetingDetails(response.data.data)
      } else {
        // If API fails, use the meeting data we have
        setMeetingDetails(meeting)
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error)
      // Use the meeting data we have if API fails
      setMeetingDetails(meeting)
    } finally {
      setLoadingMeetingDetails(false)
    }
  }

  const fetchReports = async () => {
    try {
      const params = {}
      // Always send date filters if provided, otherwise backend uses last 30 days
      if (reportDateRange.startDate) params.startDate = reportDateRange.startDate
      if (reportDateRange.endDate) params.endDate = reportDateRange.endDate
      
      const response = await api.get('/secretary/support/reports', { params })
      if (response.data.success) {
        setReports(response.data.data || { summary: {}, transactions: [], contributions: [], loans: [] })
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const handleVerify = async (verificationId) => {
    if (!confirm('Are you sure you want to verify this member? This action will approve their application and activate their account.')) {
      return
    }

    try {
      const response = await api.put(`/secretary/support/verifications/${verificationId}/verify`)
      if (response.data.success) {
        alert(`Member verified successfully! ${response.data.message}`)
        await fetchVerifications()
      }
    } catch (error) {
      console.error('Error verifying member:', error)
      alert(error.response?.data?.message || 'Failed to verify member')
    }
  }

  const handleReject = async () => {
    if (!selectedVerification) return
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      const response = await api.put(`/secretary/support/verifications/${selectedVerification.id}/reject`, {
        reason: rejectReason
      })
      if (response.data.success) {
        alert('Application rejected successfully')
        setShowRejectModal(false)
        setSelectedVerification(null)
        setRejectReason('')
        await fetchVerifications()
      }
    } catch (error) {
      console.error('Error rejecting application:', error)
      alert(error.response?.data?.message || 'Failed to reject application')
    }
  }

  const handleViewDocs = (verification) => {
    setSelectedVerification(verification)
    setShowViewDocs(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const handleExportReports = async () => {
    try {
      if (!reportDateRange.startDate || !reportDateRange.endDate) {
        alert('Please select both start and end dates before exporting')
        return
      }

      const params = new URLSearchParams({
        startDate: reportDateRange.startDate,
        endDate: reportDateRange.endDate
      })

      const response = await api.get(`/secretary/support/reports/export?${params.toString()}`, {
        responseType: 'blob'
      })

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `financial-report-${reportDateRange.startDate}-to-${reportDateRange.endDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('Report exported successfully!')
    } catch (error) {
      console.error('Error exporting reports:', error)
      alert(error.response?.data?.message || 'Failed to export report')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'disbursed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'defaulted': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'scheduled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'postponed': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'up-to-date': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (loading && !groupId) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {tSecretary('supportToGroupAdminCashier', { defaultValue: 'Support to Group Admin & Cashier' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tSecretary('assistGroupLeaders', { defaultValue: 'Assist group leaders and financial team' })}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['verification', 'loans', 'schedules', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data...</p>
                </div>
              </div>
            ) : (
              <>
            {activeTab === 'verification' && (
              <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {tSecretary('memberVerification', { defaultValue: 'Member Verification' })}
                    </h2>
                    {pendingVerifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="mx-auto mb-2" size={48} />
                        <p>No pending verifications</p>
                      </div>
                    ) : (
                <div className="space-y-3">
                  {pendingVerifications.map((verification) => (
                          <div key={verification.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{verification.member}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {verification.documents}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Phone: {verification.phone} • Submitted: {formatDate(verification.submittedDate)}
                                </p>
                                {verification.reviewer && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Previously reviewed by: {verification.reviewer} ({verification.reviewerRole})
                                  </p>
                                )}
                        </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleVerify(verification.id)}
                                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                                >
                                  <CheckCircle size={16} /> Verify
                                </button>
                                <button
                                  onClick={() => handleViewDocs(verification)}
                                  className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                                >
                                  <Eye size={16} /> View Docs
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVerification(verification)
                                    setShowRejectModal(true)
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <XCircle size={16} /> Reject
                                </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                    )}
              </div>
            )}

            {activeTab === 'loans' && (
              <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {tSecretary('loanDecisionRecords', { defaultValue: 'All Loan Requests' })}
                      </h2>
                      <select
                        value={loanStatusFilter}
                        onChange={(e) => setLoanStatusFilter(e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="disbursed">Disbursed</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                        <option value="defaulted">Defaulted</option>
                      </select>
                    </div>
                    {loanDecisions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FileText className="mx-auto mb-2" size={48} />
                        <p>No loan records found</p>
                      </div>
                    ) : (
                <div className="space-y-3">
                  {loanDecisions.map((loan) => (
                          <div key={loan.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                  {typeof loan.member === 'object' && loan.member?.name ? loan.member.name : (loan.member || 'Unknown')}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Amount: {loan.amount.toLocaleString()} RWF
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Purpose: {loan.purpose}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Requested: {formatDate(loan.requestDate)}
                                  {loan.approvalDate && ` • Approved: ${formatDate(loan.approvalDate)}`}
                                  {loan.approvedBy && ` • By: ${loan.approvedBy} (${loan.approvedByRole})`}
                                </p>
                                {loan.guarantor && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Guarantor: {typeof loan.guarantor === 'object' && loan.guarantor?.name ? loan.guarantor.name : loan.guarantor}
                                  </p>
                                )}
                                {loan.rejectionReason && (
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Rejection Reason: {loan.rejectionReason}
                                  </p>
                                )}
                        </div>
                              <div className="flex items-center gap-3 ml-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                                  {loan.status}
                          </span>
                                <button
                                  onClick={() => handleViewLoanDetails(loan)}
                                  className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                                >
                                  <Eye size={14} /> View Details
                                </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                    )}
              </div>
            )}

            {activeTab === 'schedules' && (
              <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {tSecretary('scheduledMeetings', { defaultValue: 'Scheduled Meetings' })}
                      </h2>
                      <select
                        value={meetingStatusFilter}
                        onChange={(e) => setMeetingStatusFilter(e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    {schedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="mx-auto mb-2" size={48} />
                        <p>No scheduled meetings found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {schedules.map((meeting) => (
                          <div key={meeting.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{meeting.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {meeting.agenda && meeting.agenda.length > 100 
                                    ? meeting.agenda.substring(0, 100) + '...' 
                                    : meeting.agenda}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                  <span>📅 Date: {formatDate(meeting.scheduledDate)}</span>
                                  <span>🕐 Time: {meeting.scheduledTime || 'N/A'}</span>
                                  {meeting.location && <span>📍 Location: {meeting.location}</span>}
                                  {meeting.attendanceCount > 0 && (
                                    <span>👥 Attendance: {meeting.attendanceCount} members</span>
                                  )}
                                  <span>Created by: {meeting.creator} ({meeting.creatorRole})</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                                  {meeting.status}
                                </span>
                                <button
                                  onClick={() => handleViewMeetingDetails(meeting)}
                                  className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                                >
                                  <Eye size={14} /> View Details
                                </button>
                              </div>
                </div>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {tSecretary('financialReportSummaries', { defaultValue: 'Financial Report Summaries' })}
                      </h2>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={reportDateRange.startDate}
                          onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                          className="input-field text-sm"
                          placeholder="Start Date"
                        />
                        <input
                          type="date"
                          value={reportDateRange.endDate}
                          onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                          className="input-field text-sm"
                          placeholder="End Date"
                        />
                        <button
                          onClick={fetchReports}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          Apply Filter
                        </button>
                        <button
                          onClick={handleExportReports}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                          disabled={!reportDateRange.startDate || !reportDateRange.endDate}
                        >
                          <Download size={16} /> Export Excel
                        </button>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Contributions</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                              {(reports.summary.totalContributions || 0).toLocaleString()} RWF
                            </p>
                          </div>
                          <DollarSign className="text-green-600" size={32} />
                        </div>
                      </div>

                      <div className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Loan Payments</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                              {(reports.summary.totalLoanPayments || 0).toLocaleString()} RWF
                            </p>
                          </div>
                          <TrendingUp className="text-blue-600" size={32} />
                        </div>
                      </div>

                      <div className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fines Collected</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                              {(reports.summary.totalFines || 0).toLocaleString()} RWF
                            </p>
                          </div>
                          <AlertCircle className="text-yellow-600" size={32} />
                        </div>
                      </div>

                      <div className="card">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Cash Flow</p>
                            <p className={`text-2xl font-bold ${(reports.summary.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(reports.summary.netCashFlow || 0).toLocaleString()} RWF
                            </p>
                          </div>
                          <FileText className="text-purple-600" size={32} />
                        </div>
                      </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Transactions</h3>
                      <div className="space-y-2">
                        {reports.transactions && reports.transactions.length > 0 ? (
                          reports.transactions.slice(0, 10).map((transaction) => (
                            <div key={transaction.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-white">{transaction.user?.name || 'Unknown'}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-800 dark:text-white">
                                    {parseFloat(transaction.amount).toLocaleString()} RWF
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatDate(transaction.transactionDate || transaction.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-4 text-gray-500 dark:text-gray-400">No recent transactions</p>
                        )}
                      </div>
                </div>
              </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* View Documents Modal */}
        {showViewDocs && selectedVerification && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Member Documents</h2>
                <button
                  onClick={() => {
                    setShowViewDocs(false)
                    setSelectedVerification(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{selectedVerification.member}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {selectedVerification.phone}</p>
                  {selectedVerification.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email: {selectedVerification.email}</p>
                  )}
                  {selectedVerification.nationalId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">National ID: {selectedVerification.nationalId}</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Submitted Documents</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedVerification.documents}</p>
                </div>

                {selectedVerification.occupation && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Occupation</h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedVerification.occupation}</p>
                  </div>
                )}

                {selectedVerification.address && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Address</h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedVerification.address}</p>
                  </div>
                )}

                {selectedVerification.reason && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Reason for Joining</h4>
                    <p className="text-gray-700 dark:text-gray-300">{selectedVerification.reason}</p>
                  </div>
                )}

                {selectedVerification.documentsArray && selectedVerification.documentsArray.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Document Files</h4>
                    <div className="space-y-2">
                      {selectedVerification.documentsArray.map((doc, index) => (
                        <a
                          key={index}
                          href={typeof doc === 'string' ? doc : doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {typeof doc === 'string' ? doc : doc.name || `Document ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowViewDocs(false)
                      setSelectedVerification(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedVerification && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reject Application</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedVerification(null)
                    setRejectReason('')
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Rejecting application for: <strong>{selectedVerification.member}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="input-field h-32 resize-none"
                    placeholder="Enter reason for rejection..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelectedVerification(null)
                      setRejectReason('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-500 hover:bg-red-600 text-white flex-1 px-4 py-2 rounded-lg transition-colors"
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {showLoanDetails && selectedLoan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Loan Details</h2>
                <button
                  onClick={() => {
                    setShowLoanDetails(false)
                    setSelectedLoan(null)
                    setLoanDetails(null)
                    setShowRejectLoanModal(false)
                    setRejectLoanReason('')
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {loadingLoanDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading loan details...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Member</label>
                        <p className="text-gray-800 dark:text-white">
                          {loanDetails?.member?.name || (typeof loanDetails?.member === 'string' ? loanDetails.member : null) || selectedLoan?.member || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Loan Amount</label>
                        <p className="text-gray-800 dark:text-white font-semibold">{(loanDetails?.amount || selectedLoan?.amount || 0).toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                        <p className="text-gray-800 dark:text-white">{loanDetails?.purpose || selectedLoan?.purpose || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(loanDetails?.status || selectedLoan?.status || 'pending')}`}>
                          {loanDetails?.status || selectedLoan?.status || 'pending'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Request Date</label>
                        <p className="text-gray-800 dark:text-white">{formatDate(loanDetails?.requestDate || selectedLoan?.requestDate)}</p>
                      </div>
                      {(loanDetails?.guarantor || selectedLoan?.guarantor) ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Guarantor</label>
                          <p className="text-gray-800 dark:text-white">
                            {loanDetails?.guarantor?.name || (typeof loanDetails?.guarantor === 'string' ? loanDetails.guarantor : null) || selectedLoan?.guarantor || 'N/A'}
                          </p>
                        </div>
                      ) : null}
                      {loanDetails?.interestRate !== undefined ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Interest Rate</label>
                          <p className="text-gray-800 dark:text-white">{loanDetails.interestRate}%</p>
                        </div>
                      ) : null}
                      {loanDetails?.repaymentPeriod ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Repayment Period</label>
                          <p className="text-gray-800 dark:text-white">{loanDetails.repaymentPeriod} months</p>
                        </div>
                      ) : null}
                      {loanDetails?.approvedBy || selectedLoan?.approvedBy ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Approved By</label>
                          <p className="text-gray-800 dark:text-white">{loanDetails?.approvedBy || selectedLoan?.approvedBy} ({loanDetails?.approvedByRole || selectedLoan?.approvedByRole})</p>
                        </div>
                      ) : null}
                      {loanDetails?.approvalDate || selectedLoan?.approvalDate ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Approval Date</label>
                          <p className="text-gray-800 dark:text-white">{formatDate(loanDetails?.approvalDate || selectedLoan?.approvalDate)}</p>
                        </div>
                      ) : null}
                      {loanDetails?.rejectionReason || selectedLoan?.rejectionReason ? (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Rejection Reason</label>
                          <p className="text-red-600 dark:text-red-400">{loanDetails?.rejectionReason || selectedLoan?.rejectionReason}</p>
                        </div>
                      ) : null}
                    </div>

                    {(loanDetails?.status === 'pending' || selectedLoan?.status === 'pending') && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={handleApproveLoan}
                          disabled={approvingLoan}
                          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {approvingLoan ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Approve Loan
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowRejectLoanModal(true)}
                          disabled={approvingLoan}
                          className="bg-red-500 hover:bg-red-600 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
                        >
                          <XCircle size={18} />
                          Reject Loan
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Loan Modal */}
        {showRejectLoanModal && selectedLoan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Reject Loan</h2>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rejecting loan for: <strong>{typeof selectedLoan.member === 'object' && selectedLoan.member?.name ? selectedLoan.member.name : (selectedLoan.member || 'Member')}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Amount: <strong>{(selectedLoan.amount || 0).toLocaleString()} RWF</strong>
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectLoanReason}
                    onChange={(e) => setRejectLoanReason(e.target.value)}
                    className="input-field w-full"
                    rows={4}
                    placeholder="Enter reason for rejection..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectLoanModal(false)
                      setRejectLoanReason('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={rejectingLoan}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectLoan}
                    disabled={rejectingLoan || !rejectLoanReason.trim()}
                    className="bg-red-500 hover:bg-red-600 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  >
                    {rejectingLoan ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Reject Loan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Details Modal */}
        {showMeetingDetails && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Meeting Details</h2>
                <button
                  onClick={() => {
                    setShowMeetingDetails(false)
                    setSelectedMeeting(null)
                    setMeetingDetails(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {loadingMeetingDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading meeting details...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <p className="text-gray-800 dark:text-white">{meetingDetails?.title || selectedMeeting?.title || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(meetingDetails?.status || selectedMeeting?.status || 'scheduled')}`}>
                          {meetingDetails?.status || selectedMeeting?.status || 'scheduled'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Scheduled Date</label>
                        <p className="text-gray-800 dark:text-white">{formatDate(meetingDetails?.scheduledDate || selectedMeeting?.scheduledDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Scheduled Time</label>
                        <p className="text-gray-800 dark:text-white">{meetingDetails?.scheduledTime || selectedMeeting?.scheduledTime || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
                        <p className="text-gray-800 dark:text-white">{meetingDetails?.location || selectedMeeting?.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Created By</label>
                        <p className="text-gray-800 dark:text-white">
                          {meetingDetails?.creator?.name || (typeof selectedMeeting?.creator === 'string' ? selectedMeeting.creator : null) || 'Unknown'} 
                          ({meetingDetails?.creator?.role || selectedMeeting?.creatorRole || 'N/A'})
                        </p>
                      </div>
                      {meetingDetails?.attendanceTakenByUser && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Attendance Taken By</label>
                          <p className="text-gray-800 dark:text-white">{meetingDetails.attendanceTakenByUser.name} ({meetingDetails.attendanceTakenByUser.role})</p>
                          {meetingDetails.attendanceTakenAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              On {formatDate(meetingDetails.attendanceTakenAt)}
                            </p>
                          )}
                        </div>
                      )}
                      {meetingDetails?.attendeesCount !== undefined && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Attendance</label>
                          <p className="text-gray-800 dark:text-white">
                            {meetingDetails.attendeesCount} present, {meetingDetails.absentCount || 0} absent
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Agenda</label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {meetingDetails?.agendaItems && meetingDetails.agendaItems.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-white">
                            {meetingDetails.agendaItems.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400">{meetingDetails?.agenda || selectedMeeting?.agenda || 'No agenda provided'}</p>
                        )}
                      </div>
                    </div>

                    {meetingDetails?.minutes && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Minutes</label>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-800 dark:text-white whitespace-pre-wrap">{meetingDetails.minutes}</p>
                        </div>
                      </div>
                    )}

                    {meetingDetails?.attendanceDetails && meetingDetails.attendanceDetails.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attendees ({meetingDetails.attendanceDetails.length})</label>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            {meetingDetails.attendanceDetails.map((attendee) => (
                              <div key={attendee.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                                <div>
                                  <p className="text-gray-800 dark:text-white font-medium">{attendee.name}</p>
                                  {attendee.phone && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{attendee.phone}</p>
                                  )}
                                </div>
                                <CheckCircle className="text-green-600" size={20} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {meetingDetails?.absentMembers && meetingDetails.absentMembers.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Absent Members ({meetingDetails.absentMembers.length})</label>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            {meetingDetails.absentMembers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                                <div>
                                  <p className="text-gray-800 dark:text-white font-medium">{member.name}</p>
                                  {member.phone && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.phone}</p>
                                  )}
                                </div>
                                <XCircle className="text-red-600" size={20} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
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

export default SecretarySupport
