import { useEffect, useState } from 'react'
import { Download, Filter, Search, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, FileText, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import { getTranslation } from '../utils/translations'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../utils/api'

function MemberTransactions() {
  const { language } = useLanguage()
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const { data } = await api.get('/transactions')
        if (mounted && data?.success) {
          const mapped = (data.data || []).map(t => ({
            id: t.id,
            type: t.type,
            description: t.description || t.type,
            amount: Number(t.amount || 0) * (['loan_disbursement','expense'].includes(t.type) ? -1 : 1),
            date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
            time: t.transactionDate ? new Date(t.transactionDate).toLocaleTimeString() : '',
            status: t.status,
            method: t.method || 'System',
            reference: t.reference || `TXN-${t.id}`
          }))
          setTransactions(mapped)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'contribution': return <DollarSign className="text-green-600" size={20} />
      case 'loan_payment': return <CheckCircle className="text-blue-600" size={20} />
      case 'loan_disbursement': return <FileText className="text-purple-600" size={20} />
      case 'interest': return <TrendingUp className="text-yellow-600" size={20} />
      case 'fine': return <AlertCircle className="text-red-600" size={20} />
      default: return <Clock className="text-gray-600" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  const handleExport = () => {
    // In real app, this would generate and download a PDF/Excel file
    console.log('Exporting transactions...')
    alert('Transaction report exported successfully!')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transaction History</h1>
            <p className="text-gray-600 mt-1">View and manage all your transactions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export Report
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <FileText size={18} /> Print
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
                <p className="text-sm text-gray-600 mb-2">Net Amount</p>
                <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalAmount >= 0 ? '+' : ''}{totalAmount.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">This Month</p>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions.length}
                </p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Last Transaction</p>
                <p className="text-2xl font-bold text-gray-800">
                  {transactions[0]?.date || 'N/A'}
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
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
                  placeholder="Search by description or reference..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                <option value="contribution">Contributions</option>
                <option value="loan_payment">Loan Payments</option>
                <option value="loan_disbursement">Loan Disbursements</option>
                <option value="interest">Interest</option>
                <option value="fine">Fines</option>
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
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Transactions ({filteredTransactions.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.date} at {transaction.time} • {transaction.method}
                      </p>
                      <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} RWF
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto mb-4" size={48} />
                <p>No transactions found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="card bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Transaction Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Contributions</p>
              <p className="font-semibold text-green-600">
                +{transactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + Math.max(0,t.amount), 0).toLocaleString()} RWF
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Loan Payments</p>
              <p className="font-semibold text-blue-600">
                +{transactions.filter(t => t.type === 'loan_payment').reduce((sum, t) => sum + Math.max(0,t.amount), 0).toLocaleString()} RWF
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Interest Earned</p>
              <p className="font-semibold text-yellow-600">
                +{transactions.filter(t => t.type === 'interest').reduce((sum, t) => sum + Math.max(0,t.amount), 0).toLocaleString()} RWF
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MemberTransactions


