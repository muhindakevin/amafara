import { useEffect, useState } from 'react'
import { DollarSign, Plus, Clock, CheckCircle, AlertCircle, Download, Filter, Search, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import LoanRequestModal from '../components/modals/LoanRequestModal'
import LoanPaymentModal from '../components/modals/LoanPaymentModal'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function MemberLoans() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)

  const [loanData, setLoanData] = useState({ totalBorrowed: 0, activeLoans: 0, totalRepaid: 0, creditScore: 0, eligibleAmount: 0 })

  const [activeLoans, setActiveLoans] = useState([])

  const [loanHistory, setLoanHistory] = useState([])

  const refreshLoans = async () => {
    try {
      const [dashboardRes, loansRes] = await Promise.all([
        api.get('/members/dashboard'),
        api.get('/loans/member')
      ])
      if (dashboardRes.data?.success) {
        const s = dashboardRes.data.data.stats
        setLoanData({
          totalBorrowed: Number(s.totalBorrowed || 0),
          activeLoans: Number(s.activeLoans || 0),
          totalRepaid: Number(s.totalRepaid || 0),
          creditScore: Number(s.creditScore || 0),
          eligibleAmount: Number(s.eligibleAmount || 0)
        })
      }
      if (loansRes.data?.success) {
        const list = loansRes.data.data || []
        // Include 'approved' status in active loans so members can see approved loans
        const active = list.filter(l => ['active','approved','disbursed', 'pending'].includes(l.status))
        const history = list.filter(l => l.status === 'completed' || l.status === 'rejected')
        setActiveLoans(active.map(l => ({
          id: l.id,
          amount: Number(l.amount || 0),
          purpose: l.purpose || 'Loan',
          status: l.status, // This will show 'approved' status
          monthlyPayment: Number(l.monthlyPayment || 0),
          remainingBalance: Number(l.remainingAmount || l.remainingBalance || 0),
          remainingAmount: Number(l.remainingAmount || l.remainingBalance || 0),
          paidAmount: Number(l.paidAmount || 0),
          nextPayment: l.nextPaymentDate ? new Date(l.nextPaymentDate).toLocaleDateString() : '',
          interestRate: l.interestRate ? `${l.interestRate}%` : '-',
          duration: l.duration ? `${l.duration} months` : '-',
          startDate: l.requestDate || l.createdAt || '',
          approvalDate: l.approvalDate || ''
        })))
        setLoanHistory(history.map(l => ({
          id: l.id,
          amount: Number(l.amount || 0),
          purpose: l.purpose || 'Loan',
          status: l.status,
          totalRepaid: Number(l.paidAmount || l.totalRepaid || 0),
          completedDate: l.updatedAt || l.completedDate || '',
          interestRate: l.interestRate ? `${l.interestRate}%` : '-',
          duration: l.duration ? `${l.duration} months` : '-'
        })))
      }
    } catch (e) {
      console.error('Error refreshing loans:', e)
    }
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      await refreshLoans()
    }
    load()
    
    // Set up periodic refresh every 30 seconds to check for loan status updates
    const refreshInterval = setInterval(() => {
      if (mounted) {
        refreshLoans()
      }
    }, 30000) // Refresh every 30 seconds
    
    return () => { 
      mounted = false
      clearInterval(refreshInterval)
    }
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700'
      case 'approved': return 'bg-green-100 text-green-700'
      case 'disbursed': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleLoanRequest = async (data) => {
    try {
      const response = await api.post('/loans/request', {
        amount: parseFloat(data.amount),
        purpose: data.purpose.trim(),
        duration: parseInt(data.duration),
        guarantorId: parseInt(data.guarantorId),
        guarantorName: data.guarantorName,
        guarantorPhone: data.guarantorPhone,
        guarantorNationalId: data.guarantorNationalId,
        guarantorRelationship: data.guarantorRelationship || null
      })
      
      if (response.data?.success) {
        alert(t('loanRequestSubmitted', { defaultValue: 'Loan request submitted successfully! Group Admin, Secretary, and Cashier have been notified and will review your request. All group members have been informed.' }))
        setShowLoanModal(false)
        
        // Refresh loans data
        await refreshLoans()
      }
    } catch (e) {
      const errorMessage = e.response?.data?.message || t('failedToSubmitRequest', { defaultValue: 'Failed to submit request' })
      alert(errorMessage)
      throw e // Re-throw so modal can handle it
    }
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('myLoans')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageLoanApplications', { defaultValue: 'Manage your loan applications and repayments' })}</p>
          </div>
          <button
            onClick={() => setShowLoanModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> {t('requestNewLoan', { defaultValue: 'Request New Loan' })}
          </button>
        </div>

        {/* Loan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalBorrowed', { defaultValue: 'Total Borrowed' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loanData.totalBorrowed.toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeLoans')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loanData.activeLoans}
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalRepaid', { defaultValue: 'Total Repaid' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loanData.totalRepaid.toLocaleString()} RWF
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('creditScore')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loanData.creditScore}/100
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            🤖 {t('aiLoanRecommendation', { defaultValue: 'AI Loan Recommendation' })}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t('eligibleForLoanUpTo', { defaultValue: "Based on your excellent payment history and credit score, you're eligible for a loan of up to" })}{' '}
            <span className="font-bold text-primary-600">{loanData.eligibleAmount.toLocaleString()} RWF</span>
          </p>
          <button
            onClick={() => setShowLoanModal(true)}
            className="btn-primary text-sm"
          >
            {t('applyForRecommendedLoan', { defaultValue: 'Apply for Recommended Loan' })}
          </button>
        </div>

        {/* Active Loans */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('activeLoans')}</h2>
          {activeLoans.length > 0 ? (
            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{loan.purpose}</h3>
                      <p className="text-sm text-gray-600">{loan.amount.toLocaleString()} RWF • {loan.duration}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('monthlyPayment')}</p>
                      <p className="font-semibold dark:text-white">{loan.monthlyPayment.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('remainingBalance', { defaultValue: 'Remaining Balance' })}</p>
                      <p className={`font-semibold ${loan.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {loan.remainingBalance.toLocaleString()} RWF
                        {loan.remainingBalance <= 0 && ` (${tCommon('paid', { defaultValue: 'Paid' })})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('nextPayment', { defaultValue: 'Next Payment' })}</p>
                      <p className="font-semibold dark:text-white">{loan.nextPayment || tCommon('nA', { defaultValue: 'N/A' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('interestRate', { defaultValue: 'Interest Rate' })}</p>
                      <p className="font-semibold dark:text-white">{loan.interestRate}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    {loan.status === 'active' || loan.status === 'disbursed' || loan.status === 'approved' ? (
                      <button
                        onClick={() => {
                          setSelectedLoan(loan)
                          setShowPaymentModal(true)
                        }}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        {t('makePayment', { defaultValue: 'Make Payment' })}
                      </button>
                    ) : loan.status === 'completed' ? (
                      <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                        {t('fullyPaid', { defaultValue: 'Fully Paid' })}
                      </span>
                    ) : null}
                    <button className="btn-secondary text-sm px-4 py-2">
                      {tCommon('viewDetails', { defaultValue: 'View Details' })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="mx-auto mb-4" size={48} />
              <p className="dark:text-gray-400">{t('noActiveLoans', { defaultValue: 'No active loans' })}</p>
            </div>
          )}
        </div>

        {/* Loan History */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('loanHistory', { defaultValue: 'Loan History' })}</h2>
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
            {loanHistory.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{loan.purpose}</p>
                    <p className="text-sm text-gray-600">
                      {loan.amount.toLocaleString()} RWF • Completed {loan.completedDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loan Request Modal */}
      {showLoanModal && (
        <LoanRequestModal
          onClose={() => setShowLoanModal(false)}
          onConfirm={handleLoanRequest}
        />
      )}

      {/* Loan Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <LoanPaymentModal
          loan={selectedLoan}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedLoan(null)
          }}
          onSuccess={() => {
            refreshLoans()
          }}
        />
      )}
    </Layout>
  )
}

export default MemberLoans


