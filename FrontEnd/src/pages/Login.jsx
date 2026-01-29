import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../App'
import { Lock, Mail, ArrowRight, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api, { setAuthToken } from '../utils/api'

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
  const navigate = useNavigate()
  const { t: tAuth } = useTranslation('auth')
  const { t: tForms } = useTranslation('forms')
  const { t: tCommon } = useTranslation('common')
  const { setUser } = useContext(UserContext)

  // no-op effect now; real calls are made to backend
  useEffect(() => {}, [])

  const handleLogin = async () => {
    try {
      if (step === 1) {
        setStep(2)
        return
      }
      
      // Validate inputs
      if (!identifier || !password) {
        alert(tAuth('enterEmailAndPassword', { defaultValue: 'Please enter both email/phone and password.' }))
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
        alert(data?.message || tAuth('loginFailed', { defaultValue: 'Login failed. Please try again.' }))
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
        alert(msg)
      }
    } catch (err) {
      console.error('Unexpected error in handleLogin:', err)
      setSubmitting(false)
      alert(tAuth('unexpectedError', { defaultValue: 'An unexpected error occurred. Please refresh the page and try again.' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-3 sm:p-4 md:p-6">
      <div className="max-w-md w-full mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
            <div className="relative mb-3 sm:mb-4">
              {/* Logo with proper background and shadow for readability */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
                <img 
                  src="/assets/images/wallet.png" 
                  alt="IKIMINA WALLET Logo" 
                  className="h-16 sm:h-20 md:h-24 w-auto max-w-[150px] sm:max-w-[180px] md:max-w-[200px] object-contain"
                  onError={(e) => {
                    // If image fails, show text fallback
                    e.target.style.display = 'none'
                    const fallback = e.target.parentElement?.querySelector('.logo-fallback')
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
                <div className="logo-fallback hidden text-2xl sm:text-3xl font-bold text-primary-600 py-3 sm:py-4">
                  IW
                </div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">IKIMINA WALLET</h1>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg font-medium px-4">{tAuth('platformDescription', { defaultValue: 'Digital Microfinance Platform' })}</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="card bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg">
          {step === 1 ? (
            <div className="animate-slide-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">{tForms('selectRole')}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{tForms('chooseRole')}</p>
              
              {/* Role Selection */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {tForms('selectRoleLabel')}
                </label>
                <div className="relative">
                  <Users className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} style={{ width: '18px', height: '18px' }} />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="input-field pl-10 sm:pl-12 cursor-pointer"
                  >
                    <option value="member">{tForms('member')}</option>
                    <option value="group-admin">{tForms('groupAdmin')}</option>
                    <option value="cashier">{tForms('cashier')}</option>
                    <option value="secretary">{tForms('secretary')}</option>
                    <option value="agent">{tForms('agent')}</option>
                    <option value="system-admin">{tForms('systemAdmin')}</option>
                  </select>
                </div>
                
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">{tAuth('loginTitle', { defaultValue: 'Login' })}</h2>
              
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {tForms('emailOrPhone')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} style={{ width: '18px', height: '18px' }} />
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
                    className="input-field pl-10 sm:pl-12" 
                  />
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} style={{ width: '18px', height: '18px' }} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !submitting && identifier && password) {
                        handleLogin()
                      }
                    }}
                    placeholder={tForms('passwordPlaceholder')}
                    className="input-field pl-10 sm:pl-12" 
                  />
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
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium w-full disabled:opacity-50"
              >
                {tForms('changeRole')}
              </button>
              <button
                onClick={() => navigate('/forgot-password')}
                disabled={submitting}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800 font-medium w-full disabled:opacity-50"
              >
                {tForms('forgotPassword')}
              </button>
            </div>
          ) : step === 3 ? (
            <div className="animate-slide-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">{tForms('enterOTP')}</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('oneTimePassword')}</label>
                <div className="relative">
                  <input type="text" value={otp} onChange={(e)=>setOtp(e.target.value.slice(0,6))} placeholder="000000" maxLength={6} className="input-field text-center tracking-widest font-mono text-lg sm:text-xl" />
                </div>
              </div>
              <button
                onClick={async ()=>{
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
                    alert(e.response?.data?.message || tCommon('error', { defaultValue: 'Incorrect OTP. Please try again.' }))
                  }
                }}
                disabled={otp.length!==6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tForms('verifyOTP')} <ArrowRight size={20} />
              </button>
              <button onClick={()=>setStep(2)} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium w-full">{tForms('backToLogin')}</button>
            </div>
          ) : null}

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {tAuth('dontHaveAccount')}{' '}
              <button onClick={() => navigate('/signup')} className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300">
                {tAuth('registerIkimina')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login


