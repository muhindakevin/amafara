import { useEffect, useState } from 'react'
import { Calendar, Plus, FileText, Users, Clock, Download, Search, Filter, CheckCircle, XCircle, Edit, Eye } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function GroupAdminMeetings() {
  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [viewMinutes, setViewMinutes] = useState(null)

  const [meetings, setMeetings] = useState([])
  const { data: attendanceStats, setData: setAttendanceStats, loading, wrap } = useApiState({
    totalMeetings: 0,
    averageAttendance: 0,
    upcomingMeetings: 0
  })

  useEffect(() => {
    wrap(async () => {
      const list = await api.get('/meetings')
      const items = (list.data?.data || []).map(m => ({
        id: m.id,
        title: m.title || 'Meeting',
        date: m.date || '',
        time: m.time || '',
        location: m.location || '',
        type: m.type || 'regular',
        status: m.status || 'scheduled',
        attendees: m.attendees || 0,
        totalMembers: m.totalMembers || 0,
        agenda: m.agenda || [],
        resolutions: m.resolutions || [],
        minutesUploaded: !!m.minutesFile,
        minutesFile: m.minutesFile || null,
        recordedBy: m.recordedBy || null
      }))
      setMeetings(items)
      const completed = items.filter(m => m.status === 'completed')
      setAttendanceStats({
        totalMeetings: completed.length,
        averageAttendance: completed.length ? Math.round(completed.reduce((s,m)=>s+((m.attendees/(m.totalMembers||1))*100),0)/completed.length) : 0,
        upcomingMeetings: items.filter(m => ['upcoming','scheduled'].includes(m.status)).length
      })
    })
  }, [])

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

  const handleCreateMeeting = () => {
    alert('Meeting scheduled successfully!')
    setShowCreateMeeting(false)
    setNewMeeting({
      title: '',
      date: '',
      time: '',
      location: '',
      type: 'regular',
      agenda: ['']
    })
  }

  const handleApproveMinutes = (meetingId) => {
    alert(`Meeting minutes for meeting ${meetingId} approved!`)
  }

  

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meetings & Records</h1>
            <p className="text-gray-600 mt-1">Schedule meetings, view minutes, and track attendance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateMeeting(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Schedule Meeting
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export Records
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed Meetings</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? 'Loading…' : attendanceStats.totalMeetings}
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
                  {loading ? 'Loading…' : `${attendanceStats.averageAttendance}%`}
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
                  {loading ? 'Loading…' : attendanceStats.upcomingMeetings}
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
              Meeting Schedule ({loading ? 0 : meetings.length})
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
            ) : meetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No records found</div>
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

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {meeting.minutesUploaded && meeting.status === 'completed' && (
                    <button
                      onClick={() => handleApproveMinutes(meeting.id)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve Minutes
                    </button>
                  )}
                  {meeting.status === 'scheduled' || meeting.status === 'upcoming' && (
                    <button
                      onClick={() => alert('Meeting details updated!')}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Edit size={16} /> Edit Meeting
                    </button>
                  )}
                  <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Calendar View */}
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="text-primary-600" size={24} />
            Meeting Calendar
          </h2>
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-600 mb-4">Calendar view showing all scheduled and upcoming meetings</p>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 p-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 28 }, (_, i) => i + 1).map((date) => {
                const meetingOnDate = meetings.find(m => m.date === `2024-01-${date.toString().padStart(2, '0')}`)
                return (
                  <div
                    key={date}
                    className={`p-2 text-center rounded-lg ${
                      meetingOnDate ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {date}
                    {meetingOnDate && (
                      <div className="w-1 h-1 bg-primary-600 rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Schedule New Meeting</h2>
                <button
                  onClick={() => setShowCreateMeeting(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
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
                    className="btn-primary flex-1"
                    disabled={!newMeeting.title || !newMeeting.date || !newMeeting.time || !newMeeting.location}
                  >
                    Schedule Meeting
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

export default GroupAdminMeetings

