import { useState } from 'react'
import { BarChart3, Download, Users, Calendar, FileText, TrendingUp, Eye } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryReports() {
  const [activeTab, setActiveTab] = useState('meetings')
  
  const meetingStats = {
    totalMeetings: 12,
    averageAttendance: 38,
    attendanceRate: 85,
    completedMinutes: 10
  }

  const memberStats = {
    totalMembers: 45,
    activeMembers: 42,
    inactiveMembers: 3,
    newMembers: 2
  }

  const communicationStats = {
    announcementsSent: 15,
    noticesPosted: 8,
    messagesSent: 45,
    responseRate: 78
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reporting & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate comprehensive reports and insights</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['meetings', 'members', 'communications', 'exports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'meetings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Meeting Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card text-center">
                    <Calendar className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Total Meetings</h3>
                    <p className="text-2xl font-bold text-blue-600">{meetingStats.totalMeetings}</p>
                  </div>
                  <div className="card text-center">
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Avg Attendance</h3>
                    <p className="text-2xl font-bold text-green-600">{meetingStats.averageAttendance}</p>
                  </div>
                  <div className="card text-center">
                    <TrendingUp className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Attendance Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">{meetingStats.attendanceRate}%</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-orange-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Minutes Recorded</h3>
                    <p className="text-2xl font-bold text-orange-600">{meetingStats.completedMinutes}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex items-center gap-2">
                    <Download size={18} /> Export Meeting Report
                  </button>
                  <button className="btn-secondary flex items-center gap-2">
                    <Eye size={18} /> View Detailed Analytics
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Member Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card text-center">
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Total Members</h3>
                    <p className="text-2xl font-bold text-blue-600">{memberStats.totalMembers}</p>
                  </div>
                  <div className="card text-center">
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Active Members</h3>
                    <p className="text-2xl font-bold text-green-600">{memberStats.activeMembers}</p>
                  </div>
                  <div className="card text-center">
                    <Users className="text-red-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Inactive Members</h3>
                    <p className="text-2xl font-bold text-red-600">{memberStats.inactiveMembers}</p>
                  </div>
                  <div className="card text-center">
                    <Users className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">New Members</h3>
                    <p className="text-2xl font-bold text-purple-600">{memberStats.newMembers}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex items-center gap-2">
                    <Download size={18} /> Export Member Report
                  </button>
                  <button className="btn-secondary flex items-center gap-2">
                    <Eye size={18} /> View Member Engagement
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Communication Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card text-center">
                    <FileText className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Announcements</h3>
                    <p className="text-2xl font-bold text-blue-600">{communicationStats.announcementsSent}</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Notices Posted</h3>
                    <p className="text-2xl font-bold text-green-600">{communicationStats.noticesPosted}</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Messages Sent</h3>
                    <p className="text-2xl font-bold text-purple-600">{communicationStats.messagesSent}</p>
                  </div>
                  <div className="card text-center">
                    <TrendingUp className="text-orange-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Response Rate</h3>
                    <p className="text-2xl font-bold text-orange-600">{communicationStats.responseRate}%</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex items-center gap-2">
                    <Download size={18} /> Export Communication Report
                  </button>
                  <button className="btn-secondary flex items-center gap-2">
                    <Eye size={18} /> View Message Analytics
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'exports' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Export Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Monthly Summary Report</h3>
                    <p className="text-sm text-gray-600 mb-3">Comprehensive monthly activity summary</p>
                    <button className="btn-primary text-sm px-3 py-1">Generate Report</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Member Engagement Report</h3>
                    <p className="text-sm text-gray-600 mb-3">Member activity and participation analysis</p>
                    <button className="btn-primary text-sm px-3 py-1">Generate Report</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Communication Summary</h3>
                    <p className="text-sm text-gray-600 mb-3">All communications and announcements</p>
                    <button className="btn-primary text-sm px-3 py-1">Generate Report</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Archive Summary</h3>
                    <p className="text-sm text-gray-600 mb-3">Document archive and storage report</p>
                    <button className="btn-primary text-sm px-3 py-1">Generate Report</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryReports
