import { useEffect, useState } from 'react'
import { DollarSign, CheckCircle, Clock, XCircle, Eye, Filter, Search, User, TrendingUp, AlertCircle, Download, Calendar, AlertTriangle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function GroupAdminLoanRequests() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: summary, setData: setSummary, loading, wrap } = useApiState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  const [loanRequests, setLoanRequests] = useState([])

  useEffect(() => {
    wrap(async () => {
      const res = await api.get('/loans/requests')
      const items = (res.data?.data || []).map(r => ({
        id: r.id,
        memberId: r.memberId || r.userId,
        memberName: r.member?.name || r.user?.name || 'Member',
        phone: r.member?.phone || r.user?.phone || '',
        amount: Number(r.amount || 0),
        purpose: r.purpose || '',
        status: r.status || 'pending',
        requestDate: r.requestDate || r.createdAt || '',
        duration: r.duration ? `${r.duration} months` : '-',
        monthlyPayment: Number(r.monthlyPayment || 0),
        creditScore: r.creditScore || 0,
        hasActiveLoan: !!r.hasActiveLoan,
        totalSavings: Number(r.totalSavings || 0),
        contributionHistory: '',
        aiRecommendation: r.aiRecommendation || 'review'
      }))
      setLoanRequests(items)
      setSummary({
        total: items.length,
        pending: items.filter(x=>x.status==='pending').length,
        approved: items.filter(x=>x.status==='approved').length,
        rejected: items.filter(x=>x.status==='rejected').length
      })
    })
  }, [])

  
  const [unpaidLoans, setUnpaidLoans] = useState([])

  useEffect(() => {
    let mounted = true
    async function loadUnpaid() {
      try {
        const { data } = await api.get('/loans')
        if (!mounted) return
        const allLoans = data?.data || []
        // Filter active loans that are overdue
        const now = new Date()
        const overdue = allLoans
          .filter(l => l.status === 'approved' || l.status === 'disbursed' || l.status === 'active')
          .filter(l => {
            if (!l.nextPaymentDate) return false
            const dueDate = new Date(l.nextPaymentDate)
            return dueDate < now && l.remainingAmount > 0
          })
          .map(l => {
            const dueDate = new Date(l.nextPaymentDate)
            const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))
            return {
              id: l.id,
              memberName: l.member?.name || 'Member',
              phone: l.member?.phone || '',
              memberId: l.memberId,
              loanAmount: Number(l.amount || 0),
              remainingAmount: Number(l.remainingAmount || 0),
              monthlyPayment: Number(l.monthlyPayment || 0),
              dueDate: l.nextPaymentDate ? new Date(l.nextPaymentDate).toISOString().split('T')[0] : '',
              daysOverdue: daysDiff,
              lastPayment: l.lastPaymentDate ? new Date(l.lastPaymentDate).toISOString().split('T')[0] : 'N/A',
              totalPayments: 0, // Will calculate from transactions
              totalPaid: Number(l.amount || 0) - Number(l.remainingAmount || 0)
            }
          })
        setUnpaidLoans(overdue)
      } catch (e) {
        console.error('Failed to load unpaid loans:', e)
        if (mounted) setUnpaidLoans([])
      }
    }
    loadUnpaid()
    return () => { mounted = false }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="text-green-600" size={20} />
      case 'pending': return <Clock className="text-yellow-600" size={20} />
      case 'rejected': return <XCircle className="text-red-600" size={20} />
      default: return <Clock className="text-gray-600" size={20} />
    }
  }

  const getAIRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'approve': return 'bg-green-100 text-green-700'
      case 'reject': return 'bg-red-100 text-red-700'
      case 'review': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getOverdueColor = (daysOverdue) => {
    if (daysOverdue === 0) return 'bg-green-100 text-green-700'
    if (daysOverdue <= 7) return 'bg-yellow-100 text-yellow-700'
    if (daysOverdue <= 30) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  const getOverdueIcon = (daysOverdue) => {
    if (daysOverdue === 0) return <CheckCircle className="text-green-600" size={20} />
    if (daysOverdue <= 7) return <Clock className="text-yellow-600" size={20} />
    if (daysOverdue <= 30) return <AlertTriangle className="text-orange-600" size={20} />
    return <AlertCircle className="text-red-600" size={20} />
  }

  const filteredLoans = loanRequests.filter(loan => {
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus
    const matchesSearch = !searchTerm || loan.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || (loan.phone||'').includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const handleApproveLoan = async (loanId) => {
    try {
      const { data } = await api.put(`/loans/${loanId}/approve`)
      if (data?.success) {
        alert('Loan approved successfully! Member has been notified.')
        // Reload loan requests
        const res = await api.get('/loans/requests')
        const items = (res.data?.data || []).map(r => ({
          id: r.id,
          memberId: r.memberId || r.userId,
          memberName: r.member?.name || r.user?.name || 'Member',
          phone: r.member?.phone || r.user?.phone || '',
          amount: Number(r.amount || 0),
          purpose: r.purpose || '',
          status: r.status || 'pending',
          requestDate: r.requestDate || r.createdAt || '',
          duration: r.duration ? `${r.duration} months` : '-',
          monthlyPayment: Number(r.monthlyPayment || 0),
          creditScore: r.creditScore || 0,
          hasActiveLoan: !!r.hasActiveLoan,
          totalSavings: Number(r.totalSavings || 0),
          contributionHistory: '',
          aiRecommendation: r.aiRecommendation || 'review'
        }))
        setLoanRequests(items)
        setSummary({
          total: items.length,
          pending: items.filter(x=>x.status==='pending').length,
          approved: items.filter(x=>x.status==='approved').length,
          rejected: items.filter(x=>x.status==='rejected').length
        })
      }
    } catch (err) {
      console.error('Failed to approve loan:', err)
      alert(err.response?.data?.message || 'Failed to approve loan. Please try again.')
    }
  }

  const handleRejectLoan = async (loanId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason === null) return // User cancelled
    
    try {
      const { data } = await api.put(`/loans/${loanId}/reject`, { reason })
      if (data?.success) {
        alert('Loan rejected. Member has been notified.')
        // Reload loan requests
        const res = await api.get('/loans/requests')
        const items = (res.data?.data || []).map(r => ({
          id: r.id,
          memberId: r.memberId || r.userId,
          memberName: r.member?.name || r.user?.name || 'Member',
          phone: r.member?.phone || r.user?.phone || '',
          amount: Number(r.amount || 0),
          purpose: r.purpose || '',
          status: r.status || 'pending',
          requestDate: r.requestDate || r.createdAt || '',
          duration: r.duration ? `${r.duration} months` : '-',
          monthlyPayment: Number(r.monthlyPayment || 0),
          creditScore: r.creditScore || 0,
          hasActiveLoan: !!r.hasActiveLoan,
          totalSavings: Number(r.totalSavings || 0),
          contributionHistory: '',
          aiRecommendation: r.aiRecommendation || 'review'
        }))
        setLoanRequests(items)
        setSummary({
          total: items.length,
          pending: items.filter(x=>x.status==='pending').length,
          approved: items.filter(x=>x.status==='approved').length,
          rejected: items.filter(x=>x.status==='rejected').length
        })
      }
    } catch (err) {
      console.error('Failed to reject loan:', err)
      alert(err.response?.data?.message || 'Failed to reject loan. Please try again.')
    }
  }

  const handleViewMemberDetails = (loan) => {
    setSelectedLoan(loan)
    setShowMemberDetails(true)
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Loan Requests</h1>
            <p className="text-gray-600 mt-1">Review and manage member loan applications</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Requests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loanRequests.length}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loanRequests.filter(l => l.status === 'pending').length}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {loanRequests.filter(l => l.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {loanRequests.filter(l => l.status === 'rejected').length}
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
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loan Requests List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Loan Requests ({filteredLoans.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Fetching data…</div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No data available. Please add new records to get started.</div>
            ) : filteredLoans.map((loan) => (
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
                      <p className="text-sm text-gray-500">{loan.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAIRecommendationColor(loan.aiRecommendation)}`}>
                      AI: {loan.aiRecommendation}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-semibold">{loan.amount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{loan.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Payment</p>
                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Credit Score</p>
                    <p className="font-semibold">{loan.creditScore}/1000</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewMemberDetails(loan)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {loan.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveLoan(loan.id)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectLoan(loan.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Details Modal */}
        {showMemberDetails && selectedLoan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Member Details</h2>
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Member Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {selectedLoan.memberName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedLoan.memberName}</h3>
                    <p className="text-gray-600">{selectedLoan.phone}</p>
                    <p className="text-sm text-gray-500">Member ID: {selectedLoan.memberId}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-green-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Total Savings</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.totalSavings.toLocaleString()} RWF
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-blue-600" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Credit Score</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.creditScore}/1000
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <AlertCircle className={selectedLoan.hasActiveLoan ? "text-red-600" : "text-green-600"} size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Active Loans</p>
                        <p className="text-xl font-bold text-gray-800">
                          {selectedLoan.hasActiveLoan ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className={`card border-2 ${getAIRecommendationColor(selectedLoan.aiRecommendation)}`}>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    🤖 AI Recommendation
                  </h3>
                  <p className="text-sm mb-2">
                    Based on savings history, credit score, and contribution consistency:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAIRecommendationColor(selectedLoan.aiRecommendation)}`}>
                      {selectedLoan.aiRecommendation.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      Confidence: {selectedLoan.aiRecommendation === 'approve' ? 'High' : 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Contribution History */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">Contribution History</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consistency:</span>
                      <span className={`font-semibold ${
                        selectedLoan.contributionHistory === 'excellent' ? 'text-green-600' :
                        selectedLoan.contributionHistory === 'good' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {selectedLoan.contributionHistory}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">On-time payments:</span>
                      <span className="font-semibold text-green-600">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Late payments:</span>
                      <span className="font-semibold text-red-600">2</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMemberDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  {selectedLoan.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApproveLoan(selectedLoan.id)
                          setShowMemberDetails(false)
                        }}
                        className="btn-primary flex-1"
                      >
                        Approve Loan
                      </button>
                      <button
                        onClick={() => {
                          handleRejectLoan(selectedLoan.id)
                          setShowMemberDetails(false)
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 transition-colors"
                      >
                        Reject Loan
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid Loans Section */}
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={24} />
                Unpaid Loans & Overdue Payments
              </h2>
              <p className="text-gray-600 mt-1">Track active loans and payment deadlines</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm flex items-center gap-2">
                <Download size={16} /> Export Report
              </button>
              <button className="btn-primary text-sm flex items-center gap-2">
                <Calendar size={16} /> Send Reminders
              </button>
            </div>
          </div>

          {/* Unpaid Loans Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Active Loans</p>
                  <p className="text-xl font-bold text-gray-800">{unpaidLoans.length}</p>
                </div>
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Loans</p>
                  <p className="text-xl font-bold text-red-600">
                    {unpaidLoans.filter(l => l.daysOverdue > 0).length}
                  </p>
                </div>
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Outstanding</p>
                  <p className="text-xl font-bold text-orange-600">
                    {unpaidLoans.reduce((sum, l) => sum + l.remainingAmount, 0).toLocaleString()} RWF
                  </p>
                </div>
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Days Overdue</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.round(unpaidLoans.reduce((sum, l) => sum + l.daysOverdue, 0) / unpaidLoans.length)}
                  </p>
                </div>
                <Clock className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Unpaid Loans List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Active Loan Details</h3>
            {unpaidLoans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No data available. Please add new records to get started.</div>
            ) : unpaidLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {loan.memberName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{loan.memberName}</h4>
                      <p className="text-sm text-gray-600">{loan.phone} • {loan.memberId}</p>
                      <p className="text-xs text-gray-500">Last Payment: {loan.lastPayment}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getOverdueColor(loan.daysOverdue)}`}>
                      {loan.daysOverdue === 0 ? 'Current' : `${loan.daysOverdue} days overdue`}
                    </span>
                    {getOverdueIcon(loan.daysOverdue)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Loan Amount</p>
                    <p className="font-semibold">{loan.loanAmount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-semibold text-red-600">{loan.remainingAmount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Payment</p>
                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{loan.dueDate}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payments Made: </span>
                      <span className="font-semibold">{loan.totalPayments}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Paid: </span>
                      <span className="font-semibold text-green-600">{loan.totalPaid.toLocaleString()} RWF</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Progress: </span>
                      <span className="font-semibold">
                        {Math.round((loan.totalPaid / loan.loanAmount) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary text-xs px-3 py-1 flex items-center gap-1">
                      <Eye size={14} /> View Details
                    </button>
                    {loan.daysOverdue > 0 && (
                      <button className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg flex items-center gap-1 transition-colors">
                        <AlertTriangle size={14} /> Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button 
              onClick={async () => {
                try {
                  const overdue = unpaidLoans.filter(l => l.daysOverdue > 0)
                  for (const loan of overdue) {
                    try {
                      await api.post('/notifications', {
                        userId: loan.memberId,
                        type: 'loan_reminder',
                        title: 'Loan Payment Reminder',
                        message: `Dear member, your loan payment of ${loan.monthlyPayment.toLocaleString()} RWF is overdue by ${loan.daysOverdue} days. Please make your payment as soon as possible.`
                      })
                    } catch (err) {
                      console.error(`Failed to send reminder to ${loan.memberId}:`, err)
                    }
                  }
                  alert(`Payment reminders sent to ${overdue.length} members!`)
                } catch (err) {
                  console.error('Failed to send reminders:', err)
                  alert('Failed to send reminders. Please try again.')
                }
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Calendar size={18} /> Send Payment Reminders
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export Overdue Report
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors">
              <AlertTriangle size={18} /> Generate Collection Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminLoanRequests

