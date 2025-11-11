import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, CheckCircle, Clock, AlertCircle, Search, Filter, Users, TrendingUp, Download, Calendar, Eye, Edit, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function GroupAdminContributions() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContribution, setSelectedContribution] = useState(null)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)

  const [contributions, setContributions] = useState([])
  const { data: summary, setData: setSummary, loading, wrap } = useApiState({
    totalContributions: 0,
    pendingContributions: 0,
    lateContributions: 0,
    adjustmentRequests: 0
  })

  useEffect(() => {
    wrap(async () => {
      const me = await api.get('/auth/me')
      const groupId = me.data?.data?.groupId
      if (!groupId) return
      const list = await api.get('/contributions', { params: { } })
      const items = (list.data?.data || []).map(c => ({
        id: c.id,
        memberId: c.userId,
        memberName: c.user?.name || 'Member',
        phone: c.user?.phone || '',
        amount: Number(c.amount || 0),
        date: c.contributionDate ? new Date(c.contributionDate).toISOString().split('T')[0] : '',
        status: c.status,
        method: c.method || null,
        receipt: c.receipt || null,
        contributionHistory: '',
        totalContributions: Number(c.totalForUser || 0),
        lastContribution: null
      }))
      setContributions(items)
      setSummary({
        totalContributions: items.filter(i=>i.status==='completed').reduce((s,i)=>s+i.amount,0),
        pendingContributions: items.filter(i=>i.status==='pending').length,
        lateContributions: items.filter(i=>i.status==='late').length,
        adjustmentRequests: 0
      })
    })
  }, [])

  const [pendingAdjustments, setPendingAdjustments] = useState([])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'pending-approval': return 'bg-blue-100 text-blue-700'
      case 'late': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredContributions = contributions.filter(contribution =>
    (filterStatus === 'all' || contribution.status === filterStatus) &&
    (contribution.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     contribution.phone.includes(searchTerm) ||
     contribution.memberId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const summaryStats = summary

  const handleApproveAdjustment = (adjustmentId) => {
    alert(`Adjustment ${adjustmentId} approved successfully!`)
  }

  const handleRejectAdjustment = (adjustmentId) => {
    alert(`Adjustment ${adjustmentId} rejected!`)
  }

  const handleSendReminder = (memberId) => {
    alert('Reminder sent to member!')
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contribution Oversight</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all group contributions</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export Report
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Calendar size={18} /> Send Reminders
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
                  {summaryStats.totalContributions.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summaryStats.pendingContributions}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Late Payments</p>
                <p className="text-2xl font-bold text-red-600">
                  {summaryStats.lateContributions}
                </p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Adjustment Requests</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summaryStats.adjustmentRequests}
                </p>
              </div>
              <Edit className="text-blue-600" size={32} />
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
                <option value="all">All Contributions</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="pending-approval">Pending Approval</option>
                <option value="late">Late</option>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, or ID..."
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Adjustments - Removed default data, will be fetched from DB when available */}
        {pendingAdjustments.length > 0 && (
          <div className="card bg-blue-50 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit className="text-blue-600" size={24} />
              Pending Contribution Adjustments
            </h2>
            <div className="space-y-3">
              {pendingAdjustments.map((adjustment) => (
                <div key={adjustment.id} className="bg-white rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{adjustment.memberName}</h3>
                      <p className="text-sm text-gray-600">Requested by: {adjustment.requestedBy}</p>
                      <p className="text-sm text-gray-500">Date: {adjustment.date}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      {adjustment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Original Amount</p>
                      <p className="font-semibold">{adjustment.originalAmount.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Adjusted Amount</p>
                      <p className="font-semibold text-blue-600">{adjustment.adjustedAmount.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reason</p>
                      <p className="font-semibold">{adjustment.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveAdjustment(adjustment.id)}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve Adjustment
                    </button>
                    <button
                      onClick={() => handleRejectAdjustment(adjustment.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Contribution Records ({loading ? 0 : filteredContributions.length})
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
            ) : filteredContributions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No records found</div>
            ) : filteredContributions.map((contribution) => (
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
                      <p className="text-sm text-gray-500">Date: {contribution.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contribution.status)}`}>
                    {contribution.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-semibold">{contribution.amount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-semibold">{contribution.method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Receipt</p>
                    <p className="font-semibold">{contribution.receipt || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Contributions</p>
                    <p className="font-semibold">{contribution.totalContributions.toLocaleString()} RWF</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedContribution(contribution)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {contribution.status === 'pending' && (
                    <button
                      onClick={() => handleSendReminder(contribution.memberId)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle size={16} /> Send Reminder
                    </button>
                  )}
                  {contribution.status === 'pending-approval' && (
                    <button
                      onClick={() => alert('Contribution approved!')}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Approve Entry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contribution Summary Report */}
        {contributions.length > 0 && (
          <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary-600" size={24} />
              Contribution Summary Report
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {contributions.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0).toLocaleString()} RWF
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {contributions.filter(c => c.status === 'completed').length} completed contributions
                </p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Average per Contribution</p>
                <p className="text-2xl font-bold text-gray-800">
                  {contributions.filter(c => c.status === 'completed').length > 0 
                    ? Math.round(contributions.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0) / contributions.filter(c => c.status === 'completed').length).toLocaleString()
                    : 0} RWF
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Set(contributions.filter(c => c.status === 'completed').map(c => c.memberId)).size} active contributors
                </p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Pending Contributions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {contributions.filter(c => c.status === 'pending').length}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const report = contributions
                      .filter(c => c.status === 'completed')
                      .map(c => `${c.date}\t${c.memberName}\t${c.amount.toLocaleString()} RWF\t${c.status}`)
                      .join('\n')
                    const blob = new Blob([`Contribution Report\nGenerated: ${new Date().toLocaleString()}\n\nDate\tMember\tAmount\tStatus\n${report}`], { type: 'text/plain' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `contributions-report-${new Date().toISOString().split('T')[0]}.txt`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } catch (err) {
                    alert('Failed to export report. Please try again.')
                  }
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Download size={18} /> Download Full Report
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminContributions

