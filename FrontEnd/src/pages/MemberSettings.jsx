import { useEffect, useState } from 'react'
import { User, Shield, Bell, Globe, Key, Smartphone, Mail, Save, Eye, EyeOff } from 'lucide-react'
import Layout from '../components/Layout'
import { getTranslation } from '../utils/translations'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function MemberSettings() {
  const { language } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

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
        occupation: u.occupation || ''
      })
    })
  }, [])

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true,
    biometricEnabled: false
  })

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
    try {
      const name = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ').trim()
      await api.put('/members/profile', {
        name,
        email: profileData.email,
        language,
        occupation: profileData.occupation,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth
      })
      alert('Profile updated successfully!')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update profile')
    }
  }

  const handleChangePassword = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('New passwords do not match!')
      return
    }
    console.log('Changing password...')
    alert('Password changed successfully!')
    setSecurityData({ ...securityData, currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleSaveNotifications = () => {
    console.log('Saving notification settings:', notificationSettings)
    alert('Notification settings updated!')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language', icon: Globe }
  ]

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
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
                <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID
                    </label>
                    <input
                      type="text"
                      value={profileData.nationalId}
                      onChange={(e) => setProfileData({ ...profileData, nationalId: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={profileData.occupation}
                      onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        className="input-field pr-12"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        className="input-field pr-12"
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  className="btn-primary flex items-center gap-2"
                >
                  <Key size={18} /> Change Password
                </button>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Two-Factor Authentication</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Smartphone className="text-blue-600" size={24} />
                        <div>
                          <p className="font-semibold text-gray-800">SMS Authentication</p>
                          <p className="text-sm text-gray-600">Receive OTP via SMS</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityData.twoFactorEnabled}
                          onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Shield className="text-green-600" size={24} />
                        <div>
                          <p className="font-semibold text-gray-800">Biometric Authentication</p>
                          <p className="text-sm text-gray-600">Use fingerprint or face recognition</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityData.biometricEnabled}
                          onChange={(e) => setSecurityData({ ...securityData, biometricEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via SMS</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell className="text-purple-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800">Push Notifications</p>
                        <p className="text-sm text-gray-600">Receive push notifications</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-yellow-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800">Contribution Reminders</p>
                        <p className="text-sm text-gray-600">Reminders for monthly contributions</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Key className="text-red-600" size={24} />
                      <div>
                        <p className="font-semibold text-gray-800">Loan Reminders</p>
                        <p className="text-sm text-gray-600">Reminders for loan payments</p>
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
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={18} /> Save Notification Settings
                </button>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Language Preferences</h2>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Language settings are managed globally. Use the language selector (🌍) in the top navigation bar to change your preferred language.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Available Languages</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🇺🇸</span>
                        <span className="font-medium">English</span>
                        <span className="text-sm text-gray-500">(Default)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🇷🇼</span>
                        <span className="font-medium">Kinyarwanda</span>
                        <span className="text-sm text-gray-500">(Complete translation)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🇫🇷</span>
                        <span className="font-medium">Français</span>
                        <span className="text-sm text-gray-500">(Complete translation)</span>
                      </div>
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


