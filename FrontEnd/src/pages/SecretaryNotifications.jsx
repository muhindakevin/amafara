import { useState } from 'react'
import { Bell, MessageCircle, Users, Calendar, Eye, Send, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryNotifications() {
  const [activeTab, setActiveTab] = useState('alerts')
  
  const alerts = [
    { id: 'A001', type: 'member', title: 'New Member Registration', member: 'Ikirezi Jane', time: '2 hours ago', status: 'unread' },
    { id: 'A002', type: 'meeting', title: 'Meeting Scheduled', member: 'Group Admin', time: '4 hours ago', status: 'read' },
    { id: 'A003', type: 'instruction', title: 'New Instructions', member: 'Group Admin', time: '6 hours ago', status: 'unread' }
  ]

  const sentNotifications = [
    { id: 'N001', title: 'Contribution Deadline Reminder', recipients: 'All Members', time: '1 day ago', status: 'sent' },
    { id: 'N002', title: 'Meeting Reminder', recipients: 'Active Members', time: '2 days ago', status: 'sent' }
  ]

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications & Alerts</h1>
          <p className="text-gray-600 mt-1">Manage alerts and member notifications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Unread Alerts</p>
                <p className="text-2xl font-bold text-gray-800">
                  {alerts.filter(a => a.status === 'unread').length}
                </p>
              </div>
              <Bell className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Sent Notifications</p>
                <p className="text-2xl font-bold text-green-600">{sentNotifications.length}</p>
              </div>
              <Send className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Member Alerts</p>
                <p className="text-2xl font-bold text-purple-600">
                  {alerts.filter(a => a.type === 'member').length}
                </p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Meeting Alerts</p>
                <p className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.type === 'meeting').length}
                </p>
              </div>
              <Calendar className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['alerts', 'notifications', 'templates', 'history'].map((tab) => (
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
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">System Alerts</h2>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-xl ${
                      alert.status === 'unread' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{alert.title}</h3>
                          <p className="text-sm text-gray-600">From: {alert.member}</p>
                          <p className="text-xs text-gray-500">{alert.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm px-3 py-1">View</button>
                          {alert.status === 'unread' && (
                            <button className="btn-secondary text-sm px-3 py-1">Mark Read</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Sent Notifications</h2>
                <div className="space-y-3">
                  {sentNotifications.map((notification) => (
                    <div key={notification.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                          <p className="text-sm text-gray-600">To: {notification.recipients}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {notification.status}
                          </span>
                          <button className="btn-secondary text-sm px-3 py-1">View</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Notification Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Meeting Reminder</h3>
                    <p className="text-sm text-gray-600 mb-3">Template for meeting reminders</p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Deadline Alert</h3>
                    <p className="text-sm text-gray-600 mb-3">Template for deadline notifications</p>
                    <button className="btn-primary text-sm px-3 py-1">Use Template</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Activity Log</h2>
                <div className="text-center py-8 text-gray-500">
                  <Bell className="mx-auto mb-2" size={48} />
                  <p>Activity log and message history</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryNotifications
