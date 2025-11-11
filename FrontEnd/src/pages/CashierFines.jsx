import { useState } from 'react'
import { AlertTriangle, DollarSign, Clock, CheckCircle, XCircle, Search, Filter, Users, Calendar, Bell, FileText, Plus } from 'lucide-react'
import Layout from '../components/Layout'

function CashierFines() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showApplyFine, setShowApplyFine] = useState(false)

  const fines = [
    {
      id: 'F001',
      memberId: 'M001',
      memberName: 'Kamikazi Marie',
      phone: '+250788123456',
      amount: 500,
      reason: 'Late contribution payment',
      appliedDate: '2024-01-20',
      dueDate: '2024-01-25',
      status: 'pending',
      appliedBy: 'System',
      notes: 'Payment was 2 days late'
    },
    {
      id: 'F002',
      memberId: 'M004',
      memberName: 'Mutabazi Paul',
      phone: '+250788456789',
      amount: 1000,
      reason: 'Missed loan payment',
      appliedDate: '2024-01-18',
      dueDate: '2024-01-23',
      status: 'paid',
      appliedBy: 'Cashier',
      notes: 'Loan payment overdue by 5 days'
    },
    {
      id: 'F003',
      memberId: 'M005',
      memberName: 'Uwimana Grace',
      phone: '+250788567890',
      amount: 750,
      reason: 'Late contribution payment',
      appliedDate: '2024-01-15',
      dueDate: '2024-01-20',
      status: 'overdue',
      appliedBy: 'System',
      notes: 'Payment was 3 days late'
    }
  ]

  const fineRules = [
    {
      id: 'R001',
      name: 'Late Contribution Fine',
      description: 'Applied when contribution is paid after due date',
      amount: 500,
      gracePeriod: 1,
      isActive: true
    },
    {
      id: 'R002',
      name: 'Missed Loan Payment Fine',
      description: 'Applied when loan payment is overdue',
      amount: 1000,
      gracePeriod: 0,
      isActive: true
    },
    {
      id: 'R003',
      name: 'Meeting Absence Fine',
      description: 'Applied when member misses group meeting',
      amount: 300,
      gracePeriod: 0,
      isActive: false
    }
  ]

  const [newFine, setNewFine] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    reason: '',
    notes: ''
  })

  const filteredFines = fines.filter(fine => {
    const matchesStatus = filterStatus === 'all' || fine.status === filterStatus
    const matchesSearch = 
      fine.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.phone.includes(searchTerm)
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
    alert('Fine applied successfully!')
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
    console.log('Adjusting fine:', fineId)
    alert('Fine adjustment dialog would open here')
  }

  const handleSendNotification = (fineId) => {
    console.log('Sending notification for fine:', fineId)
    alert('Notification sent successfully!')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Fine and Penalty Management</h1>
            <p className="text-gray-600 mt-1">Apply, manage, and track member fines</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowApplyFine(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Apply Fine
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Bell size={18} /> Send Notifications
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Fines</p>
                <p className="text-2xl font-bold text-gray-800">
                  {fines.length}
                </p>
              </div>
              <AlertTriangle className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Fines</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {fines.filter(f => f.status === 'pending').length}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Overdue Fines</p>
                <p className="text-2xl font-bold text-red-600">
                  {fines.filter(f => f.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {fines.reduce((sum, f) => sum + f.amount, 0).toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Fine Rules */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Fine Rules Configuration</h2>
            <button className="btn-secondary text-sm">
              <FileText size={16} /> Edit Rules
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fineRules.map((rule) => (
              <div key={rule.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">
                    {rule.amount.toLocaleString()} RWF
                  </span>
                  <span className="text-xs text-gray-500">
                    Grace: {rule.gracePeriod} days
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
            <h2 className="text-xl font-bold text-gray-800">
              Member Fines ({filteredFines.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

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
                  {fine.status === 'pending' && (
                    <button className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <CheckCircle size={16} /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Fine Modal */}
        {showApplyFine && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Apply Fine</h2>
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
      </div>
    </Layout>
  )
}

export default CashierFines
