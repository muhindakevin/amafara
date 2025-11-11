import { useState } from 'react'
import { DollarSign, AlertTriangle, Clock, CheckCircle, XCircle, Search, Filter, Users, Calendar, Bell, FileText } from 'lucide-react'
import Layout from '../components/Layout'

function CashierLoans() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loanPayments = [
    {
      id: 'LP001',
      memberId: 'M001',
      memberName: 'Kamikazi Marie',
      phone: '+250788123456',
      loanAmount: 120000,
      remainingAmount: 90000,
      monthlyPayment: 20000,
      dueDate: '2024-01-25',
      status: 'current',
      daysOverdue: 0,
      lastPayment: '2024-01-15',
      totalPayments: 3,
      paymentMethod: 'MTN Mobile Money'
    },
    {
      id: 'LP002',
      memberId: 'M004',
      memberName: 'Mutabazi Paul',
      phone: '+250788456789',
      loanAmount: 80000,
      remainingAmount: 60000,
      monthlyPayment: 15000,
      dueDate: '2024-01-20',
      status: 'overdue',
      daysOverdue: 5,
      lastPayment: '2023-12-20',
      totalPayments: 1,
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'LP003',
      memberId: 'M005',
      memberName: 'Uwimana Grace',
      phone: '+250788567890',
      loanAmount: 150000,
      remainingAmount: 120000,
      monthlyPayment: 25000,
      dueDate: '2024-01-18',
      status: 'overdue',
      daysOverdue: 7,
      lastPayment: '2023-12-18',
      totalPayments: 1,
      paymentMethod: 'Cash'
    }
  ]

  const filteredLoans = loanPayments.filter(loan => {
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus
    const matchesSearch = 
      loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.phone.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      case 'paid': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleMarkPaymentReceived = (loanId) => {
    console.log('Marking payment as received:', loanId)
    alert('Payment marked as received successfully!')
  }

  const handleSendReminder = (loanId) => {
    console.log('Sending reminder for loan:', loanId)
    alert('Reminder sent successfully!')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Loan Repayment Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor loan repayments and overdue payments</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2">
              <Bell size={18} /> Send Bulk Reminders
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <FileText size={18} /> Generate Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Loans</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loanPayments.length}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Overdue Loans</p>
                <p className="text-2xl font-bold text-red-600">
                  {loanPayments.filter(l => l.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">
                  {loanPayments.reduce((sum, l) => sum + l.remainingAmount, 0).toLocaleString()} RWF
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Avg Days Overdue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(loanPayments.reduce((sum, l) => sum + l.daysOverdue, 0) / loanPayments.length)}
                </p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Loans
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
                <option value="all">All Loans</option>
                <option value="current">Current</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan Payments List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Loan Repayment Status ({filteredLoans.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredLoans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {loan.memberName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{loan.memberName}</h3>
                      <p className="text-sm text-gray-600">{loan.phone} • {loan.memberId}</p>
                      <p className="text-sm text-gray-500">Last Payment: {loan.lastPayment}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                      {loan.status === 'current' ? 'Current' : `${loan.daysOverdue} days overdue`}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {loan.remainingAmount.toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Loan Amount</p>
                    <p className="font-semibold">{loan.loanAmount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Payment</p>
                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{loan.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payments Made</p>
                    <p className="font-semibold">{loan.totalPayments}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Progress: </span>
                      <span className="font-semibold">
                        {Math.round(((loan.loanAmount - loan.remainingAmount) / loan.loanAmount) * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment Method: </span>
                      <span className="font-semibold">{loan.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkPaymentReceived(loan.id)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Mark Received
                    </button>
                    {loan.status === 'overdue' && (
                      <button
                        onClick={() => handleSendReminder(loan.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Bell size={16} /> Send Reminder
                      </button>
                    )}
                    <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                      <FileText size={16} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Defaulters Alert */}
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Defaulters Alert</h2>
          </div>
          <div className="space-y-3">
            {loanPayments.filter(l => l.status === 'overdue').map((defaulter, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {defaulter.memberName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{defaulter.memberName}</p>
                    <p className="text-sm text-gray-600">{defaulter.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-red-600">
                    {defaulter.remainingAmount.toLocaleString()} RWF
                  </span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {defaulter.daysOverdue} days overdue
                  </span>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors">
                    Notify Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CashierLoans
