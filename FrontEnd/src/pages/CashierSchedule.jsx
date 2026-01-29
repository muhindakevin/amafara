import { useState } from 'react'
import { Calendar, Clock, Users, DollarSign, CheckCircle, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'

function CashierSchedule() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tCashier } = useTranslation('cashier')
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  const scheduledContributions = [
    {
      id: 'SC001',
      date: '2024-01-25',
      time: '09:00',
      member: 'Kamikazi Marie',
      amount: 5000,
      status: 'scheduled',
      reminderSent: false
    },
    {
      id: 'SC002',
      date: '2024-01-25',
      time: '10:00',
      member: 'Mukamana Alice',
      amount: 7500,
      status: 'scheduled',
      reminderSent: true
    },
    {
      id: 'SC003',
      date: '2024-01-26',
      time: '14:00',
      member: 'Mutabazi Paul',
      amount: 10000,
      status: 'scheduled',
      reminderSent: false
    },
    {
      id: 'SC004',
      date: '2024-01-27',
      time: '11:00',
      member: 'Ikirezi Jane',
      amount: 5000,
      status: 'completed',
      reminderSent: true
    }
  ]

  const [newSchedule, setNewSchedule] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    date: '',
    time: '',
    notes: ''
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'missed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleCreateSchedule = () => {
    console.log('Creating schedule:', newSchedule)
    alert(t('scheduleCreatedSuccessfully', { defaultValue: 'Schedule created successfully!' }))
    setShowCreateSchedule(false)
    setNewSchedule({
      memberId: '',
      memberName: '',
      amount: '',
      date: '',
      time: '',
      notes: ''
    })
  }

  const handleSendReminder = (scheduleId) => {
    console.log('Sending reminder for schedule:', scheduleId)
    alert(t('reminderSentSuccessfully', { defaultValue: 'Reminder sent successfully!' }))
  }

  const handleEditSchedule = (scheduleId) => {
    console.log('Editing schedule:', scheduleId)
    alert(t('editSchedulePlaceholder', { defaultValue: 'Edit schedule dialog would open here' }))
  }

  const handleDeleteSchedule = (scheduleId) => {
    console.log('Deleting schedule:', scheduleId)
    alert(t('scheduleDeletedSuccessfully', { defaultValue: 'Schedule deleted successfully!' }))
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{tCashier('contributionSchedule', { defaultValue: 'Contribution Schedule' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{tCashier('manageScheduledContributions', { defaultValue: 'Manage scheduled member contributions' })}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateSchedule(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> {tCashier('scheduleContribution', { defaultValue: 'Schedule Contribution' })}
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Calendar size={18} /> {t('calendarView', { defaultValue: 'Calendar View' })}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tCashier('scheduledToday', { defaultValue: 'Scheduled Today' })}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {scheduledContributions.filter(s => s.date === '2024-01-25').length}
                </p>
              </div>
              <Calendar className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tCashier('totalScheduled', { defaultValue: 'Total Scheduled' })}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {scheduledContributions.length}
                </p>
              </div>
              <Clock className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('completed', { defaultValue: 'Completed' })}</p>
                <p className="text-2xl font-bold text-green-600">
                  {scheduledContributions.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {scheduledContributions.reduce((sum, s) => sum + s.amount, 0).toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Scheduled Contributions ({scheduledContributions.length})
            </h2>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">
                <Calendar size={16} /> Filter by Date
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {scheduledContributions.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {schedule.member[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{schedule.member}</h3>
                      <p className="text-sm text-gray-600">Scheduled for {schedule.date} at {schedule.time}</p>
                      <p className="text-sm text-gray-500">Schedule ID: {schedule.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {schedule.amount.toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Reminder Sent: </span>
                      <span className={`font-semibold ${schedule.reminderSent ? 'text-green-600' : 'text-gray-600'}`}>
                        {schedule.reminderSent ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!schedule.reminderSent && (
                      <button
                        onClick={() => handleSendReminder(schedule.id)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <AlertCircle size={16} /> Send Reminder
                      </button>
                    )}
                    <button
                      onClick={() => handleEditSchedule(schedule.id)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Schedule Modal */}
        {showCreateSchedule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Schedule Contribution</h2>
                <button
                  onClick={() => setShowCreateSchedule(false)}
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
                      value={newSchedule.memberId}
                      onChange={(e) => setNewSchedule({ ...newSchedule, memberId: e.target.value })}
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
                      value={newSchedule.memberName}
                      onChange={(e) => setNewSchedule({ ...newSchedule, memberName: e.target.value })}
                      className="input-field"
                      placeholder="Enter member name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (RWF)
                    </label>
                    <input
                      type="number"
                      value={newSchedule.amount}
                      onChange={(e) => setNewSchedule({ ...newSchedule, amount: e.target.value })}
                      className="input-field"
                      placeholder="Enter amount..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newSchedule.notes}
                    onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateSchedule(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSchedule}
                    className="btn-primary flex-1"
                  >
                    Schedule Contribution
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

export default CashierSchedule
