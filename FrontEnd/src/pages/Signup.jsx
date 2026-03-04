import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, User, Phone, Mail, Lock, ArrowRight, Calendar, MapPin, Briefcase, CreditCard, Check, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { useToast } from '../contexts/ToastContext'

function Signup() {
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const { showError, showSuccess } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const steps = [
    { key: 'name', label: 'Full Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'nationalId', label: 'National ID', required: true },
    { key: 'password', label: 'Password', required: true },
    { key: 'confirmPassword', label: 'Confirm Password', required: true },
    { key: 'groupId', label: 'Group', required: true },
    { key: 'occupation', label: 'Occupation', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'dateOfBirth', label: 'Date of Birth', required: false },
    { key: 'reason', label: 'Reason', required: false },
  ]

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex]
    const value = form[step.key]
    if (step.required && !value.trim()) {
      showError(`${step.label} is required`)
      return false
    }
    if (step.key === 'confirmPassword' && value !== form.password) {
      showError('Passwords do not match')
      return false
    }
    if (step.key === 'password' && value.length < 6) {
      showError('Password must be at least 6 characters')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep - 1)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    groupId: '',
    occupation: '',
    address: '',
    dateOfBirth: '',
    nationalId: '',
    reason: ''
  })

  useEffect(() => {
    let mounted = true
    async function loadGroups() {
      try {
        const { data } = await api.get('/public/groups')
        if (mounted && data?.success) setGroups(data.data)
      } catch (e) {
        // silently ignore
      }
    }
    loadGroups()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (form.password !== form.confirmPassword) {
        showError(tForms('passwordsDoNotMatch', { defaultValue: 'Passwords do not match' }))
        setLoading(false)
        return
      }
      
      if (form.password.length < 6) {
        showError(tForms('passwordTooShort'))
        setLoading(false)
        return
      }
      
      // Use longer timeout for member application (30 seconds) as it may need to process notifications
      const { data } = await api.post('/member-applications', form, {
        timeout: 30000 // 30 seconds timeout
      })
      
      if (data?.success) {
        showSuccess(t('applicationSubmittedSuccessfully', { defaultValue: 'Application submitted successfully!\n\nYou will receive an email once your application is reviewed. Once approved, you will receive a welcome email and can log in to your account.' }))
        navigate('/login')
      } else {
        showError(data?.message || t('applicationFailed', { defaultValue: 'Failed to submit application' }))
      }
    } catch (err) {
      console.error('[Signup] Error submitting application:', err)
      
      // Handle timeout errors specifically
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Check if we got a response before timeout (partial success)
        if (err.response?.data?.success) {
          showSuccess(t('applicationMayBeSubmitted', { defaultValue: 'Application may have been submitted. Please check your email or contact the Group Admin to confirm.' }))
          navigate('/login')
          return
        }
        showError(t('requestTimeoutApplication', { defaultValue: 'Request timed out. Your application may still have been submitted. Please check your email or contact the Group Admin to confirm.' }))
        return
      }
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          t('applicationFailedTryAgain', { defaultValue: 'Failed to submit application. Please try again.' })
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Form Section - 50% on desktop, full on mobile */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative mb-4">
                {/* Logo */}
                <img 
                  src="/assets/images/wallet.png" 
                  alt="IKIMINA WALLET Logo" 
                  className="h-24 w-auto max-w-[200px] object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const fallback = e.target.parentElement?.querySelector('.logo-fallback')
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
                <div className="logo-fallback hidden text-3xl font-bold text-primary-600 py-4">
                  IW
                </div>
              </div>
              <p className="text-gray-600 text-lg font-medium">{t('platformDescription', { defaultValue: 'Digital Microfinance Platform' })}</p>
            </div>
          </div>

          {/* Signup Form - Step by Step */}
          <h2 className="text-xl font-normal text-gray-900 mb-6 flex items-center gap-2"><Users size={20}/> {t('memberSignup', { defaultValue: 'Member Signup' })}</h2>

          {/* Progress */}
          <div className="mb-8 flex justify-center gap-2">
            {steps.map((step, index) => (
              <div key={index} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep > index + 1 ? 'bg-amber-700 text-white' : currentStep === index + 1 ? 'bg-amber-600 text-white border-2 border-amber-700' : 'bg-white text-gray-500 border-2 border-gray-300'}`}>
                {index + 1}
              </div>
            ))}
          </div>

          {/* Current Field */}
          <form onSubmit={async (e) => { e.preventDefault(); if (currentStep === steps.length) { await handleSubmit(e); } else { handleNext(); } }} className="space-y-4">
            {(() => {
              const step = steps[currentStep - 1]
              return (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{step.label}</label>
                  {step.key === 'email' ? (
                    <input type="email" className="input-field !focus:border-amber-600" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="Enter your email address" />
                  ) : step.key === 'phone' ? (
                    <input className="input-field !focus:border-amber-600" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="e.g. +250788123456" />
                  ) : step.key === 'nationalId' ? (
                    <input className="input-field !focus:border-amber-600" value={form.nationalId} onChange={(e)=>setForm({...form,nationalId:e.target.value})} placeholder="Enter your national ID number" />
                  ) : step.key === 'password' ? (
                    <div className="relative">
          <input type={showPassword ? 'text' : 'password'} className="input-field !focus:border-amber-600 pr-10" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="Create a strong password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
                  ) : step.key === 'confirmPassword' ? (
                    <div className="relative">
          <input type={showConfirmPassword ? 'text' : 'password'} className="input-field !focus:border-amber-600 pr-10" value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} placeholder="Confirm your password" />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
                  ) : step.key === 'groupId' ? (
                    <select className="input-field !focus:border-amber-600" value={form.groupId} onChange={(e)=>setForm({...form,groupId:e.target.value})}>
                      <option value="">Select your group</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  ) : step.key === 'occupation' ? (
                    <input className="input-field !focus:border-amber-600" value={form.occupation} onChange={(e)=>setForm({...form,occupation:e.target.value})} placeholder="Enter your occupation" />
                  ) : step.key === 'address' ? (
                    <input className="input-field !focus:border-amber-600" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} placeholder="Enter your residential address" />
                  ) : step.key === 'dateOfBirth' ? (
                    <input type="date" className="input-field !focus:border-amber-600" value={form.dateOfBirth} onChange={(e)=>setForm({...form,dateOfBirth:e.target.value})} />
                  ) : step.key === 'reason' ? (
                    <textarea className="input-field !focus:border-amber-600 resize-none" value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})} placeholder="Tell us why you want to join" />
                  ) : (
                    <input className="input-field !focus:border-amber-600" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Enter your full name" />
                  )}
                </div>
              )
            })()}

            {/* Buttons */}
            <div className="flex gap-4">
              {currentStep > 1 && (
                <button type="button" onClick={handlePrevious} className="border border-amber-500 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded flex-1">Previous</button>
              )}
              {currentStep < steps.length ? (
                <button type="button" onClick={handleNext} className="btn-primary flex-1">Next</button>
              ) : (
                <button disabled={loading} className="btn-primary flex-1">
                  {loading ? t('submitting', { defaultValue: 'Submitting...' }) : <>{t('submitApplication', { defaultValue: 'Submit Application' })} <ArrowRight size={20} /></>}
                </button>
              )}
            </div>
            <button type="button" onClick={()=>navigate('/login')} className="border border-amber-500 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded w-full">{t('backToLogin', { defaultValue: 'Back to Login' })}</button>
          </form>
        </div>
      </div>

      {/* Image Section - 50% on desktop, full on mobile */}
      <div className="lg:w-1/2 w-full min-h-[50vh] lg:min-h-screen relative">
        <img 
          src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&q=80" 
          alt="Community savings group" 
          className="w-full h-full object-cover" 
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl font-semibold text-center px-4 animate-slide-in">
          <p>Empowering Rwanda's Saving Communities<br />Through Digital Microfinance</p>
        </div>
      </div>
    </div>
  )
}

export default Signup


