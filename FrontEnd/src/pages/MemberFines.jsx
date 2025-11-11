import { useEffect, useState } from 'react'
import { AlertCircle, DollarSign, Clock, CheckCircle, XCircle, Plus, Eye, Download, Calendar, TrendingUp, Search, Filter } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function MemberFines() {
  const [showPayFineModal, setShowPayFineModal] = useState(false)
  const [selectedFine, setSelectedFine] = useState(null)

  const [fineStats, setFineStats] = useState({ totalFines: 0, pending: 0, paid: 0, totalAmount: 0, pendingAmount: 0 })

  const [fines, setFines] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data } = await api.get('/fines/member')
      if (!mounted || !data?.success) return
      const list = data.data || []
      const mapped = list.map(f => ({
        id: f.id,
        reason: f.reason || f.type || 'Fine',
        amount: Number(f.amount || 0),
        appliedDate: f.appliedDate ? new Date(f.appliedDate).toISOString().split('T')[0] : '',
        dueDate: f.dueDate ? new Date(f.dueDate).toISOString().split('T')[0] : '',
        status: f.status,
        daysLate: f.daysLate || 0,
        paymentMethod: f.paymentMethod || null,
        paidDate: f.paidDate ? new Date(f.paidDate).toISOString().split('T')[0] : null,
        description: f.description || ''
      }))
      setFines(mapped)
      const total = mapped.reduce((s, f) => s + f.amount, 0)
      const pending = mapped.filter(f => f.status === 'pending')
      const paid = mapped.filter(f => f.status === 'paid')
      setFineStats({
        totalFines: mapped.length,
        pending: pending.length,
        paid: paid.length,
        totalAmount: total,
        pendingAmount: pending.reduce((s, f) => s + f.amount, 0)
      })
    }
    load()
    return () => { mounted = false }
  }, [])

  const performanceTrend = [
    { month: 'Sep 2023', fines: 2, amount: 1000 },
    { month: 'Oct 2023', fines: 1, amount: 500 },
    { month: 'Nov 2023', fines: 1, amount: 500 },
    { month: 'Dec 2023', fines: 2, amount: 1000 },
    { month: 'Jan 2024', fines: 2, amount: 1000 }
  ]

  const handlePayFine = (fine) => {
    setSelectedFine(fine)
    setShowPayFineModal(true)
  }

  const handleProcessPayment = async (paymentMethod) => {
    try {
      await api.put(`/fines/${selectedFine.id}/pay`, { method: paymentMethod })
      setShowPayFineModal(false)
      setSelectedFine(null)
      const { data } = await api.get('/fines/member')
      if (data?.success) {
        const list = data.data || []
        setFines(list)
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Payment failed')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityColor = (daysLate) => {
    if (daysLate <= 3) return 'text-yellow-600'
    if (daysLate <= 7) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fines & Penalties</h1>
          <p className="text-gray-600 mt-1">View and pay fines for missed contributions or late repayments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Fines</p>
                <p className="text-2xl font-bold text-gray-800">{fineStats.totalFines}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{fineStats.pending}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-gray-800">{fineStats.totalAmount.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-800">{fineStats.pendingAmount.toLocaleString()} RWF</p>
              </div>
              <XCircle className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* AI Penalty Insights */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            🤖 AI Penalty Insights
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-primary-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-800">Performance Trend</p>
                <p className="text-sm text-gray-600">
                  You've had {fineStats.totalFines} fines in the last 5 months. Most fines are due to late contributions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-800">Recommendation</p>
                <p className="text-sm text-gray-600">
                  Set up automatic reminders 2 days before contribution due dates to avoid late payments.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-1" size={20} />
              <div>
                <p className="font-semibold text-gray-800">Good Standing</p>
                <p className="text-sm text-gray-600">
                  Your payment history shows improvement. Continue making timely payments to maintain good standing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Fines Trend (Last 5 Months)</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-600">Fines trend chart would be displayed here</p>
              <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                {performanceTrend.map((item, index) => (
                  <div key={index} className="text-center">
                    <p className="font-semibold">{item.fines}</p>
                    <p className="text-gray-500">{item.month.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Fines */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Fines</h2>
          {fines.filter(f => f.status === 'pending').length > 0 ? (
            <div className="space-y-4">
              {fines.filter(f => f.status === 'pending').map((fine) => (
                <div
                  key={fine.id}
                  className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-yellow-600" size={20} />
                        <h3 className="font-bold text-gray-800">{fine.reason}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(fine.status)}`}>
                          {fine.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{fine.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-red-600">{fine.amount.toLocaleString()} RWF</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Applied Date</p>
                          <p className="font-semibold">{fine.appliedDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Due Date</p>
                          <p className={`font-semibold ${getSeverityColor(fine.daysLate)}`}>{fine.dueDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Days Late</p>
                          <p className={`font-semibold ${getSeverityColor(fine.daysLate)}`}>{fine.daysLate} days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePayFine(fine)}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Pay Fine
                    </button>
                    <button className="btn-secondary text-sm px-4 py-2">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
              <p className="font-semibold">No pending fines</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Paid Fines History */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Fines History</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search size={18} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {fines.map((fine) => (
              <div
                key={fine.id}
                className={`flex items-center justify-between p-4 rounded-xl hover:bg-white transition-colors ${
                  fine.status === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    fine.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {fine.status === 'paid' ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : (
                      <AlertCircle className="text-yellow-600" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{fine.reason}</p>
                    <p className="text-sm text-gray-600">{fine.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>Applied: {fine.appliedDate}</span>
                      {fine.paidDate && <span>Paid: {fine.paidDate}</span>}
                      {fine.paymentMethod && <span>Via: {fine.paymentMethod}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${fine.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {fine.amount.toLocaleString()} RWF
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(fine.status)}`}>
                      {fine.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {fine.status === 'pending' && (
                  <button
                    onClick={() => handlePayFine(fine)}
                    className="btn-primary text-sm px-4 py-2 ml-4"
                  >
                    Pay Now
                  </button>
                )}
                {fine.status === 'paid' && (
                  <button className="btn-secondary text-sm px-4 py-2 ml-4">
                    <Download size={16} /> Receipt
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pay Fine Modal */}
      {showPayFineModal && selectedFine && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-in">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Pay Fine</h2>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Fine Reason</p>
                  <p className="font-semibold text-gray-800">{selectedFine.reason}</p>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border-2 border-red-200">
                  <span className="text-gray-700 font-semibold">Fine Amount:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {selectedFine.amount.toLocaleString()} RWF
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleProcessPayment('MTN Mobile Money')}
                      className="btn-primary text-sm py-3"
                    >
                      MTN Mobile Money
                    </button>
                    <button
                      onClick={() => handleProcessPayment('Airtel Money')}
                      className="btn-primary text-sm py-3"
                    >
                      Airtel Money
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPayFineModal(false)
                    setSelectedFine(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MemberFines
