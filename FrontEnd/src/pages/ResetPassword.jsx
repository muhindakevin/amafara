import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token')
  const urlEmail = searchParams.get('email')
  
  // Allow manual entry if URL params are missing
  const [manualToken, setManualToken] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  
  // Use URL params if available, otherwise use manual entry
  const token = urlToken || manualToken
  const email = urlEmail || manualEmail
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  
  // Auto-verify if we have token and email from URL
  useEffect(() => {
    // Check if we're on the wrong port (e.g., 5173 instead of 3000)
    const currentPort = window.location.port
    const currentHost = window.location.hostname
    
    // If we have URL params, try to verify
    if (urlToken && urlEmail) {
      setVerifying(true)
      verifyToken(urlToken, urlEmail)
    } else {
      // If no URL params, show manual entry immediately
      setShowManualEntry(true)
    }
    
    // Log current location for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('ResetPassword - Current URL:', window.location.href)
      console.log('ResetPassword - Port:', currentPort)
      console.log('ResetPassword - URL Token:', urlToken ? 'Present' : 'Missing')
      console.log('ResetPassword - URL Email:', urlEmail ? 'Present' : 'Missing')
    }
  }, [urlToken, urlEmail])
  
  const verifyToken = async (tokenToVerify, emailToVerify) => {
    // Decode email if it's URL encoded
    let decodedEmail = null
    if (emailToVerify) {
      try {
        decodedEmail = decodeURIComponent(emailToVerify)
      } catch (e) {
        decodedEmail = emailToVerify
      }
    }
    
    if (!tokenToVerify || !decodedEmail) {
      setError(t('tokenOrEmailMissing', { defaultValue: 'Token or email is missing. Please enter both below.' }))
      setVerifying(false)
      setShowManualEntry(true)
      return
    }

    try {
      const { data } = await api.get('/auth/verify-reset-token', {
        params: { token: tokenToVerify, email: decodedEmail }
      })
      
      if (data?.success) {
        setTokenValid(true)
        setError('')
      } else {
        setError(data?.message || t('tokenInvalidOrExpired', { defaultValue: 'Token is invalid or expired. Please request a new reset link.' }))
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError(t('serverNotAvailable'))
      } else {
        const errorMessage = err.response?.data?.message || t('tokenInvalidOrExpired')
        setError(errorMessage)
      }
    } finally {
      setVerifying(false)
    }
  }
  
  const handleManualVerify = () => {
    if (!manualToken.trim() || !manualEmail.trim()) {
      setError(t('enterTokenAndEmail', { defaultValue: 'Please enter both token and email.' }))
      return
    }
    setError('')
    setVerifying(true)
    verifyToken(manualToken.trim(), manualEmail.trim())
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Decode email if it's URL encoded (handle both encoded and non-encoded)
    let decodedEmail = null
    if (email) {
      try {
        decodedEmail = decodeURIComponent(email)
      } catch (e) {
        // If decoding fails, use the email as-is
        decodedEmail = email
      }
    }

    // Validation
    if (!password || !confirmPassword) {
      setError(t('enterBothPasswordFields', { defaultValue: 'Please enter both password fields.' }))
      return
    }

    if (password.length < 6) {
      setError(tForms('passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(tForms('passwordsDoNotMatch'))
      return
    }

    if (!token || !decodedEmail) {
      setError(t('tokenOrEmailMissingRequestNew', { defaultValue: 'Token or email is missing. Please request a new reset link.' }))
      return
    }

    setSubmitting(true)

    try {
      const { data } = await api.post('/auth/reset', {
        token,
        email: decodedEmail,
        newPassword: password
      })

      if (data?.success) {
        setSuccess(true)
        // Clear any existing token since password was reset
        localStorage.removeItem('uw_token')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      } else {
        setError(data?.message || t('failedToResetPassword', { defaultValue: 'Failed to reset password. Please try again.' }))
      }
    } catch (err) {
      console.error('Reset password error:', err)
      
      // Handle connection errors
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
        setError(t('serverNotAvailable'))
      } else {
        const errorMessage = err.response?.data?.message || 
                            err.message || 
                            t('errorOccurred', { defaultValue: 'An error occurred. Please try again.' })
        setError(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET" 
                className="h-20 w-[180px] object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <span className="text-3xl font-bold text-primary-600 hidden">IKIMINA WALLET</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">IKIMINA WALLET</h1>
            <p className="text-blue-100">{t('digitalMicrofinancePlatform')}</p>
          </div>

          <div className="card bg-white/95 backdrop-blur-lg">
            <div className="text-center py-8">
              <LoadingSpinner size="default" text={t('verifyingToken', { defaultValue: 'Verifying token...' })} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET" 
                className="h-20 w-[180px] object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <span className="text-3xl font-bold text-primary-600 hidden">IKIMINA WALLET</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">IKIMINA WALLET</h1>
            <p className="text-blue-100">{t('digitalMicrofinancePlatform')}</p>
          </div>

          <div className="card bg-white/95 backdrop-blur-lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {t('passwordResetSuccessful', { defaultValue: 'Password Reset Successful!' })}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('passwordResetSuccessMessage', { defaultValue: 'Your password has been reset successfully. You can now log in with your new password.' })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('redirectingToLogin', { defaultValue: 'Redirecting to login page in a few seconds...' })}
              </p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ArrowRight size={20} />
                {t('goToLogin', { defaultValue: 'Go to Login' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid && !showManualEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET" 
                className="h-20 w-[180px] object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <span className="text-3xl font-bold text-primary-600 hidden">IKIMINA WALLET</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">IKIMINA WALLET</h1>
            <p className="text-blue-100">{t('digitalMicrofinancePlatform')}</p>
          </div>

          <div className="card bg-white/95 backdrop-blur-lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Lock className="text-yellow-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {t('enterResetToken', { defaultValue: 'Enter Reset Token' })}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('enterTokenAndEmailBelow', { defaultValue: 'If the link doesn\'t work, please enter your reset token and email below.' })}
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
                    {tForms('email', { defaultValue: 'Email' })}
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder={t('enterYourEmail', { defaultValue: 'Enter your email' })}
                    className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabled={verifying}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-left">
                    {t('resetToken')}
                  </label>
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder={t('pasteResetTokenFromEmail', { defaultValue: 'Paste reset token from email' })}
                    className="input-field w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabled={verifying}
                  />
                </div>
                <button
                  onClick={handleManualVerify}
                  disabled={verifying || !manualToken.trim() || !manualEmail.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    t('verifying', { defaultValue: 'Verifying...' })
                  ) : (
                    <>
                      {t('verifyToken', { defaultValue: 'Verify Token' })} <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium w-full flex items-center justify-center gap-2 mb-2"
                >
                  <ArrowRight size={16} />
                  {t('requestNewLink', { defaultValue: 'Request New Link' })}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-500 font-medium w-full flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  {t('backToLogin')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/assets/images/wallet.png" 
                alt="IKIMINA WALLET" 
                className="h-20 w-[180px] object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <span className="text-3xl font-bold text-primary-600 hidden">IKIMINA WALLET</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">IKIMINA WALLET</h1>
            <p className="text-blue-100">{t('digitalMicrofinancePlatform')}</p>
          </div>

        {/* Reset Password Card */}
        <div className="card bg-white/95 backdrop-blur-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('resetPassword', { defaultValue: 'Reset Password' })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('enterNewPasswordAtLeast6', { defaultValue: 'Enter your new password. It must be at least 6 characters long.' })}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('newPassword', { defaultValue: 'New Password' })}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterNewPassword', { defaultValue: 'Enter new password' })}
                  className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {tForms('confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder', { defaultValue: 'Confirm password' })}
                  className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!password || !confirmPassword || submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                t('resetting', { defaultValue: 'Resetting...' })
              ) : (
                <>
                  {t('resetPassword')} <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate('/login')}
            disabled={submitting}
            className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 font-medium w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            {t('backToLogin')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

