import { useState, useEffect } from 'react'
import { Headphones, Plus, Eye, CheckCircle, XCircle, Clock, AlertCircle, Database, Shield, RefreshCw, Settings, User, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminSupport() {
  const [activeTab, setActiveTab] = useState('tickets')
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [loading, setLoading] = useState(true)

  const [supportTickets, setSupportTickets] = useState([])
  const [systemMaintenance, setSystemMaintenance] = useState([])
  const [systemStatus, setSystemStatus] = useState({
    uptime: '0%',
    responseTime: '0ms',
    activeUsers: 0,
    apiStatus: {
      mtn: 'Unknown',
      airtel: 'Unknown',
      bank: 'Unknown',
      twilio: 'Unknown'
    }
  })

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'Technical',
    priority: 'Medium'
  })

  useEffect(() => {
    let mounted = true
    let timeoutId
    
    const loadData = async () => {
      try {
        setLoading(true)
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 5000)
        })
        
        const ticketsRes = await Promise.race([
          api.get('/support'),
          timeoutPromise
        ]).catch(() => ({ data: { data: [] } }))
        
        if (timeoutId) clearTimeout(timeoutId)
        
        if (mounted) {
          setSupportTickets(ticketsRes?.data?.data || [])
          setSystemMaintenance([])
          setSystemStatus({
            uptime: '0%',
            responseTime: '0ms',
            activeUsers: 0,
            apiStatus: { mtn: 'Unknown', airtel: 'Unknown', bank: 'Unknown', twilio: 'Unknown' }
          })
        }
      } catch (e) {
        if (mounted) {
          setSupportTickets([])
          setSystemMaintenance([])
        }
        // Silently fail - don't log to avoid console spam
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    loadData()
    
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      alert('Please fill in subject and description.')
      return
    }
    try {
      await api.post('/support', newTicket)
      const { data } = await api.get('/support').catch(() => ({ data: { data: [] } }))
      setSupportTickets(data?.data || [])
      setShowCreateTicket(false)
      setNewTicket({ subject: '', description: '', category: 'Technical', priority: 'Medium' })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create ticket')
    }
  }

  const handleViewTicketDetails = (ticket) => {
    setSelectedTicket(ticket)
    setShowTicketDetails(true)
  }

  const handleAssignTicket = (ticketId) => {
    alert(`Assigning ticket ${ticketId}...`)
  }

  const handleCloseTicket = (ticketId) => {
    alert(`Closing ticket ${ticketId}...`)
  }

  const handlePerformBackup = () => {
    alert('Initiating database backup...')
  }

  const handlePerformUpdate = () => {
    alert('Initiating system update...')
  }

  const handleRunMaintenance = (maintenanceId) => {
    alert(`Running maintenance ${maintenanceId}...`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-700'
      case 'In Progress': return 'bg-yellow-100 text-yellow-700'
      case 'Closed': return 'bg-green-100 text-green-700'
      case 'Success': return 'bg-green-100 text-green-700'
      case 'Failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'Low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Technical': return 'bg-blue-100 text-blue-700'
      case 'User Support': return 'bg-purple-100 text-purple-700'
      case 'Performance': return 'bg-orange-100 text-orange-700'
      case 'Feature Request': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getApiStatusColor = (status) => {
    switch (status) {
      case 'Connected': return 'bg-green-100 text-green-700'
      case 'Disconnected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Support & Maintenance</h1>
        <p className="text-gray-600">Assign support tickets, perform system updates, and monitor uptime</p>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">System Uptime</p>
                <p className="text-2xl font-bold text-gray-800">{systemStatus.uptime}</p>
              </div>
              <Shield className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Response Time</p>
                <p className="text-2xl font-bold text-gray-800">{systemStatus.responseTime}</p>
              </div>
              <RefreshCw className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{systemStatus.activeUsers.toLocaleString()}</p>
              </div>
              <User className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-800">{supportTickets.filter(t => t.status !== 'Closed' && t.status !== 'closed').length}</p>
              </div>
              <Headphones className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['tickets', 'maintenance', 'monitoring'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
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
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Support Tickets</h2>
                  <button
                    onClick={() => setShowCreateTicket(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={20} /> Create Ticket
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading support tickets...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {supportTickets.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                              No support tickets found
                            </td>
                          </tr>
                        ) : (
                          supportTickets.map(ticket => (
                        <tr key={ticket.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{ticket.description}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(ticket.category)}`}>
                              {ticket.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.assignedTo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.createdDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewTicketDetails(ticket)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                              title="View Details"
                            >
                              <Eye size={20} />
                            </button>
                            {ticket.status !== 'Closed' && (
                              <>
                                <button
                                  onClick={() => handleAssignTicket(ticket.id)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  title="Assign Ticket"
                                >
                                  <User size={20} />
                                </button>
                                <button
                                  onClick={() => handleCloseTicket(ticket.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Close Ticket"
                                >
                                  <CheckCircle size={20} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">System Maintenance</h2>
                <p className="text-gray-600">Schedule and monitor automated maintenance tasks</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Database className="text-blue-600" size={20} />
                        Database Backup
                      </h3>
                      <button
                        onClick={handlePerformBackup}
                        className="btn-secondary text-sm"
                      >
                        Run Now
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><span className="font-semibold">Schedule:</span> Daily at 2:00 AM</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Last Run:</span> 2024-01-15 02:00:00</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Success
                        </span>
                      </p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Next Run:</span> 2024-01-16 02:00:00</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <RefreshCw className="text-green-600" size={20} />
                        System Update
                      </h3>
                      <button
                        onClick={handlePerformUpdate}
                        className="btn-secondary text-sm"
                      >
                        Run Now
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><span className="font-semibold">Schedule:</span> Weekly on Sundays</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Last Run:</span> 2024-01-14 01:00:00</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Success
                        </span>
                      </p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Next Run:</span> 2024-01-21 01:00:00</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Shield className="text-purple-600" size={20} />
                        Security Scan
                      </h3>
                      <button
                        onClick={() => handleRunMaintenance('MAINT003')}
                        className="btn-secondary text-sm"
                      >
                        Run Now
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><span className="font-semibold">Schedule:</span> Daily at 6:00 AM</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Last Run:</span> 2024-01-15 06:00:00</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Success
                        </span>
                      </p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Next Run:</span> 2024-01-16 06:00:00</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Settings className="text-orange-600" size={20} />
                        Log Cleanup
                      </h3>
                      <button
                        onClick={() => handleRunMaintenance('MAINT004')}
                        className="btn-secondary text-sm"
                      >
                        Run Now
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600"><span className="font-semibold">Schedule:</span> Weekly on Fridays</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Last Run:</span> 2024-01-13 03:00:00</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Failed
                        </span>
                      </p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">Next Run:</span> 2024-01-20 03:00:00</p>
                    </div>
                  </div>
                </div>

                {systemMaintenance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No maintenance records available</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {systemMaintenance.map(maintenance => (
                        <tr key={maintenance.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maintenance.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintenance.schedule}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintenance.lastRun}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(maintenance.status)}`}>
                              {maintenance.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintenance.duration}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintenance.nextRun}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRunMaintenance(maintenance.id)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Run Now"
                            >
                              <RefreshCw size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">System Monitoring</h2>
                <p className="text-gray-600">Monitor system performance, uptime, and API connections</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">API Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">MTN Mobile Money</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.mtn)}`}>
                          {systemStatus.apiStatus.mtn}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Airtel Money</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.airtel)}`}>
                          {systemStatus.apiStatus.airtel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Bank API</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.bank)}`}>
                          {systemStatus.apiStatus.bank}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Twilio SMS</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.twilio)}`}>
                          {systemStatus.apiStatus.twilio}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Average Response Time</span>
                        <span className="text-sm font-semibold text-gray-800">145ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Uptime (30 days)</span>
                        <span className="text-sm font-semibold text-green-600">99.2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Error Rate</span>
                        <span className="text-sm font-semibold text-gray-800">0.08%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Active Sessions</span>
                        <span className="text-sm font-semibold text-gray-800">1,890</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Alerts</h3>
                  <div className="space-y-3">
                    <div className="text-center py-8 text-gray-500">No alerts available</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket Modal */}
        {showCreateTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create Support Ticket</h2>
                <button onClick={() => setShowCreateTicket(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Enter ticket subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    className="input-field"
                    rows="4"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Enter ticket description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    className="input-field"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  >
                    <option value="Technical">Technical</option>
                    <option value="User Support">User Support</option>
                    <option value="Performance">Performance</option>
                    <option value="Feature Request">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    className="input-field"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateTicket(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="btn-primary"
                >
                  Create Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details Modal */}
        {showTicketDetails && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Ticket Details</h2>
                <button onClick={() => setShowTicketDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedTicket.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Subject:</span> {selectedTicket.subject}</p>
                <p className="text-gray-700"><span className="font-semibold">Description:</span> {selectedTicket.description}</p>
                <p className="text-gray-700"><span className="font-semibold">Category:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(selectedTicket.category)}`}>
                    {selectedTicket.category}
                  </span>
                </p>
                <p className="text-gray-700"><span className="font-semibold">Priority:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </p>
                <p className="text-gray-700"><span className="font-semibold">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowTicketDetails(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminSupport
