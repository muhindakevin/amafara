import { useState, useEffect } from 'react'
import { CreditCard, Eye, Search, XCircle, AlertCircle, Shield, Clock, Download, ArrowUpDown } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminTransactions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try { setLoading(true); const { data } = await api.get('/transactions'); if (mounted) setTransactions(data?.data || []) }
      finally { if (mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  }, [])

  const filteredTransactions = (transactions||[]).filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'flagged' && transaction.flagged) ||
      (activeTab === 'pending' && transaction.status === 'Pending')
    const matchesSearch = [transaction.clientName, transaction.id, transaction.reference, transaction.agentName]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesType && matchesStatus && matchesTab && matchesSearch
  })

  const handleViewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionDetails(true)
  }

  const handleExportTransactions = () => {
    const rows = [['id','type','amount','status','reference','createdAt']]
    ;(filteredTransactions || []).forEach(t=>{
      rows.push([t.id, t.type||'', t.amount||0, t.status||'', t.reference||'', t.createdAt||''])
    })
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'"')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Pending Approval': return 'bg-orange-100 text-orange-700'
      case 'Flagged': return 'bg-red-100 text-red-700'
      case 'Rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Deposit': return <ArrowUpDown className="text-green-600" size={20} />
      case 'Withdrawal': return <ArrowUpDown className="text-red-600" size={20} />
      case 'Loan Payment': return <CreditCard className="text-blue-600" size={20} />
      case 'Transfer': return <ArrowUpDown className="text-purple-600" size={20} />
      default: return <CreditCard className="text-gray-600" size={20} />
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        <p className="text-gray-600">View, approve, and manage all transactions across the system</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (transactions?.length || 0)}</p>
              </div>
              <CreditCard className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (transactions||[]).filter(t => t.status === 'Pending Approval').length}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Flagged</p>
                <p className="text-2xl font-bold text-gray-800">{loading ? '0' : (transactions||[]).filter(t => t.flagged).length}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Disputes</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <Shield className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search transactions..." className="input-field pl-10" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterType} onChange={(e)=>setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option>Deposit</option>
              <option>Withdrawal</option>
              <option>Loan Payment</option>
              <option>Transfer</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Pending Approval</option>
              <option>Flagged</option>
              <option>Rejected</option>
            </select>
          </div>
          <button onClick={handleExportTransactions} className="btn-secondary flex items-center gap-2 w-full md:w-auto">
            <Download size={20} /> Export CSV
          </button>
        </div>

        {/* List */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading…</td></tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">{getTypeIcon(t.type)} <span>{t.type}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.amount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(t.status)}`}>{t.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.reference || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={()=>handleViewTransactionDetails(t)} className="text-primary-600 hover:text-primary-900" title="View Details"><Eye size={20} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details */}
        {showTransactionDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Transaction {selectedTransaction.id}</h2>
                <button onClick={()=>setShowTransactionDetails(false)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold">Type:</span> {selectedTransaction.type}</p>
                <p><span className="font-semibold">Amount:</span> {selectedTransaction.amount || 0}</p>
                <p><span className="font-semibold">Status:</span> {selectedTransaction.status}</p>
                <p><span className="font-semibold">Reference:</span> {selectedTransaction.reference || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminTransactions
