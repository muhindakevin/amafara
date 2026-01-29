import { useState, useEffect } from 'react'
import { Settings, Save, Bell, Shield, Users, DollarSign, User, Mail, Phone, Lock, X, CreditCard, Eye, EyeOff, Globe, FileText } from 'lucide-react'
import Layout from '../components/Layout'
import ProfileImage from '../components/ProfileImage'
import { useTranslation } from 'react-i18next'
import api, { getFileUrl } from '../utils/api'
import { useLanguage, getAvailableLanguages } from '../contexts/LanguageContext'

function GroupAdminSettings() {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const { language, changeLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [groupId, setGroupId] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileImage, setProfileImage] = useState('')
  
  const [settings, setSettings] = useState({
    // General Settings
    groupName: '',
    groupDescription: '',
    groupLocation: '',
    establishedDate: '',
    meetingDay: 'Saturday',
    meetingTime: '14:00',
    
    // Contribution Settings
    minimumContribution: 5000,
    maximumContribution: 50000,
    contributionDueDate: 15,
    lateFee: 500,
    gracePeriod: 5,
    
    // Loan Settings
    maxLoanAmount: 200000,
    loanInterestRate: 2.5,
    loanDuration: 6,
    loanProcessingFee: 1000,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    meetingReminders: true,
    paymentReminders: true,
    
    // Security Settings
    requireTwoFactor: false,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    auditLogging: true
  })

  // Profile update state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationalId: '',
    dateOfBirth: '',
    address: '',
    occupation: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

  // Default settings for reset
  const defaultSettings = {
    groupName: '',
    groupDescription: '',
    groupLocation: '',
    establishedDate: '',
    meetingDay: 'Saturday',
    meetingTime: '14:00',
    minimumContribution: 5000,
    maximumContribution: 50000,
    contributionDueDate: 15,
    lateFee: 500,
    gracePeriod: 5,
    maxLoanAmount: 200000,
    loanInterestRate: 2.5,
    loanDuration: 6,
    loanProcessingFee: 1000,
    emailNotifications: true,
    smsNotifications: true,
    meetingReminders: true,
    paymentReminders: true,
    requireTwoFactor: false,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    auditLogging: true
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const startTime = Date.now()
      
      // Get current user's group and profile in one call
      const meResponse = await api.get('/auth/me')
      const userData = meResponse.data?.data
      
      if (!userData) {
        alert('Failed to load user data.')
        setLoading(false)
        return
      }
      
      const currentGroupId = userData.groupId
      
      if (!currentGroupId) {
        alert('You are not assigned to a group.')
        setLoading(false)
        return
      }
      
      setGroupId(currentGroupId)
      
      // Set profile data immediately from the user data we already have
      const nameParts = (userData.name || '').split(' ')
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: userData.phone || '',
        email: userData.email || '',
        nationalId: userData.nationalId || '',
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
        address: userData.address || '',
        occupation: userData.occupation || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Set profile image URL using backend base URL
      if (userData.profileImage) {
        setProfileImage(getFileUrl(userData.profileImage))
      } else {
        setProfileImage('')
      }
      
      // Fetch group settings - this fetches directly from database
      console.log(`[Settings] Fetching settings for group ${currentGroupId}`)
      const res = await api.get(`/groups/${currentGroupId}/settings`)
      console.log(`[Settings] Response:`, res.data)
      
      if (res.data?.success && res.data.data) {
        setSettings(res.data.data)
        console.log(`[Settings] Loaded in ${Date.now() - startTime}ms`)
      } else {
        throw new Error(res.data?.message || 'Failed to load settings')
      }
    } catch (error) {
      console.error('[Settings] Error loading settings:', error)
      console.error('[Settings] Error response:', error?.response)
      console.error('[Settings] Error status:', error?.response?.status)
      console.error('[Settings] Error data:', error?.response?.data)
      
      let errorMessage = 'Failed to load settings. Please try again.'
      if (error?.response?.status === 404) {
        errorMessage = 'Settings route not found. Please check if the backend server is running.'
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!groupId) {
      alert('Group information not available.')
      return
    }

    try {
      setSaving(true)
      
      const res = await api.put(`/groups/${groupId}/settings`, settings)
      
      if (res.data?.success) {
        alert('Settings saved successfully! All group members have been notified.')
        await loadData() // Use loadData instead of loadSettings
      } else {
        alert('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(error?.response?.data?.message || 'Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      return
    }

    if (!groupId) {
      alert('Group information not available.')
      return
    }

    try {
      setSaving(true)
      
      const res = await api.post(`/groups/${groupId}/settings/reset`)
      
      if (res.data?.success) {
        alert('Settings reset to default values!')
        await loadData() // Use loadData instead of loadSettings
      } else {
        alert('Failed to reset settings. Please try again.')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      alert(error?.response?.data?.message || 'Failed to reset settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (updatingProfile) return
    
    // Validate name
    const name = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ').trim()
    if (!name) {
      alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    // Validate password if changing
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        alert(t('currentPasswordRequired', { defaultValue: 'Please enter your current password to change password' }))
        return
      }

      if (profileData.newPassword !== profileData.confirmPassword) {
        alert(tForms('passwordsDoNotMatch', { defaultValue: 'New passwords do not match' }))
        return
      }

      if (profileData.newPassword.length < 8) {
        alert(t('passwordMinLength', { defaultValue: 'Password must be at least 8 characters' }))
        return
      }
    }

    try {
      setUpdatingProfile(true)
      
      const updateData = {
        name: name,
        phone: profileData.phone || null,
        email: profileData.email || null,
        language: language,
        nationalId: profileData.nationalId || null,
        dateOfBirth: profileData.dateOfBirth || null,
        address: profileData.address || null,
        occupation: profileData.occupation || null,
        password: profileData.newPassword || undefined,
        currentPassword: profileData.newPassword ? profileData.currentPassword : undefined
      }

      const res = await api.put('/auth/profile', updateData)
      
      if (res.data?.success) {
        alert(t('profileUpdatedSuccessfully', { defaultValue: 'Profile updated successfully!' }))
        setShowProfileModal(false)
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        // Reload user data
        await loadData()
        // Reload profile image
        const meResponse = await api.get('/auth/me')
        const userData = meResponse.data?.data
        if (userData?.profileImage) {
          setProfileImage(getFileUrl(userData.profileImage))
        } else {
          setProfileImage('')
        }
      } else {
        alert(tCommon('error', { defaultValue: 'Failed to update profile. Please try again.' }))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(error?.response?.data?.message || tCommon('error', { defaultValue: 'Failed to update profile. Please try again.' }))
    } finally {
      setUpdatingProfile(false)
    }
  }

  const tabs = [
    { id: 'general', label: t('general'), icon: Settings },
    { id: 'contributions', label: t('contributions', { defaultValue: 'Contributions' }), icon: DollarSign },
    { id: 'loans', label: t('loans', { defaultValue: 'Loans' }), icon: Users },
    { id: 'notifications', label: t('notifications', { defaultValue: 'Notifications' }), icon: Bell },
    { id: 'security', label: t('security', { defaultValue: 'Security' }), icon: Shield },
    { id: 'profile', label: tCommon('profile'), icon: User },
    { id: 'language', label: t('language', { defaultValue: 'Language' }), icon: Globe }
  ]

  if (loading) {
    return (
      <Layout userRole="Group Admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">{tCommon('loading')}</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('groupSettings')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageGroupConfig')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetSettings}
              className="btn-secondary"
              disabled={saving}
            >
              {t('resetToDefault')}
            </button>
            <button
              onClick={handleSaveSettings}
              className="btn-primary flex items-center gap-2"
              disabled={saving}
            >
              <Save size={18} /> {saving ? tCommon('saving') : t('saveSettings')}
            </button>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="card dark:bg-gray-800 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      if (tab.id === 'profile') {
                        setShowProfileModal(true)
                      }
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('generalInformation', { defaultValue: 'General Information' })}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('groupName')}
                    </label>
                    <input
                      type="text"
                      value={settings.groupName}
                      onChange={(e) => setSettings({ ...settings, groupName: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('groupLocation')}
                    </label>
                    <input
                      type="text"
                      value={settings.groupLocation}
                      onChange={(e) => setSettings({ ...settings, groupLocation: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('groupDescription')}
                    </label>
                    <textarea
                      value={settings.groupDescription}
                      onChange={(e) => setSettings({ ...settings, groupDescription: e.target.value })}
                      className="input-field h-24 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('establishedDate')}
                    </label>
                    <input
                      type="date"
                      value={settings.establishedDate}
                      onChange={(e) => setSettings({ ...settings, establishedDate: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('meetingDay')}
                    </label>
                    <select
                      value={settings.meetingDay}
                      onChange={(e) => setSettings({ ...settings, meetingDay: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value="Monday">{t('monday', { defaultValue: 'Monday' })}</option>
                      <option value="Tuesday">{t('tuesday', { defaultValue: 'Tuesday' })}</option>
                      <option value="Wednesday">{t('wednesday', { defaultValue: 'Wednesday' })}</option>
                      <option value="Thursday">{t('thursday', { defaultValue: 'Thursday' })}</option>
                      <option value="Friday">{t('friday', { defaultValue: 'Friday' })}</option>
                      <option value="Saturday">{t('saturday', { defaultValue: 'Saturday' })}</option>
                      <option value="Sunday">{t('sunday', { defaultValue: 'Sunday' })}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('meetingTime')}
                    </label>
                    <input
                      type="time"
                      value={settings.meetingTime}
                      onChange={(e) => setSettings({ ...settings, meetingTime: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contribution Settings */}
            {activeTab === 'contributions' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('contributionSettings', { defaultValue: 'Contribution Settings' })}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('minimumContribution')} (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.minimumContribution}
                      onChange={(e) => setSettings({ ...settings, minimumContribution: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('maximumContribution')} (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.maximumContribution}
                      onChange={(e) => setSettings({ ...settings, maximumContribution: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('contributionDueDate')} ({t('dayOfMonth', { defaultValue: 'Day of Month' })})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={settings.contributionDueDate}
                      onChange={(e) => setSettings({ ...settings, contributionDueDate: parseInt(e.target.value) || 1 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('lateFee')} (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.lateFee}
                      onChange={(e) => setSettings({ ...settings, lateFee: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('gracePeriod')} ({t('days', { defaultValue: 'Days' })})
                    </label>
                    <input
                      type="number"
                      value={settings.gracePeriod}
                      onChange={(e) => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Loan Settings */}
            {activeTab === 'loans' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('loanSettings', { defaultValue: 'Loan Settings' })}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('maxLoanAmount')} (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.maxLoanAmount}
                      onChange={(e) => setSettings({ ...settings, maxLoanAmount: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('loanInterestRate')} (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.loanInterestRate}
                      onChange={(e) => setSettings({ ...settings, loanInterestRate: parseFloat(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('defaultLoanDuration', { defaultValue: 'Default Loan Duration' })} ({t('months', { defaultValue: 'Months' })})
                    </label>
                    <input
                      type="number"
                      value={settings.loanDuration}
                      onChange={(e) => setSettings({ ...settings, loanDuration: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('loanProcessingFee')} (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.loanProcessingFee}
                      onChange={(e) => setSettings({ ...settings, loanProcessingFee: parseInt(e.target.value) || 0 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('notificationPreferences', { defaultValue: 'Notification Preferences' })}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{t('emailNotifications')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('receiveUpdatesViaEmail')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{t('smsNotifications')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('receiveUpdatesViaSMS')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{t('meetingReminders')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('getRemindedAboutMeetings', { defaultValue: 'Get reminded about upcoming meetings' })}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.meetingReminders}
                        onChange={(e) => setSettings({ ...settings, meetingReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{t('paymentReminders')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('getRemindedAboutPayments', { defaultValue: 'Get reminded about payment deadlines' })}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.paymentReminders}
                        onChange={(e) => setSettings({ ...settings, paymentReminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Language Settings */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('languagePreferences', { defaultValue: 'Language Preferences' })}</h2>
                
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
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
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

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('securitySettings', { defaultValue: 'Security Settings' })}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{t('twoFactorAuthentication', { defaultValue: 'Two-Factor Authentication' })}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('require2FAForAdmin', { defaultValue: 'Require 2FA for admin access' })}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireTwoFactor}
                        onChange={(e) => setSettings({ ...settings, requireTwoFactor: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Session Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Users will be logged out after this period of inactivity</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password Policy
                    </label>
                    <select
                      value={settings.passwordPolicy}
                      onChange={(e) => setSettings({ ...settings, passwordPolicy: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      <option value="low">Low (6+ characters)</option>
                      <option value="medium">Medium (8+ chars, numbers)</option>
                      <option value="high">High (10+ chars, numbers, symbols)</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This applies to all group members</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{t('auditLogging', { defaultValue: 'Audit Logging' })}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('trackAdministrativeActions', { defaultValue: 'Track all administrative actions' })}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.auditLogging}
                        onChange={(e) => setSettings({ ...settings, auditLogging: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('updateProfile')}</h2>
                <button
                  onClick={() => {
                    setShowProfileModal(false)
                    setProfileData({
                      ...profileData,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('personalInformation', { defaultValue: 'Personal Information' })}</h3>
                
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Phone size={16} className="inline mr-2" /> {tForms('phone')}
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="+250788123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Mail size={16} className="inline mr-2" /> {tForms('email')}
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {tForms('nationalId', { defaultValue: 'National ID' })}
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
                      {t('dateOfBirth', { defaultValue: 'Date of Birth' })}
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
                      {t('address', { defaultValue: 'Address' })}
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
                      {t('occupation', { defaultValue: 'Occupation' })}
                    </label>
                    <input
                      type="text"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Lock size={18} /> {t('changePassword')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('currentPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                          className="input-field pr-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          placeholder={t('enterCurrentPassword', { defaultValue: 'Enter current password' })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
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
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                          className="input-field pr-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          placeholder={t('enterNewPassword', { defaultValue: 'Enter new password' })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {settings.passwordPolicy === 'medium' && t('passwordPolicyMedium', { defaultValue: 'Must be at least 8 characters with numbers' })}
                        {settings.passwordPolicy === 'high' && t('passwordPolicyHigh', { defaultValue: 'Must be at least 10 characters with numbers and symbols' })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('confirmPassword')}
                      </label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        placeholder={t('confirmNewPassword', { defaultValue: 'Confirm new password' })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowProfileModal(false)
                      setProfileData({
                        ...profileData,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="btn-secondary flex-1"
                    disabled={updatingProfile}
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="btn-primary flex-1"
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? t('updating', { defaultValue: 'Updating...' }) : t('updateProfile')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminSettings
