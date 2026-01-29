import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function AnalyticsDashboard() {
  const { t } = useTranslation('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('6months')

  const contributionData = [
    { month: 'Jan', amount: 200000, target: 250000 },
    { month: 'Feb', amount: 280000, target: 250000 },
    { month: 'Mar', amount: 320000, target: 250000 },
    { month: 'Apr', amount: 290000, target: 250000 },
    { month: 'May', amount: 350000, target: 250000 },
    { month: 'Jun', amount: 380000, target: 250000 },
  ]

  const loanStatusData = [
    { name: 'Active', value: 12, color: '#10B981' },
    { name: 'Pending', value: 3, color: '#F59E0B' },
    { name: 'Completed', value: 8, color: '#3B82F6' },
    { name: 'Overdue', value: 2, color: '#EF4444' },
  ]

  const memberActivityData = [
    { name: 'Regular Contributors', value: 35, color: '#10B981' },
    { name: 'Occasional Contributors', value: 8, color: '#F59E0B' },
    { name: 'Inactive Members', value: 2, color: '#EF4444' },
  ]

  const aiInsights = [
    {
      type: 'success',
      icon: TrendingUp,
      title: 'Excellent Performance',
      description: 'Group contributions are 15% above target this month',
      action: 'Keep up the great work!'
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Loan Risk Alert',
      description: '2 members have overdue payments. Consider follow-up.',
      action: 'Review payment plans'
    },
    {
      type: 'info',
      icon: Users,
      title: 'Member Growth',
      description: '3 new members joined this month, increasing group size by 7%',
      action: 'Welcome new members'
    }
  ]

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getInsightIconColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiInsights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <div key={index} className={`card border-2 ${getInsightColor(insight.type)}`}>
              <div className="flex items-start gap-3">
                <Icon className={`${getInsightIconColor(insight.type)} flex-shrink-0`} size={24} />
                <div>
                  <h3 className="font-bold mb-2">{insight.title}</h3>
                  <p className="text-sm mb-3">{insight.description}</p>
                  <button className="text-sm font-semibold underline">
                    {insight.action}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contribution Trends */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Contribution Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} RWF`, '']} />
              <Legend />
              <Bar dataKey="amount" fill="#0A84FF" name="Actual" />
              <Bar dataKey="target" fill="#E5E7EB" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Loan Status Distribution */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Loan Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {loanStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Activity */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Member Activity Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={memberActivityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberActivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {memberActivityData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                </div>
                <span className="font-bold text-gray-800">{item.value} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <TrendingUp className="text-green-600 mx-auto mb-3" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">RWF 2.45M</h3>
          <p className="text-sm text-gray-600">Total Savings</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
        </div>
        <div className="card text-center">
          <DollarSign className="text-blue-600 mx-auto mb-3" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">RWF 1.2M</h3>
          <p className="text-sm text-gray-600">Active Loans</p>
          <p className="text-xs text-blue-600 mt-1">15 active loans</p>
        </div>
        <div className="card text-center">
          <Users className="text-purple-600 mx-auto mb-3" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">45</h3>
          <p className="text-sm text-gray-600">Active Members</p>
          <p className="text-xs text-green-600 mt-1">↑ 3 new this month</p>
        </div>
        <div className="card text-center">
          <CheckCircle className="text-green-600 mx-auto mb-3" size={32} />
          <h3 className="text-2xl font-bold text-gray-800">94%</h3>
          <p className="text-sm text-gray-600">On-time Payments</p>
          <p className="text-xs text-green-600 mt-1">Excellent performance</p>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard


