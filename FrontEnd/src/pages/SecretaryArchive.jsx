import { useState, useEffect } from 'react'
import { Archive, FileText, Download, Search, Filter, Eye, RefreshCw, FileSpreadsheet } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SecretaryArchive() {
  const { t } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('attendance')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    meetings: 0,
    announcements: 0,
    fines: 0,
    rules: 0,
    contributions: 0,
    loans: 0
  })
  const [groupId, setGroupId] = useState(null)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (groupId) {
      fetchData()
    }
  }, [groupId, activeTab, filterDate])

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
      await Promise.all([fetchDocuments(), fetchSummary()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      // For attendance, contributions, and loans tabs, fetch from archive with category filter
      if (['attendance', 'contributions', 'loans'].includes(activeTab)) {
        const categoryMap = {
          'attendance': 'meeting',
          'contributions': 'contribution',
          'loans': 'loan'
        }
        const params = { category: categoryMap[activeTab] || activeTab }
        
        // Apply date filter
        if (filterDate !== 'all') {
          const now = new Date()
          let startDate, endDate
          
          if (filterDate === 'thisMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          } else if (filterDate === 'lastMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          } else if (filterDate === 'thisYear') {
            startDate = new Date(now.getFullYear(), 0, 1)
            endDate = new Date(now.getFullYear(), 11, 31)
          }
          
          if (startDate && endDate) {
            params.startDate = startDate.toISOString().split('T')[0]
            params.endDate = endDate.toISOString().split('T')[0]
          }
        }

        const response = await api.get('/secretary/documentation/archive', { params })
        if (response.data.success) {
          setDocuments(response.data.data || [])
        }
      } else {
        // For other tabs, use existing logic
        const params = { category: activeTab === 'rules' ? 'other' : activeTab }
        
        // Apply date filter
        if (filterDate !== 'all') {
          const now = new Date()
          let startDate, endDate
          
          if (filterDate === 'thisMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          } else if (filterDate === 'lastMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          } else if (filterDate === 'thisYear') {
            startDate = new Date(now.getFullYear(), 0, 1)
            endDate = new Date(now.getFullYear(), 11, 31)
          }
          
          if (startDate && endDate) {
            params.startDate = startDate.toISOString().split('T')[0]
            params.endDate = endDate.toISOString().split('T')[0]
          }
        }

        const response = await api.get('/secretary/documentation/archive', { params })
        if (response.data.success) {
          setDocuments(response.data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await api.get('/secretary/documentation/archive/summary')
      if (response.data.success) {
        const data = response.data.data || { total: 0, byCategory: {} }
        setSummary({
          total: data.total || 0,
          meetings: data.byCategory?.meeting || 0,
          announcements: data.byCategory?.announcement || 0,
          fines: data.byCategory?.compliance || 0,
          rules: data.byCategory?.other || 0,
          contributions: data.byCategory?.contribution || 0,
          loans: data.byCategory?.loan || 0
        })
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleView = async (doc) => {
    try {
      // If it's an archive document, fetch and display the data
      if (doc.referenceType === 'archive' || doc.title.includes('Archive')) {
        try {
          const response = await api.get(`/secretary/documentation/${doc.id}/view-data`)
          if (response.data.success) {
            const { items, period, document: docInfo, message } = response.data.data
            
            // If there's a message (like date range not found), show it and offer download
            if (message) {
              if (confirm(`${message}\n\nWould you like to download the Excel file instead?`)) {
                handleDownload(doc)
              }
              return
            }
            
            // Create a formatted view
            let content = `<h1>${docInfo.title}</h1>`
            if (period.startDate && period.endDate) {
              content += `<p><strong>Period:</strong> ${period.startDate} to ${period.endDate}</p>`
            }
            content += `<p><strong>Total Items:</strong> ${items.length}</p>`
            content += `<hr>`
            
            if (items.length === 0) {
              content += `<p>No data found for this period.</p>`
            } else if (doc.category === 'contribution') {
              const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)
              content += `<h2>Contributions Summary</h2>`
              content += `<p><strong>Total Amount:</strong> ${total.toLocaleString()} RWF</p>`
              content += `<table border="1" cellpadding="5" style="width:100%; border-collapse:collapse;">`
              content += `<tr><th>Date</th><th>Member</th><th>Phone</th><th>Amount (RWF)</th><th>Payment Method</th><th>Receipt</th><th>Status</th></tr>`
              items.forEach(item => {
                content += `<tr>`
                content += `<td>${new Date(item.date).toLocaleDateString()}</td>`
                content += `<td>${item.memberName}</td>`
                content += `<td>${item.memberPhone}</td>`
                content += `<td>${item.amount.toLocaleString()}</td>`
                content += `<td>${item.paymentMethod}</td>`
                content += `<td>${item.receiptNumber || 'N/A'}</td>`
                content += `<td>${item.status}</td>`
                content += `</tr>`
              })
              content += `</table>`
            } else if (doc.category === 'loan') {
              const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)
              content += `<h2>Loans Summary</h2>`
              content += `<p><strong>Total Amount:</strong> ${total.toLocaleString()} RWF</p>`
              content += `<table border="1" cellpadding="5" style="width:100%; border-collapse:collapse;">`
              content += `<tr><th>Date</th><th>Member</th><th>Phone</th><th>Amount (RWF)</th><th>Purpose</th><th>Status</th><th>Interest Rate</th><th>Duration</th></tr>`
              items.forEach(item => {
                content += `<tr>`
                content += `<td>${new Date(item.date).toLocaleDateString()}</td>`
                content += `<td>${item.memberName}</td>`
                content += `<td>${item.memberPhone}</td>`
                content += `<td>${item.amount.toLocaleString()}</td>`
                content += `<td>${item.purpose}</td>`
                content += `<td>${item.status}</td>`
                content += `<td>${item.interestRate}%</td>`
                content += `<td>${item.duration} months</td>`
                content += `</tr>`
              })
              content += `</table>`
            }
            
            const newWindow = window.open('', '_blank')
            newWindow.document.write(`
              <html>
                <head>
                  <title>${docInfo.title}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { margin-top: 20px; width: 100%; border-collapse: collapse; }
                    th { background-color: #f0f0f0; padding: 8px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    tr:hover { background-color: #f5f5f5; }
                  </style>
                </head>
                <body>${content}</body>
              </html>
            `)
            newWindow.document.close()
          } else {
            // If response is not successful, fall through to file URL
            throw new Error(response.data.message || 'Failed to load archive data')
          }
        } catch (viewError) {
          console.error('Error fetching archive data:', viewError)
          // If view-data fails, try to open the Excel file directly
          if (doc.fileUrl && doc.fileUrl.endsWith('.xlsx')) {
            window.open(doc.fileUrl, '_blank')
          } else {
            alert(`Failed to view archive: ${viewError.response?.data?.message || viewError.message}\n\nTrying to open file directly...`)
            if (doc.fileUrl) {
              window.open(doc.fileUrl, '_blank')
            }
          }
          return
        }
      } else if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank')
      } else if (doc.description) {
        const newWindow = window.open('', '_blank')
        newWindow.document.write(`
          <html>
            <head><title>${doc.title}</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px; white-space: pre-wrap;">${doc.description}</body>
          </html>
        `)
        newWindow.document.close()
      } else {
        alert('Document content not available')
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      // Fallback to file URL if available
      if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank')
      } else {
        alert('Failed to load document data')
      }
    }
  }

  const handleDownload = async (doc) => {
    try {
      // If it's an archive document, download PDF
      if (doc.referenceType === 'archive' || doc.title.includes('Archive')) {
        const response = await api.get(`/secretary/documentation/${doc.id}/export-pdf`, {
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = window.document.createElement('a')
        link.href = url
        link.setAttribute('download', `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`)
        window.document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else if (doc.fileUrl) {
        window.open(doc.fileUrl, '_blank')
      } else if (doc.description) {
        const blob = new Blob([doc.description], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const link = window.document.createElement('a')
        link.href = url
        link.setAttribute('download', `${doc.title.replace(/[^a-z0-9]/gi, '_')}.txt`)
        window.document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Document content not available')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document')
    }
  }

  const handleExportExcel = async (doc) => {
    try {
      const response = await api.get(`/secretary/documentation/${doc.id}/export`, {
        responseType: 'blob'
      })

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', `document-${doc.id}-${doc.title.replace(/[^a-z0-9]/gi, '_')}.xlsx`)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('Document exported to Excel successfully!')
    } catch (error) {
      console.error('Error exporting document:', error)
      alert(error.response?.data?.message || 'Failed to export document to Excel')
    }
  }

  const handleExportAttendance = async () => {
    try {
      const params = {}
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate
        params.endDate = dateRange.endDate
      } else {
        // If no date range, use current month
        const now = new Date()
        params.year = now.getFullYear()
        params.month = now.getMonth() + 1
      }

      const response = await api.get('/secretary/documentation/export-attendance', {
        params,
        responseType: 'blob'
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      const dateRangeStr = dateRange.startDate && dateRange.endDate 
        ? `${dateRange.startDate}-${dateRange.endDate}`
        : 'all-time'
      link.setAttribute('download', `attendance-records-${dateRangeStr}.xlsx`)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      alert('Attendance records exported successfully!')
    } catch (error) {
      console.error('Error exporting attendance:', error)
      alert(error.response?.data?.message || 'Failed to export attendance records')
    }
  }

  const handleArchiveContributions = async () => {
    try {
      if (!dateRange.startDate || !dateRange.endDate) {
        alert('Please select both start and end dates for archiving')
        return
      }

      setArchiving(true)
      
      // Parse dates to get year and month
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      
      const response = await api.post('/secretary/documentation/archive-contributions', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1
      })

      if (response.data.success) {
        alert(`Contributions archived successfully! ${response.data.data?.contributionsCount || 0} contributions archived.`)
        await fetchDocuments()
        await fetchSummary()
        // Reset date range
        setDateRange({ startDate: '', endDate: '' })
      }
    } catch (error) {
      console.error('Error archiving contributions:', error)
      alert(error.response?.data?.message || 'Failed to archive contributions')
    } finally {
      setArchiving(false)
    }
  }

  const handleArchiveLoans = async () => {
    try {
      if (!dateRange.startDate || !dateRange.endDate) {
        alert('Please select both start and end dates for archiving')
        return
      }

      setArchiving(true)
      
      // Parse dates to get year and month
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      
      const response = await api.post('/secretary/documentation/archive-loans', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1
      })

      if (response.data.success) {
        alert(`Loans archived successfully! ${response.data.data?.loansCount || 0} loans archived.`)
        await fetchDocuments()
        await fetchSummary()
        // Reset date range
        setDateRange({ startDate: '', endDate: '' })
      }
    } catch (error) {
      console.error('Error archiving loans:', error)
      alert(error.response?.data?.message || 'Failed to archive loan requests')
    } finally {
      setArchiving(false)
    }
  }

  const getCurrentDocuments = () => {
    if (!documents || documents.length === 0) return []
    
    // Filter by search term
    let filtered = documents
    if (searchTerm) {
      filtered = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.uploader?.name && doc.uploader.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    return filtered
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'meeting': 'Meeting Minutes',
      'announcement': 'Announcement',
      'compliance': 'Fine Record',
      'other': 'Policy Document',
      'contribution': 'Contribution',
      'loan': 'Loan',
      'report': 'Report'
    }
    return labels[category] || category
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
              {tSecretary('documentationAndArchiving', { defaultValue: 'Documentation & Archiving' })}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tSecretary('storeAndOrganizeDocuments', { defaultValue: 'Store and organize group documents' })}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tSecretary('totalDocuments', { defaultValue: 'Total Documents' })}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.total}</p>
              </div>
              <Archive className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tSecretary('contributions', { defaultValue: 'Contributions' })}
                </p>
                <p className="text-2xl font-bold text-green-600">{summary.contributions || 0}</p>
              </div>
              <FileText className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tSecretary('loans', { defaultValue: 'Loans' })}
                </p>
                <p className="text-2xl font-bold text-blue-600">{summary.loans || 0}</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tSecretary('meetingMinutes', { defaultValue: 'Meeting Minutes' })}
                </p>
                <p className="text-2xl font-bold text-purple-600">{summary.meetings}</p>
              </div>
              <FileText className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2 overflow-x-auto">
              {['attendance', 'contributions', 'loans', 'meetings', 'announcements', 'fines', 'rules'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Action buttons for attendance, contributions, and loans tabs */}
            {['attendance', 'contributions', 'loans'].includes(activeTab) && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'attendance' && (
                      <button
                        onClick={handleExportAttendance}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FileSpreadsheet size={18} /> Export Attendance (Excel)
                      </button>
                    )}
                    {activeTab === 'contributions' && (
                      <button
                        onClick={handleArchiveContributions}
                        disabled={archiving}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                      >
                        {archiving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Archiving...
                          </>
                        ) : (
                          <>
                            <Archive size={18} /> Archive Contributions
                          </>
                        )}
                      </button>
                    )}
                    {activeTab === 'loans' && (
                      <button
                        onClick={handleArchiveLoans}
                        disabled={archiving}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                      >
                        {archiving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Archiving...
                          </>
                        ) : (
                          <>
                            <Archive size={18} /> Archive Loans
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {activeTab === 'attendance' && 'Export all attendance records as Excel file'}
                  {activeTab === 'contributions' && 'Compile and save all contributions as one archived document'}
                  {activeTab === 'loans' && 'Compile and save all loan requests as one archived document'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={tSecretary('searchDocuments', { defaultValue: 'Search documents...' })}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input-field"
                >
                  <option value="all">{t('allDates', { defaultValue: 'All Dates' })}</option>
                  <option value="thisMonth">{t('thisMonth', { defaultValue: 'This Month' })}</option>
                  <option value="lastMonth">{t('lastMonth', { defaultValue: 'Last Month' })}</option>
                  <option value="thisYear">{t('thisYear', { defaultValue: 'This Year' })}</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading documents...</p>
                </div>
              </div>
            ) : getCurrentDocuments().length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Archive className="mx-auto mb-2" size={48} />
                <p>No archived documents found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getCurrentDocuments().map((doc) => (
                  <div key={doc.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold">
                          {doc.title[0]?.toUpperCase() || 'D'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 dark:text-white">{doc.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getCategoryLabel(doc.category)} • {formatFileSize(doc.fileSize)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDate(doc.createdAt)} • Uploaded by: {doc.uploader?.name || 'Unknown'} ({doc.uploadedByRole})
                          </p>
                          {doc.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {doc.description.length > 100 ? doc.description.substring(0, 100) + '...' : doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleView(doc)}
                          className="btn-primary text-sm px-3 py-1 flex items-center gap-1"
                        >
                          <Eye size={14} /> {t('view', { defaultValue: 'View' })}
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                        >
                          <Download size={14} /> {t('download', { defaultValue: 'Download' })}
                        </button>
                        <button
                          onClick={() => handleExportExcel(doc)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                          title="Export to Excel"
                        >
                          <FileSpreadsheet size={14} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryArchive
