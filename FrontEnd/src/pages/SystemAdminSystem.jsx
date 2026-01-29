import { useState, useEffect } from 'react'
import { Settings, Save, Upload, Globe, MessageCircle, Shield, Database, Smartphone, Mail, Phone, AlertCircle, CheckCircle, XCircle, Plus } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminSystem() {
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [activeTab, setActiveTab] = useState('general')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddIntegration, setShowAddIntegration] = useState(false)
  const [newIntegration, setNewIntegration] = useState({ name: '', type: '', endpoint: '', apiKey: '', apiSecret: '', config: {} })

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
    integrations: {
      mtn: { apiKey: '', apiSecret: '', enabled: false },
      airtel: { apiKey: '', apiSecret: '', enabled: false },
      bank: { endpoint: '', apiKey: '', enabled: false },
      twilio: { accountSid: '', authToken: '', phoneNumber: '', enabled: false },
      googleMaps: { apiKey: '', enabled: false },
      custom: []
    },
    
    // Notification Settings
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      username: '',
      password: '',
      enabled: true
    },
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

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/system-admin/settings')
      if (data?.success) {
        setSystemSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      alert(tSystemAdmin('failedToFetchSettings', { defaultValue: 'Failed to fetch settings' }))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await api.put('/system-admin/settings', systemSettings)
      alert(tSystemAdmin('systemSettingsSaved', { defaultValue: 'System settings saved successfully!' }))
      setShowSaveModal(false)
      await fetchSettings() // Refresh to get any server-side updates
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert(error.response?.data?.message || tSystemAdmin('failedToSaveSettings', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (type, config) => {
    try {
      console.log('[SystemAdminSystem] Testing connection:', { type, config })
      if (!config) {
        alert(tSystemAdmin('configurationRequired', { defaultValue: 'Configuration is required' }))
        return
      }
      const { data } = await api.post('/system-admin/settings/test-connection', { type, config })
      console.log('[SystemAdminSystem] Test connection response:', data)
      if (data?.success) {
        alert(data.message || tSystemAdmin('connectionSuccessful', { defaultValue: 'Connection successful!' }))
      } else {
        // Show detailed error message
        let errorMsg = data.message || tSystemAdmin('connectionFailed', { defaultValue: 'Connection failed' })
        if (data.details) {
          errorMsg += '\n\n' + data.details
        }
        alert(errorMsg)
      }
    } catch (error) {
      console.error('[SystemAdminSystem] Test connection error:', error)
      let errorMsg = error.response?.data?.message || error.message || tSystemAdmin('connectionTestFailed', { defaultValue: 'Connection test failed' })
      if (error.response?.data?.details) {
        errorMsg += '\n\n' + error.response.data.details
      }
      alert(errorMsg)
    }
  }

  const handleAddCustomIntegration = async () => {
    if (!newIntegration.name || !newIntegration.type) {
      alert(tSystemAdmin('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }
    try {
      await api.post('/system-admin/settings/integrations/custom', newIntegration)
      alert(tSystemAdmin('integrationAdded', { defaultValue: 'Custom integration added successfully!' }))
      setShowAddIntegration(false)
      setNewIntegration({ name: '', type: '', endpoint: '', apiKey: '', apiSecret: '', config: {} })
      await fetchSettings()
    } catch (error) {
      alert(error.response?.data?.message || tSystemAdmin('failedToAddIntegration', { defaultValue: 'Failed to add integration' }))
    }
  }

  const handleUploadLogo = () => {
    alert(tSystemAdmin('logoUploadPlaceholder', { defaultValue: 'Logo upload functionality would be implemented here' }))
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('systemConfiguration', { defaultValue: 'System Configuration' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('configureSystemSettings', { defaultValue: 'Configure system settings, integrations, and security parameters' })}</p>

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
                  {t(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
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
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">API Integrations</h2>
                  <button
                    onClick={() => setShowAddIntegration(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={20} /> Add Custom Integration
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mobile Money APIs */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Smartphone className="text-blue-600" size={20} />
                        MTN Mobile Money
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.integrations?.mtn?.enabled || false}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              mtn: { ...systemSettings.integrations?.mtn, enabled: e.target.checked }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">MTN API Key</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.mtn?.apiKey || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              mtn: { ...systemSettings.integrations?.mtn, apiKey: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter MTN API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">MTN API Secret</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.mtn?.apiSecret || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              mtn: { ...systemSettings.integrations?.mtn, apiSecret: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter MTN API Secret"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('mtn', systemSettings.integrations?.mtn)}
                        className="btn-secondary w-full"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>

                  {/* Airtel Money */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Smartphone className="text-green-600" size={20} />
                        Airtel Money
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.integrations?.airtel?.enabled || false}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              airtel: { ...systemSettings.integrations?.airtel, enabled: e.target.checked }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Airtel API Key</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.airtel?.apiKey || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              airtel: { ...systemSettings.integrations?.airtel, apiKey: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter Airtel API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Airtel API Secret</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.airtel?.apiSecret || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              airtel: { ...systemSettings.integrations?.airtel, apiSecret: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter Airtel API Secret"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('airtel', systemSettings.integrations?.airtel)}
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
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.integrations?.bank?.enabled || false}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              bank: { ...systemSettings.integrations?.bank, enabled: e.target.checked }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">API Endpoint</label>
                        <input
                          type="url"
                          value={systemSettings.integrations?.bank?.endpoint || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              bank: { ...systemSettings.integrations?.bank, endpoint: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="https://api.bank.rw/v1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.bank?.apiKey || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              bank: { ...systemSettings.integrations?.bank, apiKey: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter Bank API Key"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('bank', systemSettings.integrations?.bank)}
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
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.integrations?.twilio?.enabled || false}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              twilio: { ...systemSettings.integrations?.twilio, enabled: e.target.checked }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Account SID</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.twilio?.accountSid || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              twilio: { ...systemSettings.integrations?.twilio, accountSid: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter Twilio Account SID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Auth Token</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.twilio?.authToken || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              twilio: { ...systemSettings.integrations?.twilio, authToken: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="Enter Twilio Auth Token"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={systemSettings.integrations?.twilio?.phoneNumber || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              twilio: { ...systemSettings.integrations?.twilio, phoneNumber: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="+250788123456"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('twilio', systemSettings.integrations?.twilio)}
                        className="btn-secondary w-full"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Globe className="text-red-600" size={20} />
                        Google Maps
                      </h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.integrations?.googleMaps?.enabled || false}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              googleMaps: { ...systemSettings.integrations?.googleMaps, enabled: e.target.checked }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Google Maps API Key</label>
                        <input
                          type="password"
                          value={systemSettings.integrations?.googleMaps?.apiKey || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            integrations: {
                              ...systemSettings.integrations,
                              googleMaps: { ...systemSettings.integrations?.googleMaps, apiKey: e.target.value }
                            }
                          })}
                          className="input-field"
                          placeholder="AIzaSy..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get your API key from{' '}
                          <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Google Cloud Console
                          </a>
                        </p>
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
                          <strong>Important:</strong> If you get a "restricted" error:
                          <ol className="list-decimal list-inside mt-1 space-y-1 ml-2">
                            <li>Enable <strong>Maps JavaScript API</strong> in Google Cloud Console</li>
                            <li>Check API key restrictions - allow "Maps JavaScript API"</li>
                            <li>Enable billing (required even for free tier)</li>
                            <li>Wait 2-5 minutes after changes</li>
                          </ol>
                          <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                            Enable Maps JavaScript API →
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTestConnection('googleMaps', systemSettings.integrations?.googleMaps)}
                        className="btn-secondary w-full"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>

                  {/* Custom Integrations */}
                  {systemSettings.integrations?.custom?.map((integration) => (
                    <div key={integration.id} className="card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Database className="text-orange-600" size={20} />
                          {integration.name}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {integration.type}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Endpoint:</strong> {integration.endpoint || 'N/A'}</p>
                        <p><strong>Status:</strong> {integration.enabled ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  ))}
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
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">Email Enabled</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.email?.enabled !== false}
                            onChange={(e) => setSystemSettings({
                              ...systemSettings,
                              email: { ...systemSettings.email, enabled: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={systemSettings.email?.smtpHost || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, smtpHost: e.target.value }
                          })}
                          className="input-field"
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Port</label>
                        <input
                          type="number"
                          value={systemSettings.email?.smtpPort || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, smtpPort: e.target.value }
                          })}
                          className="input-field"
                          placeholder="587"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <input
                          type="email"
                          value={systemSettings.email?.username || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, username: e.target.value }
                          })}
                          className="input-field"
                          placeholder="noreply@umurenge.rw"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          value={systemSettings.email?.password || ''}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            email: { ...systemSettings.email, password: e.target.value }
                          })}
                          className="input-field"
                          placeholder="Enter SMTP password"
                        />
                      </div>
                      <button
                        onClick={() => handleTestConnection('email', systemSettings.email)}
                        className="btn-secondary w-full"
                      >
                        Test Email Connection
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
                disabled={loading || saving}
              >
                <Save size={20} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Add Custom Integration Modal */}
        {showAddIntegration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Add Custom Integration</h2>
                <button onClick={() => setShowAddIntegration(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Integration Name</label>
                  <input
                    type="text"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Custom Payment Gateway"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Integration Type</label>
                  <select
                    value={newIntegration.type}
                    onChange={(e) => setNewIntegration({...newIntegration, type: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Type</option>
                    <option value="payment">Payment Gateway</option>
                    <option value="banking">Banking API</option>
                    <option value="sms">SMS Provider</option>
                    <option value="email">Email Provider</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">API Endpoint</label>
                  <input
                    type="url"
                    value={newIntegration.endpoint}
                    onChange={(e) => setNewIntegration({...newIntegration, endpoint: e.target.value})}
                    className="input-field"
                    placeholder="https://api.example.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    value={newIntegration.apiKey}
                    onChange={(e) => setNewIntegration({...newIntegration, apiKey: e.target.value})}
                    className="input-field"
                    placeholder="Enter API Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">API Secret (Optional)</label>
                  <input
                    type="password"
                    value={newIntegration.apiSecret}
                    onChange={(e) => setNewIntegration({...newIntegration, apiSecret: e.target.value})}
                    className="input-field"
                    placeholder="Enter API Secret"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddIntegration(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomIntegration}
                  className="btn-primary flex-1"
                >
                  Add Integration
                </button>
              </div>
            </div>
          </div>
        )}

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
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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


