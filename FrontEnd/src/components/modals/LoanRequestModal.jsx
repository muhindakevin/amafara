import { useState, useEffect } from 'react'
import { X, TrendingUp, DollarSign, Calendar, AlertCircle, User, Search, ChevronRight, ChevronLeft, Users } from 'lucide-react'
import api from '../../utils/api'

function LoanRequestModal({ onClose, onConfirm }) {
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
    monthlyPayment: 0
  })
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)

  // Fetch AI recommendation and group members when modal opens
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingMembers(true)
        setLoadingRecommendation(true)
        
        // Load AI recommendation
        const recRes = await api.get('/members/loan-recommendation')
        if (recRes.data?.success) {
          setAiRecommendation(recRes.data.data)
        }

        // Load group members
        const meRes = await api.get('/auth/me')
        const currentUserId = meRes.data?.data?.id
        const groupId = meRes.data?.data?.groupId
        if (!groupId) return

        const groupRes = await api.get(`/groups/${groupId}`)
        if (groupRes.data?.success) {
          const members = (groupRes.data.data.members || [])
            .filter(m => m.role === 'Member' && m.status === 'active' && m.id !== currentUserId)
            .map(m => ({
              id: m.id,
              name: m.name,
              phone: m.phone || '',
              nationalId: m.nationalId || '',
              email: m.email || '',
            }))
          setGroupMembers(members)
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
        if (recRes.data?.success) {
          setAiRecommendation(recRes.data.data)
        }
      } catch (error) {
        console.error('Failed to update recommendation:', error)
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
        alert('Please fill in all loan details')
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
      alert('Please select a guarantor')
      return
    }

    // Validate loan amount
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid loan amount')
      return
    }

    // Validate purpose
    if (!formData.purpose || formData.purpose.trim().length < 10) {
      alert('Please provide a detailed purpose for the loan (at least 10 characters)')
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Request a Loan</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="text-sm">Loan Details</span>
              </div>
              <ChevronRight className="text-gray-400" size={16} />
              <div className={`flex items-center gap-1 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="text-sm">Guarantor</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Loan Details */}
          {currentStep === 1 && (
            <>
              {/* AI Recommendation */}
              <div className={`bg-gradient-to-r ${aiRecommendation.maxRecommendedAmount > 0 ? 'from-primary-50 to-blue-50 border-primary-200' : 'from-red-50 to-orange-50 border-red-200'} border-2 rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={aiRecommendation.maxRecommendedAmount > 0 ? 'text-primary-600' : 'text-red-600'} size={20} />
                  <h3 className="font-bold text-gray-800">AI Recommendation</h3>
                  {loadingRecommendation && <span className="text-xs text-gray-500">(Updating...)</span>}
                </div>
                {aiRecommendation.maxRecommendedAmount > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Max Recommended Amount</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {aiRecommendation.maxRecommendedAmount.toLocaleString()} RWF
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className={`text-xl font-bold ${
                          aiRecommendation.confidence === 'High' ? 'text-green-600' :
                          aiRecommendation.confidence === 'Medium' ? 'text-yellow-600' : 'text-orange-600'
                        }`}>
                          {aiRecommendation.confidence}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>Your Savings:</strong> {aiRecommendation.savings.toLocaleString()} RWF</p>
                      <p><strong>Credit Score:</strong> {aiRecommendation.creditScore}/1000</p>
                      {aiRecommendation.message && (
                        <p className="text-blue-700 mt-2">{aiRecommendation.message}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-700 font-semibold">Loan Not Recommended</p>
                    <p className="text-sm text-gray-600">{aiRecommendation.message || 'Please improve your credit score and savings to qualify for a loan.'}</p>
                    <div className="text-xs text-gray-600 mt-2">
                      <p><strong>Your Savings:</strong> {aiRecommendation.savings.toLocaleString()} RWF</p>
                      <p><strong>Credit Score:</strong> {aiRecommendation.creditScore}/1000</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loan Amount (RWF)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Based on your savings and credit score</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purpose of Loan
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Describe why you need this loan..."
                    className="input-field h-24 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Repayment Duration
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="input-field pl-12"
                      required
                    >
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>
                </div>

                {/* Loan Summary */}
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Loan Summary</p>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal:</span>
                      <span className="font-semibold">{parseFloat(formData.amount || 0).toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-semibold">{aiRecommendation.interestRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold">{formData.duration} Months</span>
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
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold">{Math.round(totalAmount).toLocaleString()} RWF</span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                            <span className="text-gray-800 font-bold">Monthly Payment:</span>
                            <span className="text-primary-600 font-bold">
                              {loadingRecommendation ? 'Calculating...' : `${Math.round(monthlyPayment).toLocaleString()} RWF`}
                            </span>
                          </div>
                          {formData.amount && parseFloat(formData.amount) > aiRecommendation.maxRecommendedAmount && aiRecommendation.maxRecommendedAmount > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                              ⚠️ Requested amount exceeds recommended maximum of {aiRecommendation.maxRecommendedAmount.toLocaleString()} RWF
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    Next: Select Guarantor
                    <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 2: Guarantor Selection */}
          {currentStep === 2 && (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-blue-600" size={20} />
                  <h3 className="font-bold text-gray-800">Select Guarantor</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Please select a guarantor from your group members. The guarantor must be an active member of your group.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, or national ID..."
                  className="input-field pl-12"
                />
              </div>

              {/* Members List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {loadingMembers ? (
                  <div className="text-center py-8 text-gray-500">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No members found</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleGuarantorSelect(member)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGuarantor?.id === member.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            selectedGuarantor?.id === member.id ? 'bg-primary-600' : 'bg-gray-400'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.phone}</p>
                            <p className="text-xs text-gray-500">ID: {member.nationalId}</p>
                          </div>
                        </div>
                        {selectedGuarantor?.id === member.id && (
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Relationship to Guarantor (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.guarantorRelationship}
                    onChange={(e) => setFormData({ ...formData, guarantorRelationship: e.target.value })}
                    placeholder="e.g., Family member, Friend, Colleague"
                    className="input-field"
                  />
                </div>
              )}

              {/* Selected Guarantor Info */}
              {selectedGuarantor && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-green-600" size={20} />
                    <h4 className="font-semibold text-gray-800">Selected Guarantor</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">Name:</span> {selectedGuarantor.name}</p>
                    <p><span className="font-semibold">Phone:</span> {selectedGuarantor.phone}</p>
                    <p><span className="font-semibold">National ID:</span> {selectedGuarantor.nationalId}</p>
                    {formData.guarantorRelationship && (
                      <p><span className="font-semibold">Relationship:</span> {formData.guarantorRelationship}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <p className="text-sm text-blue-800">
                  Your loan request will be reviewed by the Group Admin and Cashier. You'll be notified once a decision is made.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!selectedGuarantor || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
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


