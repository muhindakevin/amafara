import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../App'
import { Lock, Mail, ArrowRight, Users } from 'lucide-react'
import { getTranslation } from '../utils/translations'
import { useLanguage } from '../contexts/LanguageContext'
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
  const { language } = useLanguage()
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
        alert('Please enter both email/phone and password.')
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
        alert(data?.message || 'Login failed. Please try again.')
      } catch (err) {
        console.error('Login error:', err)
        setSubmitting(false)
        
        let msg = 'An error occurred. Please try again.'
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          msg = 'Request timed out. Please check your connection and try again.'
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
      alert('An unexpected error occurred. Please refresh the page and try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4">
            <span className="text-3xl font-bold text-primary-600">UW</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">UMURENGE WALLET</h1>
          <p className="text-blue-100">{language === 'rw' ? 'Porogaramu ya Banki Nini ya Digitele' : 'Digital Microfinance Platform'}</p>
        </div>

        {/* Login Card */}
        <div className="card bg-white/95 backdrop-blur-lg">
          {step === 1 ? (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Role</h2>
              <p className="text-sm text-gray-600 mb-6">Choose a role to continue</p>
              
              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Role
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="input-field pl-12 cursor-pointer"
                  >
                    <option value="member">Member</option>
                    <option value="group-admin">Group Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="secretary">Secretary</option>
                    <option value="agent">Agent</option>
                    <option value="system-admin">System Admin</option>
                  </select>
                </div>
                
              </div>

              <button
                onClick={handleLogin}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
            </div>
          ) : step === 2 ? (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email or Phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !submitting && identifier && password) {
                        handleLogin()
                      }
                    }}
                    placeholder="you@example.com or +2507..." 
                    className="input-field pl-12" 
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !submitting && identifier && password) {
                        handleLogin()
                      }
                    }}
                    placeholder="********" 
                    className="input-field pl-12" 
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={!identifier || !password || submitting}
                type="button"
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Signing in...' : <>Sign In <ArrowRight size={20} /></>}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium w-full disabled:opacity-50"
              >
                ← Change role
              </button>
              <button
                onClick={() => navigate('/forgot-password')}
                disabled={submitting}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800 font-medium w-full disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
          ) : step === 3 ? (
            <div className="animate-slide-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Enter OTP</h2>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">One-Time Password</label>
                <div className="relative">
                  <input type="text" value={otp} onChange={(e)=>setOtp(e.target.value.slice(0,6))} placeholder="000000" maxLength={6} className="input-field text-center tracking-widest font-mono" />
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
                    alert(e.response?.data?.message || 'Incorrect OTP. Please try again.')
                  }
                }}
                disabled={otp.length!==6}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify OTP <ArrowRight size={20} />
              </button>
              <button onClick={()=>setStep(2)} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium w-full">← Back to Login</button>
            </div>
          ) : null}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              {getTranslation('dontHaveAccount', language)}{' '}
              <button onClick={() => navigate('/signup')} className="text-primary-600 font-semibold hover:text-primary-700">
                {getTranslation('registerIkimina', language)}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login


