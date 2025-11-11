import { useState } from 'react'
import { DollarSign, Users, TrendingUp, AlertCircle, Clock, CheckCircle, FileText, BarChart3, Bell, MessageCircle, Download, Filter, Search, Calendar, CreditCard, Receipt, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'

function CashierDashboard() {
  const { language } = useLanguage()
  const [selectedTab, setSelectedTab] = useState('overview')

  const cashierStats = [
    { label: t('dashboard.totalSavings', language), value: 'RWF 125,000', icon: DollarSign, color: 'text-green-600', change: '+15%' },
    { label: t('dashboard.pending', language), value: '8', icon: Clock, color: 'text-yellow-600', change: '+2' },
    { label: 'Overdue Payments', value: '3', icon: AlertCircle, color: 'text-red-600', change: '-1' },
    { label: t('dashboard.members', language), value: '45', icon: Users, color: 'text-blue-600', change: '+1' },
  ]

  const recentTransactions = [
    { member: 'Kamikazi Marie', type: 'Contribution', amount: 5000, method: 'MTN Mobile Money', status: 'completed', time: '2 hours ago' },
    { member: 'Mukamana Alice', type: 'Loan Payment', amount: 15000, method: 'Bank Transfer', status: 'completed', time: '3 hours ago' },
    { member: 'Mutabazi Paul', type: 'Contribution', amount: 10000, method: 'Cash', status: 'pending', time: '4 hours ago' },
    { member: 'Ikirezi Jane', type: 'Fine Payment', amount: 500, method: 'MTN Mobile Money', status: 'completed', time: '5 hours ago' },
  ]

  const pendingApprovals = [
    { member: 'Uwimana Grace', type: 'Contribution', amount: 7500, method: 'Airtel Money', submitted: '1 hour ago' },
    { member: 'Nkurunziza Peter', type: 'Loan Payment', amount: 12000, method: 'Bank Transfer', submitted: '2 hours ago' },
    { member: 'Mukamana Sarah', type: 'Contribution', amount: 5000, method: 'Cash', submitted: '3 hours ago' },
  ]

  const overduePayments = [
    { member: 'Imanzi John', type: 'Loan Payment', amount: 20000, dueDate: '2024-01-18', daysOverdue: 7 },
    { member: 'Uwimana Grace', type: 'Contribution', amount: 5000, dueDate: '2024-01-20', daysOverdue: 5 },
    { member: 'Nkurunziza Peter', type: 'Fine Payment', amount: 1000, dueDate: '2024-01-19', daysOverdue: 6 },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleApproveTransaction = (transactionId) => {
    console.log('Approving transaction:', transactionId)
    alert('Transaction approved successfully!')
  }

  const handleRejectTransaction = (transactionId) => {
    console.log('Rejecting transaction:', transactionId)
    alert('Transaction rejected!')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.dashboard', language)}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.transactions', language)}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {cashierStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['overview', 'contributions', 'loans', 'fines', 'reports'].map((tab) => {
                const tabLabels = {
                  overview: t('dashboard.recentTransactions', language),
                  contributions: t('groupAdmin.contributions', language),
                  loans: t('dashboard.loans', language),
                  fines: t('dashboard.fines', language),
                  reports: 'Reports'
                }
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedTab === tab
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tabLabels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Transactions */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.recentTransactions', language)}</h2>
                  <div className="space-y-3">
                    {recentTransactions.map((transaction, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {transaction.member[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{transaction.member}</p>
                            <p className="text-sm text-gray-600">{transaction.type} • {transaction.method}</p>
                            <p className="text-xs text-gray-500">{transaction.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800">
                            {transaction.amount.toLocaleString()} RWF
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Approvals */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.pending', language)}</h2>
                  <div className="space-y-3">
                    {pendingApprovals.map((approval, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {approval.member[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{approval.member}</p>
                            <p className="text-sm text-gray-600">{approval.type} • {approval.method}</p>
                            <p className="text-xs text-gray-500">Submitted: {approval.submitted}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800">
                            {approval.amount.toLocaleString()} RWF
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveTransaction(approval.member)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {t('common.approve', language)}
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(approval.member)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {t('common.reject', language)}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue Payments */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Overdue Payments</h2>
                  <div className="space-y-3">
                    {overduePayments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {payment.member[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{payment.member}</p>
                            <p className="text-sm text-gray-600">{payment.type}</p>
                            <p className="text-xs text-gray-500">Due: {payment.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800">
                            {payment.amount.toLocaleString()} RWF
                          </span>
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {payment.daysOverdue} days overdue
                          </span>
                          <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors">
                            Send Reminder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'contributions' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Member Contributions</h2>
                <p className="text-gray-600">Manage member contributions and payment verification</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <CreditCard className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Verify Mobile Money</h3>
                    <p className="text-sm text-gray-600">Check and approve mobile money payments</p>
                  </div>
                  <div className="card text-center">
                    <Receipt className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Record Cash Payments</h3>
                    <p className="text-sm text-gray-600">Enter manual cash transactions</p>
                  </div>
                  <div className="card text-center">
                    <Calendar className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Schedule Contributions</h3>
                    <p className="text-sm text-gray-600">Manage contribution schedules</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'loans' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Loan Repayment Tracking</h2>
                <p className="text-gray-600">Monitor loan repayments and overdue payments</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <DollarSign className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Track Repayments</h3>
                    <p className="text-sm text-gray-600">Monitor loan payment schedules</p>
                  </div>
                  <div className="card text-center">
                    <AlertCircle className="text-red-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Overdue Management</h3>
                    <p className="text-sm text-gray-600">Handle overdue loan payments</p>
                  </div>
                  <div className="card text-center">
                    <Bell className="text-yellow-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Send Reminders</h3>
                    <p className="text-sm text-gray-600">Notify members of due payments</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'fines' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Fine and Penalty Management</h2>
                <p className="text-gray-600">Apply and manage fines for late payments</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <AlertTriangle className="text-orange-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Apply Fines</h3>
                    <p className="text-sm text-gray-600">Add penalties for late payments</p>
                  </div>
                  <div className="card text-center">
                    <FileText className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Fine History</h3>
                    <p className="text-sm text-gray-600">View member fine records</p>
                  </div>
                  <div className="card text-center">
                    <Shield className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Fine Rules</h3>
                    <p className="text-sm text-gray-600">Configure penalty policies</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Financial Reports & Analytics</h2>
                <p className="text-gray-600">Generate comprehensive financial reports</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <BarChart3 className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Daily Reports</h3>
                    <p className="text-sm text-gray-600">Generate daily financial summaries</p>
                  </div>
                  <div className="card text-center">
                    <Download className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Export Data</h3>
                    <p className="text-sm text-gray-600">Export reports to PDF/Excel</p>
                  </div>
                  <div className="card text-center">
                    <TrendingUp className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">AI Insights</h3>
                    <p className="text-sm text-gray-600">View AI-generated analytics</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center justify-center gap-2 py-4 text-lg">
              <CreditCard size={20} /> Verify Payment
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg">
              <Receipt size={20} /> Record Cash
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg">
              <Bell size={20} /> Send Reminders
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg">
              <Download size={20} /> Generate Report
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CashierDashboard