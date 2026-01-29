import { useState, useEffect } from 'react'
import { Headphones, Plus, Eye, CheckCircle, XCircle, Clock, AlertCircle, Database, Shield, RefreshCw, Settings, User, MessageCircle, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminSupport() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [activeTab, setActiveTab] = useState('tickets')
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])

  const [supportTickets, setSupportTickets] = useState([])
  const [systemMaintenance, setSystemMaintenance] = useState([])
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    backup: { loading: false, lastRun: null, status: null, backupPath: null },
    update: { loading: false, lastRun: null, status: null },
    security: { loading: false, lastRun: null, status: null },
    cleanup: { loading: false, lastRun: null, status: null }
  })
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
    message: '',
    category: 'other',
    priority: 'medium',
    userId: '',
    attachments: []
  })

  const fetchMaintenanceStatus = async () => {
    try {
      const { data } = await api.get('/system-admin/maintenance/status').catch(() => ({ data: { success: false } }))
      if (data?.success) {
        // Update maintenance status with recent activity
        // This could be used to show last run times, etc.
      }
    } catch (error) {
      console.error('[fetchMaintenanceStatus] Error:', error)
    }
  }

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
        
        const [ticketsRes, usersRes] = await Promise.all([
          Promise.race([
            api.get('/support'),
            timeoutPromise
          ]).catch(() => ({ data: { data: [] } })),
          Promise.race([
            api.get('/system-admin/users'),
            timeoutPromise
          ]).catch(() => ({ data: { data: [] } }))
        ])
        
        if (timeoutId) clearTimeout(timeoutId)
        
        if (mounted) {
          setSupportTickets(ticketsRes?.data?.data || [])
          setUsers(usersRes?.data?.data || [])
          setSystemMaintenance([])
          setSystemStatus({
            uptime: '0%',
            responseTime: '0ms',
            activeUsers: 0,
            apiStatus: { mtn: 'Unknown', airtel: 'Unknown', bank: 'Unknown', twilio: 'Unknown' }
          })
          
          // Fetch maintenance status
          fetchMaintenanceStatus()
        }
      } catch (e) {
        if (mounted) {
          setSupportTickets([])
          setUsers([])
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
    if (!newTicket.subject || !newTicket.message) {
      alert('Please fill in subject and description.')
      return
    }
    try {
      const payload = {
        subject: newTicket.subject,
        message: newTicket.message,
        category: newTicket.category,
        priority: newTicket.priority
      }
      
      // Add userId if provided (System Admin can create tickets for any user)
      if (newTicket.userId) {
        payload.userId = parseInt(newTicket.userId)
      }
      
      const { data } = await api.post('/support/create', payload)
      
      if (data?.success) {
        alert('Ticket created successfully!')
        const ticketsRes = await api.get('/support').catch(() => ({ data: { data: [] } }))
        setSupportTickets(ticketsRes?.data?.data || [])
        setShowCreateTicket(false)
        setNewTicket({ subject: '', message: '', category: 'other', priority: 'medium', userId: '', attachments: [] })
      }
    } catch (e) {
      console.error('[SystemAdminSupport] Error creating ticket:', e)
      alert(e?.response?.data?.message || 'Failed to create ticket. Please check your connection.')
    }
  }

  const handleViewTicketDetails = (ticket) => {
    navigate(`/system-admin/support/tickets/${ticket.id}`)
  }
  
  const handleRowClick = (ticket) => {
    navigate(`/system-admin/support/tickets/${ticket.id}`)
  }
  
  const handleUserClick = (userId) => {
    if (userId) {
      navigate(`/system-admin/users/${userId}`)
    }
  }

  const handleAssignTicket = (ticketId) => {
    alert(tSystemAdmin('assigningTicket', { defaultValue: `Assigning ticket ${ticketId}...` }))
  }

  const handleCloseTicket = (ticketId) => {
    alert(tSystemAdmin('closingTicket', { defaultValue: `Closing ticket ${ticketId}...` }))
  }

  const handlePerformBackup = async () => {
    try {
      setMaintenanceStatus(prev => ({ ...prev, backup: { ...prev.backup, loading: true } }))
      
      const { data } = await api.post('/system-admin/maintenance/backup')
      
      if (data?.success) {
        setMaintenanceStatus(prev => ({
          ...prev,
          backup: {
            loading: false,
            lastRun: new Date().toISOString(),
            status: 'success',
            backupPath: data.data.backupPath,
            backupFile: data.data.backupFile,
            fileSize: data.data.fileSize
          }
        }))
        
        // Show success message with backup location
        alert(`Database backup completed successfully!\n\nBackup File: ${data.data.backupFile}\nLocation: ${data.data.backupPath}\nSize: ${data.data.fileSize}`)
        
        // Refresh maintenance status
        fetchMaintenanceStatus()
      }
    } catch (error) {
      console.error('[handlePerformBackup] Error:', error)
      setMaintenanceStatus(prev => ({
        ...prev,
        backup: { ...prev.backup, loading: false, status: 'failed' }
      }))
      alert('Failed to perform backup: ' + (error?.response?.data?.message || error?.message || 'Unknown error'))
    }
  }

  const handlePerformUpdate = async () => {
    try {
      setMaintenanceStatus(prev => ({ ...prev, update: { ...prev.update, loading: true } }))
      
      const { data } = await api.post('/system-admin/maintenance/update')
      
      if (data?.success) {
        setMaintenanceStatus(prev => ({
          ...prev,
          update: {
            loading: false,
            lastRun: new Date().toISOString(),
            status: 'success'
          }
        }))
        
        alert('System update completed successfully!')
        fetchMaintenanceStatus()
      }
    } catch (error) {
      console.error('[handlePerformUpdate] Error:', error)
      setMaintenanceStatus(prev => ({
        ...prev,
        update: { ...prev.update, loading: false, status: 'failed' }
      }))
      alert('Failed to perform update: ' + (error?.response?.data?.message || error?.message || 'Unknown error'))
    }
  }
  
  const handleRunMaintenance = async (maintenanceId) => {
    try {
      let endpoint = ''
      let statusKey = ''
      
      if (maintenanceId === 'MAINT003') {
        // Security Scan
        endpoint = '/system-admin/maintenance/security-scan'
        statusKey = 'security'
      } else if (maintenanceId === 'MAINT004') {
        // Log Cleanup
        endpoint = '/system-admin/maintenance/log-cleanup'
        statusKey = 'cleanup'
      } else {
        alert('Unknown maintenance task')
        return
      }
      
      setMaintenanceStatus(prev => ({
        ...prev,
        [statusKey]: { ...prev[statusKey], loading: true }
      }))
      
      const { data } = await api.post(endpoint)
      
      if (data?.success) {
        setMaintenanceStatus(prev => ({
          ...prev,
          [statusKey]: {
            loading: false,
            lastRun: new Date().toISOString(),
            status: 'success',
            result: data.data
          }
        }))
        
        if (statusKey === 'cleanup') {
          alert(`Log cleanup completed successfully!\n\nDeleted ${data.data.logsDeleted} log entries older than ${data.data.daysToKeep} days.`)
        } else if (statusKey === 'security') {
          const summary = data.data.summary
          alert(`Security scan completed successfully!\n\nTotal Checks: ${summary.total}\nPassed: ${summary.passed}\nFailed: ${summary.failed}`)
        }
        
        fetchMaintenanceStatus()
      }
    } catch (error) {
      console.error('[handleRunMaintenance] Error:', error)
      const statusKey = maintenanceId === 'MAINT003' ? 'security' : 'cleanup'
      setMaintenanceStatus(prev => ({
        ...prev,
        [statusKey]: { ...prev[statusKey], loading: false, status: 'failed' }
      }))
      alert('Failed to run maintenance: ' + (error?.response?.data?.message || error?.message || 'Unknown error'))
    }
  }

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'open': return 'bg-yellow-100 text-yellow-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase()
    switch (priorityLower) {
      case 'urgent':
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryColor = (category) => {
    const categoryLower = category?.toLowerCase()
    switch (categoryLower) {
      case 'technical': return 'bg-blue-100 text-blue-700'
      case 'account': return 'bg-purple-100 text-purple-700'
      case 'loan': return 'bg-orange-100 text-orange-700'
      case 'contribution': return 'bg-green-100 text-green-700'
      case 'other': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  
  const getStatusDisplay = (status) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'open': return tCommon('open', { defaultValue: 'Open' })
      case 'in_progress': return t('inProgress')
      case 'resolved': return t('resolved')
      case 'closed': return tSystemAdmin('closed', { defaultValue: 'Closed' })
      default: return status || t('unknown')
    }
  }
  
  const getCategoryDisplay = (category) => {
    const categoryLower = category?.toLowerCase()
    switch (categoryLower) {
      case 'technical': return tSystemAdmin('technical', { defaultValue: 'Technical' })
      case 'account': return tSystemAdmin('account', { defaultValue: 'Account' })
      case 'loan': return t('loans')
      case 'contribution': return t('contributions')
      case 'other': return tSystemAdmin('other', { defaultValue: 'Other' })
      default: return category || tSystemAdmin('other')
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('supportMaintenance', { defaultValue: 'Support & Maintenance' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('assignSupportTicketsPerformUpdates', { defaultValue: 'Assign support tickets, perform system updates, and monitor uptime' })}</p>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('systemUptime', { defaultValue: 'System Uptime' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.uptime}</p>
              </div>
              <Shield className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('responseTime', { defaultValue: 'Response Time' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.responseTime}</p>
              </div>
              <RefreshCw className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('activeUsers', { defaultValue: 'Active Users' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{systemStatus.activeUsers.toLocaleString()}</p>
              </div>
              <User className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('openTickets', { defaultValue: 'Open Tickets' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length}</p>
              </div>
              <Headphones className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['tickets', 'maintenance', 'monitoring'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tSystemAdmin(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('supportTickets', { defaultValue: 'Support Tickets' })}</h2>
                  <button
                    onClick={() => setShowCreateTicket(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={20} /> {tSystemAdmin('createTicket', { defaultValue: 'Create Ticket' })}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingSupportRequests')}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('ticketId', { defaultValue: 'Ticket ID' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('subject', { defaultValue: 'Subject' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('category', { defaultValue: 'Category' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('priority', { defaultValue: 'Priority' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('assignedTo', { defaultValue: 'Assigned To' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('created', { defaultValue: 'Created' })}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tCommon('actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {supportTickets.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              {t('noSupportRequestsFound')}
                            </td>
                          </tr>
                        ) : (
                          supportTickets.map(ticket => (
                        <tr 
                          key={ticket.id}
                          onClick={() => handleRowClick(ticket)}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ticket.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{ticket.message}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(ticket.category)}`}>
                              {getCategoryDisplay(ticket.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority ? tSystemAdmin(`priority.${ticket.priority}`, { defaultValue: ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) }) : tSystemAdmin('priority.medium', { defaultValue: 'Medium' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {getStatusDisplay(ticket.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {ticket.assignedAgent ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUserClick(ticket.assignedAgent.id)
                                }}
                                className="text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                {ticket.assignedAgent.name || `User #${ticket.assignedTo}`}
                              </button>
                            ) : ticket.assignedTo ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUserClick(ticket.assignedTo)
                                }}
                                className="text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                {tSystemAdmin('user', { defaultValue: 'User' })} #${ticket.assignedTo}
                              </button>
                            ) : (
                              <span>{tSystemAdmin('unassigned', { defaultValue: 'Unassigned' })}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(ticket.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewTicketDetails(ticket)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                              title={tCommon('view')}
                            >
                              <Eye size={20} />
                            </button>
                            {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                              <>
                                <button
                                  onClick={() => handleAssignTicket(ticket.id)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                  title={tSystemAdmin('assignTicket', { defaultValue: 'Assign Ticket' })}
                                >
                                  <User size={20} />
                                </button>
                                <button
                                  onClick={() => handleCloseTicket(ticket.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title={tSystemAdmin('closeTicket', { defaultValue: 'Close Ticket' })}
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('systemMaintenance', { defaultValue: 'System Maintenance' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('scheduleMonitorAutomatedMaintenance', { defaultValue: 'Schedule and monitor automated maintenance tasks' })}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Database className="text-blue-600" size={20} />
                        {tSystemAdmin('databaseBackup', { defaultValue: 'Database Backup' })}
                      </h3>
                      <button
                        onClick={handlePerformBackup}
                        disabled={maintenanceStatus.backup.loading}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {maintenanceStatus.backup.loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Running...
                          </>
                        ) : (
                          tSystemAdmin('runNow', { defaultValue: 'Run Now' })
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('schedule', { defaultValue: 'Schedule' })}:</span> {tSystemAdmin('dailyAt2AM', { defaultValue: 'Daily at 2:00 AM' })}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">{tSystemAdmin('lastRun', { defaultValue: 'Last Run' })}:</span>{' '}
                        {maintenanceStatus.backup.lastRun ? new Date(maintenanceStatus.backup.lastRun).toLocaleString() : 'Never'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{t('status')}:</span>
                        {maintenanceStatus.backup.loading ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            In Progress...
                          </span>
                        ) : maintenanceStatus.backup.status === 'success' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {tSystemAdmin('success', { defaultValue: 'Success' })}
                          </span>
                        ) : maintenanceStatus.backup.status === 'failed' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            {tSystemAdmin('failed', { defaultValue: 'Failed' })}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Not Run
                          </span>
                        )}
                      </p>
                      {maintenanceStatus.backup.backupPath && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">Backup Location:</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 break-all">{maintenanceStatus.backup.backupPath}</p>
                          {maintenanceStatus.backup.fileSize && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Size: {maintenanceStatus.backup.fileSize}</p>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('nextRun', { defaultValue: 'Next Run' })}:</span> {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <RefreshCw className="text-green-600" size={20} />
                        {tSystemAdmin('systemUpdate', { defaultValue: 'System Update' })}
                      </h3>
                      <button
                        onClick={handlePerformUpdate}
                        disabled={maintenanceStatus.update.loading}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {maintenanceStatus.update.loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Running...
                          </>
                        ) : (
                          tSystemAdmin('runNow')
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('schedule')}:</span> {tSystemAdmin('weeklyOnSundays', { defaultValue: 'Weekly on Sundays' })}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">{tSystemAdmin('lastRun')}:</span>{' '}
                        {maintenanceStatus.update.lastRun ? new Date(maintenanceStatus.update.lastRun).toLocaleString() : 'Never'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{t('status')}:</span>
                        {maintenanceStatus.update.loading ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            In Progress...
                          </span>
                        ) : maintenanceStatus.update.status === 'success' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {tSystemAdmin('success')}
                          </span>
                        ) : maintenanceStatus.update.status === 'failed' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            {tSystemAdmin('failed', { defaultValue: 'Failed' })}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Not Run
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('nextRun')}:</span> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Shield className="text-purple-600" size={20} />
                        {tSystemAdmin('securityScan', { defaultValue: 'Security Scan' })}
                      </h3>
                      <button
                        onClick={() => handleRunMaintenance('MAINT003')}
                        disabled={maintenanceStatus.security.loading}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {maintenanceStatus.security.loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Scanning...
                          </>
                        ) : (
                          tSystemAdmin('runNow')
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('schedule')}:</span> {tSystemAdmin('dailyAt6AM', { defaultValue: 'Daily at 6:00 AM' })}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">{tSystemAdmin('lastRun')}:</span>{' '}
                        {maintenanceStatus.security.lastRun ? new Date(maintenanceStatus.security.lastRun).toLocaleString() : 'Never'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{t('status')}:</span>
                        {maintenanceStatus.security.loading ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Scanning...
                          </span>
                        ) : maintenanceStatus.security.status === 'success' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {tSystemAdmin('success')}
                          </span>
                        ) : maintenanceStatus.security.status === 'failed' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            {tSystemAdmin('failed', { defaultValue: 'Failed' })}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Not Run
                          </span>
                        )}
                      </p>
                      {maintenanceStatus.security.result && (
                        <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-xs text-purple-700 dark:text-purple-300">
                            Checks: {maintenanceStatus.security.result.summary?.passed || 0}/{maintenanceStatus.security.result.summary?.total || 0} passed
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('nextRun')}:</span> {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Settings className="text-orange-600" size={20} />
                        {tSystemAdmin('logCleanup', { defaultValue: 'Log Cleanup' })}
                      </h3>
                      <button
                        onClick={() => handleRunMaintenance('MAINT004')}
                        disabled={maintenanceStatus.cleanup.loading}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {maintenanceStatus.cleanup.loading ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Cleaning...
                          </>
                        ) : (
                          tSystemAdmin('runNow')
                        )}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('schedule')}:</span> {tSystemAdmin('weeklyOnFridays', { defaultValue: 'Weekly on Fridays' })}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">{tSystemAdmin('lastRun')}:</span>{' '}
                        {maintenanceStatus.cleanup.lastRun ? new Date(maintenanceStatus.cleanup.lastRun).toLocaleString() : 'Never'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{t('status')}:</span>
                        {maintenanceStatus.cleanup.loading ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Cleaning...
                          </span>
                        ) : maintenanceStatus.cleanup.status === 'success' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {tSystemAdmin('success')}
                          </span>
                        ) : maintenanceStatus.cleanup.status === 'failed' ? (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            {tSystemAdmin('failed', { defaultValue: 'Failed' })}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            Not Run
                          </span>
                        )}
                      </p>
                      {maintenanceStatus.cleanup.result && (
                        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            Deleted: {maintenanceStatus.cleanup.result.logsDeleted || 0} log entries
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-semibold">{tSystemAdmin('nextRun')}:</span> {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {systemMaintenance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">{tSystemAdmin('noMaintenanceRecordsAvailable', { defaultValue: 'No maintenance records available' })}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('maintenanceType', { defaultValue: 'Maintenance Type' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('schedule')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('lastRun')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('duration', { defaultValue: 'Duration' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('nextRun')}</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tCommon('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {systemMaintenance.map(maintenance => (
                        <tr key={maintenance.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{maintenance.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{maintenance.schedule}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{maintenance.lastRun}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(maintenance.status)}`}>
                              {maintenance.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{maintenance.duration}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{maintenance.nextRun}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRunMaintenance(maintenance.id)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              title={tSystemAdmin('runNow')}
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('systemMonitoring', { defaultValue: 'System Monitoring' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('monitorSystemPerformanceUptime', { defaultValue: 'Monitor system performance, uptime, and API connections' })}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{tSystemAdmin('apiStatus', { defaultValue: 'API Status' })}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('mtnMobileMoney', { defaultValue: 'MTN Mobile Money' })}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.mtn)}`}>
                          {systemStatus.apiStatus.mtn}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('airtelMoney', { defaultValue: 'Airtel Money' })}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.airtel)}`}>
                          {systemStatus.apiStatus.airtel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('bankApi', { defaultValue: 'Bank API' })}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.bank)}`}>
                          {systemStatus.apiStatus.bank}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('twilioSms', { defaultValue: 'Twilio SMS' })}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getApiStatusColor(systemStatus.apiStatus.twilio)}`}>
                          {systemStatus.apiStatus.twilio}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{tSystemAdmin('performanceMetrics')}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('averageResponseTime', { defaultValue: 'Average Response Time' })}</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">145ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('uptime30Days', { defaultValue: 'Uptime (30 days)' })}</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">99.2%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('errorRate', { defaultValue: 'Error Rate' })}</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">0.08%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tSystemAdmin('activeSessions', { defaultValue: 'Active Sessions' })}</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white">1,890</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{tSystemAdmin('recentAlerts', { defaultValue: 'Recent Alerts' })}</h3>
                  <div className="space-y-3">
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">{tSystemAdmin('noAlertsAvailable', { defaultValue: 'No alerts available' })}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Ticket Modal */}
        {showCreateTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('createSupportTicket', { defaultValue: 'Create Support Ticket' })}</h2>
                <button onClick={() => setShowCreateTicket(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Enter ticket subject"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows="4"
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    placeholder="Enter ticket description"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    >
                      <option value="other">Other</option>
                      <option value="technical">Technical</option>
                      <option value="account">Account</option>
                      <option value="loan">Loan</option>
                      <option value="contribution">Contribution</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">User (Optional)</label>
                  <select
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={newTicket.userId}
                    onChange={(e) => setNewTicket({ ...newTicket, userId: e.target.value })}
                  >
                    <option value="">Select user (optional)</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">File upload feature coming soon</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateTicket(false)}
                  className="btn-secondary"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="btn-primary"
                >
                  {tSystemAdmin('createTicket')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details Modal */}
        {showTicketDetails && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('ticketDetails', { defaultValue: 'Ticket Details' })}</h2>
                <button onClick={() => setShowTicketDetails(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('id', { defaultValue: 'ID' })}:</span> {selectedTicket.id}</p>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('subject')}:</span> {selectedTicket.subject}</p>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('message')}:</span> {selectedTicket.message}</p>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('category')}:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(selectedTicket.category)}`}>
                    {getCategoryDisplay(selectedTicket.category)}
                  </span>
                </p>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('priority')}:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority ? tSystemAdmin(`priority.${selectedTicket.priority}`, { defaultValue: selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1) }) : tSystemAdmin('priority.medium')}
                  </span>
                </p>
                <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{t('status')}:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusDisplay(selectedTicket.status)}
                  </span>
                </p>
                {selectedTicket.user && (
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('createdBy', { defaultValue: 'Created by' })}:</span> {selectedTicket.user.name} ({selectedTicket.user.email})</p>
                )}
                {selectedTicket.createdAt && (
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-semibold">{tSystemAdmin('created')}:</span> {formatDate(selectedTicket.createdAt)}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowTicketDetails(false)}
                  className="btn-secondary"
                >
                  {tCommon('close')}
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
