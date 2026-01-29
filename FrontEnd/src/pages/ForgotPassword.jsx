import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!identifier.trim()) {
      setError(t('enterEmailOrPhone', { defaultValue: 'Please enter your email or phone number' }))
      return
    }

    setSubmitting(true)

    try {
      const { data } = await api.post('/auth/forgot', { identifier: identifier.trim() })
      
      if (data?.success) {
        setSuccess(true)
        // Show dev reset URL in non-production
        if (data.devResetUrl && process.env.NODE_ENV !== 'production') {
          console.log('Dev Reset URL:', data.devResetUrl)
        }
      } else {
        setError(data?.message || 'Failed to send reset email. Please try again.')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'An error occurred. Please try again.'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
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

          {/* Success Card */}
          <div className="card bg-white/95 backdrop-blur-lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                {t('emailSent', { defaultValue: 'Email Sent!' })}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('passwordResetLinkSent', { defaultValue: 'If the account exists, a password reset link has been sent to your email. Please check your inbox and click the link to reset your password.' })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('linkExpiresInOneHour', { defaultValue: 'The link will expire in 1 hour. If you don\'t see the email, check your spam folder or try again.' })}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                {t('backToLogin')}
              </button>
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
              className="h-20 w-auto object-contain"
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

        {/* Forgot Password Card */}
        <div className="card bg-white/95 backdrop-blur-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {t('forgotPassword', { defaultValue: 'Forgot Password?' })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t('enterEmailOrPhoneForReset', { defaultValue: 'Enter your email or phone number, and we\'ll send you a link to reset your password.' })}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('emailOrPhone')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !submitting && identifier.trim()) {
                      handleSubmit(e)
                    }
                  }}
                  placeholder={t('emailOrPhonePlaceholder', { defaultValue: 'you@example.com or +2507...' })}
                  className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!identifier.trim() || submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                t('sending', { defaultValue: 'Sending...' })
              ) : (
                <>
                  {t('sendResetLink', { defaultValue: 'Send Reset Link' })} <ArrowRight size={20} />
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

export default ForgotPassword

