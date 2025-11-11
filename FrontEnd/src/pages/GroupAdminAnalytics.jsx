import { useState } from 'react'
import { TrendingUp, DollarSign, Users, FileText, Download, Filter, Calendar, BarChart3, PieChart } from 'lucide-react'
import Layout from '../components/Layout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts'

function GroupAdminAnalytics() {
  const [dateRange, setDateRange] = useState('month')
  const [selectedChart, setSelectedChart] = useState('savings')

  // Sample data for charts
  const savingsData = [
    { month: 'Jan', amount: 450000 },
    { month: 'Feb', amount: 520000 },
    { month: 'Mar', amount: 480000 },
    { month: 'Apr', amount: 610000 },
    { month: 'May', amount: 550000 },
    { month: 'Jun', amount: 680000 }
  ]

  const loanData = [
    { month: 'Jan', approved: 3, rejected: 1, pending: 2 },
    { month: 'Feb', approved: 5, rejected: 0, pending: 1 },
    { month: 'Mar', approved: 4, rejected: 2, pending: 3 },
    { month: 'Apr', approved: 6, rejected: 1, pending: 2 },
    { month: 'May', approved: 5, rejected: 0, pending: 1 },
    { month: 'Jun', approved: 7, rejected: 1, pending: 2 }
  ]

  const memberStatusData = [
    { name: 'Active', value: 45, color: '#10B981' },
    { name: 'Burned', value: 3, color: '#EF4444' },
    { name: 'Inactive', value: 2, color: '#6B7280' }
  ]

  const contributionData = [
    { name: 'On Time', value: 85, color: '#10B981' },
    { name: 'Late', value: 12, color: '#F59E0B' },
    { name: 'Missed', value: 3, color: '#EF4444' }
  ]

  const stats = [
    {
      title: 'Total Group Savings',
      value: 'RWF 2,850,000',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Members',
      value: '45',
      change: '+2',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Loans Given',
      value: 'RWF 1,200,000',
      change: '+8.3%',
      changeType: 'positive',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      title: 'Loan Repayment Rate',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ]

  const recentTransactions = [
    { id: 1, member: 'Kamikazi Marie', type: 'Contribution', amount: 5000, date: '2024-01-20', status: 'completed' },
    { id: 2, member: 'Mukamana Alice', type: 'Loan Payment', amount: 15000, date: '2024-01-19', status: 'completed' },
    { id: 3, member: 'Mutabazi Paul', type: 'Contribution', amount: 10000, date: '2024-01-18', status: 'completed' },
    { id: 4, member: 'Ikirezi Jane', type: 'Interest', amount: 750, date: '2024-01-17', status: 'completed' }
  ]

  const exportReport = () => {
    console.log('Exporting analytics report...')
    alert('Analytics report exported successfully!')
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into group performance</p>
          </div>
          <div className="flex gap-2">
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
            <button
              onClick={exportReport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mb-1">
                      {stat.value}
                    </p>
                    <p className={`text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} from last period
                    </p>
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Savings Trend Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Savings Trend</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedChart('savings')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    selectedChart === 'savings' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Savings
                </button>
                <button
                  onClick={() => setSelectedChart('loans')}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    selectedChart === 'loans' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Loans
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === 'savings' ? (
                  <BarChart data={savingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} RWF`, 'Amount']} />
                    <Bar dataKey="amount" fill="#0A84FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={loanData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="approved" stackId="a" fill="#10B981" />
                    <Bar dataKey="rejected" stackId="a" fill="#EF4444" />
                    <Bar dataKey="pending" stackId="a" fill="#F59E0B" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Status Distribution */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Member Status Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <PieChart
                    data={memberStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {memberStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </PieChart>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {memberStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contribution Performance */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Contribution Performance</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <PieChart
                    data={contributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </PieChart>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {contributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {transaction.member[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{transaction.member}</p>
                      <p className="text-xs text-gray-500">{transaction.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{transaction.amount.toLocaleString()} RWF</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📊 Performance Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Top Performers</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>1. Mutabazi Paul - RWF 200,000</li>
                <li>2. Kamikazi Marie - RWF 150,000</li>
                <li>3. Mukamana Alice - RWF 120,000</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Risk Alerts</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 3 members with late payments</li>
                <li>• 1 member approaching loan limit</li>
                <li>• 2 members inactive for 30+ days</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Recommendations</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Increase contribution targets</li>
                <li>• Review loan approval criteria</li>
                <li>• Implement member engagement program</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminAnalytics

