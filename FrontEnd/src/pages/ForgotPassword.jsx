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
              <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium px-4">{t('digitalMicrofinancePlatform')}</p>
            </div>
          </div>

          {/* Success Card */}
          <div className="animate-slide-in">
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
            <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium px-4">{t('digitalMicrofinancePlatform')}</p>
          </div>
        </div>

        {/* Forgot Password Card */}
        <div className="animate-slide-in">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {t('forgotPassword', { defaultValue: 'Forgot Password?' })}
          </h2>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6">
            {t('enterEmailOrPhoneForReset', { defaultValue: 'Enter your email or phone number, and we\'ll send you a link to reset your password.' })}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="input-field pl-12 !focus:border-amber-600"
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
            className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium w-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            {t('backToLogin')}
          </button>
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

export default ForgotPassword

