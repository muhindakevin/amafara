import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, User, Phone, Mail, Lock, ArrowRight, Calendar, MapPin, Briefcase, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function Signup() {
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
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
        alert(tForms('passwordsDoNotMatch', { defaultValue: 'Passwords do not match' }))
        setLoading(false)
        return
      }
      
      if (form.password.length < 6) {
        alert(tForms('passwordTooShort'))
        setLoading(false)
        return
      }
      
      // Use longer timeout for member application (30 seconds) as it may need to process notifications
      const { data } = await api.post('/member-applications', form, {
        timeout: 30000 // 30 seconds timeout
      })
      
      if (data?.success) {
        alert(t('applicationSubmittedSuccessfully', { defaultValue: 'Application submitted successfully!\n\nYou will receive an email once your application is reviewed. Once approved, you will receive a welcome email and can log in to your account.' }))
        navigate('/login')
      } else {
        alert(data?.message || t('applicationFailed', { defaultValue: 'Failed to submit application' }))
      }
    } catch (err) {
      console.error('[Signup] Error submitting application:', err)
      
      // Handle timeout errors specifically
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Check if we got a response before timeout (partial success)
        if (err.response?.data?.success) {
          alert(t('applicationMayBeSubmitted', { defaultValue: 'Application may have been submitted. Please check your email or contact the Group Admin to confirm.' }))
          navigate('/login')
          return
        }
        alert(t('requestTimeoutApplication', { defaultValue: 'Request timed out. Your application may still have been submitted. Please check your email or contact the Group Admin to confirm.' }))
        return
      }
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          t('applicationFailedTryAgain', { defaultValue: 'Failed to submit application. Please try again.' })
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
      <div className="max-w-lg w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative mb-4">
              {/* Logo with proper background and shadow for readability */}
              <div className="bg-white rounded-2xl p-4 shadow-2xl">
                <img 
                  src="/assets/images/wallet.png" 
                  alt="IKIMINA WALLET Logo" 
                  className="h-24 w-auto max-w-[200px] object-contain"
                  onError={(e) => {
                    // If image fails, show text fallback
                    e.target.style.display = 'none'
                    const fallback = e.target.parentElement?.querySelector('.logo-fallback')
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
                <div className="logo-fallback hidden text-3xl font-bold text-primary-600 py-4">
                  IW
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">IKIMINA WALLET</h1>
            <p className="text-blue-100 text-lg font-medium">{t('platformDescription', { defaultValue: 'Digital Microfinance Platform' })}</p>
          </div>
        </div>

        <div className="card bg-white/95 backdrop-blur-lg w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2"><Users size={20}/> {t('memberSignup', { defaultValue: 'Member Signup' })}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('fullName', { defaultValue: 'Full Name' })}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="input-field pl-12" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('emailOptional', { defaultValue: 'Email (optional)' })}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="email" className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('phone', { defaultValue: 'Phone' })}</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="+2507..." required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('nationalId', { defaultValue: 'National ID' })}</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.nationalId} onChange={(e)=>setForm({...form,nationalId:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('password', { defaultValue: 'Password' })}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('confirmPassword', { defaultValue: 'Confirm Password' })}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="password" className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('selectGroup', { defaultValue: 'Select Group' })}</label>
            <select className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.groupId} onChange={(e)=>setForm({...form,groupId:e.target.value})} required>
              <option value="">{t('chooseGroup', { defaultValue: 'Choose group' })}</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('occupation', { defaultValue: 'Occupation' })}</label>
            <input className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.occupation} onChange={(e)=>setForm({...form,occupation:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('address', { defaultValue: 'Address' })}</label>
            <input className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{tForms('dateOfBirth', { defaultValue: 'Date of Birth' })}</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="date" className="input-field pl-12 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.dateOfBirth} onChange={(e)=>setForm({...form,dateOfBirth:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('whyJoin', { defaultValue: 'Why do you want to join?' })}</label>
            <textarea className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" value={form.reason} onChange={(e)=>setForm({...form,reason:e.target.value})} />
          </div>
          <button disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? t('submitting', { defaultValue: 'Submitting...' }) : <>{t('submitApplication', { defaultValue: 'Submit Application' })} <ArrowRight size={20} /></>}
          </button>
          <button type="button" onClick={()=>navigate('/login')} className="btn-secondary w-full">{t('backToLogin')}</button>
        </form>
        </div>
      </div>
    </div>
  )
}

export default Signup


