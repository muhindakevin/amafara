import { useState, useEffect } from 'react'
import { X, TrendingUp, DollarSign, Calendar, AlertCircle, User, Search, ChevronRight, ChevronLeft, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../utils/api'

function LoanRequestModal({ onClose, onConfirm }) {
  const { t: tForms } = useTranslation('forms')
  const { t: tCommon } = useTranslation('common')
  const { t: tDashboard } = useTranslation('dashboard')
  const [currentStep, setCurrentStep] = useState(1)
  const [groupMembers, setGroupMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGuarantor, setSelectedGuarantor] = useState(null)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '3',
    guarantorId: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorNationalId: '',
    guarantorRelationship: '',
  })

  const [aiRecommendation, setAiRecommendation] = useState({
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
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)

  // Fetch AI recommendation and group members when modal opens
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingMembers(true)
        setLoadingRecommendation(true)
        
        // Load AI recommendation
        try {
          const recRes = await api.get('/members/loan-recommendation')
          if (recRes.data?.success && recRes.data.data) {
            setAiRecommendation({
              maxRecommendedAmount: recRes.data.data.maxRecommendedAmount || 0,
              confidence: recRes.data.data.confidence || 'Low',
              interestRate: recRes.data.data.interestRate || 5,
              creditScore: recRes.data.data.creditScore || 0,
              message: recRes.data.data.message || '',
              savings: recRes.data.data.savings || 0,
              monthlyPayment: recRes.data.data.monthlyPayment || 0,
              riskCategory: recRes.data.data.riskCategory || null,
              explanation: recRes.data.data.explanation || null
            })
          } else {
            // Set defaults if API fails
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
          console.error('Failed to load recommendation:', error)
          // Set defaults on error
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

        // Load group members - fetch ALL active members from the group using dedicated endpoint
        const meRes = await api.get('/auth/me')
        const groupId = meRes.data?.data?.groupId
        if (!groupId) {
          console.error('[LoanRequestModal] No groupId found for user')
          setGroupMembers([])
          return
        }

        // Fetch ALL group members (including all roles) for guarantor selection
        try {
          // First try the group endpoint to get all members
          const groupRes = await api.get(`/groups/${groupId}`)
          if (groupRes.data?.success) {
            const allMembers = groupRes.data.data.members || []
            const currentUserId = meRes.data?.data?.id
            
            // Include all active members (Member, Secretary, Cashier) but exclude current user and Group Admin
            const members = allMembers
              .filter(m => {
                const isActive = (m.status || 'active').toLowerCase() === 'active'
                const isNotCurrentUser = m.id !== currentUserId
                const isNotGroupAdmin = m.role !== 'Group Admin'
                return isActive && isNotCurrentUser && isNotGroupAdmin
              })
              .map(m => ({
                id: m.id,
                name: m.name || '',
                phone: m.phone || '',
                nationalId: m.nationalId || '',
                email: m.email || '',
                role: m.role || 'Member',
              }))
            
            console.log('[LoanRequestModal] Loaded all group members for guarantor selection:', members.length)
            setGroupMembers(members)
            
            if (members.length === 0) {
              console.warn('[LoanRequestModal] No eligible members found for guarantor selection')
            }
          } else {
            // Fallback: try the members endpoint
            try {
              const membersRes = await api.get(`/groups/${groupId}/members`)
              if (membersRes.data?.success) {
                const members = membersRes.data.data || []
                const currentUserId = meRes.data?.data?.id
                
                // Filter out current user
                const filteredMembers = members
                  .filter(m => m.id !== currentUserId && (m.status || 'active').toLowerCase() === 'active')
                  .map(m => ({
                    id: m.id,
                    name: m.name || '',
                    phone: m.phone || '',
                    nationalId: m.nationalId || '',
                    email: m.email || '',
                    role: m.role || 'Member',
                  }))
                
                console.log('[LoanRequestModal] Fallback: Loaded members from members endpoint:', filteredMembers.length)
                setGroupMembers(filteredMembers)
              } else {
                setGroupMembers([])
              }
            } catch (fallbackError) {
              console.error('[LoanRequestModal] Fallback also failed:', fallbackError)
              setGroupMembers([])
            }
          }
        } catch (membersError) {
          console.error('[LoanRequestModal] Error fetching members:', membersError)
          setGroupMembers([])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoadingMembers(false)
        setLoadingRecommendation(false)
      }
    }
    loadData()
  }, [])

  // Update recommendation when amount or duration changes
  useEffect(() => {
    if (!formData.amount || formData.amount === '0') return

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingRecommendation(true)
        const recRes = await api.get(`/members/loan-recommendation?amount=${formData.amount}&duration=${formData.duration}`)
        if (recRes.data?.success && recRes.data.data) {
          setAiRecommendation({
            maxRecommendedAmount: recRes.data.data.maxRecommendedAmount || 0,
            confidence: recRes.data.data.confidence || 'Low',
            interestRate: recRes.data.data.interestRate || 5,
            creditScore: recRes.data.data.creditScore || 0,
            message: recRes.data.data.message || '',
            savings: recRes.data.data.savings || 0,
            monthlyPayment: recRes.data.data.monthlyPayment || 0,
            riskCategory: recRes.data.data.riskCategory || null,
            explanation: recRes.data.data.explanation || null
          })
        } else {
          // Keep existing values if update fails
          console.warn('Recommendation update returned no data')
        }
      } catch (error) {
        console.error('Failed to update recommendation:', error)
        // Keep existing values on error
      } finally {
        setLoadingRecommendation(false)
      }
    }, 500) // Debounce 500ms

    return () => clearTimeout(timeoutId)
  }, [formData.amount, formData.duration])

  const filteredMembers = groupMembers.filter(member => {
    const search = searchTerm.toLowerCase()
    return (
      member.name.toLowerCase().includes(search) ||
      member.phone.includes(search) ||
      member.nationalId.includes(search)
    )
  })

  const handleGuarantorSelect = (member) => {
    setSelectedGuarantor(member)
    setFormData({
      ...formData,
      guarantorId: member.id,
      guarantorName: member.name,
      guarantorPhone: member.phone,
      guarantorNationalId: member.nationalId,
    })
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate loan details
      if (!formData.amount || !formData.purpose || !formData.duration) {
        alert(tForms('fillLoanDetails', { defaultValue: 'Please fill in all loan details' }))
        return
      }
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate guarantor information
    if (!formData.guarantorId || !formData.guarantorName || !formData.guarantorPhone || !formData.guarantorNationalId) {
      alert(tForms('selectGuarantor', { defaultValue: 'Please select a guarantor' }))
      return
    }

    // Validate loan amount
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      alert(tForms('enterValidLoanAmount', { defaultValue: 'Please enter a valid loan amount' }))
      return
    }

    // Validate purpose
    if (!formData.purpose || formData.purpose.trim().length < 10) {
      alert(tForms('provideDetailedPurpose', { defaultValue: 'Please provide a detailed purpose for the loan (at least 10 characters)' }))
      return
    }

    setSubmitting(true)
    try {
      await onConfirm(formData)
    } catch (error) {
      console.error('Loan submission error:', error)
      alert(error.response?.data?.message || 'Failed to submit loan request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{tDashboard('requestNewLoan')}</h2>
            <div className="flex items-center gap-1 sm:gap-2 mt-2 flex-wrap">
              <div className={`flex items-center gap-1 ${currentStep >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  1
                </div>
                <span className="text-xs sm:text-sm dark:text-gray-300">{tForms('loanDetails', { defaultValue: 'Loan Details' })}</span>
              </div>
              <ChevronRight className="text-gray-400 flex-shrink-0" size={14} style={{ width: '14px', height: '14px' }} />
              <div className={`flex items-center gap-1 ${currentStep >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  2
                </div>
                <span className="text-xs sm:text-sm dark:text-gray-300">{tForms('guarantor', { defaultValue: 'Guarantor' })}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Step 1: Loan Details */}
          {currentStep === 1 && (
            <>
              {/* AI Recommendation */}
              <div className={`bg-gradient-to-r ${aiRecommendation.maxRecommendedAmount > 0 ? 'from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-700' : 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-700'} border-2 rounded-lg sm:rounded-xl p-3 sm:p-4`}>
                <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                  <TrendingUp className={aiRecommendation.maxRecommendedAmount > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'} size={18} style={{ width: '18px', height: '18px' }} />
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">{tDashboard('aiRecommendation', { defaultValue: 'AI Recommendation' })}</h3>
                  {loadingRecommendation && <span className="text-xs text-gray-500 dark:text-gray-400">({tDashboard('updating', { defaultValue: 'Updating...' })})</span>}
                </div>
                {aiRecommendation.maxRecommendedAmount > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{tDashboard('maxRecommendedAmount', { defaultValue: 'Max Recommended Amount' })}</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {(aiRecommendation.maxRecommendedAmount || 0).toLocaleString()} RWF
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{tDashboard('confidence', { defaultValue: 'Confidence' })}</p>
                        <p className={`text-lg sm:text-xl font-bold ${
                          aiRecommendation.confidence === 'High' ? 'text-green-600 dark:text-green-400' :
                          aiRecommendation.confidence === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {aiRecommendation.confidence}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p><strong>{tDashboard('yourSavings', { defaultValue: 'Your Savings' })}:</strong> {(aiRecommendation.savings || 0).toLocaleString()} RWF</p>
                      <p><strong>{tDashboard('creditScore', { defaultValue: 'Credit Score' })}:</strong> {aiRecommendation.creditScore || 0}/100</p>
                      {aiRecommendation.riskCategory && (
                        <p>
                          <strong>{tDashboard('riskCategory', { defaultValue: 'Risk Category' })}:</strong>{' '}
                          <span className={`font-semibold ${
                            aiRecommendation.riskCategory === 'Low' ? 'text-green-600 dark:text-green-400' :
                            aiRecommendation.riskCategory === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {aiRecommendation.riskCategory}
                          </span>
                        </p>
                      )}
                      {aiRecommendation.explanation && (
                        <p className="text-blue-700 dark:text-blue-400 mt-2 text-xs leading-relaxed">
                          {aiRecommendation.explanation}
                        </p>
                      )}
                      {!aiRecommendation.explanation && aiRecommendation.message && (
                        <p className="text-blue-700 dark:text-blue-400 mt-2">{aiRecommendation.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-700 dark:text-red-400 font-semibold">{tDashboard('loanNotRecommended', { defaultValue: 'Loan Not Recommended' })}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{aiRecommendation.message || tDashboard('improveCreditScoreSavings', { defaultValue: 'Please improve your credit score and savings to qualify for a loan.' })}</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      <p><strong>{tDashboard('yourSavings', { defaultValue: 'Your Savings' })}:</strong> {(aiRecommendation.savings || 0).toLocaleString()} RWF</p>
                      <p><strong>{tDashboard('creditScore', { defaultValue: 'Credit Score' })}:</strong> {aiRecommendation.creditScore || 0}/100</p>
                      {aiRecommendation.riskCategory && (
                        <p>
                          <strong>{tDashboard('riskCategory', { defaultValue: 'Risk Category' })}:</strong>{' '}
                          <span className={`font-semibold ${
                            aiRecommendation.riskCategory === 'Low' ? 'text-green-600 dark:text-green-400' :
                            aiRecommendation.riskCategory === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {aiRecommendation.riskCategory}
                          </span>
                        </p>
                      )}
                      {aiRecommendation.explanation && (
                        <p className="text-blue-700 dark:text-blue-400 mt-2 text-xs leading-relaxed">
                          {aiRecommendation.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {tForms('loanAmountRWF', { defaultValue: 'Loan Amount (RWF)' })}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} style={{ width: '18px', height: '18px' }} />
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder={tForms('enterAmount', { defaultValue: 'Enter amount' })}
                      className="input-field pl-10 sm:pl-12"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tForms('basedOnSavingsCreditScore', { defaultValue: 'Based on your savings and credit score' })}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {tForms('purposeOfLoan', { defaultValue: 'Purpose of Loan' })}
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder={tForms('describeLoanPurpose', { defaultValue: 'Describe why you need this loan...' })}
                    className="input-field h-24 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {tForms('repaymentDuration', { defaultValue: 'Repayment Duration' })}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} style={{ width: '18px', height: '18px' }} />
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="input-field pl-10 sm:pl-12"
                      required
                    >
                      <option value="3">{tForms('months_3', { defaultValue: '3 Months' })}</option>
                      <option value="6">{tForms('months_6', { defaultValue: '6 Months' })}</option>
                      <option value="12">{tForms('months_12', { defaultValue: '12 Months' })}</option>
                    </select>
                  </div>
                </div>

                {/* Loan Summary */}
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{tDashboard('loanSummary', { defaultValue: 'Loan Summary' })}</p>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{tDashboard('principal', { defaultValue: 'Principal' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{parseFloat(formData.amount || 0).toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{tDashboard('interestRate', { defaultValue: 'Interest Rate' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{(aiRecommendation.interestRate || 5).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{tForms('duration', { defaultValue: 'Duration' })}:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{formData.duration} {tForms('months', { defaultValue: 'Months' })}</span>
                    </div>
                    {(() => {
                      const principal = parseFloat(formData.amount || 0)
                      const months = parseInt(formData.duration || 3)
                      const interestRate = aiRecommendation.interestRate || 5
                      const totalAmount = principal * (1 + (interestRate / 100))
                      const monthlyPayment = totalAmount / months
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{tDashboard('totalAmount', { defaultValue: 'Total Amount' })}:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{Math.round(totalAmount).toLocaleString()} RWF</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 flex justify-between">
                            <span className="text-gray-800 dark:text-gray-200 font-bold">{tDashboard('monthlyPayment', { defaultValue: 'Monthly Payment' })}:</span>
                            <span className="text-primary-600 dark:text-primary-400 font-bold">
                              {loadingRecommendation ? tDashboard('calculating', { defaultValue: 'Calculating...' }) : `${Math.round(monthlyPayment).toLocaleString()} RWF`}
                            </span>
                          </div>
                          {formData.amount && parseFloat(formData.amount) > aiRecommendation.maxRecommendedAmount && aiRecommendation.maxRecommendedAmount > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-800 dark:text-yellow-300">
                              ⚠️ {tDashboard('requestedAmountExceedsRecommended', { amount: (aiRecommendation.maxRecommendedAmount || 0).toLocaleString(), defaultValue: `Requested amount exceeds recommended maximum of ${(aiRecommendation.maxRecommendedAmount || 0).toLocaleString()} RWF` })}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1 text-sm"
                  >
                    {tCommon('cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                  >
                    {tForms('nextSelectGuarantor', { defaultValue: 'Next: Select Guarantor' })}
                    <ChevronRight size={16} style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 2: Guarantor Selection */}
          {currentStep === 2 && (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-blue-600 dark:text-blue-400" size={20} style={{ width: '20px', height: '20px' }} />
                  <h3 className="font-bold text-gray-800 dark:text-white">{tDashboard('selectGuarantor', { defaultValue: 'Select Guarantor' })}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tDashboard('selectGuarantorDescription', { defaultValue: 'Please select a guarantor from your group members. The guarantor must be an active member of your group.' })}
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} style={{ width: '18px', height: '18px' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tForms('searchByNamePhoneNationalId', { defaultValue: 'Search by name, phone, or national ID...' })}
                  className="input-field pl-10 sm:pl-12"
                />
              </div>

              {/* Show count of members */}
              {!loadingMembers && groupMembers.length > 0 && (
                <div className={`p-3 rounded-lg border-2 ${
                  searchTerm 
                    ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' 
                    : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Users className={`${searchTerm ? 'text-gray-600 dark:text-gray-400' : 'text-primary-600 dark:text-primary-400'}`} size={18} />
                    {searchTerm ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {tDashboard('showingResults', { count: filteredMembers.length, total: groupMembers.length, defaultValue: `Showing ${filteredMembers.length} of ${groupMembers.length} members` })}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                        {tDashboard('allGroupMembers', { count: groupMembers.length, defaultValue: `All ${groupMembers.length} Group Members Available - Click to Select` })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2">
                {loadingMembers ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">{tCommon('loading', { defaultValue: 'Loading members...' })}</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p>{searchTerm ? tDashboard('noMembersMatchSearch', { defaultValue: 'No members match your search' }) : tDashboard('noMembersFound', { defaultValue: 'No members found' })}</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleGuarantorSelect(member)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGuarantor?.id === member.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                            selectedGuarantor?.id === member.id ? 'bg-primary-600 ring-2 ring-primary-300' : 'bg-gradient-to-br from-primary-400 to-primary-600'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{member.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">ID: {member.nationalId}</p>
                          </div>
                        </div>
                        {selectedGuarantor?.id === member.id && (
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center shadow-md">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Relationship Field */}
              {selectedGuarantor && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {tForms('relationshipToGuarantor', { defaultValue: 'Relationship to Guarantor (Optional)' })}
                  </label>
                  <input
                    type="text"
                    value={formData.guarantorRelationship}
                    onChange={(e) => setFormData({ ...formData, guarantorRelationship: e.target.value })}
                    placeholder={tForms('guarantorRelationshipPlaceholder', { defaultValue: 'e.g., Family member, Friend, Colleague' })}
                    className="input-field"
                  />
                </div>
              )}

              {/* Selected Guarantor Info */}
              {selectedGuarantor && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-green-600 dark:text-green-400" size={20} style={{ width: '20px', height: '20px' }} />
                    <h4 className="font-semibold text-gray-800 dark:text-white">{tDashboard('selectedGuarantor', { defaultValue: 'Selected Guarantor' })}</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold text-gray-700 dark:text-gray-300">{tCommon('name', { defaultValue: 'Name' })}:</span> <span className="text-gray-600 dark:text-gray-400">{selectedGuarantor.name}</span></p>
                    <p><span className="font-semibold text-gray-700 dark:text-gray-300">{tCommon('phone', { defaultValue: 'Phone' })}:</span> <span className="text-gray-600 dark:text-gray-400">{selectedGuarantor.phone}</span></p>
                    <p><span className="font-semibold text-gray-700 dark:text-gray-300">{tForms('nationalId', { defaultValue: 'National ID' })}:</span> <span className="text-gray-600 dark:text-gray-400">{selectedGuarantor.nationalId}</span></p>
                    {formData.guarantorRelationship && (
                      <p><span className="font-semibold text-gray-700 dark:text-gray-300">{tForms('relationship', { defaultValue: 'Relationship' })}:</span> <span className="text-gray-600 dark:text-gray-400">{formData.guarantorRelationship}</span></p>
                    )}
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} style={{ width: '20px', height: '20px' }} />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {tDashboard('loanRequestReviewInfo', { defaultValue: 'Your loan request will be reviewed by the Group Admin and Cashier. You will be notified once a decision is made.' })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm order-2 sm:order-1"
                >
                  <ChevronLeft size={16} style={{ width: '16px', height: '16px' }} />
                  {tCommon('back', { defaultValue: 'Back' })}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1 text-sm order-3 sm:order-2"
                >
                  {tCommon('cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary flex-1 sm:flex-[2] flex items-center justify-center gap-2 text-sm order-1 sm:order-3"
                  disabled={!selectedGuarantor || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {tForms('submitting', { defaultValue: 'Submitting...' })}
                    </>
                  ) : (
                    tForms('submitRequest', { defaultValue: 'Submit Request' })
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoanRequestModal


