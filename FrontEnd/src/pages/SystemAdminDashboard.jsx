import { useEffect, useState } from 'react'
import { Users, Building2, UserCheck, Shield, BarChart3, BookOpen, FileCheck, MessageCircle, Plus, Eye, Edit, Download, CheckCircle, AlertCircle, Clock, Settings, Database, CreditCard, TrendingUp, Globe, Headphones, FileText } from 'lucide-react'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function SystemAdminDashboard() {
  const { language } = useLanguage()
  const [selectedTab, setSelectedTab] = useState('overview')
  const navigate = useNavigate()

  const { data: sys, setData: setSys, loading, wrap } = useApiState({
    totalUsers: 0,
    activeAgents: 0,
    totalBranches: 0,
    transactions: 0,
    totalSavings: 0,
    loans: 0
  })

  useEffect(() => {
    wrap(async () => {
      try {
        const [users, branches, agents, txSummary] = await Promise.all([
          api.get('/system-admin/users/count').catch(()=>({data:null})),
          api.get('/system-admin/branches/count').catch(()=>({data:null})),
          api.get('/system-admin/agents/count').catch(()=>({data:null})),
          api.get('/transactions/summary').catch(()=>({data:null}))
        ])
        setSys({
          totalUsers: users?.data?.data?.count || 0,
          totalBranches: branches?.data?.data?.count || 0,
          activeAgents: agents?.data?.data?.count || 0,
          transactions: txSummary?.data?.data?.count || 0,
          totalSavings: (txSummary?.data?.data?.byType?.contribution || 0),
          loans: 0
        })
      } catch (_) {}
    })
  }, [])

  const systemStats = [
    { label: 'Total Users', value: `${sys.totalUsers}`, icon: Users, color: 'text-blue-600', change: '' },
    { label: 'Active Agents', value: `${sys.activeAgents}`, icon: UserCheck, color: 'text-green-600', change: '' },
    { label: 'Total Branches', value: `${sys.totalBranches}`, icon: Building2, color: 'text-purple-600', change: '' },
    { label: t('dashboard.transactions', language), value: `${sys.transactions}`, icon: CreditCard, color: 'text-orange-600', change: '' },
    { label: t('dashboard.totalSavings', language), value: `${Number(sys.totalSavings || 0).toLocaleString()} RWF`, icon: TrendingUp, color: 'text-green-600', change: '' },
    { label: t('dashboard.loans', language), value: `${sys.loans}`, icon: Shield, color: 'text-red-600', change: '' },
  ]

  // No static activities; should be fetched from API when implemented
  const recentActivities = []

  // No static alerts; should be fetched from API when implemented
  const systemAlerts = []

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return <Users className="text-blue-600" size={20} />
      case 'transaction': return <CreditCard className="text-green-600" size={20} />
      case 'branch': return <Building2 className="text-purple-600" size={20} />
      case 'loan': return <Shield className="text-orange-600" size={20} />
      case 'content': return <BookOpen className="text-red-600" size={20} />
      default: return <AlertCircle className="text-gray-600" size={20} />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-100 text-yellow-700'
      case 'error': return 'bg-red-100 text-red-700'
      case 'info': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">System Administrator Portal</h1>
          <p className="text-gray-600 mt-1">Superuser dashboard for managing users, system operations, and digital learning content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {systemStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{loading ? 'Loading…' : stat.value}</p>
                    {stat.change && <p className="text-xs text-green-600 mt-1">{stat.change}</p>}
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">System Alerts</h2>
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    alert.priority === 'high' ? 'bg-red-50 border-red-200' :
                    alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getAlertColor(alert.type)}`}>
                        {alert.type}
                      </span>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                    </div>
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2 overflow-x-auto">
              {['overview', 'users', 'branches', 'agents', 'clients', 'loans', 'transactions', 'system', 'audit', 'reports', 'communications', 'support', 'learn-grow'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activities */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Recent System Activities</h2>
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="font-semibold text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-600">
                              {activity.user || activity.amount || activity.branch || activity.title}
                            </p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          activity.status === 'flagged' ? 'bg-red-100 text-red-700' :
                          activity.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          activity.status === 'published' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                      onClick={() => navigate('/system-admin/users')}
                      className="card text-center hover:shadow-xl transition-all cursor-pointer"
                    >
                      <Users className="text-blue-600 mx-auto mb-2" size={32} />
                      <h3 className="font-semibold text-gray-800">Manage Users</h3>
                      <p className="text-sm text-gray-600">Register, edit, or delete users</p>
                    </button>
                    <button 
                      onClick={() => navigate('/system-admin/branches')}
                      className="card text-center hover:shadow-xl transition-all cursor-pointer"
                    >
                      <Building2 className="text-green-600 mx-auto mb-2" size={32} />
                      <h3 className="font-semibold text-gray-800">Branch Management</h3>
                      <p className="text-sm text-gray-600">Create and manage branches</p>
                    </button>
                    <button 
                      onClick={() => navigate('/system-admin/clients')}
                      className="card text-center hover:shadow-xl transition-all cursor-pointer"
                    >
                      <Users className="text-purple-600 mx-auto mb-2" size={32} />
                      <h3 className="font-semibold text-gray-800">Client Management</h3>
                      <p className="text-sm text-gray-600">View and manage clients</p>
                    </button>
                    <button 
                      onClick={() => navigate('/system-admin/learn-grow')}
                      className="card text-center hover:shadow-xl transition-all cursor-pointer"
                    >
                      <BookOpen className="text-orange-600 mx-auto mb-2" size={32} />
                      <h3 className="font-semibold text-gray-800">Learn & Grow</h3>
                      <p className="text-sm text-gray-600">Manage educational content</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'users' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
                <p className="text-gray-600">Register, edit, or delete users (agents, clients, managers, etc.)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/users')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Register Users</h3>
                    <p className="text-sm text-gray-600">Create new user accounts</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/users')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <UserCheck className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Approve Registrations</h3>
                    <p className="text-sm text-gray-600">Verify and approve user profiles</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/users')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Shield className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Manage Permissions</h3>
                    <p className="text-sm text-gray-600">Assign roles and permissions</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'branches' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Branch & Location Management</h2>
                <p className="text-gray-600">Create and manage Umurenge SACCO branches</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/branches')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Building2 className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Create Branches</h3>
                    <p className="text-sm text-gray-600">Add new SACCO branches</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/branches')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Assign Agents</h3>
                    <p className="text-sm text-gray-600">Assign agents per branch</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/branches')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Globe className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Coverage Zones</h3>
                    <p className="text-sm text-gray-600">Monitor rural and urban zones</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'agents' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Agent Management</h2>
                <p className="text-gray-600">Approve, suspend, and monitor agent performance</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/agents')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <UserCheck className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Approve Agents</h3>
                    <p className="text-sm text-gray-600">Approve or suspend agent accounts</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/agents')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Assign Clients</h3>
                    <p className="text-sm text-gray-600">Assign clients to agents</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/agents')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BarChart3 className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Performance Monitor</h3>
                    <p className="text-sm text-gray-600">View agent performance metrics</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'clients' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Client Management</h2>
                <p className="text-gray-600">View all clients' profiles and manage applications</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/clients')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Eye className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">View Profiles</h3>
                    <p className="text-sm text-gray-600">View all client profiles and ID info</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/clients')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <TrendingUp className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Track Repayments</h3>
                    <p className="text-sm text-gray-600">Monitor loan repayment behavior</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/clients')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <CheckCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Approve Applications</h3>
                    <p className="text-sm text-gray-600">Approve client account creation</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'loans' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Loan & Credit Management</h2>
                <p className="text-gray-600">Define loan products and manage credit scoring</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/loans')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <CreditCard className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Define Products</h3>
                    <p className="text-sm text-gray-600">Define loan products and structures</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/loans')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Shield className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Credit Scoring</h3>
                    <p className="text-sm text-gray-600">Configure credit parameters</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/loans')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <CheckCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Approve Loans</h3>
                    <p className="text-sm text-gray-600">Approve large loan requests</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'transactions' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Transaction Management</h2>
                <p className="text-gray-600">View, approve, and manage all transactions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/transactions')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Eye className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">View Transactions</h3>
                    <p className="text-sm text-gray-600">View all deposits and withdrawals</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/transactions')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Approve Flagged</h3>
                    <p className="text-sm text-gray-600">Approve flagged transactions</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/transactions')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <AlertCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Reverse Transactions</h3>
                    <p className="text-sm text-gray-600">Reverse erroneous transactions</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'system' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">System Configuration</h2>
                <p className="text-gray-600">Configure system settings and integrations</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/system')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Settings className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">System Settings</h3>
                    <p className="text-sm text-gray-600">Configure branding and terms</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/system')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Globe className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">API Integrations</h3>
                    <p className="text-sm text-gray-600">Manage mobile money and bank APIs</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/system')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <MessageCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <p className="text-sm text-gray-600">Manage templates and settings</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'audit' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Audit & Compliance</h2>
                <p className="text-gray-600">Access audit trails and monitor compliance</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/audit')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <FileCheck className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Audit Trail</h3>
                    <p className="text-sm text-gray-600">Access complete audit trail</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/audit')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Shield className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Compliance Reports</h3>
                    <p className="text-sm text-gray-600">Generate compliance reports</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/audit')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <AlertCircle className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Fraud Detection</h3>
                    <p className="text-sm text-gray-600">Monitor suspicious activities</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Reporting & Analytics</h2>
                <p className="text-gray-600">Access analytics dashboards and generate reports</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/reports')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BarChart3 className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Analytics Dashboard</h3>
                    <p className="text-sm text-gray-600">View performance analytics</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/reports')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Download className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Generate Reports</h3>
                    <p className="text-sm text-gray-600">Export PDF/Excel reports</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/reports')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Globe className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Geographic Distribution</h3>
                    <p className="text-sm text-gray-600">View user distribution maps</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'communications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Communication & Announcements</h2>
                <p className="text-gray-600">Broadcast messages and send targeted notifications</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/communications')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <MessageCircle className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Broadcast Messages</h3>
                    <p className="text-sm text-gray-600">Send system-wide messages</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/communications')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Targeted Notifications</h3>
                    <p className="text-sm text-gray-600">Send to specific groups</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/communications')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <FileText className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">System News</h3>
                    <p className="text-sm text-gray-600">Publish updates and reminders</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'support' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Support & Maintenance</h2>
                <p className="text-gray-600">Assign support tickets and perform system maintenance</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/support')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Headphones className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Support Tickets</h3>
                    <p className="text-sm text-gray-600">Assign and monitor tickets</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/support')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Database className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">System Updates</h3>
                    <p className="text-sm text-gray-600">Perform updates and backups</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/support')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Shield className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Security Monitor</h3>
                    <p className="text-sm text-gray-600">Monitor uptime and security</p>
                  </button>
                </div>
              </div>
            )}

            {selectedTab === 'learn-grow' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Learn & Grow Content Management</h2>
                <p className="text-gray-600">Educate and empower users on digital finance and savings</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/system-admin/learn-grow')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BookOpen className="text-blue-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Upload Content</h3>
                    <p className="text-sm text-gray-600">Upload PDFs, videos, tutorials</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/learn-grow')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Users className="text-green-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Access Levels</h3>
                    <p className="text-sm text-gray-600">Set public, agent, or client access</p>
                  </button>
                  <button 
                    onClick={() => navigate('/system-admin/learn-grow')}
                    className="card text-center hover:shadow-xl transition-all cursor-pointer"
                  >
                    <BarChart3 className="text-purple-600 mx-auto mb-2" size={32} />
                    <h3 className="font-semibold text-gray-800">Engagement Analytics</h3>
                    <p className="text-sm text-gray-600">View learning metrics</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/system-admin/users')}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Plus size={20} /> Register User
            </button>
            <button 
              onClick={() => navigate('/system-admin/branches')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Building2 size={20} /> Create Branch
            </button>
            <button 
              onClick={() => navigate('/system-admin/reports')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <BarChart3 size={20} /> Generate Report
            </button>
            <button 
              onClick={() => navigate('/system-admin/communications')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <MessageCircle size={20} /> Send Announcement
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SystemAdminDashboard