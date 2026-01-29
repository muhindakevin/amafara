import { useState, useEffect, useContext } from 'react'
import { FileText, Plus, Edit, Trash2, Download, Search, Filter, CheckCircle, XCircle, Clock, Users, Calendar, Upload, Save, RefreshCw, Eye, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { createPDFDocument, savePDF, formatDate as formatDatePDF } from '../utils/pdfExport'
import jsPDF from 'jspdf'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function SecretaryMeetings() {
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [showRecordMinutes, setShowRecordMinutes] = useState(false)
  const [showTakeAttendance, setShowTakeAttendance] = useState(false)
  const [showEditMeeting, setShowEditMeeting] = useState(false)
  const [showPostponeMeeting, setShowPostponeMeeting] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [showMeetingDetails, setShowMeetingDetails] = useState(false)
  const [showViewMinutes, setShowViewMinutes] = useState(false)
  const [showViewAttendance, setShowViewAttendance] = useState(false)
  const [showViewFines, setShowViewFines] = useState(false)
  const [meetings, setMeetings] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [meetingFines, setMeetingFines] = useState([])
  const [loadingFines, setLoadingFines] = useState(false)
  const [summary, setSummary] = useState({ total: 0, completed: 0, scheduled: 0, minutesRecorded: 0 })

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    agenda: ''
  })

  const [editMeeting, setEditMeeting] = useState({
    title: '',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    agenda: ''
  })

  const [minutes, setMinutes] = useState('')
  const [attendance, setAttendance] = useState([]) // Array of member IDs
  const [postponeData, setPostponeData] = useState({
    newDate: '',
    newTime: '',
    reason: ''
  })

  // Fetch meetings
  useEffect(() => {
    fetchMeetings()
    fetchGroupMembers()
  }, [filterStatus, searchTerm])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)

      console.log('[SecretaryMeetings] Fetching meetings with params:', params.toString())
      const response = await api.get(`/meetings?${params.toString()}`)
      console.log('[SecretaryMeetings] API response:', {
        success: response.data.success,
        dataLength: response.data.data?.length || 0
      })

      if (response.data.success) {
        let meetingsData = response.data.data || []
        console.log('[SecretaryMeetings] Received', meetingsData.length, 'meetings from API')

        // Log meeting details
        if (meetingsData.length > 0) {
          console.log('[SecretaryMeetings] Sample meetings:', meetingsData.slice(0, 3).map(m => ({
            id: m.id,
            title: m.title,
            status: m.status,
            scheduledDate: m.scheduledDate,
            hasAttendance: !!m.attendance
          })))
        }

        // Fetch full details for each meeting to get attendanceTakenBy info
        const meetingsWithDetails = await Promise.all(
          meetingsData.map(async (meeting) => {
            try {
              const detailResponse = await api.get(`/meetings/${meeting.id}`)
              if (detailResponse.data.success) {
                return {
                  ...meeting,
                  ...detailResponse.data.data,
                  attendanceTakenByUser: detailResponse.data.data.attendanceTakenByUser,
                  attendanceTaken: detailResponse.data.data.attendanceTaken
                }
              }
            } catch (err) {
              console.error(`[SecretaryMeetings] Error fetching details for meeting ${meeting.id}:`, err)
            }
            return meeting
          })
        )

        console.log('[SecretaryMeetings] After fetching details:', meetingsWithDetails.length, 'meetings')

        // Apply search filter on frontend (or can be done on backend)
        if (searchTerm) {
          meetingsData = meetingsWithDetails.filter(meeting =>
            meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.id?.toString().includes(searchTerm) ||
            meeting.location?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        } else {
          meetingsData = meetingsWithDetails
        }

        // Sort meetings: completed first (most recent first), then others by date
        meetingsData.sort((a, b) => {
          // Completed meetings first
          if (a.status === 'completed' && b.status !== 'completed') return -1
          if (a.status !== 'completed' && b.status === 'completed') return 1

          // Within same status, sort by date (most recent first)
          const dateA = new Date(a.scheduledDate || a.createdAt || 0)
          const dateB = new Date(b.scheduledDate || b.createdAt || 0)
          return dateB - dateA
        })

        setMeetings(meetingsData)

        // Calculate summary
        const total = meetingsData.length
        const completed = meetingsData.filter(m => m.status === 'completed').length
        const scheduled = meetingsData.filter(m => m.status === 'scheduled').length
        const minutesRecorded = meetingsData.filter(m => m.minutes && m.minutes.trim()).length

        setSummary({ total, completed, scheduled, minutesRecorded })
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupMembers = async () => {
    try {
      // Get secretary's groupId from user info
      const userResponse = await api.get('/auth/me')
      if (userResponse.data.success && userResponse.data.data.groupId) {
        const groupId = userResponse.data.data.groupId
        const membersResponse = await api.get(`/groups/${groupId}/members`)
        if (membersResponse.data.success) {
          setGroupMembers(membersResponse.data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching group members:', error)
    }
  }

  const fetchMeetingDetails = async (meetingId) => {
    try {
      setLoadingDetails(true)
      const response = await api.get(`/meetings/${meetingId}`)
      if (response.data.success) {
        setMeetingDetails(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'scheduled': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'ongoing': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const handleCreateMeeting = async () => {
    try {
      if (!newMeeting.title || !newMeeting.scheduledDate || !newMeeting.scheduledTime) {
        alert('Please fill in title, date, and time')
        return
      }

      // Get secretary's groupId
      const userResponse = await api.get('/auth/me')
      if (!userResponse.data.success || !userResponse.data.data.groupId) {
        alert('Unable to determine your group. Please try again.')
        return
      }

      const groupId = userResponse.data.data.groupId

      const response = await api.post('/meetings', {
        ...newMeeting,
        groupId
      })

      if (response.data.success) {
        alert('Meeting created successfully!')
        setShowCreateMeeting(false)
        setNewMeeting({
          title: '',
          scheduledDate: '',
          scheduledTime: '',
          location: '',
          agenda: ''
        })
        fetchMeetings()
      }
    } catch (error) {
      console.error('Error creating meeting:', error)
      alert(error.response?.data?.message || 'Failed to create meeting')
    }
  }

  const handleViewMeetingDetails = async (meeting) => {
    setSelectedMeeting(meeting)
    setShowMeetingDetails(true)
    await fetchMeetingDetails(meeting.id)
  }

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting)
    setEditMeeting({
      title: meeting.title || '',
      scheduledDate: meeting.scheduledDate ? new Date(meeting.scheduledDate).toISOString().split('T')[0] : '',
      scheduledTime: meeting.scheduledTime || '',
      location: meeting.location || '',
      agenda: meeting.agenda || ''
    })
    setShowEditMeeting(true)
  }

  const handleUpdateMeeting = async () => {
    try {
      const response = await api.put(`/meetings/${selectedMeeting.id}`, editMeeting)
      if (response.data.success) {
        alert('Meeting updated successfully!')
        setShowEditMeeting(false)
        fetchMeetings()
      }
    } catch (error) {
      console.error('Error updating meeting:', error)
      alert(error.response?.data?.message || 'Failed to update meeting')
    }
  }

  const handlePostponeMeeting = (meeting) => {
    setSelectedMeeting(meeting)
    setPostponeData({
      newDate: meeting.scheduledDate ? new Date(meeting.scheduledDate).toISOString().split('T')[0] : '',
      newTime: meeting.scheduledTime || '',
      reason: ''
    })
    setShowPostponeMeeting(true)
  }

  const handlePostpone = async () => {
    try {
      if (!postponeData.newDate || !postponeData.newTime) {
        alert('Please provide new date and time')
        return
      }

      const response = await api.put(`/meetings/${selectedMeeting.id}/postpone`, postponeData)
      if (response.data.success) {
        alert('Meeting postponed successfully!')
        setShowPostponeMeeting(false)
        fetchMeetings()
      }
    } catch (error) {
      console.error('Error postponing meeting:', error)
      alert(error.response?.data?.message || 'Failed to postpone meeting')
    }
  }

  const handleRecordMinutes = (meeting) => {
    setSelectedMeeting(meeting)
    setMinutes(meeting.minutes || '')
    // Check if meeting is in the past
    const meetingDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : null
    const isPastMeeting = meetingDate && meetingDate < new Date()
    // For past meetings, show view modal instead
    if (isPastMeeting && meeting.minutes) {
      handleViewMinutes(meeting)
    } else {
      setShowRecordMinutes(true)
    }
  }

  const handleSaveMinutes = async () => {
    try {
      if (!minutes.trim()) {
        alert('Please enter meeting minutes')
        return
      }

      const response = await api.put(`/meetings/${selectedMeeting.id}/minutes`, { minutes })
      if (response.data.success) {
        alert('Meeting minutes recorded successfully!')
        setShowRecordMinutes(false)
        setMinutes('')
        fetchMeetings()
        if (showMeetingDetails) {
          await fetchMeetingDetails(selectedMeeting.id)
        }
      }
    } catch (error) {
      console.error('Error recording minutes:', error)
      alert(error.response?.data?.message || 'Failed to record minutes')
    }
  }

  const handleTakeAttendance = async (meeting) => {
    // Check if meeting is in the past
    const meetingDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : null
    const isPastMeeting = meetingDate && meetingDate < new Date()

    // For past meetings, show view modal instead
    if (isPastMeeting) {
      handleViewAttendanceModal(meeting)
      return
    }

    // Fetch full meeting details to check who took attendance
    try {
      const response = await api.get(`/meetings/${meeting.id}`)
      if (response.data.success) {
        const fullMeeting = response.data.data

        // Check if attendance was taken by Group Admin
        if (fullMeeting.attendanceTaken && fullMeeting.attendanceTakenByUser &&
          fullMeeting.attendanceTakenByUser.role === 'Group Admin') {
          // Show view-only modal instead
          setSelectedMeeting(fullMeeting)
          setShowTakeAttendance(false)
          // Open view attendance modal
          handleViewAttendanceModal(fullMeeting)
          return
        }
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error)
    }

    setSelectedMeeting(meeting)
    // Initialize attendance with existing attendance if any
    setAttendance(meeting.attendance && Array.isArray(meeting.attendance) ? [...meeting.attendance] : [])
    setShowTakeAttendance(true)
  }

  const handleViewAttendance = (meeting) => {
    setSelectedMeeting(meeting)
    setShowTakeAttendance(true) // Reuse the same modal but in view mode
  }

  const handleSaveAttendance = async () => {
    try {
      const response = await api.put(`/meetings/${selectedMeeting.id}/attendance`, { attendance })
      if (response.data.success) {
        alert('Attendance recorded successfully!')
        setShowTakeAttendance(false)
        setAttendance([])
        fetchMeetings()
        if (showMeetingDetails) {
          await fetchMeetingDetails(selectedMeeting.id)
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert(error.response?.data?.message || 'Failed to save attendance')
    }
  }

  const toggleMemberAttendance = (memberId) => {
    if (attendance.includes(memberId)) {
      setAttendance(attendance.filter(id => id !== memberId))
    } else {
      setAttendance([...attendance, memberId])
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return

    try {
      const response = await api.delete(`/meetings/${meetingId}`)
      if (response.data.success) {
        alert('Meeting deleted successfully!')
        fetchMeetings()
      }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      alert(error.response?.data?.message || 'Failed to delete meeting')
    }
  }

  const handleViewMinutes = (meeting) => {
    setSelectedMeeting(meeting)
    setShowViewMinutes(true)
  }

  const handleViewAttendanceModal = (meeting) => {
    setSelectedMeeting(meeting)
    setShowViewAttendance(true)
  }

  const handleViewFines = async (meeting) => {
    setSelectedMeeting(meeting)
    setShowViewFines(true)
    setLoadingFines(true)
    try {
      const response = await api.get(`/meetings/${meeting.id}/fines`)
      if (response.data.success) {
        setMeetingFines(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching meeting fines:', error)
      setMeetingFines([])
    } finally {
      setLoadingFines(false)
    }
  }

  const handleExportMeetingReport = async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}/export`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `meeting_report_${meetingId}_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      alert('Meeting report exported successfully!')
    } catch (error) {
      console.error('Error exporting meeting report:', error)
      alert('Failed to export meeting report')
    }
  }

  const handleExportMinutes = async (meetingId) => {
    try {
      // Fetch meeting details first
      const response = await api.get(`/meetings/${meetingId}`)
      if (response.data.success) {
        const meeting = response.data.data

        // Create PDF document
        const { doc, pageWidth } = createPDFDocument(
          'Meeting Minutes',
          meeting.title || 'Meeting Documentation'
        )

        let yPos = 60

        // Meeting Information
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 64, 175)
        doc.text('Meeting Information', 15, yPos)
        yPos += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(31, 41, 55)
        doc.text(`Title: ${meeting.title || 'N/A'}`, 15, yPos)
        yPos += 7
        doc.text(`Date: ${meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString() : 'N/A'}`, 15, yPos)
        yPos += 7
        doc.text(`Time: ${meeting.scheduledTime || 'N/A'}`, 15, yPos)
        yPos += 7
        doc.text(`Location: ${meeting.location || 'N/A'}`, 15, yPos)
        yPos += 7
        doc.text(`Status: ${meeting.status || 'N/A'}`, 15, yPos)
        yPos += 7
        doc.text(`Created By: ${meeting.creator?.name || 'Unknown'}`, 15, yPos)
        yPos += 10

        // Agenda
        if (meeting.agendaItems && meeting.agendaItems.length > 0) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 64, 175)
          doc.text('Agenda', 15, yPos)
          yPos += 7

          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(31, 41, 55)
          meeting.agendaItems.forEach((item, index) => {
            if (yPos > 270) {
              doc.addPage()
              yPos = 20
            }
            doc.text(`${index + 1}. ${item}`, 20, yPos)
            yPos += 7
          })
          yPos += 5
        } else if (meeting.agenda) {
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 64, 175)
          doc.text('Agenda', 15, yPos)
          yPos += 7

          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(31, 41, 55)
          const agendaLines = meeting.agenda.split('\n')
          agendaLines.forEach(line => {
            if (yPos > 270) {
              doc.addPage()
              yPos = 20
            }
            doc.text(line.trim(), 20, yPos)
            yPos += 7
          })
          yPos += 5
        }

        // Minutes
        if (meeting.minutes) {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 64, 175)
          doc.text('Meeting Minutes', 15, yPos)
          yPos += 7

          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(31, 41, 55)
          const minutesLines = meeting.minutes.split('\n')
          minutesLines.forEach(line => {
            if (yPos > 270) {
              doc.addPage()
              yPos = 20
            }
            doc.text(line.trim(), 20, yPos, { maxWidth: pageWidth - 40 })
            yPos += 7
          })
          yPos += 5
        }

        // Attendance
        if (meeting.attendanceDetails && meeting.attendanceDetails.length > 0) {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(30, 64, 175)
          doc.text('Attendance', 15, yPos)
          yPos += 7

          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(31, 41, 55)
          doc.text(`Total Attendees: ${meeting.attendeesCount || 0}`, 20, yPos)
          yPos += 7
          doc.text(`Absent: ${meeting.absentCount || 0}`, 20, yPos)
          yPos += 10

          doc.setFont('helvetica', 'bold')
          doc.text('Present Members:', 20, yPos)
          yPos += 7
          doc.setFont('helvetica', 'normal')
          meeting.attendanceDetails.forEach(member => {
            if (yPos > 270) {
              doc.addPage()
              yPos = 20
            }
            doc.text(`- ${member.name} (${member.phone || 'N/A'})`, 25, yPos)
            yPos += 7
          })
        }

        // Save PDF
        savePDF(doc, `Meeting_Minutes_${meetingId}`)
        alert('Meeting minutes exported as PDF successfully!')
      }
    } catch (error) {
      console.error('Error exporting minutes:', error)
      alert('Failed to export minutes')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    // Convert HH:mm to readable format
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading meetings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('meetingDocumentation', { defaultValue: 'Meeting Documentation' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('recordAndArchiveMinutes', { defaultValue: 'Record and archive meeting minutes and decisions' })}</p>
          </div>
          <div className="flex gap-2">
            {hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
              <button
                onClick={() => setShowCreateMeeting(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} /> {t('scheduleMeeting', { defaultValue: 'Schedule Meeting' })}
              </button>
            )}
            <button
              onClick={fetchMeetings}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalMeetings', { defaultValue: 'Total Meetings' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.total}</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('completed', { defaultValue: 'Completed' })}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.completed}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('scheduled', { defaultValue: 'Scheduled' })}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.scheduled}</p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('minutesRecorded', { defaultValue: 'Minutes Recorded' })}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.minutesRecorded}</p>
              </div>
              <FileText className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('searchMeetings', { defaultValue: 'Search Meetings' })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchByTitleIdLocation', { defaultValue: 'Search by title, ID, or location...' })}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Meetings</option>
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Meeting Records ({meetings.length})
            </h2>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto mb-2" size={32} />
              <p>No meetings found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => {
                const hasMinutes = meeting.minutes && meeting.minutes.trim()
                const attendeesCount = meeting.attendance && Array.isArray(meeting.attendance) ? meeting.attendance.length : 0
                const creatorName = meeting.creator?.name || 'Unknown'
                const attendanceTaken = meeting.attendance && Array.isArray(meeting.attendance)
                // Check if meeting is in the past
                const meetingDate = meeting.scheduledDate ? new Date(meeting.scheduledDate) : null
                const isPastMeeting = meetingDate && meetingDate < new Date()
                // Check if attendance was taken by Group Admin (Secretary can only view)
                const attendanceTakenByGroupAdmin = meeting.attendanceTakenByUser &&
                  meeting.attendanceTakenByUser.role === 'Group Admin'

                return (
                  <div
                    key={meeting.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {meeting.title?.[0] || 'M'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-white">{meeting.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{meeting.location || 'No location'}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            {formatDate(meeting.scheduledDate)} at {formatTime(meeting.scheduledTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                        {attendanceTaken && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-semibold">
                            ✓ Attendance
                          </span>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {attendeesCount} attendees
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Meeting ID</p>
                        <p className="font-semibold dark:text-white">MT{meeting.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Minutes Recorded</p>
                        <p className="font-semibold dark:text-white">{hasMinutes ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Created By</p>
                        <p className="font-semibold dark:text-white">{creatorName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Created Date</p>
                        <p className="font-semibold dark:text-white">{formatDate(meeting.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewMeetingDetails(meeting)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <FileText size={16} /> View Details
                      </button>
                      {hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                        <button
                          onClick={() => handleEditMeeting(meeting)}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Edit size={16} /> Edit
                        </button>
                      )}
                      {meeting.status === 'scheduled' && hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                        <button
                          onClick={() => handlePostponeMeeting(meeting)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Calendar size={16} /> Postpone
                        </button>
                      )}
                      {isPastMeeting ? (
                        <>
                          {hasMinutes && (
                            <button
                              onClick={() => handleViewMinutes(meeting)}
                              className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <Eye size={16} /> View Minutes
                            </button>
                          )}
                          {attendanceTaken && (
                            <button
                              onClick={() => handleViewAttendanceModal(meeting)}
                              className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <Eye size={16} /> View Attendance
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {!hasMinutes && hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                            <button
                              onClick={() => handleRecordMinutes(meeting)}
                              className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <Edit size={16} /> Record Minutes
                            </button>
                          )}
                          {attendanceTaken && attendanceTakenByGroupAdmin ? (
                            <button
                              onClick={() => handleViewAttendanceModal(meeting)}
                              className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <Eye size={16} /> View Attendance
                            </button>
                          ) : (
                            hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                              <button
                                onClick={() => handleTakeAttendance(meeting)}
                                className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <Users size={16} /> {attendanceTaken ? 'Update Attendance' : 'Take Attendance'}
                              </button>
                            )
                          )}
                        </>
                      )}
                      {hasMinutes && hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
                        <button
                          onClick={() => handleExportMinutes(meeting.id)}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Download size={16} /> Export
                        </button>
                      )}
                      {hasPermission(user, PERMISSIONS.MANAGE_GROUPS) && (
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Schedule Meeting</h2>
                <button
                  onClick={() => setShowCreateMeeting(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Meeting Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                      className="input-field"
                      placeholder="Enter meeting title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newMeeting.scheduledDate}
                      onChange={(e) => setNewMeeting({ ...newMeeting, scheduledDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newMeeting.scheduledTime}
                      onChange={(e) => setNewMeeting({ ...newMeeting, scheduledTime: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newMeeting.location}
                      onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                      className="input-field"
                      placeholder="Enter meeting location..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Agenda
                  </label>
                  <textarea
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter meeting agenda items (one per line)..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateMeeting(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    className="btn-primary flex-1"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Meeting Modal */}
        {showEditMeeting && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Meeting</h2>
                <button
                  onClick={() => setShowEditMeeting(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={editMeeting.title}
                      onChange={(e) => setEditMeeting({ ...editMeeting, title: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editMeeting.scheduledDate}
                      onChange={(e) => setEditMeeting({ ...editMeeting, scheduledDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={editMeeting.scheduledTime}
                      onChange={(e) => setEditMeeting({ ...editMeeting, scheduledTime: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editMeeting.location}
                      onChange={(e) => setEditMeeting({ ...editMeeting, location: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Agenda
                  </label>
                  <textarea
                    value={editMeeting.agenda}
                    onChange={(e) => setEditMeeting({ ...editMeeting, agenda: e.target.value })}
                    className="input-field h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditMeeting(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMeeting}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Postpone Meeting Modal */}
        {showPostponeMeeting && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Postpone Meeting</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Current: {formatDate(selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.scheduledTime)}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      New Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={postponeData.newDate}
                      onChange={(e) => setPostponeData({ ...postponeData, newDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      New Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={postponeData.newTime}
                      onChange={(e) => setPostponeData({ ...postponeData, newTime: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Reason (Optional)
                    </label>
                    <textarea
                      value={postponeData.reason}
                      onChange={(e) => setPostponeData({ ...postponeData, reason: e.target.value })}
                      className="input-field h-20 resize-none"
                      placeholder="Enter reason for postponement..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPostponeMeeting(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostpone}
                    className="btn-primary flex-1"
                  >
                    Postpone Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record Minutes Modal */}
        {showRecordMinutes && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Record Meeting Minutes</h2>
                <button
                  onClick={() => setShowRecordMinutes(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{selectedMeeting.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.scheduledTime)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Minutes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="input-field h-64 resize-none"
                    placeholder="Enter detailed meeting minutes..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRecordMinutes(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMinutes}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Minutes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Take Attendance Modal */}
        {showTakeAttendance && selectedMeeting && (() => {
          const attendanceTakenByGroupAdmin = selectedMeeting.attendanceTakenByUser &&
            selectedMeeting.attendanceTakenByUser.role === 'Group Admin'
          const isViewOnly = attendanceTakenByGroupAdmin

          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                      {isViewOnly ? 'View Attendance' : 'Take Attendance'}
                    </h2>
                    {isViewOnly && selectedMeeting.attendanceTakenByUser && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Taken by {selectedMeeting.attendanceTakenByUser.name} ({selectedMeeting.attendanceTakenByUser.role})
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTakeAttendance(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{selectedMeeting.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.scheduledTime)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Selected: {attendance.length} member(s)
                    </p>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Selected:</span> {attendance.length} present | {groupMembers.length - attendance.length} absent
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {groupMembers.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">No members found</p>
                    ) : (
                      <>
                        {/* Show present members first */}
                        {groupMembers.filter(m => attendance.includes(m.id)).length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Present Members ({groupMembers.filter(m => attendance.includes(m.id)).length})</h5>
                            {groupMembers
                              .filter(m => attendance.includes(m.id))
                              .map((member) => {
                                const isPresent = true
                                return (
                                  <div
                                    key={member.id}
                                    onClick={() => !isViewOnly && toggleMemberAttendance(member.id)}
                                    className={`p-3 rounded-lg border-2 transition-all bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400 mb-2 ${isViewOnly ? '' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-green-500 text-white">
                                          {member.name?.[0] || 'M'}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-800 dark:text-white">{member.name}</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                                        </div>
                                      </div>
                                      <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )}

                        {/* Show absent members */}
                        {groupMembers.filter(m => !attendance.includes(m.id)).length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Absent Members ({groupMembers.filter(m => !attendance.includes(m.id)).length})</h5>
                            {groupMembers
                              .filter(m => !attendance.includes(m.id))
                              .map((member) => {
                                const isPresent = false
                                return (
                                  <div
                                    key={member.id}
                                    onClick={() => !isViewOnly && toggleMemberAttendance(member.id)}
                                    className={`p-3 rounded-lg border-2 transition-all bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 hover:border-red-500 dark:hover:border-red-400 mb-2 ${isViewOnly ? '' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-red-300 dark:bg-red-600 text-gray-700 dark:text-gray-300">
                                          {member.name?.[0] || 'M'}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-800 dark:text-white">{member.name}</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                                        </div>
                                      </div>
                                      <XCircle className="text-red-600 dark:text-red-400" size={24} />
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowTakeAttendance(false)}
                      className="btn-secondary flex-1"
                    >
                      {isViewOnly ? 'Close' : 'Cancel'}
                    </button>
                    {!isViewOnly && (
                      <button
                        onClick={handleSaveAttendance}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Save size={18} /> Save Attendance ({attendance.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Meeting Details Modal */}
        {showMeetingDetails && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meeting Details</h2>
                <button
                  onClick={() => {
                    setShowMeetingDetails(false)
                    setMeetingDetails(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading details...</p>
                </div>
              ) : meetingDetails ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                      {meetingDetails.title?.[0] || 'M'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{meetingDetails.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{meetingDetails.location || 'No location'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {formatDate(meetingDetails.scheduledDate)} at {formatTime(meetingDetails.scheduledTime)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Meeting Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Meeting ID:</span>
                          <span className="font-semibold dark:text-white">MT{meetingDetails.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Attendees:</span>
                          <span className="font-semibold dark:text-white">{meetingDetails.attendeesCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(meetingDetails.status)}`}>
                            {meetingDetails.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Created By:</span>
                          <span className="font-semibold dark:text-white">{meetingDetails.creator?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Minutes Recorded:</span>
                          <span className="font-semibold dark:text-white">{meetingDetails.minutesRecorded ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {meetingDetails.agendaItems && meetingDetails.agendaItems.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Meeting Agenda</h4>
                      <div className="space-y-2">
                        {meetingDetails.agendaItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <span className="text-gray-800 dark:text-white">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {meetingDetails.minutes && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Meeting Minutes</h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg whitespace-pre-line text-gray-800 dark:text-white">
                        {meetingDetails.minutes}
                      </div>
                    </div>
                  )}

                  {(meetingDetails.attendanceTaken || (meetingDetails.attendanceDetails && meetingDetails.attendanceDetails.length > 0)) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Attendance Record</h4>
                        {meetingDetails.attendanceTaken && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
                            ✓ Attendance Taken
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Present: <span className="font-semibold text-green-600 dark:text-green-400">{meetingDetails.attendeesCount || 0}</span> |
                          Absent: <span className="font-semibold text-red-600 dark:text-red-400">{meetingDetails.absentCount || 0}</span>
                        </p>
                      </div>
                      {meetingDetails.attendanceDetails && meetingDetails.attendanceDetails.length > 0 ? (
                        <div className="space-y-2">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Present Members</h5>
                            {meetingDetails.attendanceDetails.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {member.name?.[0] || 'M'}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-800 dark:text-white">{member.name}</span>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                                  </div>
                                </div>
                                <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                              </div>
                            ))}
                          </div>
                          {meetingDetails.absentMembers && meetingDetails.absentMembers.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Absent Members</h5>
                              {meetingDetails.absentMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                      {member.name?.[0] || 'M'}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-gray-800 dark:text-white">{member.name}</span>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                                    </div>
                                  </div>
                                  <XCircle className="text-red-600 dark:text-red-400" size={20} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : meetingDetails.attendanceTaken ? (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            Attendance was taken but no members were marked as present.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-4">
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Actions</h4>

                      {/* View Minutes and Export PDF - Always show if minutes exist */}
                      {meetingDetails.minutes ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            onClick={() => handleViewMinutes(meetingDetails)}
                            className="btn-primary flex items-center justify-center gap-2"
                          >
                            <FileText size={18} /> View Minutes
                          </button>
                          <button
                            onClick={() => handleExportMinutes(selectedMeeting.id)}
                            className="btn-secondary flex items-center justify-center gap-2"
                          >
                            <Download size={18} /> Export Minutes as PDF
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            No minutes recorded for this meeting yet.
                          </p>
                        </div>
                      )}

                      {/* Other action buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(meetingDetails.attendanceTaken || (meetingDetails.attendanceDetails && meetingDetails.attendanceDetails.length > 0)) && (
                          <button
                            onClick={() => handleViewAttendanceModal(meetingDetails)}
                            className="btn-primary flex items-center justify-center gap-2"
                          >
                            <Users size={18} /> View Attendance
                          </button>
                        )}
                        <button
                          onClick={() => handleViewFines(meetingDetails)}
                          className="btn-primary flex items-center justify-center gap-2"
                        >
                          <AlertCircle size={18} /> View Fines
                        </button>
                        <button
                          onClick={() => handleExportMeetingReport(selectedMeeting.id)}
                          className="btn-secondary flex items-center justify-center gap-2"
                        >
                          <Download size={18} /> Export Excel Report
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowMeetingDetails(false)
                        setMeetingDetails(null)
                      }}
                      className="btn-secondary w-full"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p>Failed to load meeting details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Minutes Modal */}
        {showViewMinutes && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meeting Minutes</h2>
                <button
                  onClick={() => setShowViewMinutes(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedMeeting.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.scheduledTime)}
                  </p>
                </div>
                {selectedMeeting.minutes ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg whitespace-pre-line text-gray-800 dark:text-white">
                    {selectedMeeting.minutes}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-800 dark:text-yellow-300">No minutes recorded for this meeting.</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowViewMinutes(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Attendance Modal */}
        {showViewAttendance && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meeting Attendance</h2>
                <button
                  onClick={() => setShowViewAttendance(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedMeeting.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.scheduledTime)}
                  </p>
                </div>
                {selectedMeeting.attendanceDetails && selectedMeeting.attendanceDetails.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Present: <span className="font-semibold text-green-600 dark:text-green-400">{selectedMeeting.attendeesCount || 0}</span> |
                        Absent: <span className="font-semibold text-red-600 dark:text-red-400">{selectedMeeting.absentCount || 0}</span>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Present Members</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedMeeting.attendanceDetails.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {member.name?.[0] || 'M'}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 dark:text-white">{member.name}</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                              </div>
                            </div>
                            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedMeeting.absentMembers && selectedMeeting.absentMembers.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Absent Members</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedMeeting.absentMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {member.name?.[0] || 'M'}
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-800 dark:text-white">{member.name}</span>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                                </div>
                              </div>
                              <XCircle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-800 dark:text-yellow-300">No attendance recorded for this meeting.</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowViewAttendance(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Fines Modal */}
        {showViewFines && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Fines Related to Meeting</h2>
                <button
                  onClick={() => {
                    setShowViewFines(false)
                    setMeetingFines([])
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedMeeting.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.scheduledTime)}
                  </p>
                </div>
                {loadingFines ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading fines...</p>
                  </div>
                ) : meetingFines.length > 0 ? (
                  <div className="space-y-3">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Fines: <span className="font-semibold">{meetingFines.length}</span> |
                        Total Amount: <span className="font-semibold">
                          {meetingFines.reduce((sum, fine) => sum + parseFloat(fine.amount || 0), 0).toLocaleString()} RWF
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {meetingFines.map((fine) => (
                        <div key={fine.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{fine.member?.name || 'Unknown Member'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{fine.member?.phone || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800 dark:text-white">{parseFloat(fine.amount || 0).toLocaleString()} RWF</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${fine.status === 'paid'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : fine.status === 'approved'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                {fine.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{fine.reason || 'No reason provided'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Issued: {fine.issuedDate ? new Date(fine.issuedDate).toLocaleDateString() : 'N/A'}
                            {fine.paidDate && ` | Paid: ${new Date(fine.paidDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-300">No fines related to this meeting.</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowViewFines(false)
                      setMeetingFines([])
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
      </div>
    </Layout>
  )
}

export default SecretaryMeetings
