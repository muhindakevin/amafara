import { useState } from 'react'
import { Settings, Save, Upload, Globe, MessageCircle, Shield, Database, Smartphone, Mail, Phone, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'

function SystemAdminSystem() {
  const [activeTab, setActiveTab] = useState('general')
  const [showSaveModal, setShowSaveModal] = useState(false)

  const [systemSettings, setSystemSettings] = useState({
    // General Settings
    organizationName: 'Umurenge SACCO',
    organizationLogo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    timezone: 'Africa/Kigali',
    currency: 'RWF',
    language: 'en',
    
    // API Integrations
    mtnApiKey: '••••••••••••••••',
    mtnApiSecret: '••••••••••••••••',
    airtelApiKey: '••••••••••••••••',
    airtelApiSecret: '••••••••••••••••',
    bankApiEndpoint: 'https://api.bank.rw/v1',
    bankApiKey: '••••••••••••••••',
    twilioAccountSid: '••••••••••••••••',
    twilioAuthToken: '••••••••••••••••',
    twilioPhoneNumber: '+250788123456',
    
    // Notification Settings
    emailSmtpHost: 'smtp.gmail.com',
    emailSmtpPort: '587',
    emailUsername: 'noreply@umurenge.rw',
    emailPassword: '••••••••••••••••',
    smsEnabled: true,
    whatsappEnabled: true,
    pushNotificationsEnabled: true,
    
    // Security Settings
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    sessionTimeout: 30,
    twoFactorEnabled: false,
    ipWhitelist: '',
    auditLogRetention: 365,
    
    // Terms and Conditions
    termsOfService: 'By using this platform, you agree to our terms of service...',
    privacyPolicy: 'We respect your privacy and protect your personal data...',
    loanTerms: 'Loan terms and conditions apply...',
  })

  const handleSaveSettings = () => {
    console.log('Saving system settings:', systemSettings)
    alert('System settings saved successfully!')
    setShowSaveModal(false)
  }

  const handleTestConnection = (service) => {
    alert(`Testing ${service} connection...`)
  }

  const handleUploadLogo = () => {
    alert('Logo upload functionality would be implemented here')
  }

  const getConnectionStatus = (service) => {
    // Mock connection status
    const statuses = {
      'MTN Mobile Money': 'connected',
      'Airtel Money': 'connected',
      'Bank API': 'disconnected',
      'Twilio SMS': 'connected',
      'Email SMTP': 'connected'
    }
    return statuses[service] || 'unknown'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-700'
      case 'disconnected': return 'bg-red-100 text-red-700'
      case 'unknown': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600">Configure system settings, integrations, and security parameters</p>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2 overflow-x-auto">
              {['general', 'integrations', 'notifications', 'security', 'terms'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">General Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                      <input
                        type="text"
                        value={systemSettings.organizationName}
                        onChange={(e) => setSystemSettings({...systemSettings, organizationName: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
                      <input
                        type="color"
                        value={systemSettings.primaryColor}
                        onChange={(e) => setSystemSettings({...systemSettings, primaryColor: e.target.value})}
                        className="input-field h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary Color</label>
                      <input
                        type="color"
                        value={systemSettings.secondaryColor}
                        onChange={(e) => setSystemSettings({...systemSettings, secondaryColor: e.target.value})}
                        className="input-field h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Logo</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-600 mb-2">Upload your organization logo</p>
                        <button
                          onClick={handleUploadLogo}
                          className="btn-secondary"
                        >
                          Choose File
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                        className="input-field"
                      >
                        <option value="Africa/Kigali">Africa/Kigali</option>
                        <option value="Africa/Nairobi">Africa/Nairobi</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                      <select
                        value={systemSettings.currency}
                        onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
                        className="input-field"
                      >
                        <option value="RWF">RWF (Rwandan Franc)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">API Integrations</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Money APIs */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Smartphone className="text-blue-600" size={20} />
                        Mobile Money APIs
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(getConnectionStatus('MTN Mobile Money'))}`}>
                        {getConnectionStatus('MTN Mobile Money')}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">MTN API Key</label>
                        <input
                          type="password"
                          value={systemSettings.mtnApiKey}
                          onChange={(e) => setSystemSettings({...systemSettings, mtnApiKey: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">MTN API Secret</label>
                        <input
                          type="password"
                          value={systemSettings.mtnApiSecret}
                          onChange={(e) => setSystemSettings({...systemSettings, mtnApiSecret: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Airtel API Key</label>
                        <input
                          type="password"
                          value={systemSettings.airtelApiKey}
                          onChange={(e) => setSystemSettings({...systemSettings, airtelApiKey: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Airtel API Secret</label>
                        <input
                          type="password"
                          value={systemSettings.airtelApiSecret}
                          onChange={(e) => setSystemSettings({...systemSettings, airtelApiSecret: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('Mobile Money')}
                        className="btn-secondary w-full"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>

                  {/* Bank API */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Database className="text-green-600" size={20} />
                        Bank API
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(getConnectionStatus('Bank API'))}`}>
                        {getConnectionStatus('Bank API')}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">API Endpoint</label>
                        <input
                          type="url"
                          value={systemSettings.bankApiEndpoint}
                          onChange={(e) => setSystemSettings({...systemSettings, bankApiEndpoint: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={systemSettings.bankApiKey}
                          onChange={(e) => setSystemSettings({...systemSettings, bankApiKey: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('Bank API')}
                        className="btn-secondary w-full"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>

                  {/* Twilio SMS */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <MessageCircle className="text-purple-600" size={20} />
                        Twilio SMS
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(getConnectionStatus('Twilio SMS'))}`}>
                        {getConnectionStatus('Twilio SMS')}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Account SID</label>
                        <input
                          type="password"
                          value={systemSettings.twilioAccountSid}
                          onChange={(e) => setSystemSettings({...systemSettings, twilioAccountSid: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Auth Token</label>
                        <input
                          type="password"
                          value={systemSettings.twilioAuthToken}
                          onChange={(e) => setSystemSettings({...systemSettings, twilioAuthToken: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={systemSettings.twilioPhoneNumber}
                          onChange={(e) => setSystemSettings({...systemSettings, twilioPhoneNumber: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('Twilio SMS')}
                        className="btn-secondary w-full"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Notification Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Settings */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Mail className="text-blue-600" size={20} />
                      Email Configuration
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={systemSettings.emailSmtpHost}
                          onChange={(e) => setSystemSettings({...systemSettings, emailSmtpHost: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Port</label>
                        <input
                          type="number"
                          value={systemSettings.emailSmtpPort}
                          onChange={(e) => setSystemSettings({...systemSettings, emailSmtpPort: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <input
                          type="email"
                          value={systemSettings.emailUsername}
                          onChange={(e) => setSystemSettings({...systemSettings, emailUsername: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          value={systemSettings.emailPassword}
                          onChange={(e) => setSystemSettings({...systemSettings, emailPassword: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('Email SMTP')}
                        className="btn-secondary w-full"
                      >
                        Test Email
                      </button>
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageCircle className="text-green-600" size={20} />
                      Notification Channels
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">SMS Notifications</p>
                          <p className="text-sm text-gray-600">Send SMS via Twilio</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.smsEnabled}
                            onChange={(e) => setSystemSettings({...systemSettings, smsEnabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">WhatsApp Notifications</p>
                          <p className="text-sm text-gray-600">Send WhatsApp messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.whatsappEnabled}
                            onChange={(e) => setSystemSettings({...systemSettings, whatsappEnabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">Push Notifications</p>
                          <p className="text-sm text-gray-600">Browser push notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.pushNotificationsEnabled}
                            onChange={(e) => setSystemSettings({...systemSettings, pushNotificationsEnabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield className="text-red-600" size={20} />
                      Password Policy
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Length</label>
                        <input
                          type="number"
                          value={systemSettings.passwordMinLength}
                          onChange={(e) => setSystemSettings({...systemSettings, passwordMinLength: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Require Special Characters</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.passwordRequireSpecial}
                            onChange={(e) => setSystemSettings({...systemSettings, passwordRequireSpecial: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="text-orange-600" size={20} />
                      Session Management
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          value={systemSettings.sessionTimeout}
                          onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: e.target.value})}
                          className="input-field"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.twoFactorEnabled}
                            onChange={(e) => setSystemSettings({...systemSettings, twoFactorEnabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Database className="text-blue-600" size={20} />
                      Data Management
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">IP Whitelist</label>
                        <textarea
                          value={systemSettings.ipWhitelist}
                          onChange={(e) => setSystemSettings({...systemSettings, ipWhitelist: e.target.value})}
                          className="input-field h-20"
                          placeholder="Enter IP addresses separated by commas"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Audit Log Retention (days)</label>
                        <input
                          type="number"
                          value={systemSettings.auditLogRetention}
                          onChange={(e) => setSystemSettings({...systemSettings, auditLogRetention: e.target.value})}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Terms & Conditions</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Terms of Service</label>
                    <textarea
                      value={systemSettings.termsOfService}
                      onChange={(e) => setSystemSettings({...systemSettings, termsOfService: e.target.value})}
                      className="input-field h-32"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Privacy Policy</label>
                    <textarea
                      value={systemSettings.privacyPolicy}
                      onChange={(e) => setSystemSettings({...systemSettings, privacyPolicy: e.target.value})}
                      className="input-field h-32"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Terms</label>
                    <textarea
                      value={systemSettings.loanTerms}
                      onChange={(e) => setSystemSettings({...systemSettings, loanTerms: e.target.value})}
                      className="input-field h-32"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowSaveModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={20} /> Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Save Confirmation Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Save className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Save Settings</h2>
                  <p className="text-gray-600">Are you sure you want to save these changes?</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="btn-primary flex-1"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminSystem


