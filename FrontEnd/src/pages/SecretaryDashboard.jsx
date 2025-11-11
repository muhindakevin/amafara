import { useState } from 'react'
import { Users, FileText, MessageCircle, Shield, Archive, BookOpen, Bell, BarChart3, Plus, Eye, Edit, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'

function SecretaryDashboard() {
  const { language } = useLanguage()
  const [selectedTab, setSelectedTab] = useState('overview')

  const secretaryStats = [
    { label: t('dashboard.members', language), value: '45', icon: Users, color: 'text-blue-600', change: '+2' },
    { label: t('groupAdmin.meetings', language), value: '3', icon: FileText, color: 'text-green-600', change: '+1' },
    { label: t('groupAdmin.announcements', language), value: '2', icon: MessageCircle, color: 'text-yellow-600', change: '+1' },
    { label: 'Documents Archived', value: '127', icon: Archive, color: 'text-purple-600', change: '+5' },
  ]

  const recentActivities = [
    { type: 'meeting', title: 'Monthly Group Meeting', member: 'Group Admin', time: '2 hours ago', status: 'completed' },
    { type: 'announcement', title: 'Contribution Deadline Reminder', member: 'Secretary', time: '4 hours ago', status: 'sent' },
    { type: 'member', title: 'New Member Registration', member: 'Ikirezi Jane', time: '6 hours ago', status: 'pending' },
    { type: 'document', title: 'Meeting Minutes Uploaded', member: 'Secretary', time: '1 day ago', status: 'archived' },
  ]

  const upcomingTasks = [
    { task: 'Prepare meeting agenda for next week', priority: 'high', dueDate: '2024-01-25' },
    { task: 'Send contribution deadline reminders', priority: 'medium', dueDate: '2024-01-24' },
    { task: 'Update member contact information', priority: 'low', dueDate: '2024-01-26' },
    { task: 'Archive last month\'s documents', priority: 'medium', dueDate: '2024-01-28' },
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'meeting': return <FileText className="text-green-600" size={20} />
      case 'announcement': return <MessageCircle className="text-blue-600" size={20} />
      case 'member': return <Users className="text-purple-600" size={20} />
      case 'document': return <Archive className="text-orange-600" size={20} />
      default: return <Bell className="text-gray-600" size={20} />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.dashboard', language)}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.members', language)}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {secretaryStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['overview', 'members', 'meetings', 'announcements', 'compliance', 'support', 'archive', 'training', 'notifications', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activities */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="font-semibold text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-600">By {activity.member}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                          activity.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Tasks */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Tasks</h2>
                  <div className="space-y-3">
                    {upcomingTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="text-yellow-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-800">{task.task}</p>
                            <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <button className="btn-primary text-sm px-3 py-1">
                            Start Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'members' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Member Records Management</h2>
                <p className="text-gray-600">Maintain comprehensive member records and data</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">View All Members</h3>
                    <p className="text-sm text-gray-600">Access complete member database</p>
                  </div>
                  <div className="card text-center">
                    <Edit className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Update Records</h3>
                    <p className="text-sm text-gray-600">Modify member information</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Export Data</h3>
                    <p className="text-sm text-gray-600">Generate member reports</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'meetings' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Meeting Documentation</h2>
                <p className="text-gray-600">Record and archive meeting minutes</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <FileText className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Record Minutes</h3>
                    <p className="text-sm text-gray-600">Document meeting proceedings</p>
                  </div>
                  <div className="card text-center">
                    <Archive className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Archive Documents</h3>
                    <p className="text-sm text-gray-600">Store meeting records</p>
                  </div>
                  <div className="card text-center">
                    <CheckCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Approve Minutes</h3>
                    <p className="text-sm text-gray-600">Get admin approval</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'announcements' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Communication & Announcements</h2>
                <p className="text-gray-600">Manage group communications and notices</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <MessageCircle className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Create Announcements</h3>
                    <p className="text-sm text-gray-600">Post official notices</p>
                  </div>
                  <div className="card text-center">
                    <Bell className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Send Reminders</h3>
                    <p className="text-sm text-gray-600">Notify members of deadlines</p>
                  </div>
                  <div className="card text-center">
                    <Eye className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Notice Board</h3>
                    <p className="text-sm text-gray-600">Manage public notices</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'compliance' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Compliance & Transparency</h2>
                <p className="text-gray-600">Ensure group compliance and transparency</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Shield className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Rule Compliance</h3>
                    <p className="text-sm text-gray-600">Monitor group adherence</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Document Agreements</h3>
                    <p className="text-sm text-gray-600">Store signed resolutions</p>
                  </div>
                  <div className="card text-center">
                    <AlertCircle className="text-red-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Report Misconduct</h3>
                    <p className="text-sm text-gray-600">Flag violations</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'support' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Support to Group Admin & Cashier</h2>
                <p className="text-gray-600">Assist group leaders and financial team</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Member Verification</h3>
                    <p className="text-sm text-gray-600">Verify new member documents</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Loan Decisions</h3>
                    <p className="text-sm text-gray-600">Record loan outcomes</p>
                  </div>
                  <div className="card text-center">
                    <BarChart3 className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Financial Reports</h3>
                    <p className="text-sm text-gray-600">Prepare summaries</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'archive' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Documentation & Archiving</h2>
                <p className="text-gray-600">Store and organize group documents</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Archive className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Store Documents</h3>
                    <p className="text-sm text-gray-600">Archive all group data</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Categorize Archives</h3>
                    <p className="text-sm text-gray-600">Organize by date/event</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Generate Reports</h3>
                    <p className="text-sm text-gray-600">Create archive summaries</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'training' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Training & Member Education</h2>
                <p className="text-gray-600">Provide educational resources and support</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <BookOpen className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Educational Materials</h3>
                    <p className="text-sm text-gray-600">Post learning resources</p>
                  </div>
                  <div className="card text-center">
                    <MessageCircle className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Member Support</h3>
                    <p className="text-sm text-gray-600">Help with app usage</p>
                  </div>
                  <div className="card text-center">
                    <Bell className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Policy Updates</h3>
                    <p className="text-sm text-gray-600">Share official changes</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Notifications & Alerts</h2>
                <p className="text-gray-600">Manage alerts and member notifications</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <Bell className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Receive Alerts</h3>
                    <p className="text-sm text-gray-600">Get system notifications</p>
                  </div>
                  <div className="card text-center">
                    <MessageCircle className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Send Notifications</h3>
                    <p className="text-sm text-gray-600">Notify members</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Activity Log</h3>
                    <p className="text-sm text-gray-600">Track all messages</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Reporting & Analytics</h2>
                <p className="text-gray-600">Generate comprehensive reports and insights</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <BarChart3 className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Meeting Statistics</h3>
                    <p className="text-sm text-gray-600">Attendance and engagement</p>
                  </div>
                  <div className="card text-center">
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Member Analytics</h3>
                    <p className="text-sm text-gray-600">Activity and status reports</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Export Reports</h3>
                    <p className="text-sm text-gray-600">Generate summaries</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center justify-center gap-2 py-4 text-lg">
              <Plus size={20} /> New Meeting
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg">
              <MessageCircle size={20} /> Send Announcement
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg">
              <Users size={20} /> View Members
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg">
              <Download size={20} /> Generate Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryDashboard