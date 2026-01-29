import { useEffect, useState, useCallback, useContext } from 'react'
import { Calendar, Plus, FileText, Users, Clock, Download, Search, Filter, CheckCircle, XCircle, Edit, Eye, Trash2, X, ClipboardCheck, AlertCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'
import { formatDate, formatDateTimeFull } from '../utils/pdfExport'
import * as XLSX from 'xlsx'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function GroupAdminMeetings() {
  const { user } = useContext(UserContext)
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [showEditMeeting, setShowEditMeeting] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showAttendanceReview, setShowAttendanceReview] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [attendanceMeeting, setAttendanceMeeting] = useState(null)
  const [viewMinutes, setViewMinutes] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [saving, setSaving] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])
  const [attendanceList, setAttendanceList] = useState([])
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [sendingFine, setSendingFine] = useState(null)
  const [attendanceViewOnly, setAttendanceViewOnly] = useState(false)

  const [meetings, setMeetings] = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState(new Date().getMonth())
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(new Date().getFullYear())
  const { data: attendanceStats, setData: setAttendanceStats } = useApiState({
    totalMeetings: 0,
    averageAttendance: 0,
    upcomingMeetings: 0
  })

  // Load meetings from database
  const loadMeetings = useCallback(async () => {
    try {
      setMeetingsLoading(true)
      console.log('[GroupAdminMeetings] Loading meetings from database...')

      const list = await api.get('/meetings')
      console.log('[GroupAdminMeetings] API response:', list.data)

      if (!list.data?.success) {
        console.error('[GroupAdminMeetings] API returned unsuccessful response:', list.data)
        setMeetings([])
        setAttendanceStats({
          totalMeetings: 0,
          averageAttendance: 0,
          upcomingMeetings: 0
        })
        return
      }

      // Fetch full details for each meeting to get attendanceTakenBy info
      const meetingsWithDetails = await Promise.all(
        (list.data?.data || []).map(async (m) => {
          try {
            const detailResponse = await api.get(`/meetings/${m.id}`)
            if (detailResponse.data.success) {
              return {
                ...m,
                ...detailResponse.data.data,
                attendanceTakenByUser: detailResponse.data.data.attendanceTakenByUser,
                attendanceTaken: detailResponse.data.data.attendanceTaken
              }
            }
          } catch (err) {
            console.error(`Error fetching details for meeting ${m.id}:`, err)
          }
          return m
        })
      )

      const items = meetingsWithDetails.map(m => {
        const scheduledDate = m.scheduledDate ? new Date(m.scheduledDate) : null
        const dateStr = scheduledDate ? scheduledDate.toISOString().split('T')[0] : ''
        const timeStr = m.scheduledTime || ''

        // Parse agenda - can be string or array
        let agendaList = []
        if (Array.isArray(m.agenda)) {
          agendaList = m.agenda
        } else if (typeof m.agenda === 'string' && m.agenda.trim()) {
          // Try to parse as JSON, otherwise split by newline
          try {
            agendaList = JSON.parse(m.agenda)
            if (!Array.isArray(agendaList)) agendaList = [m.agenda]
          } catch {
            agendaList = m.agenda.split('\n').filter(item => item.trim())
          }
        }

        // Calculate attendance
        let attendanceList = []
        if (Array.isArray(m.attendance)) {
          attendanceList = m.attendance
        } else if (m.attendance && typeof m.attendance === 'string') {
          try {
            attendanceList = JSON.parse(m.attendance)
            if (!Array.isArray(attendanceList)) attendanceList = []
          } catch {
            attendanceList = []
          }
        }
        const attendees = attendanceList.length

        return {
          id: m.id,
          title: m.title || 'Meeting',
          date: dateStr,
          scheduledDate: scheduledDate,
          time: timeStr,
          location: m.location || '',
          type: m.type || 'regular',
          status: m.status || 'scheduled',
          attendees: attendees,
          attendance: attendanceList, // Store attendance array (array of member IDs)
          totalMembers: m.group?.totalMembers || 0,
          agenda: agendaList,
          minutes: m.minutes || null,
          minutesUploaded: !!m.minutes,
          recordedBy: m.creator?.name || null,
          groupId: m.groupId,
          attendanceTakenBy: m.attendanceTakenBy || null,
          attendanceTakenAt: m.attendanceTakenAt || null
        }
      })

      console.log(`[GroupAdminMeetings] Loaded ${items.length} meetings from database`)
      setMeetings(items)

      const completed = items.filter(m => m.status === 'completed')
      setAttendanceStats({
        totalMeetings: completed.length,
        averageAttendance: completed.length ? Math.round(completed.reduce((s, m) => s + ((m.attendees / (m.totalMembers || 1)) * 100), 0) / completed.length) : 0,
        upcomingMeetings: items.filter(m => ['upcoming', 'scheduled'].includes(m.status)).length
      })
    } catch (error) {
      console.error('[GroupAdminMeetings] Error loading meetings:', error)
      console.error('[GroupAdminMeetings] Error details:', error.response?.data || error.message)
      setMeetings([])
      setAttendanceStats({
        totalMeetings: 0,
        averageAttendance: 0,
        upcomingMeetings: 0
      })
    } finally {
      setMeetingsLoading(false)
    }
  }, [setAttendanceStats])

  useEffect(() => {
    // Get groupId and group name
    api.get('/auth/me')
      .then(res => {
        const currentGroupId = res.data?.data?.groupId
        if (currentGroupId) {
          setGroupId(currentGroupId)

          // Fetch group name
          api.get(`/groups/${currentGroupId}`)
            .then(groupRes => {
              if (groupRes.data?.success && groupRes.data?.data) {
                setGroupName(groupRes.data.data.name || '')
              }
            })
            .catch(err => console.error('[GroupAdminMeetings] Error fetching group name:', err))
        }
      })
      .catch(err => console.error('[GroupAdminMeetings] Error getting user info:', err))

    loadMeetings()
  }, [loadMeetings])

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'regular',
    agenda: ['']
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'upcoming': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'regular': return 'bg-blue-100 text-blue-700'
      case 'special': return 'bg-purple-100 text-purple-700'
      case 'emergency': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateMeeting = async () => {
    if (!groupId) {
      alert(t('groupInformationNotAvailable', { defaultValue: 'Group information not available' }))
      return
    }

    if (!newMeeting.title || !newMeeting.date || !newMeeting.time || !newMeeting.location) {
      alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    try {
      setSaving(true)

      // Filter out empty agenda items
      const agendaItems = newMeeting.agenda.filter(item => item.trim())

      const response = await api.post('/meetings', {
        groupId,
        title: newMeeting.title,
        scheduledDate: newMeeting.date,
        scheduledTime: newMeeting.time,
        location: newMeeting.location,
        agenda: agendaItems.length > 0 ? agendaItems : null
      })

      if (response.data?.success) {
        alert(t('meetingScheduledSuccessfully', { defaultValue: 'Meeting scheduled successfully! All group members have been notified.' }))
        setShowCreateMeeting(false)
        setNewMeeting({
          title: '',
          date: '',
          time: '',
          location: '',
          type: 'regular',
          agenda: ['']
        })
        // Reload meetings
        loadMeetings()
      } else {
        alert(t('failedToScheduleMeeting', { defaultValue: 'Failed to schedule meeting. Please try again.' }))
      }
    } catch (error) {
      console.error('[GroupAdminMeetings] Error creating meeting:', error)
      alert('Failed to schedule meeting. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditMeeting = (meeting) => {
    setEditingMeeting({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      location: meeting.location,
      type: meeting.type,
      agenda: meeting.agenda.length > 0 ? meeting.agenda : ['']
    })
    setShowEditMeeting(true)
  }

  const handleUpdateMeeting = async () => {
    if (!editingMeeting) return

    if (!editingMeeting.title || !editingMeeting.date || !editingMeeting.time || !editingMeeting.location) {
      alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    try {
      setSaving(true)

      const agendaItems = editingMeeting.agenda.filter(item => item.trim())

      const response = await api.put(`/meetings/${editingMeeting.id}`, {
        title: editingMeeting.title,
        scheduledDate: editingMeeting.date,
        scheduledTime: editingMeeting.time,
        location: editingMeeting.location,
        agenda: agendaItems.length > 0 ? agendaItems : null
      })

      if (response.data?.success) {
        alert(t('meetingUpdatedSuccessfully', { defaultValue: 'Meeting updated successfully!' }))
        setShowEditMeeting(false)
        setEditingMeeting(null)
        loadMeetings()
      } else {
        alert(t('failedToUpdateMeeting', { defaultValue: 'Failed to update meeting. Please try again.' }))
      }
    } catch (error) {
      console.error('[GroupAdminMeetings] Error updating meeting:', error)
      alert('Failed to update meeting. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm(t('confirmDeleteMeeting', { defaultValue: 'Are you sure you want to delete this meeting? This action cannot be undone.' }))) {
      return
    }

    try {
      const response = await api.delete(`/meetings/${meetingId}`)
      if (response.data?.success) {
        alert(t('meetingDeletedSuccessfully', { defaultValue: 'Meeting deleted successfully!' }))
        loadMeetings()
      } else {
        alert('Failed to delete meeting. Please try again.')
      }
    } catch (error) {
      console.error('[GroupAdminMeetings] Error deleting meeting:', error)
      alert('Failed to delete meeting. Please try again.')
    }
  }

  const handleApproveMinutes = (meetingId) => {
    alert(`Meeting minutes for meeting ${meetingId} approved!`)
  }

  // Export meeting attendance
  const handleExportAttendance = async (meeting) => {
    try {
      // If meeting doesn't have attendance, show message
      const hasAttendance = meeting.attendance && (
        (Array.isArray(meeting.attendance) && meeting.attendance.length > 0) ||
        (typeof meeting.attendance === 'string' && meeting.attendance.trim() !== '' && meeting.attendance !== '[]')
      )

      if (!hasAttendance) {
        alert('No attendance has been taken for this meeting yet.')
        return
      }

      // Load group members to get full member details
      const members = await loadGroupMembers(meeting.groupId)
      if (members.length === 0) {
        alert('No members found in this group.')
        return
      }

      // Parse attendance IDs
      let attendanceIds = []
      if (Array.isArray(meeting.attendance)) {
        attendanceIds = meeting.attendance.map(id => parseInt(id))
      } else if (typeof meeting.attendance === 'string') {
        try {
          const parsed = JSON.parse(meeting.attendance)
          if (Array.isArray(parsed)) {
            attendanceIds = parsed.map(id => parseInt(id))
          }
        } catch {
          attendanceIds = meeting.attendance.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        }
      }

      // Create attendance data with all members
      const attendanceData = members.map(member => {
        const isPresent = attendanceIds.includes(parseInt(member.id))
        return {
          'Member ID': member.id,
          'Member Name': member.name || 'N/A',
          'Phone': member.phone || 'N/A',
          'Email': member.email || 'N/A',
          'Attendance Status': isPresent ? 'Present' : 'Absent',
          'National ID': member.nationalId || 'N/A'
        }
      })

      // Prepare headers
      const headers = ['Member ID', 'Member Name', 'Phone', 'Email', 'Attendance Status', 'National ID']

      // Create summary
      const presentCount = attendanceData.filter(m => m['Attendance Status'] === 'Present').length
      const absentCount = attendanceData.filter(m => m['Attendance Status'] === 'Absent').length
      const totalCount = attendanceData.length

      // Format meeting date and time
      const meetingDate = meeting.scheduledDate ? formatDate(meeting.scheduledDate) : meeting.date
      const meetingTime = meeting.time || 'N/A'

      // Create Excel workbook manually for better control
      const workbook = XLSX.utils.book_new()
      const worksheetData = []

      // Add title
      worksheetData.push([`Meeting Attendance Report - ${meeting.title || 'Meeting'}`])
      worksheetData.push([])

      // Add meeting details
      worksheetData.push(['Group:', meeting.group?.name || 'N/A'])
      worksheetData.push(['Meeting Date:', meetingDate])
      worksheetData.push(['Meeting Time:', meetingTime])
      worksheetData.push(['Location:', meeting.location || 'N/A'])
      worksheetData.push(['Generated:', new Date().toLocaleString()])
      worksheetData.push([])

      // Add summary
      worksheetData.push(['SUMMARY'])
      worksheetData.push(['Total Members:', totalCount])
      worksheetData.push(['Present:', presentCount])
      worksheetData.push(['Absent:', absentCount])
      worksheetData.push(['Attendance Rate:', `${totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%`])
      worksheetData.push([])

      // Add headers
      worksheetData.push(headers)

      // Add data rows
      attendanceData.forEach(row => {
        worksheetData.push(Object.values(row))
      })

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Set column widths
      const colWidths = headers.map((_, index) => {
        const maxLength = Math.max(
          ...worksheetData.map(row => {
            const cell = row[index]
            return cell ? String(cell).length : 0
          })
        )
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
      })
      worksheet['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report')

      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0]
      const safeTitle = (meeting.title || 'Meeting').replace(/[^a-zA-Z0-9]/g, '_')
      const finalFilename = `Meeting_Attendance_${safeTitle}_${dateStr}.xlsx`

      // Save file
      XLSX.writeFile(workbook, finalFilename)

      alert('Attendance report exported successfully!')
    } catch (error) {
      console.error('[GroupAdminMeetings] Error exporting attendance:', error)
      alert('Failed to export attendance. Please try again.')
    }
  }

  // Load group members for attendance
  const loadGroupMembers = useCallback(async (meetingGroupId) => {
    try {
      const response = await api.get(`/groups/${meetingGroupId}/members`)
      if (response.data?.success) {
        const members = response.data.data || []
        setGroupMembers(members)
        console.log(`[GroupAdminMeetings] Loaded ${members.length} group members for attendance`)
        return members
      }
    } catch (error) {
      console.error('[GroupAdminMeetings] Error loading group members:', error)
      alert('Failed to load group members. Please try again.')
    }
    return []
  }, [])

  // Handle take attendance button
  const handleTakeAttendance = async (meeting) => {
    // Fetch full meeting details to check who took attendance
    try {
      const response = await api.get(`/meetings/${meeting.id}`)
      if (response.data.success) {
        const fullMeeting = response.data.data

        // Check if attendance was taken by Secretary
        if (fullMeeting.attendanceTaken && fullMeeting.attendanceTakenByUser &&
          fullMeeting.attendanceTakenByUser.role === 'Secretary') {
          // Show view-only modal instead
          alert(`Attendance has already been taken by ${fullMeeting.attendanceTakenByUser.name} (Secretary). You can only view it.`)
          handleViewAttendance(fullMeeting)
          return
        }
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error)
    }

    setAttendanceMeeting(meeting)

    // Load group members
    const members = await loadGroupMembers(meeting.groupId)
    if (members.length === 0) {
      alert('No members found in this group.')
      return
    }

    // Initialize attendance list - check if attendance already exists
    let initialAttendance = []
    if (meeting.attendance) {
      if (Array.isArray(meeting.attendance)) {
        initialAttendance = meeting.attendance
      } else if (typeof meeting.attendance === 'string') {
        try {
          initialAttendance = JSON.parse(meeting.attendance)
          if (!Array.isArray(initialAttendance)) initialAttendance = []
        } catch {
          initialAttendance = []
        }
      }
    }

    // Set attendance list with all members, marking those who attended
    const attendanceData = members.map(member => ({
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      present: initialAttendance.includes(member.id),
      fineSent: false
    }))

    // Check if attendance was taken by Secretary (view-only mode)
    const takenBySecretary = meeting.attendanceTakenByUser &&
      meeting.attendanceTakenByUser.role === 'Secretary'
    setAttendanceViewOnly(takenBySecretary)

    setAttendanceList(attendanceData)
    setShowAttendanceModal(true)
  }

  // View attendance review (for meetings that already have attendance)
  const handleViewAttendance = async (meeting) => {
    console.log('[GroupAdminMeetings] handleViewAttendance called for meeting:', meeting.id)
    console.log('[GroupAdminMeetings] Meeting attendance data:', meeting.attendance)
    console.log('[GroupAdminMeetings] Meeting attendance type:', typeof meeting.attendance)

    // Fetch full meeting details to get attendanceTakenBy info
    try {
      const response = await api.get(`/meetings/${meeting.id}`)
      if (response.data.success) {
        const fullMeeting = response.data.data
        meeting = { ...meeting, ...fullMeeting }
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error)
    }

    // Check if attendance exists - be more lenient with the check
    const hasAttendance = meeting.attendance && (
      (Array.isArray(meeting.attendance) && meeting.attendance.length > 0) ||
      (typeof meeting.attendance === 'string' && meeting.attendance.trim() !== '' && meeting.attendance !== '[]' && meeting.attendance !== 'null')
    )

    if (!hasAttendance) {
      alert('No attendance has been taken for this meeting yet.')
      return
    }

    // Check if attendance was taken by Secretary (view-only mode)
    const takenBySecretary = meeting.attendanceTakenByUser &&
      meeting.attendanceTakenByUser.role === 'Secretary'
    setAttendanceViewOnly(takenBySecretary)

    // Set attendance meeting first to show loading state
    setAttendanceMeeting(meeting)
    setShowAttendanceReview(true)
    setAttendanceList([]) // Clear previous attendance list

    try {
      // Load group members
      const members = await loadGroupMembers(meeting.groupId)
      if (members.length === 0) {
        alert('No members found in this group.')
        setShowAttendanceReview(false)
        setAttendanceMeeting(null)
        return
      }

      console.log('[GroupAdminMeetings] Loaded members:', members.length)

      // Get attendance list - handle different formats
      let attendanceIds = []
      if (Array.isArray(meeting.attendance)) {
        // Convert all to numbers for comparison
        attendanceIds = meeting.attendance.map(id => {
          const numId = typeof id === 'string' ? parseInt(id, 10) : id
          return isNaN(numId) ? null : numId
        }).filter(id => id !== null)
      } else if (typeof meeting.attendance === 'string') {
        try {
          const parsed = JSON.parse(meeting.attendance)
          if (Array.isArray(parsed)) {
            attendanceIds = parsed.map(id => {
              const numId = typeof id === 'string' ? parseInt(id, 10) : id
              return isNaN(numId) ? null : numId
            }).filter(id => id !== null)
          } else {
            attendanceIds = []
          }
        } catch (e) {
          // If not JSON, try splitting by comma
          attendanceIds = meeting.attendance.split(',').map(id => {
            const numId = parseInt(id.trim(), 10)
            return isNaN(numId) ? null : numId
          }).filter(id => id !== null)
        }
      }

      console.log('[GroupAdminMeetings] Parsed attendance IDs:', attendanceIds)

      // Set attendance list with all members - ensure proper ID comparison
      const attendanceData = members.map(member => {
        const memberId = typeof member.id === 'string' ? parseInt(member.id, 10) : member.id
        const isPresent = attendanceIds.some(attId => {
          const attIdNum = typeof attId === 'string' ? parseInt(attId, 10) : attId
          return attIdNum === memberId
        })

        return {
          memberId: memberId,
          memberName: member.name || 'Unknown',
          memberPhone: member.phone || '',
          present: isPresent,
          fineSent: false // We'll check this from fines later
        }
      })

      console.log('[GroupAdminMeetings] Created attendance data:', attendanceData.length, 'members')
      console.log('[GroupAdminMeetings] Present:', attendanceData.filter(m => m.present).length)
      console.log('[GroupAdminMeetings] Absent:', attendanceData.filter(m => !m.present).length)
      console.log('[GroupAdminMeetings] Sample attendance data:', attendanceData.slice(0, 3))

      setAttendanceList(attendanceData)
      console.log('[GroupAdminMeetings] Attendance review should now be visible with data')
    } catch (error) {
      console.error('[GroupAdminMeetings] Error in handleViewAttendance:', error)
      console.error('[GroupAdminMeetings] Error stack:', error.stack)
      alert(`Failed to load attendance: ${error.message || 'Unknown error'}. Please try again.`)
      setShowAttendanceReview(false)
      setAttendanceMeeting(null)
      setAttendanceList([])
    }
  }

  // Toggle member attendance
  const toggleAttendance = (memberId) => {
    setAttendanceList(prev => prev.map(item =>
      item.memberId === memberId ? { ...item, present: !item.present } : item
    ))
  }

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!attendanceMeeting) return

    try {
      setSavingAttendance(true)

      // Get list of present member IDs
      const presentMemberIds = attendanceList
        .filter(item => item.present)
        .map(item => item.memberId)

      // Update meeting with attendance
      const response = await api.put(`/meetings/${attendanceMeeting.id}`, {
        attendance: presentMemberIds,
        status: attendanceMeeting.status === 'scheduled' ? 'completed' : attendanceMeeting.status
      })

      if (response.data?.success) {
        alert('Attendance saved successfully!')
        setShowAttendanceModal(false)

        // Update the meeting object with new attendance data
        const updatedMeeting = {
          ...attendanceMeeting,
          attendance: presentMemberIds,
          status: attendanceMeeting.status === 'scheduled' ? 'completed' : attendanceMeeting.status,
          attendees: presentMemberIds.length
        }
        setAttendanceMeeting(updatedMeeting)

        // Show attendance review
        setShowAttendanceReview(true)

        // Reload meetings to update the list
        loadMeetings()
      } else {
        alert('Failed to save attendance. Please try again.')
      }
    } catch (error) {
      console.error('[GroupAdminMeetings] Error saving attendance:', error)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setSavingAttendance(false)
    }
  }

  // Send fine to absent member
  const handleSendFine = async (member) => {
    if (!attendanceMeeting) return

    if (!confirm(`Send fine to ${member.memberName} for missing the meeting "${attendanceMeeting.title}"?`)) {
      return
    }

    try {
      setSendingFine(member.memberId)

      // Get fine amount from fine rules (default 1000 RWF for missed meeting)
      const fineAmount = 1000 // Default amount, can be configured
      const fineReason = `Absent from meeting: ${attendanceMeeting.title} on ${attendanceMeeting.date}`

      // Calculate due date (7 days from now)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)

      const response = await api.post('/fines', {
        memberId: member.memberId,
        amount: fineAmount,
        reason: fineReason,
        dueDate: dueDate.toISOString().split('T')[0]
      })

      if (response.data?.success) {
        alert(`Fine of ${fineAmount.toLocaleString()} RWF sent to ${member.memberName}. They will receive a notification.`)

        // Update attendance list to mark fine as sent
        setAttendanceList(prev => prev.map(item =>
          item.memberId === member.memberId
            ? { ...item, fineSent: true, fineId: response.data.data.id }
            : item
        ))
      } else {
        alert('Failed to send fine. Please try again.')
      }
    } catch (error) {
      console.error('[GroupAdminMeetings] Error sending fine:', error)
      alert('Failed to send fine. Please try again.')
    } finally {
      setSendingFine(null)
    }
  }



  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('meetingsRecords', { defaultValue: 'Meetings & Records' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('scheduleMeetingsViewMinutes', { defaultValue: 'Schedule meetings, view minutes, and track attendance' })}</p>
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
            {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
              <button
                onClick={async () => {
                  // Export all meetings with attendance
                  const meetingsWithAttendance = meetings.filter(m =>
                    m.attendance && (
                      (Array.isArray(m.attendance) && m.attendance.length > 0) ||
                      (typeof m.attendance === 'string' && m.attendance.trim() !== '' && m.attendance !== '[]')
                    )
                  )

                  if (meetingsWithAttendance.length === 0) {
                    alert('No meetings with attendance data to export.')
                    return
                  }

                  // Export all meetings attendance
                  try {
                    const allAttendanceData = []

                    for (const meeting of meetingsWithAttendance) {
                      const members = await loadGroupMembers(meeting.groupId)

                      let attendanceIds = []
                      if (Array.isArray(meeting.attendance)) {
                        attendanceIds = meeting.attendance.map(id => parseInt(id))
                      } else if (typeof meeting.attendance === 'string') {
                        try {
                          const parsed = JSON.parse(meeting.attendance)
                          if (Array.isArray(parsed)) {
                            attendanceIds = parsed.map(id => parseInt(id))
                          }
                        } catch {
                          attendanceIds = meeting.attendance.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        }
                      }

                      const meetingDate = meeting.scheduledDate ? formatDate(meeting.scheduledDate) : meeting.date

                      members.forEach(member => {
                        const isPresent = attendanceIds.includes(parseInt(member.id))
                        allAttendanceData.push({
                          'Meeting Title': meeting.title,
                          'Meeting Date': meetingDate,
                          'Meeting Time': meeting.time || 'N/A',
                          'Location': meeting.location || 'N/A',
                          'Member ID': member.id,
                          'Member Name': member.name || 'N/A',
                          'Phone': member.phone || 'N/A',
                          'Email': member.email || 'N/A',
                          'Attendance Status': isPresent ? 'Present' : 'Absent',
                          'National ID': member.nationalId || 'N/A'
                        })
                      })
                    }

                    const headers = ['Meeting Title', 'Meeting Date', 'Meeting Time', 'Location', 'Member ID', 'Member Name', 'Phone', 'Email', 'Attendance Status', 'National ID']

                    // Create Excel workbook
                    const workbook = XLSX.utils.book_new()
                    const worksheetData = []

                    // Add title
                    worksheetData.push(['All Meetings Attendance Report'])
                    worksheetData.push([])

                    // Add details
                    worksheetData.push(['Group:', groupName || 'N/A'])
                    worksheetData.push(['Total Meetings:', meetingsWithAttendance.length])
                    worksheetData.push(['Total Records:', allAttendanceData.length])
                    worksheetData.push(['Generated:', new Date().toLocaleString()])
                    worksheetData.push([])

                    // Add headers
                    worksheetData.push(headers)

                    // Add data rows
                    allAttendanceData.forEach(row => {
                      worksheetData.push(Object.values(row))
                    })

                    // Create worksheet
                    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

                    // Set column widths
                    const colWidths = headers.map((_, index) => {
                      const maxLength = Math.max(
                        ...worksheetData.map(row => {
                          const cell = row[index]
                          return cell ? String(cell).length : 0
                        })
                      )
                      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
                    })
                    worksheet['!cols'] = colWidths

                    // Add worksheet to workbook
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Meetings Attendance')

                    // Generate filename
                    const dateStr = new Date().toISOString().split('T')[0]
                    const finalFilename = `All_Meetings_Attendance_${dateStr}.xlsx`

                    // Save file
                    XLSX.writeFile(workbook, finalFilename)

                    alert('All meetings attendance exported successfully!')
                  } catch (error) {
                    console.error('[GroupAdminMeetings] Error exporting all attendance:', error)
                    alert('Failed to export attendance. Please try again.')
                  }
                }}
                className="btn-secondary flex items-center gap-2"
              >
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed Meetings</p>
                <p className="text-2xl font-bold text-gray-800">
                  {meetingsLoading ? 'Loading…' : attendanceStats.totalMeetings}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Average Attendance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {meetingsLoading ? 'Loading…' : `${attendanceStats.averageAttendance}%`}
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Upcoming Meetings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {meetingsLoading ? 'Loading…' : attendanceStats.upcomingMeetings}
                </p>
              </div>
              <Calendar className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Meeting Schedule ({meetingsLoading ? 0 : meetings.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {meetingsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading meetings from database…</div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No meetings found. Click "Schedule Meeting" to create one.</div>
            ) : meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{meeting.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(meeting.type)}`}>
                        {meeting.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} /> {meeting.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} /> {meeting.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} /> {meeting.attendees}/{meeting.totalMembers} attendees
                      </div>
                      <div className="flex items-center gap-1">
                        Location: {meeting.location}
                      </div>
                    </div>
                  </div>
                </div>

                {meeting.agenda && meeting.agenda.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Agenda:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {meeting.agenda.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.resolutions && meeting.resolutions.length > 0 && (
                  <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-800 mb-2">Resolutions:</p>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                      {meeting.resolutions.map((resolution, index) => (
                        <li key={index}>{resolution}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {meeting.minutesUploaded && (
                  <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="text-blue-600" size={18} />
                        <span className="text-sm text-blue-800">
                          Minutes uploaded by {meeting.recordedBy}
                        </span>
                      </div>
                      <button
                        onClick={() => setViewMinutes(meeting)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        View/Download
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {(meeting.status === 'scheduled' || meeting.status === 'ongoing' || meeting.status === 'completed') && (
                    <>
                      {(() => {
                        const hasAttendance = meeting.attendance && (
                          (Array.isArray(meeting.attendance) && meeting.attendance.length > 0) ||
                          (typeof meeting.attendance === 'string' && meeting.attendance.trim() !== '' && meeting.attendance !== '[]')
                        )
                        const attendanceTakenBySecretary = meeting.attendanceTakenByUser &&
                          meeting.attendanceTakenByUser.role === 'Secretary'

                        if (hasAttendance && attendanceTakenBySecretary) {
                          return (
                            <button
                              onClick={() => handleViewAttendance(meeting)}
                              className="bg-purple-500 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <Eye size={16} /> View Attendance
                            </button>
                          )
                        }

                        if (hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS)) {
                          return (
                            <button
                              onClick={() => handleTakeAttendance(meeting)}
                              className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <ClipboardCheck size={16} /> {hasAttendance ? 'Update Attendance' : 'Take Attendance'}
                            </button>
                          )
                        }
                        return null
                      })()}
                    </>
                  )}
                  {meeting.minutesUploaded && meeting.status === 'completed' && hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                    <button
                      onClick={() => handleApproveMinutes(meeting.id)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve Minutes
                    </button>
                  )}
                  {(meeting.status === 'scheduled' || meeting.status === 'upcoming') && hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditMeeting(meeting)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Edit size={16} /> Edit Meeting
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                  {hasPermission(user, PERMISSIONS.VIEW_REPORTS) && (
                    <button
                      onClick={() => handleExportAttendance(meeting)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!meeting.attendance || (Array.isArray(meeting.attendance) && meeting.attendance.length === 0)}
                      title={(!meeting.attendance || (Array.isArray(meeting.attendance) && meeting.attendance.length === 0)) ? 'No attendance taken yet' : 'Export attendance report'}
                    >
                      <Download size={16} /> Export Attendance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Calendar View - All Months */}
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-primary-600" size={24} />
            Meeting Calendar - {selectedCalendarYear}
          </h2>

          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between bg-white rounded-lg p-3">
            <button
              onClick={() => {
                if (selectedCalendarMonth === 0) {
                  setSelectedCalendarMonth(11)
                  setSelectedCalendarYear(selectedCalendarYear - 1)
                } else {
                  setSelectedCalendarMonth(selectedCalendarMonth - 1)
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {new Date(selectedCalendarYear, selectedCalendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => {
                if (selectedCalendarMonth === 11) {
                  setSelectedCalendarMonth(0)
                  setSelectedCalendarYear(selectedCalendarYear + 1)
                } else {
                  setSelectedCalendarMonth(selectedCalendarMonth + 1)
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Month Selector - Quick Jump */}
          <div className="mb-4 bg-white rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-2">Quick Jump to Month:</p>
            <div className="grid grid-cols-6 gap-2">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCalendarMonth(index)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCalendarMonth === index
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-600 mb-4">Days with meetings are highlighted in blue</p>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 p-2">
                  {day}
                </div>
              ))}
              {(() => {
                // Get selected month and year
                const year = selectedCalendarYear
                const month = selectedCalendarMonth

                // Get first day of month and number of days
                const firstDay = new Date(year, month, 1).getDay()
                const daysInMonth = new Date(year, month + 1, 0).getDate()

                // Create calendar grid
                const calendarDays = []

                // Add empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  calendarDays.push(null)
                }

                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const meetingOnDate = meetings.find(m => m.date === dateStr)
                  calendarDays.push({ day, dateStr, meetingOnDate })
                }

                return calendarDays.map((item, index) => {
                  if (item === null) {
                    return <div key={`empty-${index}`} className="p-2"></div>
                  }

                  const isToday = item.dateStr === new Date().toISOString().split('T')[0]

                  return (
                    <div
                      key={item.day}
                      onClick={() => {
                        if (item.meetingOnDate) {
                          setSelectedMeeting(item.meetingOnDate)
                        }
                      }}
                      className={`p-2 text-center rounded-lg cursor-pointer transition-colors ${item.meetingOnDate
                        ? 'bg-primary-100 text-primary-700 font-semibold hover:bg-primary-200'
                        : isToday
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      title={item.meetingOnDate ? `${item.meetingOnDate.title} - ${item.meetingOnDate.time || ''}` : isToday ? 'Today' : ''}
                    >
                      {item.day}
                      {item.meetingOnDate && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full mx-auto mt-1"></div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-100 rounded"></div>
                <span className="text-gray-600">Meeting Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 rounded"></div>
                <span className="text-gray-600">Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-800">Schedule New Meeting</h2>
                <button
                  onClick={() => {
                    setShowCreateMeeting(false)
                    setNewMeeting({
                      title: '',
                      date: '',
                      time: '',
                      location: '',
                      type: 'regular',
                      agenda: ['']
                    })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Monthly Group Meeting"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Group Office or Online"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={newMeeting.type}
                    onChange={(e) => setNewMeeting({ ...newMeeting, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="regular">Regular</option>
                    <option value="special">Special</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agenda Items
                  </label>
                  {newMeeting.agenda.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newAgenda = [...newMeeting.agenda]
                          newAgenda[index] = e.target.value
                          setNewMeeting({ ...newMeeting, agenda: newAgenda })
                        }}
                        className="input-field"
                        placeholder={`Agenda item ${index + 1}`}
                      />
                      {newMeeting.agenda.length > 1 && (
                        <button
                          onClick={() => {
                            const newAgenda = newMeeting.agenda.filter((_, i) => i !== index)
                            setNewMeeting({ ...newMeeting, agenda: newAgenda })
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <XCircle size={18} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewMeeting({ ...newMeeting, agenda: [...newMeeting.agenda, ''] })}
                    className="btn-secondary text-sm"
                  >
                    + Add Agenda Item
                  </button>
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
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!newMeeting.title || !newMeeting.date || !newMeeting.time || !newMeeting.location || saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Meeting'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Meeting Modal */}
        {showEditMeeting && editingMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-800">Edit Meeting</h2>
                <button
                  onClick={() => {
                    setShowEditMeeting(false)
                    setEditingMeeting(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={editingMeeting.title}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Monthly Group Meeting"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editingMeeting.date}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={editingMeeting.time}
                      onChange={(e) => setEditingMeeting({ ...editingMeeting, time: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingMeeting.location}
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, location: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Group Office or Online"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agenda Items
                  </label>
                  {editingMeeting.agenda.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newAgenda = [...editingMeeting.agenda]
                          newAgenda[index] = e.target.value
                          setEditingMeeting({ ...editingMeeting, agenda: newAgenda })
                        }}
                        className="input-field"
                        placeholder={`Agenda item ${index + 1}`}
                      />
                      {editingMeeting.agenda.length > 1 && (
                        <button
                          onClick={() => {
                            const newAgenda = editingMeeting.agenda.filter((_, i) => i !== index)
                            setEditingMeeting({ ...editingMeeting, agenda: newAgenda })
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <XCircle size={18} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingMeeting({ ...editingMeeting, agenda: [...editingMeeting.agenda, ''] })}
                    className="btn-secondary text-sm"
                  >
                    + Add Agenda Item
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditMeeting(false)
                      setEditingMeeting(null)
                    }}
                    className="btn-secondary flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMeeting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!editingMeeting.title || !editingMeeting.date || !editingMeeting.time || !editingMeeting.location || saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Meeting'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Take Attendance Modal */}
        {showAttendanceModal && attendanceMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {attendanceViewOnly ? 'View Attendance' : 'Take Attendance'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Meeting: {attendanceMeeting.title}</p>
                  {attendanceViewOnly && attendanceMeeting.attendanceTakenByUser && (
                    <p className="text-sm text-gray-500 mt-1">
                      Taken by {attendanceMeeting.attendanceTakenByUser.name} ({attendanceMeeting.attendanceTakenByUser.role})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowAttendanceModal(false)
                    setAttendanceMeeting(null)
                    setAttendanceList([])
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {!attendanceViewOnly && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Instructions:</strong> Check the box next to each member who attended the meeting.
                      Unchecked members will be marked as absent.
                    </p>
                  </div>
                )}
                {attendanceViewOnly && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>View Only:</strong> Attendance has already been taken by {attendanceMeeting.attendanceTakenByUser?.name || 'Secretary'}.
                      You can view the attendance but cannot modify it.
                    </p>
                  </div>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendanceList.map((member) => (
                    <div
                      key={member.memberId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={member.present}
                          onChange={() => !attendanceViewOnly && toggleAttendance(member.memberId)}
                          disabled={attendanceViewOnly}
                          className={`w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 ${attendanceViewOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{member.memberName}</p>
                          {member.memberPhone && (
                            <p className="text-sm text-gray-600">{member.memberPhone}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.present
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {member.present ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>

                {attendanceList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No members found in this group.
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowAttendanceModal(false)
                      setAttendanceMeeting(null)
                      setAttendanceList([])
                      setAttendanceViewOnly(false)
                    }}
                    className="btn-secondary flex-1"
                    disabled={savingAttendance}
                  >
                    {attendanceViewOnly ? 'Close' : 'Cancel'}
                  </button>
                  {!attendanceViewOnly && (
                    <button
                      onClick={handleSaveAttendance}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={savingAttendance || attendanceList.length === 0}
                    >
                      {savingAttendance ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <ClipboardCheck size={18} />
                          Save Attendance
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Review Modal */}
        {showAttendanceReview && attendanceMeeting && attendanceList.length > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ClipboardCheck className="text-yellow-600" size={24} />
                    Attendance Review - {attendanceMeeting.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {attendanceViewOnly
                      ? `Attendance taken by ${attendanceMeeting.attendanceTakenByUser?.name || 'Secretary'} (${attendanceMeeting.attendanceTakenByUser?.role || 'Secretary'}) - View Only`
                      : 'Review attendance and send fines to absent members'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAttendanceReview(false)
                    setAttendanceMeeting(null)
                    setAttendanceList([])
                    setAttendanceViewOnly(false)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Present Members */}
                <div>
                  <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle size={18} />
                    Present Members ({attendanceList.filter(m => m.present).length})
                  </h3>
                  <div className="space-y-2">
                    {attendanceList.filter(m => m.present).length === 0 ? (
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        No members were marked as present.
                      </p>
                    ) : (
                      attendanceList.filter(m => m.present).map((member) => (
                        <div
                          key={member.memberId}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{member.memberName}</p>
                            {member.memberPhone && (
                              <p className="text-sm text-gray-600">{member.memberPhone}</p>
                            )}
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Present
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Absent Members */}
                <div>
                  <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Absent Members ({attendanceList.filter(m => !m.present).length})
                  </h3>
                  <div className="space-y-2">
                    {attendanceList.filter(m => !m.present).length === 0 ? (
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        All members attended the meeting. Great!
                      </p>
                    ) : (
                      attendanceList.filter(m => !m.present).map((member) => (
                        <div
                          key={member.memberId}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{member.memberName}</p>
                            {member.memberPhone && (
                              <p className="text-sm text-gray-600">{member.memberPhone}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              Absent
                            </span>
                            {member.fineSent ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Fine Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSendFine(member)}
                                disabled={sendingFine === member.memberId || attendanceViewOnly}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendingFine === member.memberId ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle size={16} />
                                    Send Fine
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show loading message if attendance review is open but no data */}
        {showAttendanceReview && attendanceMeeting && attendanceList.length === 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <AlertCircle className="text-yellow-600" size={24} />
                      Loading Attendance...
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Please wait while we load the attendance data.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAttendanceReview(false)
                      setAttendanceMeeting(null)
                      setAttendanceList([])
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Details Modal */}
        {selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meeting Details</h2>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedMeeting.title || 'Meeting'}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {selectedMeeting.date ? new Date(selectedMeeting.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {selectedMeeting.time || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {selectedMeeting.location || 'N/A'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedMeeting.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      selectedMeeting.status === 'ongoing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        selectedMeeting.status === 'scheduled' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          selectedMeeting.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                      {selectedMeeting.status || 'scheduled'}
                    </span>
                    {selectedMeeting.type && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedMeeting.type === 'emergency' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        selectedMeeting.type === 'regular' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                        {selectedMeeting.type}
                      </span>
                    )}
                  </div>
                  {selectedMeeting.attendees !== undefined && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Attendance:</span> {selectedMeeting.attendees} {selectedMeeting.totalMembers ? `of ${selectedMeeting.totalMembers}` : ''} members
                    </div>
                  )}
                </div>

                {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Agenda</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {Array.isArray(selectedMeeting.agenda) ? (
                        selectedMeeting.agenda.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))
                      ) : (
                        <li>{selectedMeeting.agenda}</li>
                      )}
                    </ul>
                  </div>
                )}

                {selectedMeeting.secretaryNotes && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Secretary Notes</h4>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedMeeting.secretaryNotes}</p>
                  </div>
                )}

                {selectedMeeting.attendance && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                      Attendees ({Array.isArray(selectedMeeting.attendance) ? selectedMeeting.attendance.length : 0})
                    </h4>
                    {Array.isArray(selectedMeeting.attendance) && selectedMeeting.attendance.length > 0 ? (
                      <div className="space-y-2">
                        {selectedMeeting.attendance.map((memberId, index) => {
                          const member = groupMembers.find(m => m.id === memberId)
                          return member ? (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {member.name?.[0]?.toUpperCase() || 'M'}
                              </div>
                              <span className="text-gray-800 dark:text-white">{member.name}</span>
                            </div>
                          ) : (
                            <div key={index} className="text-gray-500 dark:text-gray-400">Member ID: {memberId}</div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No attendance recorded</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminMeetings

