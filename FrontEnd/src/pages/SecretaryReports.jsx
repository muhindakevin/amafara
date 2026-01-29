import { useState, useEffect } from 'react'
import { BarChart3, Download, Users, Calendar, FileText, TrendingUp, Eye, Printer, RefreshCw, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SecretaryReports() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('meetings')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Meeting stats
  const [meetingStats, setMeetingStats] = useState({
    totalMeetings: 0,
    averageAttendance: 0,
    attendanceRate: 0,
    minutesRecorded: 0
  })

  // Member stats
  const [memberStats, setMemberStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    newMembers: 0
  })

  // Communication stats
  const [communicationStats, setCommunicationStats] = useState({
    totalAnnouncements: 0,
    noticesPosted: 0,
    messagesSent: 0,
    responseRate: 0
  })

  // Member engagement data
  const [memberEngagement, setMemberEngagement] = useState([])
  const [showEngagementModal, setShowEngagementModal] = useState(false)

  // Detailed analytics modal
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [analyticsData, setAnalyticsData] = useState(null)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (activeTab === 'meetings') {
        const response = await api.get('/secretary/reports/meetings/stats')
        if (response.data.success) {
          setMeetingStats(response.data.data)
        }
      } else if (activeTab === 'members') {
        const response = await api.get('/secretary/reports/members/stats')
        if (response.data.success) {
          setMemberStats(response.data.data)
        }
      } else if (activeTab === 'communications') {
        const response = await api.get('/secretary/reports/communications/stats')
        if (response.data.success) {
          setCommunicationStats(response.data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportMeetingReport = async () => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/meetings/export', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `meeting_report_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting meeting report:', error)
      alert('Failed to export meeting report')
    } finally {
      setExporting(false)
    }
  }

  const handleExportMemberReport = async () => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/members/export', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `member_report_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting member report:', error)
      alert('Failed to export member report')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCommunicationReport = async () => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/communications/export', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `communication_report_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting communication report:', error)
      alert('Failed to export communication report')
    } finally {
      setExporting(false)
    }
  }

  const handleViewDetailedAnalytics = async () => {
    try {
      // Fetch detailed meeting data for the secretary's group
      const response = await api.get('/meetings')
      if (response.data.success) {
        setAnalyticsData(response.data.data || [])
        setShowAnalyticsModal(true)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      alert('Failed to load detailed analytics')
    }
  }

  const handleViewMemberEngagement = async () => {
    try {
      const response = await api.get('/secretary/reports/members/engagement')
      if (response.data.success) {
        setMemberEngagement(response.data.data || [])
        setShowEngagementModal(true)
      }
    } catch (error) {
      console.error('Error fetching member engagement:', error)
      alert('Failed to load member engagement data')
    }
  }

  const handleViewMessageAnalytics = async () => {
    try {
      // Fetch communication data
      const announcementsResponse = await api.get('/announcements')
      const messagesResponse = await api.get('/chat/messages')

      setAnalyticsData({
        announcements: announcementsResponse.data.success ? announcementsResponse.data.data : [],
        messages: messagesResponse.data.success ? messagesResponse.data.data : []
      })
      setShowAnalyticsModal(true)
    } catch (error) {
      console.error('Error fetching message analytics:', error)
      alert('Failed to load message analytics')
    }
  }

  const handleExportTransactionHistory = async (format = 'excel') => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/transactions/export', {
        params: { format },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transaction_history_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting transaction history:', error)
      alert('Failed to export transaction history')
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateMonthlySummary = async () => {
    try {
      setExporting(true)
      const now = new Date()
      const response = await api.get('/secretary/reports/monthly-summary/export', {
        params: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `monthly_summary_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error generating monthly summary:', error)
      alert('Failed to generate monthly summary')
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateMemberEngagement = async () => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/member-engagement/export', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `member_engagement_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error generating member engagement report:', error)
      alert('Failed to generate member engagement report')
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateArchiveSummary = async () => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/archive-summary/export', {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      })

      // Check if response is actually a blob (Excel file) or an error JSON
      if (response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `archive_summary_${Date.now()}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        // If it's not a blob, it might be an error response
        const text = await response.data.text()
        try {
          const errorData = JSON.parse(text)
          alert(errorData.message || 'Failed to generate archive summary')
        } catch {
          alert('Failed to generate archive summary. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error generating archive summary:', error)
      if (error.response?.status === 500) {
        alert('Archive summary export is currently unavailable. Please try again later or contact support.')
      } else {
        alert('Failed to generate archive summary. Please try again.')
      }
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateCommunicationSummary = async () => {
    try {
      setExporting(true)
      const response = await api.get('/secretary/reports/communication-summary/export', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `communication_summary_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error generating communication summary:', error)
      alert('Failed to generate communication summary')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {tSecretary('reportingAnalytics', { defaultValue: 'Reporting & Analytics' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tSecretary('generateComprehensiveReports', { defaultValue: 'Generate comprehensive reports and insights' })}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide">
              {['meetings', 'members', 'communications', 'exports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {tSecretary(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* MEETINGS TAB */}
                {activeTab === 'meetings' && (
                  <div className="space-y-6 max-w-full overflow-x-auto">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {tSecretary('meetingStatistics', { defaultValue: 'Meeting Statistics' })}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card text-center">
                        <Calendar className="text-blue-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('totalMeetings', { defaultValue: 'Total Meetings' })}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">{meetingStats.totalMeetings}</p>
                      </div>
                      <div className="card text-center">
                        <Users className="text-green-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('avgAttendance', { defaultValue: 'Avg Attendance' })}
                        </h3>
                        <p className="text-2xl font-bold text-green-600">{meetingStats.averageAttendance}</p>
                      </div>
                      <div className="card text-center">
                        <TrendingUp className="text-purple-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('attendanceRate', { defaultValue: 'Attendance Rate' })}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">{meetingStats.attendanceRate}%</p>
                      </div>
                      <div className="card text-center">
                        <FileText className="text-orange-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('minutesRecorded', { defaultValue: 'Minutes Recorded' })}
                        </h3>
                        <p className="text-2xl font-bold text-orange-600">{meetingStats.minutesRecorded}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportMeetingReport}
                        disabled={exporting}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={18} /> {tSecretary('exportMeetingReport', { defaultValue: 'Export Meeting Report' })}
                      </button>
                      <button
                        onClick={handleViewDetailedAnalytics}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Eye size={18} /> {tSecretary('viewDetailedAnalytics', { defaultValue: 'View Detailed Analytics' })}
                      </button>
                    </div>
                  </div>
                )}

                {/* MEMBERS TAB */}
                {activeTab === 'members' && (
                  <div className="space-y-6 max-w-full overflow-x-auto">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {tSecretary('memberAnalytics', { defaultValue: 'Member Analytics' })}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card text-center">
                        <Users className="text-blue-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">{t('totalMembers')}</h3>
                        <p className="text-2xl font-bold text-blue-600">{memberStats.totalMembers}</p>
                      </div>
                      <div className="card text-center">
                        <Users className="text-green-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('activeMembers', { defaultValue: 'Active Members' })}
                        </h3>
                        <p className="text-2xl font-bold text-green-600">{memberStats.activeMembers}</p>
                      </div>
                      <div className="card text-center">
                        <Users className="text-red-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('inactiveMembers', { defaultValue: 'Inactive Members' })}
                        </h3>
                        <p className="text-2xl font-bold text-red-600">{memberStats.inactiveMembers}</p>
                      </div>
                      <div className="card text-center">
                        <Users className="text-purple-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('newMembers', { defaultValue: 'New Members' })}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">{memberStats.newMembers}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportMemberReport}
                        disabled={exporting}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={18} /> {tSecretary('exportMemberReport', { defaultValue: 'Export Member Report' })}
                      </button>
                      <button
                        onClick={handleViewMemberEngagement}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Eye size={18} /> {tSecretary('viewMemberEngagement', { defaultValue: 'View Member Engagement' })}
                      </button>
                    </div>
                  </div>
                )}

                {/* COMMUNICATIONS TAB */}
                {activeTab === 'communications' && (
                  <div className="space-y-6 max-w-full overflow-x-auto">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {tSecretary('communicationAnalytics', { defaultValue: 'Communication Analytics' })}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="card text-center">
                        <FileText className="text-blue-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('announcements', { defaultValue: 'Announcements' })}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">{communicationStats.totalAnnouncements}</p>
                      </div>
                      <div className="card text-center">
                        <FileText className="text-green-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('noticesPosted', { defaultValue: 'Notices Posted' })}
                        </h3>
                        <p className="text-2xl font-bold text-green-600">{communicationStats.noticesPosted}</p>
                      </div>
                      <div className="card text-center">
                        <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('messagesSent', { defaultValue: 'Messages Sent' })}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">{communicationStats.messagesSent}</p>
                      </div>
                      <div className="card text-center">
                        <TrendingUp className="text-orange-600 mx-auto mb-2" size={32} />
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {tSecretary('responseRate', { defaultValue: 'Response Rate' })}
                        </h3>
                        <p className="text-2xl font-bold text-orange-600">{communicationStats.responseRate}%</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportCommunicationReport}
                        disabled={exporting}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={18} /> {tSecretary('exportCommunicationReport', { defaultValue: 'Export Communication Report' })}
                      </button>
                      <button
                        onClick={handleViewMessageAnalytics}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Eye size={18} /> {tSecretary('viewMessageAnalytics', { defaultValue: 'View Message Analytics' })}
                      </button>
                    </div>
                  </div>
                )}

                {/* EXPORTS TAB */}
                {activeTab === 'exports' && (
                  <div className="space-y-6 max-w-full overflow-x-auto">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {tSecretary('exportReports', { defaultValue: 'Export Reports' })}
                    </h2>

                    {/* Transaction Report Section */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">
                            {t('transactionsReport', { defaultValue: 'Transaction History Report' })}
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 break-words">
                            {tSecretary('generateComprehensiveTransactionHistory', {
                              defaultValue: 'Generate comprehensive transaction history report with all member transactions including contributions, loan requests, loan payments, fine payments, and more.'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleExportTransactionHistory('excel')}
                            disabled={exporting}
                            className="btn-primary flex items-center gap-2 whitespace-nowrap"
                          >
                            <Download size={18} /> {t('exportExcel', { defaultValue: 'Export Excel' })}
                          </button>
                        </div>
                      </div>
                      {exporting && (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-2"></div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {tSecretary('generatingReport', { defaultValue: 'Generating report...' })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                          {tSecretary('monthlySummaryReport', { defaultValue: 'Monthly Summary Report' })}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {tSecretary('comprehensiveMonthlyActivitySummary', { defaultValue: 'Comprehensive monthly activity summary' })}
                        </p>
                        <button
                          onClick={handleGenerateMonthlySummary}
                          disabled={exporting}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {tSecretary('generateReport', { defaultValue: 'Generate Report' })}
                        </button>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                          {tSecretary('memberEngagementReport', { defaultValue: 'Member Engagement Report' })}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {tSecretary('memberActivityParticipationAnalysis', { defaultValue: 'Member activity and participation analysis' })}
                        </p>
                        <button
                          onClick={handleGenerateMemberEngagement}
                          disabled={exporting}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {tSecretary('generateReport')}
                        </button>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                          {tSecretary('communicationSummary', { defaultValue: 'Communication Summary' })}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {tSecretary('allCommunicationsAnnouncements', { defaultValue: 'All communications and announcements' })}
                        </p>
                        <button
                          onClick={handleGenerateCommunicationSummary}
                          disabled={exporting}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {tSecretary('generateReport')}
                        </button>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                          {tSecretary('archiveSummary', { defaultValue: 'Archive Summary' })}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {tSecretary('documentArchiveStorageReport', { defaultValue: 'Document archive and storage report' })}
                        </p>
                        <button
                          onClick={handleGenerateArchiveSummary}
                          disabled={exporting}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {tSecretary('generateReport')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member Engagement Modal */}
      {showEngagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {tSecretary('memberEngagement', { defaultValue: 'Member Engagement' })}
              </h2>
              <button
                onClick={() => setShowEngagementModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {memberEngagement.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No engagement data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 font-semibold text-gray-700 dark:text-gray-300 pb-2 border-b">
                    <div>Rank</div>
                    <div>Name</div>
                    <div>Meetings</div>
                    <div>Contributions</div>
                    <div>Score</div>
                    <div>Savings</div>
                  </div>
                  {memberEngagement.map((member, index) => (
                    <div key={member.id} className="grid grid-cols-6 gap-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-bold text-primary-600">#{index + 1}</div>
                      <div>{member.name}</div>
                      <div>{member.meetingsAttended || 0}</div>
                      <div>{member.contributionCount || 0}</div>
                      <div className="font-semibold">{member.participationScore || 0}</div>
                      <div>{member.totalSavings?.toLocaleString() || 0} RWF</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {tSecretary('detailedAnalytics', { defaultValue: 'Detailed Analytics' })}
              </h2>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {analyticsData && Array.isArray(analyticsData) && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Meetings</h3>
                  {analyticsData.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No meetings found</p>
                  ) : (
                    <div className="space-y-2">
                      {analyticsData.map((meeting) => (
                        <div key={meeting.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="font-semibold">{meeting.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {analyticsData && analyticsData.announcements && (
                <div className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xl text-gray-800 dark:text-white">Message & Announcement Details</h3>
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                      Total: {analyticsData.announcements.length + (analyticsData.messages?.length || 0)}
                    </span>
                  </div>

                  {/* Announcements Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Recent Announcements ({analyticsData.announcements.length})
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.announcements.length > 0 ? (
                        analyticsData.announcements.slice(0, 10).map((ann, idx) => (
                          <div key={ann.id || idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-gray-800 dark:text-white">{ann.title}</h5>
                              <span className="text-[10px] text-gray-500">{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">"{ann.content}"</p>
                            <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-500">
                              <span>Recipient: {ann.targetAudience || 'All'}</span>
                              {ann.priority && (
                                <span className={`px-2 py-0.5 rounded ${ann.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                  {ann.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic ml-4">No recent announcements found.</p>
                      )}
                    </div>
                  </div>

                  {/* Messages Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Recent Chat Messages ({analyticsData.messages?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.messages && analyticsData.messages.length > 0 ? (
                        analyticsData.messages.slice(0, 10).map((msg, idx) => (
                          <div key={msg.id || idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-sm text-gray-800 dark:text-white">{msg.senderName || 'Member'}</span>
                              <span className="text-[10px] text-gray-500">{msg.timestamp ? new Date(msg.timestamp).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">"{msg.message}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic ml-4">No recent chat messages found.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default SecretaryReports
