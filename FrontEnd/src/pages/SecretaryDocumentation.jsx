import { useState, useEffect } from 'react'
import { FileText, Download, RefreshCw, Calendar, Users, DollarSign, FileSpreadsheet, AlertCircle, MessageSquare } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { exportToExcel, formatCurrency, formatDate } from '../utils/pdfExport'

function SecretaryDocumentation() {
  const { t } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('attendance')
  const [loading, setLoading] = useState(true)
  const [groupId, setGroupId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  })
  
  // Data states for each tab
  const [attendanceData, setAttendanceData] = useState([])
  const [contributionsData, setContributionsData] = useState([])
  const [loansData, setLoansData] = useState([])
  const [meetingsData, setMeetingsData] = useState([])
  const [announcementsData, setAnnouncementsData] = useState([])

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (groupId) {
      fetchTabData()
    }
  }, [groupId, activeTab, selectedMonth])

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

  const fetchTabData = async () => {
    try {
      setLoading(true)
      const [year, month] = selectedMonth.split('-')
      const params = { year, month }

      switch (activeTab) {
        case 'attendance':
          await fetchAttendance(params)
          break
        case 'contributions':
          await fetchContributions(params)
          break
        case 'loans':
          await fetchLoans(params)
          break
        case 'meetings':
          await fetchMeetings(params)
          break
        case 'announcements':
          await fetchAnnouncements(params)
          break
      }
    } catch (error) {
      console.error('Error fetching tab data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async (params) => {
    try {
      const response = await api.get('/secretary/documentation/attendance', { params })
      if (response.data.success) {
        setAttendanceData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendanceData([])
    }
  }

  const fetchContributions = async (params) => {
    try {
      const response = await api.get('/secretary/documentation/contributions', { params })
      if (response.data.success) {
        setContributionsData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching contributions:', error)
      setContributionsData([])
    }
  }

  const fetchLoans = async (params) => {
    try {
      const response = await api.get('/secretary/documentation/loans', { params })
      if (response.data.success) {
        setLoansData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching loans:', error)
      setLoansData([])
    }
  }

  const fetchMeetings = async (params) => {
    try {
      const response = await api.get('/secretary/documentation/meetings', { params })
      if (response.data.success) {
        setMeetingsData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      setMeetingsData([])
    }
  }

  const fetchAnnouncements = async (params) => {
    try {
      const response = await api.get('/secretary/documentation/announcements', { params })
      if (response.data.success) {
        setAnnouncementsData(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setAnnouncementsData([])
    }
  }

  const handleExportAttendance = () => {
    const headers = ['Date', 'Meeting Title', 'Attendees Count', 'Present Members', 'Absent Members', 'Taken By']
    const rows = attendanceData.map(item => [
      formatDate(item.date),
      item.meetingTitle || 'N/A',
      item.attendeesCount || 0,
      item.presentMembers?.join(', ') || 'None',
      item.absentMembers?.join(', ') || 'None',
      item.takenBy || 'N/A'
    ])
    
    exportToExcel(rows, headers, `Attendance_Report_${selectedMonth}`, {
      title: `Attendance Report - ${selectedMonth}`,
      dateRange: { startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-31` }
    })
  }

  const handleExportContributions = () => {
    const headers = ['Date', 'Member Name', 'Member Phone', 'Amount (RWF)', 'Payment Method', 'Receipt Number']
    const rows = contributionsData.map(item => [
      formatDate(item.date),
      item.memberName || 'N/A',
      item.memberPhone || 'N/A',
      item.amount || 0,
      item.paymentMethod || 'N/A',
      item.receiptNumber || 'N/A'
    ])
    
    const totalAmount = contributionsData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    
    exportToExcel(rows, headers, `Contributions_Report_${selectedMonth}`, {
      title: `Contributions Report - ${selectedMonth}`,
      dateRange: { startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-31` },
      summary: { totalTransactions: contributionsData.length, totalAmount }
    })
  }

  const handleExportLoans = () => {
    const headers = ['Date', 'Member Name', 'Member Phone', 'Loan Amount (RWF)', 'Purpose', 'Status', 'Duration (Months)', 'Interest Rate']
    const rows = loansData.map(item => [
      formatDate(item.date),
      item.memberName || 'N/A',
      item.memberPhone || 'N/A',
      item.amount || 0,
      item.purpose || 'N/A',
      item.status || 'N/A',
      item.duration || 'N/A',
      item.interestRate ? `${item.interestRate}%` : 'N/A'
    ])
    
    const totalAmount = loansData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    
    exportToExcel(rows, headers, `Loans_Report_${selectedMonth}`, {
      title: `Loans Report - ${selectedMonth}`,
      dateRange: { startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-31` },
      summary: { totalTransactions: loansData.length, totalAmount }
    })
  }

  const handleExportMeetings = () => {
    const headers = ['Date', 'Time', 'Title', 'Location', 'Status', 'Attendees Count', 'Minutes Recorded', 'Attendance Taken']
    const rows = meetingsData.map(item => [
      formatDate(item.scheduledDate),
      item.scheduledTime || 'N/A',
      item.title || 'N/A',
      item.location || 'N/A',
      item.status || 'N/A',
      item.attendeesCount || 0,
      item.minutes ? 'Yes' : 'No',
      item.attendanceTaken ? 'Yes' : 'No'
    ])
    
    exportToExcel(rows, headers, `Meetings_Report_${selectedMonth}`, {
      title: `Meetings Report - ${selectedMonth}`,
      dateRange: { startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-31` },
      summary: { totalTransactions: meetingsData.length }
    })
  }

  const handleExportAnnouncements = () => {
    const headers = ['Date', 'Title', 'Content', 'Priority', 'Status', 'Created By']
    const rows = announcementsData.map(item => [
      formatDate(item.createdAt),
      item.title || 'N/A',
      item.content?.substring(0, 100) + (item.content?.length > 100 ? '...' : '') || 'N/A',
      item.priority || 'N/A',
      item.status || 'N/A',
      item.createdBy || 'N/A'
    ])
    
    exportToExcel(rows, headers, `Announcements_Report_${selectedMonth}`, {
      title: `Announcements Report - ${selectedMonth}`,
      dateRange: { startDate: `${selectedMonth}-01`, endDate: `${selectedMonth}-31` },
      summary: { totalTransactions: announcementsData.length }
    })
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'attendance': return attendanceData
      case 'contributions': return contributionsData
      case 'loans': return loansData
      case 'meetings': return meetingsData
      case 'announcements': return announcementsData
      default: return []
    }
  }

  const getExportHandler = () => {
    switch (activeTab) {
      case 'attendance': return handleExportAttendance
      case 'contributions': return handleExportContributions
      case 'loans': return handleExportLoans
      case 'meetings': return handleExportMeetings
      case 'announcements': return handleExportAnnouncements
      default: return null
    }
  }

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'attendance': return <Users size={20} />
      case 'contributions': return <DollarSign size={20} />
      case 'loans': return <FileText size={20} />
      case 'meetings': return <Calendar size={20} />
      case 'announcements': return <MessageSquare size={20} />
      default: return <FileText size={20} />
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

  const currentData = getCurrentData()
  const exportHandler = getExportHandler()

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {tSecretary('documentation', { defaultValue: 'Documentation' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tSecretary('groupDocumentation', { defaultValue: 'View and export group documentation' })}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
            />
            <button
              onClick={fetchTabData}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
            {exportHandler && (
              <button
                onClick={exportHandler}
                className="btn-primary flex items-center gap-2"
              >
                <FileSpreadsheet size={18} /> Export Excel
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1.5 p-1.5 overflow-x-auto scrollbar-hide">
              {['attendance', 'contributions', 'loans', 'meetings', 'announcements'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {getTabIcon(tab)}
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
            ) : currentData.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="mx-auto mb-2" size={48} />
                <p>No data found for {selectedMonth}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report for {selectedMonth}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Total Records: {currentData.length}
                      </p>
                    </div>
                    <button
                      onClick={exportHandler}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FileSpreadsheet size={18} /> Download Excel
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        {activeTab === 'attendance' && (
                          <>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Meeting Title</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Attendees</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Present</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Absent</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Taken By</th>
                          </>
                        )}
                        {activeTab === 'contributions' && (
                          <>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Member</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Phone</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Amount</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Method</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Receipt</th>
                          </>
                        )}
                        {activeTab === 'loans' && (
                          <>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Member</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Phone</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Amount</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Purpose</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Duration</th>
                          </>
                        )}
                        {activeTab === 'meetings' && (
                          <>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Time</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Title</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Location</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Attendees</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Minutes</th>
                          </>
                        )}
                        {activeTab === 'announcements' && (
                          <>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Title</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Content</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Priority</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Status</th>
                            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Created By</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {activeTab === 'attendance' && (
                            <>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{formatDate(item.date)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.meetingTitle || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.attendeesCount || 0}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.presentMembers?.join(', ') || 'None'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.absentMembers?.join(', ') || 'None'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.takenBy || 'N/A'}</td>
                            </>
                          )}
                          {activeTab === 'contributions' && (
                            <>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{formatDate(item.date)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.memberName || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.memberPhone || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.paymentMethod || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.receiptNumber || 'N/A'}</td>
                            </>
                          )}
                          {activeTab === 'loans' && (
                            <>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{formatDate(item.date)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.memberName || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.memberPhone || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.purpose || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.status || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.duration || 'N/A'}</td>
                            </>
                          )}
                          {activeTab === 'meetings' && (
                            <>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{formatDate(item.scheduledDate)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.scheduledTime || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.title || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.location || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.status || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.attendeesCount || 0}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.minutes ? 'Yes' : 'No'}</td>
                            </>
                          )}
                          {activeTab === 'announcements' && (
                            <>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{formatDate(item.createdAt)}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.title || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.content?.substring(0, 50) + (item.content?.length > 50 ? '...' : '') || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.priority || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.status || 'N/A'}</td>
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{item.createdBy || 'N/A'}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryDocumentation
