import { useState } from 'react'
import { BarChart3, Users, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Eye, Download, Calendar, Target } from 'lucide-react'
import Layout from '../components/Layout'

function CashierOverview() {
  const [timeRange, setTimeRange] = useState('monthly')
  const [selectedMetric, setSelectedMetric] = useState('contributions')

  const groupMetrics = {
    totalMembers: 45,
    activeMembers: 42,
    suspendedMembers: 3,
    totalSavings: 2450000,
    totalLoans: 1200000,
    outstandingLoans: 800000,
    totalFines: 45000,
    monthlyTarget: 500000,
    monthlyAchieved: 425000
  }

  const memberRankings = [
    { rank: 1, name: 'Kamikazi Marie', contributions: 50000, loanPayments: 60000, consistency: 98, status: 'excellent' },
    { rank: 2, name: 'Mukamana Alice', contributions: 45000, loanPayments: 45000, consistency: 95, status: 'excellent' },
    { rank: 3, name: 'Mutabazi Paul', contributions: 40000, loanPayments: 30000, consistency: 88, status: 'good' },
    { rank: 4, name: 'Ikirezi Jane', contributions: 35000, loanPayments: 20000, consistency: 82, status: 'good' },
    { rank: 5, name: 'Uwimana Grace', contributions: 30000, loanPayments: 15000, consistency: 75, status: 'fair' }
  ]

  const recentActivities = [
    { member: 'Kamikazi Marie', action: 'Made contribution', amount: 5000, time: '2 hours ago', status: 'completed' },
    { member: 'Mukamana Alice', action: 'Paid loan installment', amount: 15000, time: '3 hours ago', status: 'completed' },
    { member: 'Mutabazi Paul', action: 'Applied for loan', amount: 80000, time: '5 hours ago', status: 'pending' },
    { member: 'Ikirezi Jane', action: 'Paid fine', amount: 500, time: '6 hours ago', status: 'completed' },
    { member: 'Uwimana Grace', action: 'Made contribution', amount: 7500, time: '8 hours ago', status: 'completed' }
  ]

  const monthlyTrends = {
    contributions: [350000, 420000, 380000, 450000, 425000],
    loanPayments: [280000, 320000, 290000, 350000, 315000],
    fines: [15000, 18000, 12000, 22000, 19000]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700'
      case 'good': return 'bg-blue-100 text-blue-700'
      case 'fair': return 'bg-yellow-100 text-yellow-700'
      case 'poor': return 'bg-red-100 text-red-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const achievementRate = Math.round((groupMetrics.monthlyAchieved / groupMetrics.monthlyTarget) * 100)

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Group Overview & Performance</h1>
            <p className="text-gray-600 mt-1">Monitor group performance and member activities</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2">
              <Download size={18} /> Export Report
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Calendar size={18} /> Schedule Report
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="card">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700">Time Range:</label>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'quarterly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Members</p>
                <p className="text-2xl font-bold text-gray-800">{groupMetrics.totalMembers}</p>
                <p className="text-xs text-green-600 mt-1">
                  {groupMetrics.activeMembers} active
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Group Savings</p>
                <p className="text-2xl font-bold text-gray-800">
                  {groupMetrics.totalSavings.toLocaleString()} RWF
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +12% this month
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Outstanding Loans</p>
                <p className="text-2xl font-bold text-gray-800">
                  {groupMetrics.outstandingLoans.toLocaleString()} RWF
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {Math.round((groupMetrics.outstandingLoans / groupMetrics.totalLoans) * 100)}% of total
                </p>
              </div>
              <TrendingUp className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Monthly Target</p>
                <p className="text-2xl font-bold text-gray-800">
                  {groupMetrics.monthlyAchieved.toLocaleString()} RWF
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {achievementRate}% achieved
                </p>
              </div>
              <Target className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Achievement */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Monthly Achievement</h2>
              <span className="text-sm text-gray-600">Target: {groupMetrics.monthlyTarget.toLocaleString()} RWF</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Contributions</span>
                  <span className="text-sm font-semibold">{groupMetrics.monthlyAchieved.toLocaleString()} RWF</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${achievementRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{achievementRate}% of target achieved</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-600">Contributions</p>
                  <p className="font-bold text-blue-600">85%</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600">Loan Payments</p>
                  <p className="font-bold text-green-600">92%</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <p className="text-sm text-gray-600">Fines</p>
                  <p className="font-bold text-orange-600">78%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Status */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Member Status</h2>
              <button className="btn-secondary text-sm">
                <Eye size={16} /> View All
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold text-gray-800">Active Members</span>
                </div>
                <span className="font-bold text-green-600">{groupMetrics.activeMembers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="text-yellow-600" size={20} />
                  <span className="font-semibold text-gray-800">Suspended Members</span>
                </div>
                <span className="font-bold text-yellow-600">{groupMetrics.suspendedMembers}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="font-semibold text-gray-800">Defaulters</span>
                </div>
                <span className="font-bold text-red-600">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Members */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Performing Members</h2>
            <button className="btn-secondary text-sm">
              <BarChart3 size={16} /> View Rankings
            </button>
          </div>
          <div className="space-y-3">
            {memberRankings.map((member) => (
              <div
                key={member.rank}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.rank}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{member.name}</h3>
                    <p className="text-sm text-gray-600">
                      Contributions: {member.contributions.toLocaleString()} RWF • 
                      Loan Payments: {member.loanPayments.toLocaleString()} RWF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Consistency</p>
                    <p className="font-semibold text-gray-800">{member.consistency}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
            <button className="btn-secondary text-sm">
              <Clock size={16} /> View All
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {activity.member[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{activity.member}</h3>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">
                    {activity.amount.toLocaleString()} RWF
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Trends Chart Placeholder */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Financial Trends</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric('contributions')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedMetric === 'contributions' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Contributions
              </button>
              <button
                onClick={() => setSelectedMetric('loans')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedMetric === 'loans' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Loan Payments
              </button>
              <button
                onClick={() => setSelectedMetric('fines')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedMetric === 'fines' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Fines
              </button>
            </div>
          </div>
          <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="text-gray-400 mx-auto mb-2" size={48} />
              <p className="text-gray-500">Chart visualization would be here</p>
              <p className="text-sm text-gray-400">
                {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} trends over time
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CashierOverview
