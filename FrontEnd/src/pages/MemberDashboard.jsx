import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, DollarSign, Clock, Bell, MessageCircle, Settings, Plus, Eye, History, Search, Filter, User, FileText, Users, AlertCircle, Vote } from 'lucide-react'
import Layout from '../components/Layout'
import BalanceCard from '../components/cards/BalanceCard'
import TransactionList from '../components/TransactionList'
import LoanRequestModal from '../components/modals/LoanRequestModal'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function MemberDashboard() {
  const [showLoanModal, setShowLoanModal] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')

  const { data: statsData, setData: setStatsData, loading: statsLoading, wrap } = useApiState({
    totalSavings: 0,
    creditScore: 0,
    activeLoans: 0
  })

  const [userName, setUserName] = useState('')
  const [activeVotes, setActiveVotes] = useState([])
  const [aiRecommendation, setAiRecommendation] = useState({
    maxRecommendedAmount: 0,
    confidence: 'Low',
    interestRate: 5,
    creditScore: 0,
    message: '',
    savings: 0,
    monthlyPayment: 0
  })
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)

  const stats = [
    { label: t('totalSavings'), value: `RWF ${Number(statsData.totalSavings || 0).toLocaleString()}`, icon: Wallet, color: 'bg-blue-500' },
    { label: t('loans'), value: `${Number(statsData.activeLoans || 0)}`, icon: DollarSign, color: 'bg-green-500' },
    { label: t('creditScore'), value: `${Number(statsData.creditScore || 0)}/100`, icon: TrendingUp, color: 'bg-purple-500' },
  ]

  const [transactions, setTransactions] = useState([])
  const [activeLoans, setActiveLoans] = useState([])
  const [nextPayment, setNextPayment] = useState(null)

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
        const [dash, tx, me, contributions, votes, recommendation, loans] = await Promise.all([
          api.get('/members/dashboard'),
          api.get('/transactions?limit=5'),
          api.get('/auth/me'),
          api.get('/contributions/member'), // Fetch contributions directly from database
          api.get('/voting?status=open').catch(() => ({ data: { success: false, data: [] } })), // Fetch active votes
          api.get('/members/loan-recommendation').catch(() => ({ data: { success: false, data: null } })), // Fetch AI recommendation
          api.get('/loans/member').catch(() => ({ data: { success: false, data: [] } })) // Fetch member loans
        ])

        if (dash.data?.success) {
          // Use backend values directly (backend queries database and returns stored totalSavings)
          let backendTotalSavings = dash.data.data.stats?.totalSavings || 0
          const backendActiveLoans = dash.data.data.stats?.activeLoans || 0
          const backendCreditScore = dash.data.data.stats?.creditScore || 0

          console.log(`[MemberDashboard] Backend stats from database:`, {
            totalSavings: backendTotalSavings,
            activeLoans: backendActiveLoans,
            creditScore: backendCreditScore
          })

          // Verify with contributions and PREFER calculated value for real-time updates
          if (contributions.data?.success) {
            const approvedContributions = (contributions.data.data || []).filter(c => c.status === 'approved')
            const calculatedFromContributions = approvedContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
            console.log(`[MemberDashboard] Calculated from contributions: ${calculatedFromContributions.toFixed(2)} RWF, Backend stats: ${backendTotalSavings.toFixed(2)} RWF`)

            // Use calculated value if it seems more up-to-date (or just always use it as source of truth for display)
            if (calculatedFromContributions > 0) {
              backendTotalSavings = calculatedFromContributions
            }
          }

          // Use backend value directly (this comes from users.totalSavings in database)
          setStatsData({
            totalSavings: backendTotalSavings, // refined with calculation from contributions
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
        if (votes.data?.success) {
          setActiveVotes((votes.data.data || []).slice(0, 3)) // Show up to 3 active votes
        }

        // Process loan data
        if (loans.data?.success) {
          const loanList = loans.data.data || []
          // Filter active loans (active, approved, disbursed)
          const active = loanList.filter(l => ['active', 'approved', 'disbursed'].includes(l.status))

          // Format active loans
          const formattedActiveLoans = active.map(l => ({
            id: l.id,
            purpose: l.purpose || t('loan', { defaultValue: 'Loan' }),
            amount: Number(l.remainingAmount || l.amount || 0),
            status: l.status,
            nextPaymentDate: l.nextPaymentDate,
            monthlyPayment: Number(l.monthlyPayment || 0),
            startDate: l.disbursementDate || l.approvalDate || l.createdAt
          }))

          setActiveLoans(formattedActiveLoans.slice(0, 1)) // Show only the first active loan

          // Find the next payment (earliest nextPaymentDate from active loans)
          const loansWithNextPayment = active.filter(l => l.nextPaymentDate)
          if (loansWithNextPayment.length > 0) {
            const sortedByNextPayment = loansWithNextPayment.sort((a, b) => {
              const dateA = new Date(a.nextPaymentDate)
              const dateB = new Date(b.nextPaymentDate)
              return dateA - dateB
            })
            const earliestPayment = sortedByNextPayment[0]
            setNextPayment({
              date: earliestPayment.nextPaymentDate,
              amount: Number(earliestPayment.monthlyPayment || 0),
              loanId: earliestPayment.id
            })
          } else {
            setNextPayment(null)
          }
        } else {
          setActiveLoans([])
          setNextPayment(null)
        }
        if (recommendation.data?.success && recommendation.data.data) {
          setAiRecommendation({
            maxRecommendedAmount: recommendation.data.data.maxRecommendedAmount || 0,
            confidence: recommendation.data.data.confidence || 'Low',
            interestRate: recommendation.data.data.interestRate || 5,
            creditScore: recommendation.data.data.creditScore || 0,
            message: recommendation.data.data.message || '',
            savings: recommendation.data.data.savings || 0,
            monthlyPayment: recommendation.data.data.monthlyPayment || 0,
            riskCategory: recommendation.data.data.riskCategory || null,
            explanation: recommendation.data.data.explanation || null
          })
        } else {
          // Set default values if API fails
          setAiRecommendation({
            maxRecommendedAmount: 0,
            confidence: 'Low',
            interestRate: 5,
            creditScore: 0,
            message: '',
            savings: 0,
            monthlyPayment: 0,
            riskCategory: null,
            explanation: null
          })
        }
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('memberDashboard', { defaultValue: 'Member Dashboard' })}</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('welcomeBack')}, {userName || tCommon('user', { defaultValue: 'User' })}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/chat')}
              className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm"
            >
              <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden xs:inline">{tCommon('chat')}</span>
            </button>
            <button
              onClick={() => navigate('/member/settings')}
              className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial text-sm"
            >
              <Settings size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden xs:inline">{tCommon('settings')}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Active Votes Summary */}
        {activeVotes.length > 0 && (
          <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Vote className="text-blue-600 dark:text-blue-400" size={20} style={{ width: '20px', height: '20px' }} />
                {t('activeVotes', { defaultValue: 'Active Votes' })} ({activeVotes.length})
              </h2>
              <button
                onClick={() => navigate('/member/voting')}
                className="btn-secondary text-xs sm:text-sm w-full sm:w-auto"
              >
                {t('viewAll')}
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {activeVotes.map((vote) => (
                <div key={vote.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm sm:text-base">{vote.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{vote.description}</p>
                  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{t('ends', { defaultValue: 'Ends' })}: {new Date(vote.endDate).toLocaleDateString()}</span>
                    <button
                      onClick={() => navigate('/member/voting')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                    >
                      {t('voteNow', { defaultValue: 'Vote Now' })} →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/member/savings')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <Wallet size={18} className="sm:w-5 sm:h-5" /> {t('mySavings')}
            </button>
            <button
              onClick={() => navigate('/member/loans')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <DollarSign size={18} className="sm:w-5 sm:h-5" /> {t('myLoans')}
            </button>
            <button
              onClick={() => navigate('/member/transactions')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <History size={18} className="sm:w-5 sm:h-5" /> {t('transactions')}
            </button>
            <button
              onClick={() => navigate('/member/fines')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <AlertCircle size={18} className="sm:w-5 sm:h-5" /> {t('fines')}
            </button>
            <button
              onClick={() => navigate('/member/learn-grow')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <FileText size={18} className="sm:w-5 sm:h-5" /> {t('learnGrow')}
            </button>
            <button
              onClick={() => navigate('/member/voting')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <User size={18} className="sm:w-5 sm:h-5" /> {t('voting')}
            </button>
            <button
              onClick={() => navigate('/member/group')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <Users size={18} className="sm:w-5 sm:h-5" /> {t('myGroup')}
            </button>
            <button
              onClick={() => navigate('/member/support')}
              className="btn-secondary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              <MessageCircle size={18} className="sm:w-5 sm:h-5" /> {t('support')}
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{t('recentTransactions')}</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Search size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Filter size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">{statsLoading ? tCommon('loading') : tCommon('noData')}</div>
          ) : (
            <TransactionList transactions={transactions} />
          )}
        </div>

        {/* AI Recommendations */}
        <div className={`card bg-gradient-to-r ${aiRecommendation.maxRecommendedAmount > 0 ? 'from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-700' : 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700'} border-2`}>
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              {t('aiRecommendations', { defaultValue: 'AI Recommendations' })}
            </h2>
            {loadingRecommendation && (
              <span className="text-xs text-gray-500 dark:text-gray-400">({t('updating', { defaultValue: 'Updating...' })})</span>
            )}
          </div>

          {aiRecommendation.maxRecommendedAmount > 0 ? (
            <>
              <div className="mb-3 sm:mb-4 space-y-2">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {t('eligibleForLoan', { defaultValue: 'Based on your saving history, you are eligible for a loan of' })}
                  <span className="font-bold text-primary-600 dark:text-primary-400 ml-1">
                    RWF {(aiRecommendation.maxRecommendedAmount || 0).toLocaleString()}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('confidence', { defaultValue: 'Confidence' })}:</span>
                    <span className={`font-semibold ${aiRecommendation.confidence === 'High' ? 'text-green-600 dark:text-green-400' :
                        aiRecommendation.confidence === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                      {aiRecommendation.confidence}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('creditScore', { defaultValue: 'Credit Score' })}:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{aiRecommendation.creditScore || 0}/100</span>
                  </div>
                  {aiRecommendation.riskCategory && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 dark:text-gray-400">{t('riskCategory', { defaultValue: 'Risk' })}:</span>
                      <span className={`font-semibold ${aiRecommendation.riskCategory === 'Low' ? 'text-green-600 dark:text-green-400' :
                          aiRecommendation.riskCategory === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                        }`}>
                        {aiRecommendation.riskCategory}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('yourSavings', { defaultValue: 'Your Savings' })}:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{(aiRecommendation.savings || 0).toLocaleString()} RWF</span>
                  </div>
                </div>
                {aiRecommendation.message && (
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    {aiRecommendation.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowLoanModal(true)}
                  className="btn-primary text-xs sm:text-sm w-full sm:w-auto"
                >
                  {tCommon('getStarted')}
                </button>
                <button
                  onClick={() => navigate('/member/loans')}
                  className="btn-secondary text-xs sm:text-sm w-full sm:w-auto"
                >
                  {t('viewAll')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-2">
                {aiRecommendation.message || t('improveCreditScoreSavings', { defaultValue: 'Please improve your credit score and savings to qualify for a loan.' })}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">{t('creditScore', { defaultValue: 'Credit Score' })}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{aiRecommendation.creditScore || 0}/100</span>
                </div>
                {aiRecommendation.riskCategory && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 dark:text-gray-400">{t('riskCategory', { defaultValue: 'Risk' })}:</span>
                    <span className={`font-semibold ${aiRecommendation.riskCategory === 'Low' ? 'text-green-600 dark:text-green-400' :
                        aiRecommendation.riskCategory === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                      }`}>
                      {aiRecommendation.riskCategory}
                    </span>
                  </div>
                )}
                {aiRecommendation.explanation && (
                  <div className="mt-2 text-xs sm:text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    {aiRecommendation.explanation}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">{t('yourSavings', { defaultValue: 'Your Savings' })}:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{(aiRecommendation.savings || 0).toLocaleString()} RWF</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/member/savings')}
                  className="btn-primary text-xs sm:text-sm w-full sm:w-auto"
                >
                  {t('mySavings')}
                </button>
                <button
                  onClick={() => navigate('/member/loans')}
                  className="btn-secondary text-xs sm:text-sm w-full sm:w-auto"
                >
                  {t('viewAll')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="card">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">{t('recentContributions', { defaultValue: 'Recent Contributions' })}</h3>
            <div className="space-y-3">
              {statsLoading ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">{tCommon('loading')}</div>
              ) : transactions.filter(t => t.type === 'contribution').length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">{t('noContributions', { defaultValue: 'No contributions yet' })}</div>
              ) : (
                transactions
                  .filter(t => t.type === 'contribution')
                  .slice(0, 5)
                  .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <DollarSign className="text-green-600 dark:text-green-400" size={14} style={{ width: '14px', height: '14px' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-white">{t('contribution', { defaultValue: 'Contribution' })}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm flex-shrink-0">+{transaction.amount.toLocaleString()} RWF</span>
                    </div>
                  ))
              )}
            </div>
            <button
              onClick={() => navigate('/member/savings')}
              className="w-full mt-3 sm:mt-4 btn-secondary text-xs sm:text-sm"
            >
              View All Contributions
            </button>
          </div>

          <div className="card">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">{t('loanStatus', { defaultValue: 'Loan Status' })}</h3>
            <div className="space-y-2 sm:space-y-3">
              {statsLoading ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">{tCommon('loading')}</div>
              ) : activeLoans.length === 0 && !nextPayment ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">{t('noActiveLoans', { defaultValue: 'No active loans' })}</div>
              ) : (
                <>
                  {/* Active Loan */}
                  {activeLoans.length > 0 && activeLoans[0] && (() => {
                    const loan = activeLoans[0]
                    const startDate = loan.startDate ? new Date(loan.startDate) : null
                    const monthsActive = startDate ? Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30)) : 0
                    return (
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="text-purple-600 dark:text-purple-400" size={14} style={{ width: '14px', height: '14px' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-white truncate">{loan.purpose}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {loan.status === 'active' ? t('active', { defaultValue: 'Active' }) :
                                loan.status === 'approved' ? t('approved', { defaultValue: 'Approved' }) :
                                  loan.status === 'disbursed' ? t('disbursed', { defaultValue: 'Disbursed' }) : loan.status}
                              {monthsActive > 0 && ` • ${monthsActive} ${t('months', { defaultValue: 'months' })}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-xs sm:text-sm flex-shrink-0">{loan.amount.toLocaleString()} RWF</span>
                      </div>
                    )
                  })()}

                  {/* Next Payment */}
                  {nextPayment && (
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="text-green-600 dark:text-green-400" size={14} style={{ width: '14px', height: '14px' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-gray-800 dark:text-white">{t('nextPayment', { defaultValue: 'Next Payment' })}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {nextPayment.date ? new Date(nextPayment.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : t('noDate', { defaultValue: 'No date set' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm flex-shrink-0">{nextPayment.amount.toLocaleString()} RWF</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/member/loans')}
              className="w-full mt-3 sm:mt-4 btn-secondary text-xs sm:text-sm"
            >
              {t('manageLoans', { defaultValue: 'Manage Loans' })}
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


