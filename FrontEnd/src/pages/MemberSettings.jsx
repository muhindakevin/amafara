import { useEffect, useState } from 'react'
import { User, Shield, Bell, Globe, Key, Smartphone, Mail, Save, Eye, EyeOff, DollarSign, X, Camera, FileText } from 'lucide-react'
import Layout from '../components/Layout'
import ProfileImage from '../components/ProfileImage'
import { useTranslation } from 'react-i18next'
import api, { getFileUrl } from '../utils/api'
import useApiState from '../hooks/useApiState'
import { useLanguage, getAvailableLanguages } from '../contexts/LanguageContext'

function MemberSettings() {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const { language, changeLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [profileImage, setProfileImage] = useState('')
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState(null)

  const { data: profileData, setData: setProfileData, loading, wrap } = useApiState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    address: '',
    occupation: ''
  })

  useEffect(() => {
    wrap(async () => {
      const me = await api.get('/auth/me')
      const u = me.data?.data || {}
      const nameParts = (u.name || '').split(' ')
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: u.email || '',
        phone: u.phone || '',
          nationalId: u.nationalId || '',
          dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
          address: u.address || '',
          occupation: u.occupation || '',
          profileImage: u.profileImage || ''
        })
        // Set profile image URL using backend base URL
        if (u.profileImage) {
          setProfileImage(getFileUrl(u.profileImage))
        } else {
          setProfileImage('')
        }
      
      // Load 2FA and notification settings from API response
      if (u.twoFactorEnabled !== undefined) {
        setSecurityData(prev => ({ ...prev, twoFactorEnabled: u.twoFactorEnabled }))
      }
      if (u.biometricEnabled !== undefined) {
        setSecurityData(prev => ({ ...prev, biometricEnabled: u.biometricEnabled }))
      }
      if (u.notificationPreferences) {
        setNotificationSettings(u.notificationPreferences)
      }
    })
  }, [])
  

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    biometricEnabled: false
  })
  
  // Load 2FA settings on mount
  useEffect(() => {
    const saved2FA = localStorage.getItem('twoFactorEnabled')
    const savedBiometric = localStorage.getItem('biometricEnabled')
    if (saved2FA !== null) {
      setSecurityData(prev => ({ ...prev, twoFactorEnabled: saved2FA === 'true' }))
    }
    if (savedBiometric !== null) {
      setSecurityData(prev => ({ ...prev, biometricEnabled: savedBiometric === 'true' }))
    }
  }, [])
  
  const handleSetup2FA = async () => {
    try {
      const response = await api.get('/auth/2fa/setup')
      if (response.data?.success) {
        setQrCodeData(response.data.data.qrCode)
        setShow2FASetup(true)
      }
    } catch (error) {
      console.error('Setup 2FA error:', error)
      alert(error.response?.data?.message || tCommon('error', { defaultValue: 'Failed to setup 2FA' }))
    }
  }
  
  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      alert(t('enterValidCode', { defaultValue: 'Please enter a valid 6-digit code' }))
      return
    }
    
    try {
      const response = await api.post('/auth/2fa/verify', {
        token: verificationCode
      })
      
      if (response.data?.success) {
        setSecurityData(prev => ({ ...prev, twoFactorEnabled: true }))
        setShow2FASetup(false)
        setQrCodeData(null)
        setVerificationCode('')
        if (response.data.data?.backupCodes) {
          setBackupCodes(response.data.data.backupCodes)
          alert(t('twoFactorEnabledSuccess', { defaultValue: '2FA enabled successfully! Save your backup codes in a safe place.' }))
        } else {
          alert(t('twoFactorEnabledSuccess', { defaultValue: '2FA enabled successfully!' }))
        }
      }
    } catch (error) {
      console.error('Verify 2FA error:', error)
      alert(error.response?.data?.message || tCommon('error', { defaultValue: 'Invalid verification code' }))
    }
  }
  
  const handleDisable2FA = async () => {
    const password = prompt(t('enterPasswordToDisable', { defaultValue: 'Enter your password to disable 2FA:' }))
    if (!password) return
    
    try {
      const response = await api.post('/auth/2fa/disable', {
        password: password
      })
      
      if (response.data?.success) {
        setSecurityData(prev => ({ ...prev, twoFactorEnabled: false }))
        alert(t('twoFactorDisabledSuccess', { defaultValue: '2FA disabled successfully' }))
      }
    } catch (error) {
      console.error('Disable 2FA error:', error)
      alert(error.response?.data?.message || tCommon('error', { defaultValue: 'Failed to disable 2FA' }))
    }
  }
  
  const handleToggle2FA = async (enabled) => {
    // This is now handled by setup/disable functions
    if (enabled) {
      handleSetup2FA()
    } else {
      handleDisable2FA()
    }
  }
  
  const handleToggleBiometric = async (enabled) => {
    try {
      setSecurityData(prev => ({ ...prev, biometricEnabled: enabled }))
      localStorage.setItem('biometricEnabled', enabled.toString())
      // Try to save to backend if endpoint exists
      try {
        await api.put('/auth/profile', {
          biometricEnabled: enabled
        })
      } catch (e) {
        // If endpoint doesn't exist, just use localStorage
        console.log('Biometric preference saved to localStorage')
      }
    } catch (e) {
      console.error('Failed to update biometric setting:', e)
      // Revert on error
      setSecurityData(prev => ({ ...prev, biometricEnabled: !enabled }))
    }
  }

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    contributionReminders: true,
    loanReminders: true,
    groupAnnouncements: true,
    paymentConfirmations: true
  })

  const handleSaveProfile = async () => {
    if (saving) return
    try {
      setSaving(true)
      const name = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ').trim()
      if (!name) {
        alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
        setSaving(false)
        return
      }
      
      const response = await api.put('/auth/profile', {
        name,
        email: profileData.email || null,
        phone: profileData.phone || null,
        language: language,
        occupation: profileData.occupation || null,
        address: profileData.address || null,
        dateOfBirth: profileData.dateOfBirth || null,
        nationalId: profileData.nationalId || null
      })
      
      if (response.data?.success) {
        alert(t('profileUpdatedSuccessfully', { defaultValue: 'Profile updated successfully!' }))
        // Reload user data
        const me = await api.get('/auth/me')
        const u = me.data?.data || {}
        const nameParts = (u.name || '').split(' ')
        setProfileData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: u.email || '',
          phone: u.phone || '',
          nationalId: u.nationalId || '',
          dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
          address: u.address || '',
          occupation: u.occupation || ''
        })
      }
    } catch (e) {
      console.error('Profile update error:', e)
      alert(e.response?.data?.message || tCommon('error', { defaultValue: 'Failed to update profile' }))
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (savingPassword) return
    
    if (!securityData.currentPassword) {
      alert(t('currentPasswordRequired', { defaultValue: 'Please enter your current password' }))
      return
    }
    
    if (!securityData.newPassword) {
      alert(t('newPasswordRequired', { defaultValue: 'Please enter a new password' }))
      return
    }
    
    if (securityData.newPassword.length < 8) {
      alert(t('passwordMinLength', { defaultValue: 'Password must be at least 8 characters' }))
      return
    }
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert(tForms('passwordsDoNotMatch', { defaultValue: 'Passwords do not match' }))
      return
    }
    
    try {
      setSavingPassword(true)
      const response = await api.put('/auth/profile', {
        password: securityData.newPassword,
        currentPassword: securityData.currentPassword
      })
      
      if (response.data?.success) {
        alert(t('passwordChangedSuccessfully', { defaultValue: 'Password changed successfully!' }))
        setSecurityData({ ...securityData, currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (e) {
      console.error('Password change error:', e)
      alert(e.response?.data?.message || tCommon('error', { defaultValue: 'Failed to change password' }))
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (savingNotifications) return
    try {
      setSavingNotifications(true)
      // Save notification preferences to user settings or a separate endpoint
      // For now, we'll store in localStorage and send to backend if endpoint exists
      localStorage.setItem('notification_preferences', JSON.stringify(notificationSettings))
      
      // Try to save to backend if endpoint exists
      try {
        await api.put('/auth/profile', {
          notificationPreferences: notificationSettings
        })
      } catch (e) {
        // If endpoint doesn't exist, just use localStorage
        console.log('Notification preferences saved to localStorage')
      }
      
      alert(t('notificationSettingsUpdated', { defaultValue: 'Notification settings updated!' }))
    } catch (e) {
      console.error('Notification settings error:', e)
      alert(e.response?.data?.message || tCommon('error', { defaultValue: 'Failed to update notification settings' }))
    } finally {
      setSavingNotifications(false)
    }
  }
  
  // Load notification preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences')
    if (saved) {
      try {
        setNotificationSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load notification preferences:', e)
      }
    }
  }, [])

  const [terms, setTerms] = useState({
    termsOfService: '',
    privacyPolicy: '',
    loanTerms: ''
  })

  useEffect(() => {
    fetchTerms()
  }, [])

  const fetchTerms = async () => {
    try {
      const { data } = await api.get('/public/terms')
      if (data?.success) {
        setTerms(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch terms:', error)
    }
  }

  const tabs = [
    { id: 'profile', label: t('profile', { defaultValue: 'Profile' }), icon: User },
    { id: 'security', label: t('security', { defaultValue: 'Security' }), icon: Shield },
    { id: 'notifications', label: t('notifications', { defaultValue: 'Notifications' }), icon: Bell },
    { id: 'language', label: t('language', { defaultValue: 'Language' }), icon: Globe },
    { id: 'terms', label: t('terms', { defaultValue: 'Terms' }), icon: FileText }
  ]

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('settings')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageAccountPreferences', { defaultValue: 'Manage your account preferences and security' })}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('personalInformation', { defaultValue: 'Personal Information' })}</h2>
                
                {/* Profile Picture Upload */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <ProfileImage
                    imageUrl={profileImage}
                    name={`${profileData.firstName} ${profileData.lastName}`.trim() || 'User'}
                    size={96}
                    editable={true}
                    onImageChange={(newImageUrl) => {
                      setProfileImage(newImageUrl || '')
                      setProfileData(prev => ({ ...prev, profileImage: newImageUrl || '' }))
                    }}
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('profilePicture', { defaultValue: 'Profile Picture' })}
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t('clickPenIconToEdit', { defaultValue: 'Click the pen icon on your profile picture to upload, change, or remove it.' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('pictureRequirements', { defaultValue: 'JPG, PNG or GIF. Max 5MB.' })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tForms('firstName', { defaultValue: 'First Name' })}
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tForms('lastName', { defaultValue: 'Last Name' })}
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tForms('nationalId')}
                    </label>
                    <input
                      type="text"
                      value={profileData.nationalId}
                      onChange={(e) => setProfileData({ ...profileData, nationalId: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('dateOfBirth')}
                    </label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('address')}
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('occupation')}
                    </label>
                    <input
                      type="text"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} /> {saving ? tCommon('saving', { defaultValue: 'Saving...' }) : tCommon('saveChanges', { defaultValue: 'Save Changes' })}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('securitySettings')}</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('currentPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        className="input-field pr-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('newPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        className="input-field pr-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('confirmNewPassword')}
                    </label>
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Key size={18} /> {savingPassword ? tCommon('saving', { defaultValue: 'Saving...' }) : t('changePassword', { defaultValue: 'Change Password' })}
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('twoFactorAuthentication', { defaultValue: 'Two-Factor Authentication' })}</h3>
                  
                  <div className="space-y-4">
                    {!securityData.twoFactorEnabled ? (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
                          {t('twoFactorDescription', { defaultValue: 'Add an extra layer of security to your account by enabling two-factor authentication. You\'ll need to enter a code from your authenticator app when logging in.' })}
                        </p>
                        <button
                          onClick={handleSetup2FA}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Shield size={18} />
                          {t('setup2FA', { defaultValue: 'Set Up 2FA' })}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <Shield className="text-green-600" size={24} />
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{t('twoFactorEnabled', { defaultValue: 'Two-Factor Authentication Enabled' })}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('twoFactorActive', { defaultValue: 'Your account is protected with 2FA' })}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleDisable2FA}
                          className="btn-secondary text-sm"
                        >
                          {t('disable2FA', { defaultValue: 'Disable' })}
                        </button>
                      </div>
                    )}
                    
                    {show2FASetup && (
                      <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-4">{t('scanQRCode', { defaultValue: 'Scan QR Code' })}</h4>
                        {qrCodeData && (
                          <div className="flex flex-col items-center gap-4">
                            <img src={qrCodeData} alt="QR Code" className="w-48 h-48 border-2 border-gray-300 dark:border-gray-600 rounded-lg" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                              {t('scanWithAuthenticator', { defaultValue: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)' })}
                            </p>
                            <div className="w-full">
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {t('enterVerificationCode', { defaultValue: 'Enter verification code' })}
                              </label>
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 text-center text-2xl tracking-widest"
                              />
                              <button
                                onClick={handleVerify2FA}
                                disabled={!verificationCode || verificationCode.length !== 6}
                                className="btn-primary w-full mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {t('verifyAndEnable', { defaultValue: 'Verify and Enable' })}
                              </button>
                              <button
                                onClick={() => {
                                  setShow2FASetup(false)
                                  setQrCodeData(null)
                                  setVerificationCode('')
                                }}
                                className="btn-secondary w-full mt-2"
                              >
                                {tCommon('cancel', { defaultValue: 'Cancel' })}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {backupCodes && backupCodes.length > 0 && (
                      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">{t('backupCodes', { defaultValue: 'Backup Codes' })}</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                          {t('saveBackupCodes', { defaultValue: 'Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.' })}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {backupCodes.map((code, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded font-mono text-sm text-center border border-yellow-300 dark:border-yellow-700">
                              {code}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setBackupCodes(null)}
                          className="btn-secondary w-full"
                        >
                          {tCommon('close', { defaultValue: 'Close' })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('biometricAuthentication', { defaultValue: 'Biometric Authentication' })}</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('biometricAuthentication')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('useFingerprintOrFaceRecognition', { defaultValue: 'Use fingerprint or face recognition' })}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securityData.biometricEnabled}
                        onChange={(e) => handleToggleBiometric(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('notificationPreferences')}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('emailNotifications')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('receiveUpdatesViaEmail', { defaultValue: 'Receive updates via email' })}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('smsNotifications')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('receiveUpdatesViaSms', { defaultValue: 'Receive updates via SMS' })}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell className="text-purple-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('pushNotifications', { defaultValue: 'Push Notifications' })}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('receivePushNotifications', { defaultValue: 'Receive push notifications' })}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-yellow-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('contributionReminders')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('remindersForMonthlyContributions', { defaultValue: 'Reminders for monthly contributions' })}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.contributionReminders}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, contributionReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Key className="text-red-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('loanReminders')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('remindersForLoanPayments', { defaultValue: 'Reminders for loan payments' })}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.loanReminders}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, loanReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} /> {savingNotifications ? tCommon('saving', { defaultValue: 'Saving...' }) : t('saveNotificationSettings', { defaultValue: 'Save Notification Settings' })}
                </button>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('languagePreferences')}</h2>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {t('languageSettingsManagedGlobally', { defaultValue: 'Language settings are managed globally. Use the language selector (🌍) in the top navigation bar to change your preferred language.' })}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t('availableLanguages', { defaultValue: 'Available Languages' })}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {getAvailableLanguages().map((lang) => {
                        // Check if this language is currently active
                        // First try exact match, then base language match (for 'en-US' vs 'en')
                        const currentLang = language || 'en'
                        const isExactMatch = currentLang === lang.code
                        const isBaseMatch = currentLang.split('-')[0] === lang.code.split('-')[0] && lang.code.split('-').length === 1
                        const isActive = isExactMatch || isBaseMatch || (lang.code === 'en' && (!language || language.startsWith('en')))
                        return (
                          <div 
                            key={lang.code} 
                            onClick={() => changeLanguage(lang.code)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              isActive 
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400' 
                                : 'bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                            }`}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <div className="flex-1">
                              <div className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'dark:text-gray-300'}`}>
                                {lang.name}
                              </div>
                              <div className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {lang.nativeName}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {lang.code === 'en' && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  {t('default', { defaultValue: 'Default' })}
                                </span>
                              )}
                              {isActive && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded font-semibold">
                                  {t('active', { defaultValue: 'Active' })}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms Tab */}
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('termsAndConditions', { defaultValue: 'Terms & Conditions' })}</h2>
                
                <div className="space-y-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('termsOfService', { defaultValue: 'Terms of Service' })}</h3>
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {terms.termsOfService || t('loading', { defaultValue: 'Loading...' })}
                      </p>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('privacyPolicy', { defaultValue: 'Privacy Policy' })}</h3>
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {terms.privacyPolicy || t('loading', { defaultValue: 'Loading...' })}
                      </p>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('loanTerms', { defaultValue: 'Loan Terms & Conditions' })}</h3>
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {terms.loanTerms || t('loading', { defaultValue: 'Loading...' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MemberSettings


