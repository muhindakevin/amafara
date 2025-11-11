import { useState } from 'react'
import { FileText, Download, Search, Filter, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminTransactions() {
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')

  const transactions = [
    {
      id: 1,
      member: 'Kamikazi Marie',
      type: 'Contribution',
      amount: 5000,
      date: '2024-01-20',
      time: '10:30 AM',
      status: 'completed',
      method: 'MTN Mobile Money'
    },
    {
      id: 2,
      member: 'Mukamana Alice',
      type: 'Loan Payment',
      amount: 15000,
      date: '2024-01-19',
      time: '2:15 PM',
      status: 'completed',
      method: 'Bank Transfer'
    },
    {
      id: 3,
      member: 'Mutabazi Paul',
      type: 'Contribution',
      amount: 10000,
      date: '2024-01-18',
      time: '9:45 AM',
      status: 'completed',
      method: 'Cash'
    },
    {
      id: 4,
      member: 'Ikirezi Jane',
      type: 'Interest',
      amount: 750,
      date: '2024-01-17',
      time: '11:20 AM',
      status: 'completed',
      method: 'System'
    },
    {
      id: 5,
      member: 'Imanzi John',
      type: 'Loan Disbursement',
      amount: 50000,
      date: '2024-01-16',
      time: '3:00 PM',
      status: 'completed',
      method: 'Bank Transfer'
    }
  ]

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type.toLowerCase().includes(filterType.toLowerCase())
    const matchesSearch = transaction.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const completedTransactions = filteredTransactions.filter(t => t.status === 'completed').length

  const exportReport = () => {
    console.log('Exporting transaction report...')
    alert('Transaction report exported successfully!')
  }

  const printReport = () => {
    console.log('Printing transaction report...')
    window.print()
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transactions</h1>
            <p className="text-gray-600 mt-1">View and manage all group transactions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={printReport}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText size={18} /> Print Report
            </button>
            <button
              onClick={exportReport}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} /> Export Report
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
                  {filteredTransactions.length}
                </p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalAmount.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {completedTransactions}
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Members</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(filteredTransactions.map(t => t.member)).size}
                </p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Transactions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by member or transaction type..."
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
                <option value="all">All Types</option>
                <option value="contribution">Contributions</option>
                <option value="loan">Loan Payments</option>
                <option value="interest">Interest</option>
                <option value="disbursement">Loan Disbursements</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Transaction History ({filteredTransactions.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Member</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {transaction.member[0]}
                        </div>
                        <span className="font-semibold text-gray-800">{transaction.member}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'Contribution' ? 'bg-green-100 text-green-700' :
                        transaction.type === 'Loan Payment' ? 'bg-blue-100 text-blue-700' :
                        transaction.type === 'Interest' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-800">
                        {transaction.amount.toLocaleString()} RWF
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-gray-800">{transaction.date}</p>
                        <p className="text-xs text-gray-500">{transaction.time}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{transaction.method}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">By Type</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Contributions: {filteredTransactions.filter(t => t.type === 'Contribution').length}</li>
                <li>Loan Payments: {filteredTransactions.filter(t => t.type === 'Loan Payment').length}</li>
                <li>Interest: {filteredTransactions.filter(t => t.type === 'Interest').length}</li>
                <li>Disbursements: {filteredTransactions.filter(t => t.type === 'Loan Disbursement').length}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">By Payment Method</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>MTN Mobile Money: {filteredTransactions.filter(t => t.method === 'MTN Mobile Money').length}</li>
                <li>Bank Transfer: {filteredTransactions.filter(t => t.method === 'Bank Transfer').length}</li>
                <li>Cash: {filteredTransactions.filter(t => t.method === 'Cash').length}</li>
                <li>System: {filteredTransactions.filter(t => t.method === 'System').length}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Performance</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Success Rate: {Math.round((completedTransactions / filteredTransactions.length) * 100)}%</li>
                <li>Avg Transaction: {Math.round(totalAmount / filteredTransactions.length).toLocaleString()} RWF</li>
                <li>Peak Hours: 10:00 AM - 2:00 PM</li>
                <li>Most Active Day: Monday</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminTransactions

