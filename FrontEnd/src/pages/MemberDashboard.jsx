import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, DollarSign, Clock, Bell, MessageCircle, Settings, Plus, Eye, History, Search, Filter, User, FileText, Users, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import BalanceCard from '../components/cards/BalanceCard'
import TransactionList from '../components/TransactionList'
import LoanRequestModal from '../components/modals/LoanRequestModal'
import { t } from '../utils/i18n'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function MemberDashboard() {
  const [showLoanModal, setShowLoanModal] = useState(false)
  const navigate = useNavigate()
  const { language } = useLanguage()

  const { data: statsData, setData: setStatsData, loading: statsLoading, wrap } = useApiState({
    totalSavings: 0,
    creditScore: 0,
    activeLoans: 0
  })

  const [userName, setUserName] = useState('')

  const stats = [
    { label: t('dashboard.totalSavings', language), value: `RWF ${Number(statsData.totalSavings || 0).toLocaleString()}`, icon: Wallet, color: 'bg-blue-500' },
    { label: t('dashboard.loans', language), value: `${Number(statsData.activeLoans || 0)}`, icon: DollarSign, color: 'bg-green-500' },
    { label: t('dashboard.creditScore', language), value: `${Number(statsData.creditScore || 0)}/1000`, icon: TrendingUp, color: 'bg-purple-500' },
  ]

  const [transactions, setTransactions] = useState([])

  const refreshDashboard = async () => {
    // Check if token exists before making requests
    const token = localStorage.getItem('uw_token')
    if (!token) {
      console.warn('No token found. Redirecting to login...')
      navigate('/login')
      return
    }

    wrap(async () => {
      try {
        // Fetch all data in parallel including contributions directly from database
        const [dash, tx, me, contributions] = await Promise.all([
          api.get('/members/dashboard'),
          api.get('/transactions?limit=5'),
          api.get('/auth/me'),
          api.get('/contributions/member') // Fetch contributions directly from database
        ])
        
        if (dash.data?.success) {
          // Use backend values directly (backend queries database and returns stored totalSavings)
          const backendTotalSavings = dash.data.data.stats?.totalSavings || 0
          const backendActiveLoans = dash.data.data.stats?.activeLoans || 0
          const backendCreditScore = dash.data.data.stats?.creditScore || 0
          
          console.log(`[MemberDashboard] Backend stats from database:`, {
            totalSavings: backendTotalSavings,
            activeLoans: backendActiveLoans,
            creditScore: backendCreditScore
          })
          
          // Verify with contributions (for debugging)
          if (contributions.data?.success) {
            const approvedContributions = (contributions.data.data || []).filter(c => c.status === 'approved')
            const calculatedFromContributions = approvedContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
            console.log(`[MemberDashboard] Verification: Calculated from contributions: ${calculatedFromContributions.toFixed(2)} RWF, Backend (from DB): ${backendTotalSavings.toFixed(2)} RWF`)
          }
          
          // Use backend value directly (this comes from users.totalSavings in database)
          setStatsData({
            totalSavings: backendTotalSavings, // From users.totalSavings field in database
            creditScore: backendCreditScore, // From database via backend
            activeLoans: backendActiveLoans, // From database via backend (SELECT COUNT from Loans table)
          })
        }
        if (tx.data?.success) {
          setTransactions((tx.data.data || []).map(t => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount || 0),
            date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
            status: t.status
          })))
        }
        if (me.data?.success) setUserName(me.data.data?.name || '')
      } catch (error) {
        // If 401, the interceptor will handle redirect
        if (error.response?.status === 401) {
          console.error('Authentication failed. Please log in again.')
        }
      }
    })
  }

  useEffect(() => {
    refreshDashboard()
  }, [])

  // Expose refresh function globally for contribution updates
  useEffect(() => {
    window.refreshMemberDashboard = refreshDashboard
    return () => {
      delete window.refreshMemberDashboard
    }
  }, [])

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Member Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {userName || 'User'}</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/chat')}
              className="btn-secondary flex items-center gap-2"
            >
              <MessageCircle size={18} /> {t('dashboard.chat', language)}
            </button>
            <button 
              onClick={() => navigate('/member/settings')}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings size={18} /> {t('common.settings', language)}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <BalanceCard
                key={index}
                label={stat.label}
                value={statsLoading ? 'Loading…' : stat.value}
                icon={Icon}
                color={stat.color}
              />
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.quickActions', language)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/member/savings')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Wallet size={20} /> {t('dashboard.mySavings', language)}
            </button>
            <button
              onClick={() => navigate('/member/loans')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <DollarSign size={20} /> {t('dashboard.myLoans', language)}
            </button>
            <button
              onClick={() => navigate('/member/transactions')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <History size={20} /> {t('dashboard.transactions', language)}
            </button>
            <button
              onClick={() => navigate('/member/fines')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <AlertCircle size={20} /> {t('dashboard.fines', language)}
            </button>
            <button
              onClick={() => navigate('/member/learn-grow')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <FileText size={20} /> {t('dashboard.learnGrow', language)}
            </button>
            <button
              onClick={() => navigate('/member/voting')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <User size={20} /> {t('dashboard.voting', language)}
            </button>
            <button
              onClick={() => navigate('/member/group')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Users size={20} /> {t('dashboard.myGroup', language)}
            </button>
            <button
              onClick={() => navigate('/member/support')}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <MessageCircle size={20} /> {t('dashboard.support', language)}
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{t('dashboard.recentTransactions', language)}</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search size={18} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{statsLoading ? 'Fetching data…' : 'No records found'}</div>
          ) : (
            <TransactionList transactions={transactions} />
          )}
        </div>

        {/* AI Recommendations */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            🤖 AI Recommendations
          </h2>
          <p className="text-gray-700 mb-4">
            {t('member.requestLoan', language)}: 
            <span className="font-bold text-primary-600"> RWF 80,000</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLoanModal(true)}
              className="btn-primary text-sm"
            >
              {t('common.getStarted', language)}
            </button>
            <button
              onClick={() => navigate('/member/loans')}
              className="btn-secondary text-sm"
            >
              {t('dashboard.viewAll', language)}
            </button>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Contributions</h3>
            <div className="space-y-3">
              {statsLoading ? (
                <div className="text-center py-4 text-gray-500">Loading contributions...</div>
              ) : transactions.filter(t => t.type === 'contribution').length === 0 ? (
                <div className="text-center py-4 text-gray-500">No contributions yet</div>
              ) : (
                transactions
                  .filter(t => t.type === 'contribution')
                  .slice(0, 5)
                  .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="text-green-600" size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Contribution</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">+{transaction.amount.toLocaleString()} RWF</span>
                    </div>
                  ))
              )}
            </div>
            <button
              onClick={() => navigate('/member/savings')}
              className="w-full mt-4 btn-secondary text-sm"
            >
              View All Contributions
            </button>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Loan Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="text-purple-600" size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Business Loan</p>
                    <p className="text-xs text-gray-500">Active • 3 months</p>
                  </div>
                </div>
                <span className="font-bold text-purple-600">45,000 RWF</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="text-green-600" size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Next Payment</p>
                    <p className="text-xs text-gray-500">Feb 15, 2024</p>
                  </div>
                </div>
                <span className="font-bold text-green-600">15,000 RWF</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/member/loans')}
              className="w-full mt-4 btn-secondary text-sm"
            >
              Manage Loans
            </button>
          </div>
        </div>
      </div>

      {showLoanModal && (
        <LoanRequestModal
          onClose={() => setShowLoanModal(false)}
          onConfirm={(data) => {
            console.log('Loan request:', data)
            setShowLoanModal(false)
          }}
        />
      )}
    </Layout>
  )
}

export default MemberDashboard


