import { useState } from 'react'
import { BarChart3, Download, TrendingUp, DollarSign, Users, Calendar, FileText, Filter, Search, Eye, Printer, AlertTriangle } from 'lucide-react'
import Layout from '../components/Layout'

function CashierReports() {
  const [reportType, setReportType] = useState('daily')
  const [dateRange, setDateRange] = useState('today')
  const [selectedMember, setSelectedMember] = useState('all')

  const reportData = {
    daily: {
      title: 'Daily Financial Summary',
      date: '2024-01-20',
      data: {
        totalContributions: 125000,
        totalLoanPayments: 45000,
        totalFines: 1500,
        newLoans: 0,
        activeMembers: 45,
        transactions: 12
      }
    },
    weekly: {
      title: 'Weekly Financial Summary',
      date: 'Jan 14-20, 2024',
      data: {
        totalContributions: 875000,
        totalLoanPayments: 315000,
        totalFines: 10500,
        newLoans: 2,
        activeMembers: 45,
        transactions: 84
      }
    },
    monthly: {
      title: 'Monthly Financial Summary',
      date: 'January 2024',
      data: {
        totalContributions: 3500000,
        totalLoanPayments: 1260000,
        totalFines: 42000,
        newLoans: 8,
        activeMembers: 45,
        transactions: 336
      }
    }
  }

  const memberPerformance = [
    { member: 'Kamikazi Marie', contributions: 50000, loanPayments: 60000, fines: 0, rank: 1 },
    { member: 'Mukamana Alice', contributions: 45000, loanPayments: 45000, fines: 500, rank: 2 },
    { member: 'Mutabazi Paul', contributions: 40000, loanPayments: 30000, fines: 1000, rank: 3 },
    { member: 'Ikirezi Jane', contributions: 35000, loanPayments: 20000, fines: 750, rank: 4 },
    { member: 'Uwimana Grace', contributions: 30000, loanPayments: 15000, fines: 1500, rank: 5 }
  ]

  const aiInsights = [
    {
      type: 'risk',
      title: 'Default Risk Alert',
      description: '3 members show high risk of loan default',
      severity: 'high',
      members: ['Mutabazi Paul', 'Uwimana Grace', 'Nkurunziza Peter']
    },
    {
      type: 'prediction',
      title: 'Cash Flow Projection',
      description: 'Expected cash inflow next week: RWF 180,000',
      severity: 'medium',
      confidence: '85%'
    },
    {
      type: 'health',
      title: 'Group Financial Health',
      description: 'Group shows excellent financial stability',
      severity: 'low',
      score: '92/100'
    }
  ]

  const currentReport = reportData[reportType]

  const handleExportReport = (format) => {
    console.log(`Exporting ${reportType} report as ${format}`)
    alert(`Report exported as ${format.toUpperCase()} successfully!`)
  }

  const handlePrintReport = () => {
    console.log(`Printing ${reportType} report`)
    alert('Report sent to printer!')
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Financial Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive financial reports and insights</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExportReport('pdf')}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} /> Export PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export Excel
            </button>
          </div>
        </div>

        {/* Report Controls */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-field"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="quarterly">Quarterly Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Member Filter
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="input-field"
              >
                <option value="all">All Members</option>
                <option value="topContributors">Top Contributors</option>
                <option value="defaulters">Defaulters</option>
                <option value="active">Active Only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handlePrintReport}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Summary */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentReport.title}</h2>
              <p className="text-gray-600">Report Date: {currentReport.date}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm flex items-center gap-2">
                <Eye size={16} /> Preview
              </button>
              <button className="btn-primary text-sm flex items-center gap-2">
                <Download size={16} /> Download
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <DollarSign className="text-blue-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Contributions</p>
              <p className="text-xl font-bold text-blue-600">
                {currentReport.data.totalContributions.toLocaleString()} RWF
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <TrendingUp className="text-green-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Loan Payments</p>
              <p className="text-xl font-bold text-green-600">
                {currentReport.data.totalLoanPayments.toLocaleString()} RWF
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <AlertTriangle className="text-orange-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Fines</p>
              <p className="text-xl font-bold text-orange-600">
                {currentReport.data.totalFines.toLocaleString()} RWF
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <FileText className="text-purple-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">New Loans</p>
              <p className="text-xl font-bold text-purple-600">
                {currentReport.data.newLoans}
              </p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-xl">
              <Users className="text-indigo-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-xl font-bold text-indigo-600">
                {currentReport.data.activeMembers}
              </p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <BarChart3 className="text-pink-600 mx-auto mb-2" size={24} />
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-pink-600">
                {currentReport.data.transactions}
              </p>
            </div>
          </div>
        </div>

        {/* Member Performance */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Performing Members</h2>
            <button className="btn-secondary text-sm">
              <BarChart3 size={16} /> View Full Report
            </button>
          </div>
          <div className="space-y-3">
            {memberPerformance.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.rank}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{member.member}</h3>
                    <p className="text-sm text-gray-600">
                      Contributions: {member.contributions.toLocaleString()} RWF • 
                      Loan Payments: {member.loanPayments.toLocaleString()} RWF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Fines</p>
                    <p className="font-semibold text-gray-800">
                      {member.fines.toLocaleString()} RWF
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Rank #{member.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">AI Insights & Predictions</h2>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-xl border border-blue-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    insight.severity === 'high' ? 'bg-red-100 text-red-700' :
                    insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                {insight.members && (
                  <div className="text-sm">
                    <span className="text-gray-600">Affected members: </span>
                    <span className="font-semibold">{insight.members.join(', ')}</span>
                  </div>
                )}
                {insight.confidence && (
                  <div className="text-sm">
                    <span className="text-gray-600">Confidence: </span>
                    <span className="font-semibold">{insight.confidence}</span>
                  </div>
                )}
                {insight.score && (
                  <div className="text-sm">
                    <span className="text-gray-600">Health Score: </span>
                    <span className="font-semibold">{insight.score}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Trends</h3>
            <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="text-gray-400 mx-auto mb-2" size={48} />
                <p className="text-gray-500">Chart visualization would be here</p>
                <p className="text-sm text-gray-400">Contributions vs Loan Payments over time</p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Member Distribution</h3>
            <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Users className="text-gray-400 mx-auto mb-2" size={48} />
                <p className="text-gray-500">Chart visualization would be here</p>
                <p className="text-sm text-gray-400">Member performance distribution</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CashierReports
