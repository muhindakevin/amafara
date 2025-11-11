import { useState } from 'react'
import { AlertCircle, DollarSign, Search, Filter, Users, TrendingUp, Download, CheckCircle, XCircle, Edit, Settings, Calendar } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminFines() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFineRules, setShowFineRules] = useState(false)
  const [showWaiveModal, setShowWaiveModal] = useState(null)

  const fines = [
    {
      id: 1,
      memberId: 'M001',
      memberName: 'Kamikazi Marie',
      phone: '+250788123456',
      reason: 'Late contribution payment',
      amount: 500,
      dueDate: '2024-01-25',
      status: 'pending',
      imposedBy: 'Cashier',
      imposedDate: '2024-01-20',
      paidDate: null,
      paymentMethod: null
    },
    {
      id: 2,
      memberId: 'M003',
      memberName: 'Ikirezi Jane',
      phone: '+250788345678',
      reason: 'Missed group meeting',
      amount: 1000,
      dueDate: '2024-01-22',
      status: 'paid',
      imposedBy: 'Secretary',
      imposedDate: '2024-01-18',
      paidDate: '2024-01-19',
      paymentMethod: 'MTN Mobile Money'
    },
    {
      id: 3,
      memberId: 'M005',
      memberName: 'Uwimana Grace',
      phone: '+250788567890',
      reason: 'Late loan payment',
      amount: 750,
      dueDate: '2024-01-28',
      status: 'waived',
      imposedBy: 'Cashier',
      imposedDate: '2024-01-17',
      paidDate: null,
      paymentMethod: null,
      waivedBy: 'Group Admin',
      waivedDate: '2024-01-20',
      waivedReason: 'Medical emergency'
    },
    {
      id: 4,
      memberId: 'M002',
      memberName: 'Mukamana Alice',
      phone: '+250788234567',
      reason: 'Incomplete contribution',
      amount: 300,
      dueDate: '2024-01-30',
      status: 'pending',
      imposedBy: 'Cashier',
      imposedDate: '2024-01-19',
      paidDate: null,
      paymentMethod: null
    }
  ]

  const fineRules = [
    {
      id: 1,
      type: 'Late Contribution Payment',
      amount: 500,
      description: 'Applied when a member pays their contribution after the due date',
      conditions: 'Must be paid within 5 days of due date',
      maxLimit: 5000,
      enabled: true
    },
    {
      id: 2,
      type: 'Missed Group Meeting',
      amount: 1000,
      description: 'Applied when a member misses a scheduled group meeting',
      conditions: 'No valid excuse provided',
      maxLimit: 5000,
      enabled: true
    },
    {
      id: 3,
      type: 'Late Loan Payment',
      amount: 750,
      description: 'Applied when a member delays loan repayment',
      conditions: 'Per week of delay',
      maxLimit: 10000,
      enabled: true
    },
    {
      id: 4,
      type: 'Incomplete Contribution',
      amount: 300,
      description: 'Applied when a member pays less than the minimum required amount',
      conditions: 'Difference between required and paid amount',
      maxLimit: 3000,
      enabled: true
    },
    {
      id: 5,
      type: 'Rule Violation',
      amount: 2000,
      description: 'Applied for violations of group rules and regulations',
      conditions: 'As per group constitution',
      maxLimit: 10000,
      enabled: true
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'waived': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredFines = fines.filter(fine =>
    (filterStatus === 'all' || fine.status === filterStatus) &&
    (fine.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     fine.phone.includes(searchTerm) ||
     fine.memberId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const summaryStats = {
    totalFines: fines.length,
    pendingFines: fines.filter(f => f.status === 'pending').length,
    paidFines: fines.filter(f => f.status === 'paid').length,
    totalCollected: fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
    totalPending: fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0)
  }

  const handleWaiveFine = (fineId, reason) => {
    alert(`Fine ${fineId} waived. Reason: ${reason}`)
    setShowWaiveModal(null)
  }

  const handleApproveFine = (fineId) => {
    alert(`Fine ${fineId} approved!`)
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Fines & Penalties</h1>
            <p className="text-gray-600 mt-1">Manage and approve fines imposed on members</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFineRules(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings size={18} /> Fine Rules
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Fines</p>
                <p className="text-2xl font-bold text-gray-800">
                  {summaryStats.totalFines}
                </p>
              </div>
              <AlertCircle className="text-gray-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summaryStats.pendingFines}
                </p>
              </div>
              <Calendar className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.paidFines}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.totalCollected.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summaryStats.totalPending.toLocaleString()} RWF
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
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
                <option value="all">All Fines</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
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

        {/* Fines List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Fine Records ({filteredFines.length})
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
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {fine.memberName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{fine.memberName}</h3>
                      <p className="text-sm text-gray-600">{fine.phone} • {fine.memberId}</p>
                      <p className="text-sm text-gray-500">Reason: {fine.reason}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fine.status)}`}>
                    {fine.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-semibold">{fine.amount.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{fine.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Imposed By</p>
                    <p className="font-semibold">{fine.imposedBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Imposed Date</p>
                    <p className="font-semibold">{fine.imposedDate}</p>
                  </div>
                </div>

                {fine.status === 'waived' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">
                      <strong>Waived by:</strong> {fine.waivedBy} on {fine.waivedDate}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>Reason:</strong> {fine.waivedReason}
                    </p>
                  </div>
                )}

                {fine.status === 'paid' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800">
                      <strong>Paid on:</strong> {fine.paidDate} via {fine.paymentMethod}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {fine.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveFine(fine.id)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => setShowWaiveModal(fine.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Waive Fine
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fine Trends Chart */}
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={24} />
            Fine Trends & Recovery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Monthly Collection</p>
              <p className="text-2xl font-bold text-gray-800">3,550 RWF</p>
              <p className="text-xs text-green-600 mt-1">↑ 15% from last month</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Recovery Rate</p>
              <p className="text-2xl font-bold text-gray-800">75%</p>
              <p className="text-xs text-blue-600 mt-1">3 out of 4 fines paid</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Most Common Fine</p>
              <p className="text-2xl font-bold text-gray-800">Late Payment</p>
              <p className="text-xs text-orange-600 mt-1">60% of all fines</p>
            </div>
          </div>
        </div>

        {/* Fine Rules Modal */}
        {showFineRules && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Fine Rules Configuration</h2>
                <button
                  onClick={() => setShowFineRules(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600 mb-4">
                  Manage fine types, amounts, and conditions. These rules are used when Cashier or Secretary imposes fines.
                </p>

                <div className="space-y-3">
                  {fineRules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{rule.type}</h3>
                          <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Amount: </span>
                              <span className="font-semibold">{rule.amount.toLocaleString()} RWF</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Max Limit: </span>
                              <span className="font-semibold">{rule.maxLimit.toLocaleString()} RWF</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Conditions: {rule.conditions}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                            <Edit size={18} className="text-blue-600" />
                          </button>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowFineRules(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => alert('Fine rules updated!')}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waive Fine Modal */}
        {showWaiveModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Waive Fine</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Waiving
                  </label>
                  <textarea
                    placeholder="Enter reason (e.g., illness, emergency, group decision)..."
                    className="input-field"
                    rows="4"
                    id="waiveReason"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowWaiveModal(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const reason = document.getElementById('waiveReason').value
                      if (reason.trim()) {
                        handleWaiveFine(showWaiveModal, reason)
                      } else {
                        alert('Please provide a reason for waiving the fine')
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    Waive Fine
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

export default GroupAdminFines

