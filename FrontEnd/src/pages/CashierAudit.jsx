import { useState } from 'react'
import { Shield, FileText, Clock, CheckCircle, XCircle, Search, Filter, Users, Calendar, Download, Eye, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'

function CashierAudit() {
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('today')
  const [searchTerm, setSearchTerm] = useState('')

  const auditLogs = [
    {
      id: 'A001',
      action: 'Contribution Approved',
      member: 'Kamikazi Marie',
      amount: 5000,
      timestamp: '2024-01-20 14:30:25',
      user: 'Cashier',
      details: 'MTN Mobile Money payment verified and approved',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'A002',
      action: 'Fine Applied',
      member: 'Mutabazi Paul',
      amount: 1000,
      timestamp: '2024-01-20 12:15:10',
      user: 'System',
      details: 'Late payment fine applied automatically',
      status: 'success',
      ipAddress: 'System'
    },
    {
      id: 'A003',
      action: 'Cash Payment Recorded',
      member: 'Ikirezi Jane',
      amount: 10000,
      timestamp: '2024-01-20 10:45:30',
      user: 'Cashier',
      details: 'Manual cash payment recorded with receipt #CASH001',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'A004',
      action: 'Loan Payment Marked',
      member: 'Mukamana Alice',
      amount: 15000,
      timestamp: '2024-01-20 09:20:15',
      user: 'Cashier',
      details: 'Loan payment marked as received',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'A005',
      action: 'Contribution Rejected',
      member: 'Uwimana Grace',
      amount: 5000,
      timestamp: '2024-01-19 16:30:45',
      user: 'Cashier',
      details: 'Bank transfer failed - insufficient funds',
      status: 'failed',
      ipAddress: '192.168.1.100'
    }
  ]

  const transactionRecords = [
    {
      id: 'T001',
      type: 'Contribution',
      member: 'Kamikazi Marie',
      amount: 5000,
      method: 'MTN Mobile Money',
      status: 'Completed',
      timestamp: '2024-01-20 14:30:25',
      reference: 'MTN123456789',
      verifiedBy: 'Cashier'
    },
    {
      id: 'T002',
      type: 'Loan Payment',
      member: 'Mukamana Alice',
      amount: 15000,
      method: 'Bank Transfer',
      status: 'Completed',
      timestamp: '2024-01-20 09:20:15',
      reference: 'BANK456789123',
      verifiedBy: 'Cashier'
    },
    {
      id: 'T003',
      type: 'Fine Payment',
      member: 'Mutabazi Paul',
      amount: 1000,
      method: 'Airtel Money',
      status: 'Completed',
      timestamp: '2024-01-20 12:15:10',
      reference: 'AIR987654321',
      verifiedBy: 'System'
    },
    {
      id: 'T004',
      type: 'Contribution',
      member: 'Ikirezi Jane',
      amount: 10000,
      method: 'Cash',
      status: 'Completed',
      timestamp: '2024-01-20 10:45:30',
      reference: 'CASH001',
      verifiedBy: 'Cashier'
    }
  ]

  const filteredLogs = auditLogs.filter(log => {
    const matchesType = filterType === 'all' || log.action.toLowerCase().includes(filterType.toLowerCase())
    const matchesSearch = 
      log.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getActionIcon = (action) => {
    if (action.includes('Approved') || action.includes('Completed')) return <CheckCircle className="text-green-600" size={20} />
    if (action.includes('Rejected') || action.includes('Failed')) return <XCircle className="text-red-600" size={20} />
    if (action.includes('Applied') || action.includes('Recorded')) return <FileText className="text-blue-600" size={20} />
    return <Clock className="text-gray-600" size={20} />
  }

  const handleExportAuditLog = () => {
    console.log('Exporting audit log')
    alert('Audit log exported successfully!')
  }

  const handleViewTransactionDetails = (transactionId) => {
    console.log('Viewing transaction details:', transactionId)
    alert('Transaction details would open here')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Record and Audit Management</h1>
            <p className="text-gray-600 mt-1">Track all financial transactions and system activities</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportAuditLog}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} /> Export Audit Log
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Shield size={18} /> Security Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {transactionRecords.length}
                </p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Audit Logs</p>
                <p className="text-2xl font-bold text-gray-800">
                  {auditLogs.length}
                </p>
              </div>
              <Shield className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Successful Actions</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditLogs.filter(l => l.status === 'success').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Failed Actions</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditLogs.filter(l => l.status === 'failed').length}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Records
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member, action, or user..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Actions</option>
                <option value="contribution">Contributions</option>
                <option value="loan">Loan Payments</option>
                <option value="fine">Fines</option>
                <option value="cash">Cash Payments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Audit Log ({filteredLogs.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    {getActionIcon(log.action)}
                    <div>
                      <h3 className="font-bold text-gray-800">{log.action}</h3>
                      <p className="text-sm text-gray-600">{log.member}</p>
                      <p className="text-sm text-gray-500">{log.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {log.amount.toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">User</p>
                    <p className="font-semibold">{log.user}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">IP Address</p>
                    <p className="font-semibold">{log.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Log ID</p>
                    <p className="font-semibold">{log.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-semibold">{log.amount.toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Details:</p>
                  <p className="text-sm text-gray-800 italic">"{log.details}"</p>
                </div>

                <div className="flex gap-2">
                  <button className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
                    <Eye size={14} /> View Details
                  </button>
                  <button className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Records */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Transaction Records</h2>
            <button className="btn-secondary text-sm">
              <Download size={16} /> Export Transactions
            </button>
          </div>

          <div className="space-y-3">
            {transactionRecords.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {transaction.member[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{transaction.member}</h3>
                    <p className="text-sm text-gray-600">{transaction.type} • {transaction.method}</p>
                    <p className="text-xs text-gray-500">{transaction.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {transaction.amount.toLocaleString()} RWF
                    </p>
                    <p className="text-sm text-gray-600">Ref: {transaction.reference}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status.toLowerCase())}`}>
                    {transaction.status}
                  </span>
                  <button
                    onClick={() => handleViewTransactionDetails(transaction.id)}
                    className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Security Alerts</h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Multiple Failed Login Attempts</p>
                  <p className="text-sm text-gray-600">Detected from IP: 192.168.1.105</p>
                </div>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                  High Risk
                </span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Unusual Transaction Pattern</p>
                  <p className="text-sm text-gray-600">Large cash payment detected</p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Medium Risk
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CashierAudit
