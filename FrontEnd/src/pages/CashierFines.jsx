import { useState, useEffect } from 'react'
import { AlertTriangle, DollarSign, Clock, CheckCircle, XCircle, Search, Filter, Users, Calendar, Bell, FileText, Plus, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function CashierFines() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showApplyFine, setShowApplyFine] = useState(false)
  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationContent, setNotificationContent] = useState('')
  const [notificationType, setNotificationType] = useState('fine_notification')
  const [sendingNotifications, setSendingNotifications] = useState(false)
  const [fineRules, setFineRules] = useState([])
  const [showEditRulesModal, setShowEditRulesModal] = useState(false)
  const [editingRules, setEditingRules] = useState([])
  const [savingRules, setSavingRules] = useState(false)
  const [showAdjustFineModal, setShowAdjustFineModal] = useState(false)
  const [selectedFine, setSelectedFine] = useState(null)
  const [adjustFineData, setAdjustFineData] = useState({
    amount: '',
    reason: '',
    dueDate: '',
    notes: ''
  })
  const [adjustingFine, setAdjustingFine] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        const [groupRes, finesRes] = await Promise.all([
          api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } })),
          api.get('/fines', { params: { status: 'all' } }).catch(() => ({ data: { success: false, data: [] } }))
        ])

        // Fetch group members separately
        let membersRes = { data: { success: false, data: [] } }
        try {
          membersRes = await api.get(`/groups/${groupId}/members`)
        } catch (err) {
          console.warn('Could not fetch group members:', err)
        }

        // Fetch fine rules
        try {
          const rulesRes = await api.get(`/fine-rules/${groupId}`)
          if (rulesRes.data?.success) {
            setFineRules(rulesRes.data.data || [])
          }
        } catch (err) {
          console.warn('Could not fetch fine rules:', err)
          // Set default rules if fetch fails
          setFineRules([
            {
              id: 'late_contribution',
              name: 'Late Contribution Fine',
              description: 'Applied when contribution is paid after due date',
              amount: 500,
              gracePeriod: 1,
              isActive: true
            },
            {
              id: 'missed_loan_payment',
              name: 'Missed Loan Payment Fine',
              description: 'Applied when loan payment is overdue',
              amount: 1000,
              gracePeriod: 0,
              isActive: true
            },
            {
              id: 'meeting_absence',
              name: 'Meeting Absence Fine',
              description: 'Applied when member misses group meeting',
              amount: 300,
              gracePeriod: 0,
              isActive: false
            }
          ])
        }

        if (!mounted) return

        if (groupRes.data?.success) {
          setGroupInfo(groupRes.data.data)
        }

        const allFines = Array.isArray(finesRes.data?.data) 
          ? finesRes.data.data.filter(f => f.groupId === groupId || f.groupId === parseInt(groupId))
          : []

        const today = new Date()
        const formattedFines = allFines.map(fine => {
          const member = fine.member || {}
          const dueDate = fine.dueDate ? new Date(fine.dueDate) : null
          const isOverdue = dueDate && dueDate < today && fine.status !== 'paid' && fine.status !== 'waived'
          const status = isOverdue ? 'overdue' : (fine.status || 'pending')

          return {
            id: fine.id,
            memberId: fine.memberId || member.id,
            memberName: member.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            phone: member.phone || '',
            amount: Number(fine.amount || 0),
            reason: fine.reason || '',
            appliedDate: fine.issuedDate ? new Date(fine.issuedDate).toISOString().split('T')[0] : '',
            dueDate: dueDate ? dueDate.toISOString().split('T')[0] : '',
            status: status,
            rawStatus: fine.status,
            appliedBy: fine.issuedBy || 'System',
            notes: fine.notes || fine.waiverReason || ''
          }
        })

        setFines(formattedFines)

        if (membersRes.data?.success && Array.isArray(membersRes.data.data)) {
          setGroupMembers(membersRes.data.data.filter(m => m.status === 'active'))
        }
      } catch (error) {
        console.error('[CashierFines] Error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const [newFine, setNewFine] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    reason: '',
    notes: ''
  })

  const filteredFines = fines.filter(fine => {
    const matchesStatus = filterStatus === 'all' || fine.status === filterStatus
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      !searchTerm || // If no search term, show all
      fine.memberName?.toLowerCase().includes(searchLower) ||
      fine.memberId?.toString().includes(searchTerm) ||
      fine.phone?.includes(searchTerm) ||
      fine.reason?.toLowerCase().includes(searchLower) ||
      fine.id?.toString().includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleApplyFine = () => {
    console.log('Applying fine:', newFine)
    alert(t('fineAppliedSuccessfully', { defaultValue: 'Fine applied successfully!' }))
    setShowApplyFine(false)
    setNewFine({
      memberId: '',
      memberName: '',
      amount: '',
      reason: '',
      notes: ''
    })
  }

  const handleAdjustFine = (fineId) => {
    const fine = fines.find(f => f.id === fineId)
    if (fine) {
      setSelectedFine(fine)
      setAdjustFineData({
        amount: fine.amount.toString(),
        reason: fine.reason,
        dueDate: fine.dueDate || '',
        notes: fine.notes || ''
      })
      setShowAdjustFineModal(true)
    }
  }

  const handleSaveAdjustment = async () => {
    if (!selectedFine) return

    if (!adjustFineData.amount || !adjustFineData.reason) {
      alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    setAdjustingFine(true)
    try {
      const response = await api.put(`/fines/${selectedFine.id}`, {
        amount: parseFloat(adjustFineData.amount),
        reason: adjustFineData.reason.trim(),
        dueDate: adjustFineData.dueDate || null,
        notes: adjustFineData.notes.trim() || null
      })

      if (response.data?.success) {
        alert(response.data.message || t('fineAdjustedSuccessfully', { defaultValue: 'Fine adjusted successfully!' }))
        setShowAdjustFineModal(false)
        setSelectedFine(null)
        setAdjustFineData({ amount: '', reason: '', dueDate: '', notes: '' })
        // Reload fines
        window.location.reload()
      } else {
        alert(response.data?.message || t('fineAdjustmentFailed', { defaultValue: 'Failed to adjust fine' }))
      }
    } catch (error) {
      console.error('Error adjusting fine:', error)
      alert(error.response?.data?.message || t('fineAdjustmentFailed', { defaultValue: 'Failed to adjust fine' }))
    } finally {
      setAdjustingFine(false)
    }
  }

  const handleMarkAsPaid = async (fineId) => {
    const fine = fines.find(f => f.id === fineId)
    if (!fine) return

    if (!confirm(t('confirmMarkAsPaid', { 
      defaultValue: `Are you sure you want to mark this fine as paid? This will clear the fine for ${fine.memberName} and notify all group members.` 
    }))) {
      return
    }

    setMarkingPaid(true)
    try {
      const response = await api.put(`/fines/${fineId}/verify-payment`, {
        paymentMethod: 'cash'
      })

      if (response.data?.success) {
        alert(response.data.message || t('fineMarkedAsPaid', { defaultValue: 'Fine marked as paid successfully! All members have been notified.' }))
        // Reload fines
        window.location.reload()
      } else {
        alert(response.data?.message || t('markAsPaidFailed', { defaultValue: 'Failed to mark fine as paid' }))
      }
    } catch (error) {
      console.error('Error marking fine as paid:', error)
      alert(error.response?.data?.message || t('markAsPaidFailed', { defaultValue: 'Failed to mark fine as paid' }))
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleSendNotification = (fineId) => {
    const fine = fines.find(f => f.id === fineId)
    if (fine) {
      setSelectedRecipients([fine.memberId])
      setNotificationTitle(t('fineNotification', { defaultValue: 'Fine Notification' }))
      setNotificationContent(
        t('fineNotificationMessage', { 
          defaultValue: `You have a fine of ${fine.amount.toLocaleString()} RWF for: ${fine.reason}. Please pay by ${fine.dueDate || 'the due date'}.` 
        })
      )
      setNotificationType('fine_notification')
      setShowNotificationModal(true)
    }
  }

  const handleSendBulkNotifications = () => {
    setSelectedRecipients([])
    setNotificationTitle(t('fineNotification', { defaultValue: 'Fine Notification' }))
    setNotificationContent('')
    setNotificationType('fine_notification')
    setShowNotificationModal(true)
  }

  const handleSendNotifications = async () => {
    if (selectedRecipients.length === 0) {
      alert(t('selectRecipients', { defaultValue: 'Please select at least one recipient' }))
      return
    }

    if (!notificationTitle || !notificationContent) {
      alert(t('fillAllFields', { defaultValue: 'Please fill in title and content' }))
      return
    }

    setSendingNotifications(true)
    try {
      let successCount = 0
      let failCount = 0

      for (const userId of selectedRecipients) {
        try {
          await api.post('/notifications', {
            userId: userId,
            type: notificationType,
            title: notificationTitle,
            content: notificationContent
          })
          successCount++
        } catch (error) {
          console.error(`Error sending notification to user ${userId}:`, error)
          failCount++
        }
      }

      alert(t('notificationsSent', { 
        defaultValue: `Notifications sent: ${successCount} successful, ${failCount} failed` 
      }))
      setShowNotificationModal(false)
      setSelectedRecipients([])
      setNotificationTitle('')
      setNotificationContent('')
    } catch (error) {
      console.error('Error sending notifications:', error)
      alert(error.response?.data?.message || t('notificationsFailed', { defaultValue: 'Failed to send notifications' }))
    } finally {
      setSendingNotifications(false)
    }
  }

  const toggleRecipientSelection = (userId) => {
    setSelectedRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllMembers = () => {
    setSelectedRecipients(groupMembers.map(m => m.id))
  }

  const deselectAllMembers = () => {
    setSelectedRecipients([])
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t('fineAndPenaltyManagement', { defaultValue: 'Fine and Penalty Management' })}</h1>
            <p className="text-gray-600 mt-1">{t('applyManageTrackFines', { defaultValue: 'Apply, manage, and track member fines' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApplyFine(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> {t('applyFine', { defaultValue: 'Apply Fine' })}
            </button>
            <button 
              onClick={handleSendBulkNotifications}
              className="btn-secondary flex items-center gap-2"
            >
              <Bell size={18} /> {t('sendNotifications', { defaultValue: 'Send Notifications' })}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('totalFines', { defaultValue: 'Total Fines' })}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">
                  {loading ? '...' : fines.length}
                </p>
              </div>
              <AlertTriangle className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('pendingFines', { defaultValue: 'Pending Fines' })}</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {loading ? '...' : fines.filter(f => f.status === 'pending').length}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('overdueFines', { defaultValue: 'Overdue Fines' })}</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {loading ? '...' : fines.filter(f => f.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('totalAmount', { defaultValue: 'Total Amount' })}</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {loading ? '...' : fines.reduce((sum, f) => sum + f.amount, 0).toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Fine Rules */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('fineRulesConfiguration', { defaultValue: 'Fine Rules Configuration' })}</h2>
            <button 
              onClick={() => {
                setEditingRules(JSON.parse(JSON.stringify(fineRules)))
                setShowEditRulesModal(true)
              }}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <FileText size={16} /> {t('editRules', { defaultValue: 'Edit Rules' })}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fineRules.map((rule) => (
              <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{rule.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    rule.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                  }`}>
                    {rule.isActive ? t('active', { defaultValue: 'Active' }) : t('inactive', { defaultValue: 'Inactive' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rule.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {rule.amount.toLocaleString()} RWF
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('grace', { defaultValue: 'Grace' })}: {rule.gracePeriod} {t('days', { defaultValue: 'days' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Fines
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member name, ID, or phone..."
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
                <option value="all">All Fines</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fines List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('memberFines', { defaultValue: 'Member Fines' })} ({filteredFines.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : filteredFines.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noFinesFound', { defaultValue: 'No fines found' })}</p>
          ) : (
            <div className="space-y-4">
              {filteredFines.map((fine) => (
              <div
                key={fine.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {fine.memberName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{fine.memberName}</h3>
                      <p className="text-sm text-gray-600">{fine.phone} • {fine.memberId}</p>
                      <p className="text-sm text-gray-500">Applied: {fine.appliedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fine.status)}`}>
                      {fine.status}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {fine.amount.toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Reason</p>
                    <p className="font-semibold">{fine.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{fine.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Applied By</p>
                    <p className="font-semibold">{fine.appliedBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fine ID</p>
                    <p className="font-semibold">{fine.id}</p>
                  </div>
                </div>

                {fine.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Notes:</p>
                    <p className="text-sm text-gray-800 italic">"{fine.notes}"</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdjustFine(fine.id)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <FileText size={16} /> Adjust Fine
                  </button>
                  <button
                    onClick={() => handleSendNotification(fine.id)}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Bell size={16} /> Send Notification
                  </button>
                  {(fine.status === 'pending' || fine.status === 'approved') && (
                    <button
                      onClick={() => handleMarkAsPaid(fine.id)}
                      disabled={markingPaid}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> {markingPaid ? t('processing', { defaultValue: 'Processing...' }) : t('markPaid', { defaultValue: 'Mark Paid' })}
                    </button>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply Fine Modal */}
        {showApplyFine && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Apply Fine</h2>
                <button
                  onClick={() => setShowApplyFine(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Member ID
                    </label>
                    <input
                      type="text"
                      value={newFine.memberId}
                      onChange={(e) => setNewFine({ ...newFine, memberId: e.target.value })}
                      className="input-field"
                      placeholder="Enter member ID..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Member Name
                    </label>
                    <input
                      type="text"
                      value={newFine.memberName}
                      onChange={(e) => setNewFine({ ...newFine, memberName: e.target.value })}
                      className="input-field"
                      placeholder="Enter member name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fine Amount (RWF)
                    </label>
                    <input
                      type="number"
                      value={newFine.amount}
                      onChange={(e) => setNewFine({ ...newFine, amount: e.target.value })}
                      className="input-field"
                      placeholder="Enter fine amount..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason
                    </label>
                    <select
                      value={newFine.reason}
                      onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select reason...</option>
                      <option value="Late contribution payment">Late contribution payment</option>
                      <option value="Missed loan payment">Missed loan payment</option>
                      <option value="Meeting absence">Meeting absence</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newFine.notes}
                    onChange={(e) => setNewFine({ ...newFine, notes: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowApplyFine(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyFine}
                    className="btn-primary flex-1"
                  >
                    Apply Fine
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Notifications Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {t('sendNotifications', { defaultValue: 'Send Notifications' })}
                </h2>
                <button
                  onClick={() => {
                    setShowNotificationModal(false)
                    setSelectedRecipients([])
                    setNotificationTitle('')
                    setNotificationContent('')
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Notification Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('notificationType', { defaultValue: 'Notification Type' })}
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="fine_notification">{t('fineNotification', { defaultValue: 'Fine Notification' })}</option>
                    <option value="general">{t('general', { defaultValue: 'General' })}</option>
                    <option value="payment_reminder">{t('paymentReminder', { defaultValue: 'Payment Reminder' })}</option>
                    <option value="important">{t('important', { defaultValue: 'Important' })}</option>
                  </select>
                </div>

                {/* Notification Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('title', { defaultValue: 'Title' })} *
                  </label>
                  <input
                    type="text"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder={t('enterNotificationTitle', { defaultValue: 'Enter notification title...' })}
                  />
                </div>

                {/* Notification Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('content', { defaultValue: 'Content' })} *
                  </label>
                  <textarea
                    value={notificationContent}
                    onChange={(e) => setNotificationContent(e.target.value)}
                    className="input-field h-32 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder={t('enterNotificationContent', { defaultValue: 'Enter notification content...' })}
                  />
                </div>

                {/* Recipient Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('selectRecipients', { defaultValue: 'Select Recipients' })} *
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllMembers}
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        {t('selectAll', { defaultValue: 'Select All' })}
                      </button>
                      <button
                        onClick={deselectAllMembers}
                        className="btn-secondary text-xs px-3 py-1"
                      >
                        {t('deselectAll', { defaultValue: 'Deselect All' })}
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {groupMembers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">{t('noMembersFound', { defaultValue: 'No members found' })}</p>
                    ) : (
                      <div className="space-y-2">
                        {groupMembers.map((member) => (
                          <div
                            key={member.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedRecipients.includes(member.id)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => toggleRecipientSelection(member.id)}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(member.id)}
                                onChange={() => toggleRecipientSelection(member.id)}
                                className="w-5 h-5"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{member.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {member.phone} • ID: {member.id}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {t('selected', { defaultValue: 'Selected' })}: {selectedRecipients.length} {t('of', { defaultValue: 'of' })} {groupMembers.length}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowNotificationModal(false)
                      setSelectedRecipients([])
                      setNotificationTitle('')
                      setNotificationContent('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={sendingNotifications}
                  >
                    {tCommon('cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    onClick={handleSendNotifications}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={sendingNotifications || selectedRecipients.length === 0 || !notificationTitle || !notificationContent}
                  >
                    {sendingNotifications ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('sending', { defaultValue: 'Sending...' })}
                      </>
                    ) : (
                      <>
                        <Bell size={18} />
                        {t('sendNotifications', { defaultValue: 'Send Notifications' })} ({selectedRecipients.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Fine Modal */}
        {showAdjustFineModal && selectedFine && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {t('adjustFine', { defaultValue: 'Adjust Fine' })} #{selectedFine.id}
                </h2>
                <button
                  onClick={() => {
                    setShowAdjustFineModal(false)
                    setSelectedFine(null)
                    setAdjustFineData({ amount: '', reason: '', dueDate: '', notes: '' })
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>{t('note', { defaultValue: 'Note' })}:</strong> {t('adjustFineNote', { 
                      defaultValue: 'Adjusting this fine will notify the person who charged it, the Secretary, and Group Admin.' 
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('memberName', { defaultValue: 'Member Name' })}
                    </label>
                    <input
                      type="text"
                      value={selectedFine.memberName}
                      disabled
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('currentAmount', { defaultValue: 'Current Amount' })} (RWF)
                    </label>
                    <input
                      type="text"
                      value={selectedFine.amount.toLocaleString()}
                      disabled
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('newAmount', { defaultValue: 'New Amount' })} (RWF) *
                    </label>
                    <input
                      type="number"
                      value={adjustFineData.amount}
                      onChange={(e) => setAdjustFineData({ ...adjustFineData, amount: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Enter new amount..."
                      min="0"
                      step="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('dueDate', { defaultValue: 'Due Date' })}
                    </label>
                    <input
                      type="date"
                      value={adjustFineData.dueDate}
                      onChange={(e) => setAdjustFineData({ ...adjustFineData, dueDate: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('reason', { defaultValue: 'Reason' })} *
                  </label>
                  <textarea
                    value={adjustFineData.reason}
                    onChange={(e) => setAdjustFineData({ ...adjustFineData, reason: e.target.value })}
                    className="input-field h-24 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Enter reason for fine..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('notes', { defaultValue: 'Notes' })}
                  </label>
                  <textarea
                    value={adjustFineData.notes}
                    onChange={(e) => setAdjustFineData({ ...adjustFineData, notes: e.target.value })}
                    className="input-field h-24 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Enter additional notes (optional)..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAdjustFineModal(false)
                      setSelectedFine(null)
                      setAdjustFineData({ amount: '', reason: '', dueDate: '', notes: '' })
                    }}
                    className="btn-secondary flex-1"
                    disabled={adjustingFine}
                  >
                    {tCommon('cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    onClick={handleSaveAdjustment}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={adjustingFine || !adjustFineData.amount || !adjustFineData.reason}
                  >
                    {adjustingFine ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('saving', { defaultValue: 'Saving...' })}
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        {t('saveAdjustment', { defaultValue: 'Save Adjustment' })}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rules Modal */}
        {showEditRulesModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {t('editFineRules', { defaultValue: 'Edit Fine Rules' })}
                </h2>
                <button
                  onClick={() => {
                    setShowEditRulesModal(false)
                    setEditingRules([])
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>{t('note', { defaultValue: 'Note' })}:</strong> {t('fineRulesVotingNote', { 
                      defaultValue: 'Changes to fine rules will be submitted for voting. Group Admin and all members will be notified to vote. Rules will only be applied after voting is completed and approved.' 
                    })}
                  </p>
                </div>

                {editingRules.map((rule, index) => (
                  <div key={rule.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{rule.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('amount', { defaultValue: 'Amount' })} (RWF) *
                        </label>
                        <input
                          type="number"
                          value={rule.amount}
                          onChange={(e) => {
                            const updated = [...editingRules]
                            updated[index].amount = parseFloat(e.target.value) || 0
                            setEditingRules(updated)
                          }}
                          className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          min="0"
                          step="100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('gracePeriod', { defaultValue: 'Grace Period' })} ({t('days', { defaultValue: 'days' })}) *
                        </label>
                        <input
                          type="number"
                          value={rule.gracePeriod}
                          onChange={(e) => {
                            const updated = [...editingRules]
                            updated[index].gracePeriod = parseInt(e.target.value) || 0
                            setEditingRules(updated)
                          }}
                          className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('status', { defaultValue: 'Status' })}
                        </label>
                        <select
                          value={rule.isActive ? 'active' : 'inactive'}
                          onChange={(e) => {
                            const updated = [...editingRules]
                            updated[index].isActive = e.target.value === 'active'
                            setEditingRules(updated)
                          }}
                          className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                          <option value="active">{t('active', { defaultValue: 'Active' })}</option>
                          <option value="inactive">{t('inactive', { defaultValue: 'Inactive' })}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditRulesModal(false)
                      setEditingRules([])
                    }}
                    className="btn-secondary flex-1"
                    disabled={savingRules}
                  >
                    {tCommon('cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    onClick={async () => {
                      if (!groupInfo?.id) {
                        alert(t('groupNotFound', { defaultValue: 'Group not found' }))
                        return
                      }

                      setSavingRules(true)
                      try {
                        const response = await api.post(`/fine-rules/${groupInfo.id}/propose`, {
                          rules: editingRules
                        })

                        if (response.data?.success) {
                          alert(t('fineRulesProposed', { 
                            defaultValue: 'Fine rules change proposal created! Group Admin and all members have been notified to vote.' 
                          }))
                          setShowEditRulesModal(false)
                          setEditingRules([])
                          // Reload fine rules after a delay
                          setTimeout(async () => {
                            try {
                              const rulesRes = await api.get(`/fine-rules/${groupInfo.id}`)
                              if (rulesRes.data?.success) {
                                setFineRules(rulesRes.data.data || [])
                              }
                            } catch (err) {
                              console.warn('Could not reload fine rules:', err)
                            }
                          }, 2000)
                        } else {
                          alert(response.data?.message || t('proposalFailed', { defaultValue: 'Failed to create proposal' }))
                        }
                      } catch (error) {
                        console.error('Error proposing fine rules:', error)
                        alert(error.response?.data?.message || t('proposalFailed', { defaultValue: 'Failed to create proposal' }))
                      } finally {
                        setSavingRules(false)
                      }
                    }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={savingRules}
                  >
                    {savingRules ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('submitting', { defaultValue: 'Submitting...' })}
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        {t('submitForVoting', { defaultValue: 'Submit for Voting' })}
                      </>
                    )}
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

export default CashierFines
