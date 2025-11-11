import { useState, useEffect } from 'react'
import { BarChart3, Download, FileText, Globe, TrendingUp, Users, Building2, CreditCard, DollarSign, PieChart, MapPin, Calendar } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminReports() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [showExportModal, setShowExportModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const [analyticsData, setAnalyticsData] = useState({
    users: { total: 0, active: 0, newThisMonth: 0, growth: 0 },
    transactions: { total: 0, volume: '0 RWF', averageValue: '0 RWF', growth: 0 },
    loans: { total: 0, active: 0, totalValue: '0 RWF', defaultRate: 0 },
    branches: { total: 0, active: 0, coverage: '0%', performance: 0 }
  })

  const [geographicData, setGeographicData] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [analyticsRes, usersRes, transactionsRes, loansRes, branchesRes] = await Promise.all([
          api.get('/analytics').catch(() => ({ data: { data: {} } })),
          api.get('/system-admin/users/count').catch(() => ({ data: { data: { count: 0 } } })),
          api.get('/transactions/summary').catch(() => ({ data: { data: { count: 0, total: 0 } } })),
          api.get('/loans').catch(() => ({ data: { data: [] } })),
          api.get('/system-admin/branches/count').catch(() => ({ data: { data: { count: 0 } } }))
        ])

        if (mounted) {
          const userCount = usersRes?.data?.data?.count || 0
          const txCount = transactionsRes?.data?.data?.count || 0
          const txTotal = transactionsRes?.data?.data?.total || 0
          const loans = loansRes?.data?.data || []
          const activeLoans = loans.filter(l => ['approved', 'disbursed', 'active'].includes(l.status)).length
          const branchCount = branchesRes?.data?.data?.count || 0

          setAnalyticsData({
            users: { total: userCount, active: userCount, newThisMonth: 0, growth: 0 },
            transactions: { 
              total: txCount, 
              volume: `${(txTotal / 1000000).toFixed(1)}M RWF`, 
              averageValue: txCount > 0 ? `${(txTotal / txCount).toLocaleString()} RWF` : '0 RWF', 
              growth: 0 
            },
            loans: { total: loans.length, active: activeLoans, totalValue: '0 RWF', defaultRate: 0 },
            branches: { total: branchCount, active: branchCount, coverage: '0%', performance: 0 }
          })
          setGeographicData([])
          setPerformanceMetrics([])
        }
      } catch (e) {
        console.error('Failed to load reports:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleExportReport = (type) => {
    alert(`Exporting ${type} report...`)
    setShowExportModal(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'text-green-600'
      case 'met': return 'text-blue-600'
      case 'below': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Reporting & Analytics</h1>
        <p className="text-gray-600">Access analytics dashboards and generate comprehensive reports</p>

        {/* Period Selector */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Report Period</h2>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['analytics', 'geographic', 'performance', 'exports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Analytics Dashboard</h2>
                
                {/* Key Metrics */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading analytics data...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Total Users</p>
                          <p className="text-2xl font-bold text-gray-800">{analyticsData.users.total.toLocaleString()}</p>
                          {analyticsData.users.growth > 0 && (
                            <p className="text-xs text-green-600 mt-1">+{analyticsData.users.growth}% this month</p>
                          )}
                        </div>
                        <Users className="text-blue-600" size={32} />
                      </div>
                    </div>
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Transaction Volume</p>
                          <p className="text-2xl font-bold text-gray-800">{analyticsData.transactions.volume}</p>
                          {analyticsData.transactions.growth > 0 && (
                            <p className="text-xs text-green-600 mt-1">+{analyticsData.transactions.growth}% growth</p>
                          )}
                        </div>
                        <CreditCard className="text-green-600" size={32} />
                      </div>
                    </div>
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Active Loans</p>
                          <p className="text-2xl font-bold text-gray-800">{analyticsData.loans.active}</p>
                          {analyticsData.loans.defaultRate > 0 && (
                            <p className="text-xs text-red-600 mt-1">{analyticsData.loans.defaultRate}% default rate</p>
                          )}
                        </div>
                        <DollarSign className="text-purple-600" size={32} />
                      </div>
                    </div>
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Branch Performance</p>
                          <p className="text-2xl font-bold text-gray-800">{analyticsData.branches.performance}%</p>
                          {analyticsData.branches.coverage !== '0%' && (
                            <p className="text-xs text-green-600 mt-1">{analyticsData.branches.coverage} coverage</p>
                          )}
                        </div>
                        <Building2 className="text-orange-600" size={32} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Trends</h3>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="mx-auto text-gray-400 mb-2" size={48} />
                        <p className="text-gray-600">Transaction volume chart would be displayed here</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <TrendingUp className="mx-auto text-gray-400 mb-2" size={48} />
                        <p className="text-gray-600">User growth chart would be displayed here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Geographic Distribution</h2>
                <p className="text-gray-600">View user distribution and performance across different regions</p>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Savings</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Share</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {geographicData.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                              No geographic data available
                            </td>
                          </tr>
                        ) : (
                          geographicData.map((region, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.region}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.users.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.transactions.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.savings}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {analyticsData.users.total > 0 ? ((region.users / analyticsData.users.total) * 100).toFixed(1) : 0}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Geographic Map</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="text-gray-600">Interactive map showing user distribution would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Performance Metrics</h2>
                <p className="text-gray-600">Track key performance indicators and targets</p>

                <div className="space-y-4">
                  {performanceMetrics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No performance metrics available</div>
                  ) : (
                    performanceMetrics.map((metric, index) => (
                    <div key={index} className="card">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{metric.metric}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          metric.status === 'exceeded' ? 'bg-green-100 text-green-700' :
                          metric.status === 'met' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {metric.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Current: {metric.value}%</span>
                            <span>Target: {metric.target}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                metric.value >= metric.target ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                            {metric.value}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'exports' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Export Reports</h2>
                <p className="text-gray-600">Generate and download reports in various formats</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card text-center">
                    <FileText className="mx-auto text-blue-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">User Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Complete user statistics and demographics</p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="btn-primary w-full"
                    >
                      Export PDF
                    </button>
                  </div>
                  <div className="card text-center">
                    <CreditCard className="mx-auto text-green-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Transaction Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Transaction volume and patterns analysis</p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="btn-primary w-full"
                    >
                      Export Excel
                    </button>
                  </div>
                  <div className="card text-center">
                    <DollarSign className="mx-auto text-purple-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Financial Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Savings, loans, and financial performance</p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="btn-primary w-full"
                    >
                      Export PDF
                    </button>
                  </div>
                  <div className="card text-center">
                    <Building2 className="mx-auto text-orange-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Branch Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Branch performance and coverage analysis</p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="btn-primary w-full"
                    >
                      Export Excel
                    </button>
                  </div>
                  <div className="card text-center">
                    <BarChart3 className="mx-auto text-red-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Comprehensive analytics and insights</p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="btn-primary w-full"
                    >
                      Export PDF
                    </button>
                  </div>
                  <div className="card text-center">
                    <Calendar className="mx-auto text-indigo-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Custom Report</h3>
                    <p className="text-sm text-gray-600 mb-4">Create custom reports with selected data</p>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="btn-primary w-full"
                    >
                      Create Report
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Export Report</h2>
                  <p className="text-gray-600">Choose export format and options</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
                  <select className="input-field">
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <select className="input-field">
                    <option value="last-month">Last Month</option>
                    <option value="last-quarter">Last Quarter</option>
                    <option value="last-year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExportReport('selected')}
                  className="btn-primary flex-1"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminReports

