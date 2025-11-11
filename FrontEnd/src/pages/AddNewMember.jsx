import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, User, Phone, Mail, Calendar, MapPin, Briefcase, Save, X, Lock } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function AddNewMember() {
  const navigate = useNavigate()
  const [memberData, setMemberData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationalId: '',
    dateOfBirth: '',
    address: '',
    occupation: '',
    emergencyContact: '',
    emergencyPhone: '',
    relationship: '',
    monthlyIncome: '',
    bankAccount: '',
    bankName: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorAddress: '',
    password: '',
    confirmPassword: ''
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupId, setGroupId] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadGroupId() {
      try {
        const me = await api.get('/auth/me')
        if (mounted) {
          setGroupId(me.data?.data?.groupId)
        }
      } catch (e) {
        console.error('Failed to load group ID:', e)
      }
    }
    loadGroupId()
    return () => { mounted = false }
  }, [])

  const steps = [
    { id: 1, title: 'Personal Information', icon: User },
    { id: 2, title: 'Contact Details', icon: Phone },
    { id: 3, title: 'Financial Information', icon: Briefcase },
    { id: 4, title: 'Guarantor Details', icon: User },
    { id: 5, title: 'Password', icon: Lock }
  ]

  const handleInputChange = (field, value) => {
    setMemberData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!groupId) {
      alert('Group ID not found. Please refresh the page.')
      return
    }

    if (!memberData.password || memberData.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    if (memberData.password !== memberData.confirmPassword) {
      alert('Passwords do not match. Please try again.')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create member via system-admin/users endpoint
      const { data } = await api.post('/system-admin/users', {
        name: `${memberData.firstName} ${memberData.lastName}`.trim(),
        phone: memberData.phone,
        email: memberData.email || null,
        nationalId: memberData.nationalId,
        password: memberData.password,
        role: 'Member',
        groupId: groupId,
        address: memberData.address || null,
        occupation: memberData.occupation || null,
        dateOfBirth: memberData.dateOfBirth ? new Date(memberData.dateOfBirth).toISOString() : null
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to create member')
      }
      
      alert(`Member created successfully!\n\nThey can now login with:\n- Email/Phone: ${memberData.email || memberData.phone}\n- Password: ${memberData.password}\n\n(Please inform the member of these credentials)`)
      
      // Navigate back to members page
      navigate('/admin/members')
    } catch (error) {
      console.error('Error adding member:', error)
      alert(error.response?.data?.message || error.message || 'Error adding member. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return memberData.firstName && memberData.lastName && memberData.nationalId && memberData.dateOfBirth
      case 2:
        return memberData.phone && memberData.address
      case 3:
        return memberData.occupation && memberData.monthlyIncome
      case 4:
        return memberData.guarantorName && memberData.guarantorPhone
      case 5:
        return memberData.password && memberData.confirmPassword && 
               memberData.password.length >= 6 && 
               memberData.password === memberData.confirmPassword
      default:
        return false
    }
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/members')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add New Member</h1>
            <p className="text-gray-600 mt-1">Register a new member to the group</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="card">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive ? 'bg-primary-100 text-primary-700' :
                    isCompleted ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon size={20} />
                    <span className="font-semibold">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="card">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={memberData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="input-field"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={memberData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="input-field"
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    National ID *
                  </label>
                  <input
                    type="text"
                    value={memberData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    className="input-field"
                    placeholder="Enter national ID number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={memberData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={memberData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input-field"
                    placeholder="+250 788 123 456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={memberData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-field"
                    placeholder="member@email.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={memberData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input-field"
                    placeholder="Enter full address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={memberData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="input-field"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={memberData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    className="input-field"
                    placeholder="+250 788 123 456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Financial Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Occupation *
                  </label>
                  <input
                    type="text"
                    value={memberData.occupation}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="input-field"
                    placeholder="Enter occupation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monthly Income *
                  </label>
                  <input
                    type="number"
                    value={memberData.monthlyIncome}
                    onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                    className="input-field"
                    placeholder="Enter monthly income in RWF"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={memberData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    className="input-field"
                    placeholder="Enter bank account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={memberData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="input-field"
                    placeholder="Enter bank name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Guarantor Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Guarantor Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guarantor Name *
                  </label>
                  <input
                    type="text"
                    value={memberData.guarantorName}
                    onChange={(e) => handleInputChange('guarantorName', e.target.value)}
                    className="input-field"
                    placeholder="Enter guarantor name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guarantor Phone *
                  </label>
                  <input
                    type="tel"
                    value={memberData.guarantorPhone}
                    onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                    className="input-field"
                    placeholder="+250 788 123 456"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guarantor Address
                  </label>
                  <input
                    type="text"
                    value={memberData.guarantorAddress}
                    onChange={(e) => handleInputChange('guarantorAddress', e.target.value)}
                    className="input-field"
                    placeholder="Enter guarantor address"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Password */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Password</h2>
              <p className="text-gray-600">Set a password for the member to login to their account</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={memberData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="input-field"
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={memberData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`input-field ${
                      memberData.confirmPassword && memberData.password !== memberData.confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                    placeholder="Confirm password"
                    required
                    minLength={6}
                  />
                  {memberData.confirmPassword && memberData.password !== memberData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {memberData.confirmPassword && memberData.password === memberData.confirmPassword && (
                    <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The member will use this password along with their email address or phone number to login to their account.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMemberData({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                    nationalId: '',
                    dateOfBirth: '',
                    address: '',
                    occupation: '',
                    emergencyContact: '',
                    emergencyPhone: '',
                    relationship: '',
                    monthlyIncome: '',
                    bankAccount: '',
                    bankName: '',
                    guarantorName: '',
                    guarantorPhone: '',
                    guarantorAddress: '',
                    password: '',
                    confirmPassword: ''
                  })
                  setCurrentStep(1)
                }}
                className="px-6 py-3 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                <X size={18} className="inline mr-2" />
                Cancel
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isStepValid(currentStep)
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid(currentStep) || isSubmitting}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isStepValid(currentStep) && !isSubmitting
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Member...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="inline mr-2" />
                      Add Member
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AddNewMember


