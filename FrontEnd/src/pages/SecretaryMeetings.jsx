import { useState } from 'react'
import { FileText, Plus, Edit, Trash2, Download, Search, Filter, CheckCircle, XCircle, Clock, Users, Calendar, Upload } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryMeetings() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateMeeting, setShowCreateMeeting] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [showMeetingDetails, setShowMeetingDetails] = useState(false)

  const meetings = [
    {
      id: 'MT001',
      title: 'Monthly Group Meeting',
      date: '2024-01-20',
      time: '10:00 AM',
      location: 'Community Center',
      attendees: 42,
      status: 'completed',
      minutesRecorded: true,
      approvedBy: 'Group Admin',
      approvedDate: '2024-01-20',
      agenda: [
        'Review monthly contributions',
        'Discuss loan applications',
        'Plan next month activities',
        'Member concerns'
      ],
      decisions: [
        'Approved 3 loan applications',
        'Increased contribution amount to RWF 5,000',
        'Scheduled next meeting for February 20th'
      ],
      attendance: [
        { member: 'Kamikazi Marie', status: 'present', signature: true },
        { member: 'Mukamana Alice', status: 'present', signature: true },
        { member: 'Mutabazi Paul', status: 'absent', signature: false },
        { member: 'Ikirezi Jane', status: 'present', signature: true }
      ]
    },
    {
      id: 'MT002',
      title: 'Emergency Meeting',
      date: '2024-01-25',
      time: '2:00 PM',
      location: 'Online',
      attendees: 0,
      status: 'scheduled',
      minutesRecorded: false,
      approvedBy: null,
      approvedDate: null,
      agenda: [
        'Discuss urgent financial matters',
        'Review member compliance',
        'Emergency fund allocation'
      ],
      decisions: [],
      attendance: []
    },
    {
      id: 'MT003',
      title: 'Quarterly Review Meeting',
      date: '2024-01-15',
      time: '9:00 AM',
      location: 'Group Office',
      attendees: 38,
      status: 'completed',
      minutesRecorded: true,
      approvedBy: 'Group Admin',
      approvedDate: '2024-01-16',
      agenda: [
        'Quarterly financial review',
        'Member performance evaluation',
        'Policy updates',
        'Future planning'
      ],
      decisions: [
        'Updated group constitution',
        'Implemented new fine structure',
        'Approved budget for next quarter'
      ],
      attendance: [
        { member: 'Kamikazi Marie', status: 'present', signature: true },
        { member: 'Mukamana Alice', status: 'present', signature: true },
        { member: 'Mutabazi Paul', status: 'present', signature: true },
        { member: 'Ikirezi Jane', status: 'present', signature: true }
      ]
    }
  ]

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    agenda: '',
    notes: ''
  })

  const filteredMeetings = meetings.filter(meeting => {
    const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus
    const matchesSearch = 
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'in-progress': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateMeeting = () => {
    console.log('Creating meeting:', newMeeting)
    alert('Meeting created successfully!')
    setShowCreateMeeting(false)
    setNewMeeting({
      title: '',
      date: '',
      time: '',
      location: '',
      agenda: '',
      notes: ''
    })
  }

  const handleViewMeetingDetails = (meeting) => {
    setSelectedMeeting(meeting)
    setShowMeetingDetails(true)
  }

  const handleRecordMinutes = (meetingId) => {
    console.log('Recording minutes for meeting:', meetingId)
    alert('Meeting minutes recorded successfully!')
  }

  const handleApproveMinutes = (meetingId) => {
    console.log('Approving minutes for meeting:', meetingId)
    alert('Meeting minutes approved!')
  }

  const handleExportMinutes = (meetingId) => {
    console.log('Exporting minutes for meeting:', meetingId)
    alert('Meeting minutes exported successfully!')
  }

  const handleDeleteMeeting = (meetingId) => {
    console.log('Deleting meeting:', meetingId)
    alert('Meeting deleted successfully!')
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meeting Documentation</h1>
            <p className="text-gray-600 mt-1">Record and archive meeting minutes and decisions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateMeeting(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Schedule Meeting
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export All Minutes
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-800">{meetings.length}</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {meetings.filter(m => m.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {meetings.filter(m => m.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Minutes Recorded</p>
                <p className="text-2xl font-bold text-purple-600">
                  {meetings.filter(m => m.minutesRecorded).length}
                </p>
              </div>
              <FileText className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Meetings
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, ID, or location..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <option value="in-progress">In Progress</option>
              </select>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Meeting Records ({filteredMeetings.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {meeting.title[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{meeting.title}</h3>
                      <p className="text-sm text-gray-600">{meeting.location}</p>
                      <p className="text-sm text-gray-500">{meeting.date} at {meeting.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {meeting.attendees} attendees
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Meeting ID</p>
                    <p className="font-semibold">{meeting.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Minutes Recorded</p>
                    <p className="font-semibold">{meeting.minutesRecorded ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Approved By</p>
                    <p className="font-semibold">{meeting.approvedBy || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Approved Date</p>
                    <p className="font-semibold">{meeting.approvedDate || 'Pending'}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewMeetingDetails(meeting)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <FileText size={16} /> View Details
                  </button>
                  {!meeting.minutesRecorded && (
                    <button
                      onClick={() => handleRecordMinutes(meeting.id)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Edit size={16} /> Record Minutes
                    </button>
                  )}
                  {meeting.minutesRecorded && !meeting.approvedBy && (
                    <button
                      onClick={() => handleApproveMinutes(meeting.id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} /> Approve Minutes
                    </button>
                  )}
                  <button
                    onClick={() => handleExportMinutes(meeting.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Download size={16} /> Export
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Schedule Meeting</h2>
                <button
                  onClick={() => setShowCreateMeeting(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                      className="input-field"
                      placeholder="Enter meeting title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      className="input-field"
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
                    />
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
                      placeholder="Enter meeting location..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agenda
                  </label>
                  <textarea
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter meeting agenda items..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={newMeeting.notes}
                    onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter any additional notes..."
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

        {/* Meeting Details Modal */}
        {showMeetingDetails && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Meeting Details</h2>
                <button
                  onClick={() => setShowMeetingDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedMeeting.title[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedMeeting.title}</h3>
                    <p className="text-gray-600">{selectedMeeting.location}</p>
                    <p className="text-sm text-gray-500">{selectedMeeting.date} at {selectedMeeting.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Meeting Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Meeting ID:</span>
                        <span className="font-semibold">{selectedMeeting.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attendees:</span>
                        <span className="font-semibold">{selectedMeeting.attendees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMeeting.status)}`}>
                          {selectedMeeting.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minutes Recorded:</span>
                        <span className="font-semibold">{selectedMeeting.minutesRecorded ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Approval Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved By:</span>
                        <span className="font-semibold">{selectedMeeting.approvedBy || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved Date:</span>
                        <span className="font-semibold">{selectedMeeting.approvedDate || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Meeting Agenda</h4>
                    <div className="space-y-2">
                      {selectedMeeting.agenda.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-gray-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMeeting.decisions && selectedMeeting.decisions.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Meeting Decisions</h4>
                    <div className="space-y-2">
                      {selectedMeeting.decisions.map((decision, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle className="text-green-600 mt-1" size={16} />
                          <span className="text-gray-800">{decision}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMeeting.attendance && selectedMeeting.attendance.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Attendance Record</h4>
                    <div className="space-y-2">
                      {selectedMeeting.attendance.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {member.member[0]}
                            </div>
                            <span className="font-semibold text-gray-800">{member.member}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              member.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {member.status}
                            </span>
                            {member.signature && (
                              <span className="text-green-600 text-sm">✓ Signed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMeetingDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleExportMinutes(selectedMeeting.id)}
                    className="btn-primary flex-1"
                  >
                    Export Minutes
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
