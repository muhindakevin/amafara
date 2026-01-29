import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { tAlert } from '../utils/translationHelpers'
import api from '../utils/api'

function AddNewMember() {
  const { t } = useTranslation('common')
  const { t: tGroupAdmin } = useTranslation('groupAdmin')
  const { t: tForms } = useTranslation('forms')
  const { t: tErrors } = useTranslation('errors')
  const navigate = useNavigate()
  const [memberData, setMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    location: '',
    password: '',
    confirmPassword: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
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

  // Validation functions
  const validateForm = () => {
    const errors = {}

    // First name validation
    if (!memberData.firstName || !memberData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    // Last name validation
    if (!memberData.lastName || !memberData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    // Email validation
    if (!memberData.email || !memberData.email.trim()) {
      errors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(memberData.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    // Phone validation - must be exactly 10 digits
    if (!memberData.phone || !memberData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      const phoneDigits = memberData.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits'
      }
    }

    // National ID validation - must be exactly 16 digits
    if (!memberData.nationalId || !memberData.nationalId.trim()) {
      errors.nationalId = 'National ID is required'
    } else {
      const nationalIdDigits = memberData.nationalId.replace(/\D/g, '')
      if (nationalIdDigits.length !== 16) {
        errors.nationalId = 'National ID must be exactly 16 digits'
      }
    }

    // Date of birth validation - must not be future and must be at least 10 years old
    if (!memberData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    } else {
      const birthDate = new Date(memberData.dateOfBirth)
      const today = new Date()
      const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())
      
      if (birthDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future'
      } else if (birthDate > tenYearsAgo) {
        errors.dateOfBirth = 'Member must be at least 10 years old'
      }
    }

    // Location validation
    if (!memberData.location || !memberData.location.trim()) {
      errors.location = 'Location is required'
    }

    // Password validation
    if (!memberData.password || !memberData.password.trim()) {
      errors.password = 'Password is required'
    } else if (memberData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }

    // Confirm password validation
    if (!memberData.confirmPassword || !memberData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (memberData.password !== memberData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field, value) => {
    let processedValue = value
    
    // Format phone and national ID to only allow digits
    if (field === 'phone') {
      processedValue = value.replace(/\D/g, '').substring(0, 10)
    } else if (field === 'nationalId') {
      processedValue = value.replace(/\D/g, '').substring(0, 16)
    }
    
    setMemberData(prev => ({
      ...prev,
      [field]: processedValue
    }))
    
    // Clear error for this field when user types
    setValidationErrors(prev => ({
      ...prev,
      [field]: ''
    }))
  }

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting')
      return
    }

    if (!groupId) {
      tAlert('common.groupIdNotFound', {}, 'common')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create member via groups/members endpoint (DIRECT SQL - independent)
      const { data } = await api.post('/groups/members', {
        firstName: memberData.firstName.trim(),
        lastName: memberData.lastName.trim(),
        email: memberData.email.trim().toLowerCase(),
        phone: memberData.phone.replace(/\D/g, ''),
        nationalId: memberData.nationalId.replace(/\D/g, ''),
        dateOfBirth: memberData.dateOfBirth,
        location: memberData.location.trim(),
        password: memberData.password
      })

      if (!data?.success) {
        throw new Error(data?.message || tErrors('operationFailed', { defaultValue: 'Failed to create member' }))
      }
      
      // Show success notification with credentials
      const email = memberData.email.trim().toLowerCase()
      const password = memberData.password
      const successMessage = `✅ Member Created Successfully!\n\n` +
        `A welcome email with login credentials has been sent to:\n${email}\n\n` +
        `Login Credentials:\n` +
        `📧 Email: ${email}\n` +
        `🔑 Password: ${password}\n\n` +
        `The member can now log in using these credentials.`
      
      alert(successMessage)
      
      // Clear form data
      setMemberData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationalId: '',
        dateOfBirth: '',
        location: '',
        password: '',
        confirmPassword: ''
      })
      setValidationErrors({})
      
      // Navigate back to members page (will auto-refresh)
      navigate('/admin/members')
    } catch (error) {
      console.error('Error adding member:', error)
      
      // Better error handling for different error types
      let errorMsg = ''
      
      if (error.response?.status === 409) {
        // Conflict - email, phone, or national ID already exists
        errorMsg = error.response?.data?.message || 'This member already exists. Please check the email, phone number, or national ID.'
      } else if (error.response?.status === 400) {
        // Bad request - validation error
        errorMsg = error.response?.data?.message || 'Please check all fields and try again.'
      } else if (error.response?.status === 403) {
        // Forbidden
        errorMsg = error.response?.data?.message || 'You do not have permission to perform this action.'
      } else {
        // Other errors
        errorMsg = error.response?.data?.message || error.message || 'Failed to create member. Please try again.'
      }
      
      alert(`❌ Error: ${errorMsg}`)
    } finally {
      setIsSubmitting(false)
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

        {/* Form Content */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Member Registration</h2>
          
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={memberData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`input-field ${validationErrors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Enter first name"
                    required
                  />
              {validationErrors.firstName && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
              )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={memberData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`input-field ${validationErrors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Enter last name"
                    required
                  />
              {validationErrors.lastName && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={memberData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`input-field ${validationErrors.email ? 'border-red-500' : ''}`}
                placeholder="example@email.com"
                required
              />
              {validationErrors.email && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
              )}
              {!validationErrors.email && memberData.email && (
                <p className="text-xs text-gray-500 mt-1">Welcome email with credentials will be sent here</p>
              )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                National ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={memberData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                className={`input-field ${validationErrors.nationalId ? 'border-red-500' : ''}`}
                placeholder="16 digits"
                    required
                    maxLength={16}
                  />
                  {validationErrors.nationalId && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.nationalId}</p>
                  )}
                  {!validationErrors.nationalId && memberData.nationalId && (
                <p className="text-xs text-gray-500 mt-1">Must be exactly 16 digits</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={memberData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`input-field ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
                    required
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0]}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.dateOfBirth}</p>
                  )}
                  {!validationErrors.dateOfBirth && memberData.dateOfBirth && (
                <p className="text-xs text-gray-500 mt-1">Member must be at least 10 years old</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telephone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={memberData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`input-field ${validationErrors.phone ? 'border-red-500' : ''}`}
                    placeholder="0781234567"
                    required
                    maxLength={10}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                  {!validationErrors.phone && memberData.phone && (
                <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                value={memberData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`input-field ${validationErrors.location ? 'border-red-500' : ''}`}
                placeholder="Enter location/address"
                    required
                  />
              {validationErrors.location && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.location}</p>
              )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={memberData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                className={`input-field ${validationErrors.password ? 'border-red-500' : ''}`}
                placeholder="Enter password"
                    required
                    minLength={6}
                  />
              {validationErrors.password && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
              )}
              {!validationErrors.password && memberData.password && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={memberData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`input-field ${
                  validationErrors.confirmPassword || (memberData.confirmPassword && memberData.password !== memberData.confirmPassword)
                    ? 'border-red-500'
                        : ''
                    }`}
                    placeholder="Confirm password"
                    required
                    minLength={6}
                  />
              {validationErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                  )}
              {memberData.confirmPassword && memberData.password === memberData.confirmPassword && !validationErrors.confirmPassword && (
                    <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
                  )}
                </div>
              </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
              <strong>Note:</strong> A welcome email with login credentials will be automatically sent to the member after registration.
                </p>
              </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={() => navigate('/admin/members')}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                <X size={18} className="inline mr-2" />
                Cancel
              </button>
                <button
                  onClick={handleSubmit}
              disabled={isSubmitting}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                !isSubmitting
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
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AddNewMember


