import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../App'
import { Lock, Mail, ArrowRight, Users, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api, { setAuthToken } from '../utils/api'
import { useToast } from '../contexts/ToastContext'

// Map for default paths per role (used after login)
const rolePath = {
  'Member': '/member',
  'Group Admin': '/admin',
  'Cashier': '/cashier',
  'Secretary': '/secretary',
  'Agent': '/agent',
  'System Admin': '/system-admin',
}

function normalizeIdentifier(value) {
  const raw = (value || '').trim()
  if (!raw) return ''
  if (raw.includes('@')) return raw.toLowerCase()
  // phone: ensure +250 prefix if user types 07...
  if (raw.startsWith('+')) return raw
  if (raw.startsWith('07')) return `+250${raw.replace(/^0/, '')}`
  return raw
}

function Login() {
  const [step, setStep] = useState(1) // 1: Select role, 2: Credentials
  const [selectedRole, setSelectedRole] = useState('member')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { t: tAuth } = useTranslation('auth')
  const { t: tForms } = useTranslation('forms')
  const { t: tCommon } = useTranslation('common')
  const { setUser } = useContext(UserContext)
  const { showError } = useToast()

  // no-op effect now; real calls are made to backend
  useEffect(() => {}, [])

  const verifyOtp = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const norm = normalizeIdentifier(identifier)
      const { data } = await api.post('/auth/verify-otp', { identifier: norm, otp })
      if (data?.success) {
        const { token, user } = data.data
        setAuthToken(token)
        setUser(user)
        const path = rolePath[user.role] || '/dashboard'
        navigate(path)
      }
    } catch (e) {
      showError(e.response?.data?.message || tCommon('error', { defaultValue: 'Incorrect OTP. Please try again.' }))
    } finally {
      setVerifying(false);
    }
  }

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !verifying) {
      verifyOtp()
    }
  }, [otp])

  const handleLogin = async () => {
    try {
      if (step === 1) {
        setStep(2)
        return
      }
      
      // Validate inputs
      if (!identifier || !password) {
        showError(tAuth('enterEmailAndPassword', { defaultValue: 'Please enter both email/phone and password.' }))
        return
      }
      
      setSubmitting(true)
      
      try {
        const norm = normalizeIdentifier(identifier)
        console.log('Attempting login with:', { identifier: norm, hasPassword: !!password })
        
        const { data } = await api.post('/auth/login', { identifier: norm, password })
        
        console.log('Login response:', data)
        
        if (data?.success) {
          if (data.data?.otpRequired) {
            setSubmitting(false)
            setStep(3)
            return
          }
          if (data.data?.token) {
            const { token, user } = data.data
            setAuthToken(token)
            setUser(user)
            const path = rolePath[user.role] || '/dashboard'
            setSubmitting(false)
            navigate(path)
            return
          }
        }
        
        // If we get here, success was false or unexpected response
        setSubmitting(false)
        showError(data?.message || tAuth('loginFailed', { defaultValue: 'Login failed. Please try again.' }))
      } catch (err) {
        console.error('Login error:', err)
        setSubmitting(false)
        
        let msg = tAuth('errorOccurred', { defaultValue: 'An error occurred. Please try again.' })
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          msg = tAuth('requestTimeout', { defaultValue: 'Request timed out. Please check your connection and try again.' })
        } else if (err.response?.data?.message) {
          msg = err.response.data.message
        } else if (err.message) {
          msg = err.message
        }
        showError(msg)
      }
    } catch (err) {
      console.error('Unexpected error in handleLogin:', err)
      setSubmitting(false)
      showError(tAuth('unexpectedError', { defaultValue: 'An unexpected error occurred. Please refresh the page and try again.' }))
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Form Section - 50% on desktop, full on mobile */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-8">
        <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
            <div className="relative mb-3 sm:mb-4">
              {/* Logo */}
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET Logo" 
                className="h-16 sm:h-20 md:h-24 w-auto max-w-[150px] sm:max-w-[180px] md:max-w-[200px] object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  const fallback = e.target.parentElement?.querySelector('.logo-fallback')
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              <div className="logo-fallback hidden text-2xl sm:text-3xl font-bold text-primary-600 py-3 sm:py-4">
                IW
              </div>
            </div>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium px-4">{tAuth('platformDescription', { defaultValue: 'Digital Microfinance Platform' })}</p>
          </div>
        </div>

        {/* Login Form Steps */}
        {step === 1 ? (
            <div className="animate-slide-in">
              <p className="text-sm text-gray-600 mb-4 sm:mb-6">{tForms('chooseRole')}</p>
              
              {/* Role Selection */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {tForms('selectRoleLabel')}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="input-field !focus:border-amber-600 cursor-pointer !focus:border-amber-600"
                >
                  <option value="member">{tForms('member')}</option>
                  <option value="group-admin">{tForms('groupAdmin')}</option>
                  <option value="cashier">{tForms('cashier')}</option>
                  <option value="secretary">{tForms('secretary')}</option>
                  <option value="agent">{tForms('agent')}</option>
                  <option value="system-admin">{tForms('systemAdmin')}</option>
                </select>
              </div>

              <button
                onClick={handleLogin}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {tForms('continue')} <ArrowRight size={20} />
              </button>
            </div>
          ) : step === 2 ? (
            <div className="animate-slide-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{tAuth('loginTitle', { defaultValue: 'Login' })}</h2>
              
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {tForms('emailOrPhone')}
                </label>
                <input 
                  type="text" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !submitting && identifier && password) {
                      handleLogin()
                    }
                  }}
                  placeholder={tForms('emailOrPhonePlaceholder')}
                  className="input-field !focus:border-amber-600" 
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{tForms('password')}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !submitting && identifier && password) {
                        handleLogin()
                      }
                    }}
                    placeholder={tForms('passwordPlaceholder')}
                    className="input-field !focus:border-amber-600 pr-10" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={!identifier || !password || submitting}
                type="button"
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? tForms('signingIn') : <>{tForms('signIn')} <ArrowRight size={20} /></>}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium w-full disabled:opacity-50"
              >
                {tForms('changeRole')}
              </button>
              <button
                onClick={() => navigate('/forgot-password')}
                disabled={submitting}
                className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium w-full disabled:opacity-50"
              >
                {tForms('forgotPassword')}
              </button>
            </div>
          ) : step === 3 ? (
            <div className="animate-slide-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{tForms('enterOTP')}</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{tForms('oneTimePassword')}</label>
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 6 }, (_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value) {
                          const newOtp = otp.substring(0, index) + value + otp.substring(index + 1);
                          setOtp(newOtp);
                          // Auto-focus next input
                          const nextInput = e.target.nextElementSibling;
                          if (nextInput && index < 5) {
                            nextInput.focus();
                          }
                        } else {
                          const newOtp = otp.substring(0, index) + otp.substring(index + 1);
                          setOtp(newOtp);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = e.target.previousElementSibling;
                          if (prevInput) {
                            prevInput.focus();
                          }
                        }
                      }}
                      className="w-12 h-12 text-center text-lg font-mono border border-gray-300 rounded-md focus:border-amber-600 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={verifyOtp}
                disabled={otp.length !== 6 || verifying}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : <>{tForms('verifyOTP')} <ArrowRight size={20} /></>}
              </button>
              <button onClick={()=>setStep(2)} className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium w-full">{tForms('backToLogin')}</button>
            </div>
          ) : null}

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              {tAuth('dontHaveAccount')}{' '}
              <button onClick={() => navigate('/signup')} className="text-amber-600 font-semibold hover:text-amber-700">
                {tAuth('registerIkimina')}
              </button>
            </p>
          </div>
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

export default Login


