import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Receipt, Calendar, CheckCircle, XCircle, Search, Filter, DollarSign, Clock, AlertCircle, Phone, Mail } from 'lucide-react'
import Layout from '../components/Layout'

function CashierContributions() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRecordCash, setShowRecordCash] = useState(false)

  const contributions = [
    {
      id: 'C001',
      memberId: 'M001',
      memberName: 'Kamikazi Marie',
      phone: '+250788123456',
      amount: 5000,
      method: 'MTN Mobile Money',
      status: 'completed',
      submittedDate: '2024-01-20',
      approvedDate: '2024-01-20',
      transactionId: 'MTN123456789',
      verifiedBy: 'Cashier',
      notes: 'Payment verified successfully'
    },
    {
      id: 'C002',
      memberId: 'M002',
      memberName: 'Mukamana Alice',
      phone: '+250788234567',
      amount: 7500,
      method: 'Airtel Money',
      status: 'pending',
      submittedDate: '2024-01-20',
      approvedDate: null,
      transactionId: 'AIR987654321',
      verifiedBy: null,
      notes: 'Awaiting verification'
    },
    {
      id: 'C003',
      memberId: 'M003',
      memberName: 'Mutabazi Paul',
      phone: '+250788345678',
      amount: 10000,
      method: 'Cash',
      status: 'completed',
      submittedDate: '2024-01-19',
      approvedDate: '2024-01-19',
      transactionId: 'CASH001',
      verifiedBy: 'Cashier',
      notes: 'Cash payment received'
    },
    {
      id: 'C004',
      memberId: 'M004',
      memberName: 'Ikirezi Jane',
      phone: '+250788456789',
      amount: 5000,
      method: 'Bank Transfer',
      status: 'rejected',
      submittedDate: '2024-01-18',
      approvedDate: null,
      transactionId: 'BANK456789123',
      verifiedBy: 'Cashier',
      notes: 'Insufficient funds'
    }
  ]

  const scheduledContributions = [
    {
      memberId: 'M001',
      memberName: 'Kamikazi Marie',
      phone: '+250788123456',
      expectedAmount: 5000,
      dueDate: '2024-01-25',
      status: 'upcoming',
      lastPayment: '2024-01-20'
    },
    {
      memberId: 'M002',
      memberName: 'Mukamana Alice',
      phone: '+250788234567',
      expectedAmount: 7500,
      dueDate: '2024-01-25',
      status: 'upcoming',
      lastPayment: '2024-01-15'
    },
    {
      memberId: 'M005',
      memberName: 'Uwimana Grace',
      phone: '+250788567890',
      expectedAmount: 6000,
      dueDate: '2024-01-22',
      status: 'overdue',
      lastPayment: '2023-12-22'
    }
  ]

  const [cashPayment, setCashPayment] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    receiptNumber: '',
    notes: ''
  })

  const filteredContributions = contributions.filter(contribution => {
    const matchesStatus = filterStatus === 'all' || contribution.status === filterStatus
    const matchesSearch = 
      contribution.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.phone.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'upcoming': return 'bg-blue-100 text-blue-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleApproveContribution = (contributionId) => {
    console.log('Approving contribution:', contributionId)
    alert('Contribution approved successfully!')
  }

  const handleRejectContribution = (contributionId) => {
    console.log('Rejecting contribution:', contributionId)
    alert('Contribution rejected!')
  }

  const handleRecordCashPayment = () => {
    console.log('Recording cash payment:', cashPayment)
    alert('Cash payment recorded successfully!')
    setShowRecordCash(false)
    setCashPayment({
      memberId: '',
      memberName: '',
      amount: '',
      receiptNumber: '',
      notes: ''
    })
  }

  const handleVerifyMobileMoney = (contributionId) => {
    console.log('Verifying mobile money payment:', contributionId)
    alert('Mobile money payment verified!')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Member Contributions</h1>
            <p className="text-gray-600 mt-1">Manage and verify member contribution payments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRecordCash(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Receipt size={18} /> Record Cash Payment
            </button>
            <button 
              onClick={() => navigate('/cashier/schedule')}
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar size={18} /> View Schedule
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {contributions.length}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {contributions.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {contributions.filter(c => c.status === 'completed').length}
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
                  {contributions.reduce((sum, c) => sum + c.amount, 0).toLocaleString()} RWF
                </p>
              </div>
              <CreditCard className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Contributions
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
                <option value="all">All Contributions</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contributions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Contribution Payments ({filteredContributions.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredContributions.map((contribution) => (
              <div
                key={contribution.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {contribution.memberName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{contribution.memberName}</h3>
                      <p className="text-sm text-gray-600">{contribution.phone} • {contribution.memberId}</p>
                      <p className="text-sm text-gray-500">Submitted: {contribution.submittedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contribution.status)}`}>
                      {contribution.status}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {contribution.amount.toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-semibold">{contribution.method}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transaction ID</p>
                    <p className="font-semibold">{contribution.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Verified By</p>
                    <p className="font-semibold">{contribution.verifiedBy || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Approved Date</p>
                    <p className="font-semibold">{contribution.approvedDate || 'Pending'}</p>
                  </div>
                </div>

                {contribution.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Notes:</p>
                    <p className="text-sm text-gray-800 italic">"{contribution.notes}"</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {contribution.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveContribution(contribution.id)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectContribution(contribution.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      {contribution.method.includes('Mobile Money') && (
                        <button
                          onClick={() => handleVerifyMobileMoney(contribution.id)}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <CreditCard size={16} /> Verify Payment
                        </button>
                      )}
                    </>
                  )}
                  {contribution.status === 'completed' && (
                    <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                      <Receipt size={16} /> View Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Contributions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Scheduled Contributions</h2>
            <button className="btn-secondary text-sm">
              <Calendar size={16} /> Manage Schedule
            </button>
          </div>

          <div className="space-y-3">
            {scheduledContributions.map((scheduled, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {scheduled.memberName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{scheduled.memberName}</h3>
                    <p className="text-sm text-gray-600">{scheduled.phone}</p>
                    <p className="text-xs text-gray-500">Last Payment: {scheduled.lastPayment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {scheduled.expectedAmount.toLocaleString()} RWF
                    </p>
                    <p className="text-sm text-gray-600">Due: {scheduled.dueDate}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(scheduled.status)}`}>
                    {scheduled.status}
                  </span>
                  <button className="btn-secondary text-sm px-3 py-1">
                    Send Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Record Cash Payment Modal */}
        {showRecordCash && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Record Cash Payment</h2>
                <button
                  onClick={() => setShowRecordCash(false)}
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
                      value={cashPayment.memberId}
                      onChange={(e) => setCashPayment({ ...cashPayment, memberId: e.target.value })}
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
                      value={cashPayment.memberName}
                      onChange={(e) => setCashPayment({ ...cashPayment, memberName: e.target.value })}
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
                      value={cashPayment.amount}
                      onChange={(e) => setCashPayment({ ...cashPayment, amount: e.target.value })}
                      className="input-field"
                      placeholder="Enter amount..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Receipt Number
                    </label>
                    <input
                      type="text"
                      value={cashPayment.receiptNumber}
                      onChange={(e) => setCashPayment({ ...cashPayment, receiptNumber: e.target.value })}
                      className="input-field"
                      placeholder="Enter receipt number..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={cashPayment.notes}
                    onChange={(e) => setCashPayment({ ...cashPayment, notes: e.target.value })}
                    className="input-field h-24 resize-none"
                    placeholder="Enter any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRecordCash(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordCashPayment}
                    className="btn-primary flex-1"
                  >
                    Record Payment
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

export default CashierContributions
