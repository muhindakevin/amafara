import { useState } from 'react'
import { Settings, Save, Bell, Shield, Users, DollarSign, Calendar, Globe } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    // General Settings
    groupName: 'Ikimina "Abahizi"',
    groupDescription: 'A community savings group focused on financial empowerment',
    groupLocation: 'Kigali, Rwanda',
    establishedDate: '2023-01-15',
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
    loanDeadlines: true,
    
    // Security Settings
    requireTwoFactor: false,
    sessionTimeout: 30,
    passwordPolicy: 'medium',
    auditLogging: true
  })

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings)
    alert('Settings saved successfully!')
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      alert('Settings reset to default values!')
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'contributions', label: 'Contributions', icon: DollarSign },
    { id: 'loans', label: 'Loans', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Group Settings</h1>
            <p className="text-gray-600 mt-1">Manage group configuration and preferences</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetSettings}
              className="btn-secondary"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSaveSettings}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="card">
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
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={settings.groupName}
                      onChange={(e) => setSettings({ ...settings, groupName: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={settings.groupLocation}
                      onChange={(e) => setSettings({ ...settings, groupLocation: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Group Description
                    </label>
                    <textarea
                      value={settings.groupDescription}
                      onChange={(e) => setSettings({ ...settings, groupDescription: e.target.value })}
                      className="input-field h-24 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Established Date
                    </label>
                    <input
                      type="date"
                      value={settings.establishedDate}
                      onChange={(e) => setSettings({ ...settings, establishedDate: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meeting Day
                    </label>
                    <select
                      value={settings.meetingDay}
                      onChange={(e) => setSettings({ ...settings, meetingDay: e.target.value })}
                      className="input-field"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meeting Time
                    </label>
                    <input
                      type="time"
                      value={settings.meetingTime}
                      onChange={(e) => setSettings({ ...settings, meetingTime: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contribution Settings */}
            {activeTab === 'contributions' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Contribution Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Contribution (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.minimumContribution}
                      onChange={(e) => setSettings({ ...settings, minimumContribution: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maximum Contribution (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.maximumContribution}
                      onChange={(e) => setSettings({ ...settings, maximumContribution: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date (Day of Month)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={settings.contributionDueDate}
                      onChange={(e) => setSettings({ ...settings, contributionDueDate: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Late Fee (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.lateFee}
                      onChange={(e) => setSettings({ ...settings, lateFee: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Grace Period (Days)
                    </label>
                    <input
                      type="number"
                      value={settings.gracePeriod}
                      onChange={(e) => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Loan Settings */}
            {activeTab === 'loans' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Loan Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maximum Loan Amount (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.maxLoanAmount}
                      onChange={(e) => setSettings({ ...settings, maxLoanAmount: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.loanInterestRate}
                      onChange={(e) => setSettings({ ...settings, loanInterestRate: parseFloat(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Default Loan Duration (Months)
                    </label>
                    <input
                      type="number"
                      value={settings.loanDuration}
                      onChange={(e) => setSettings({ ...settings, loanDuration: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Processing Fee (RWF)
                    </label>
                    <input
                      type="number"
                      value={settings.loanProcessingFee}
                      onChange={(e) => setSettings({ ...settings, loanProcessingFee: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive important updates via email</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Receive urgent updates via SMS</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">Meeting Reminders</h3>
                      <p className="text-sm text-gray-600">Get reminded about upcoming meetings</p>
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

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">Payment Reminders</h3>
                      <p className="text-sm text-gray-600">Get reminded about payment deadlines</p>
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

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Require 2FA for admin access</p>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Session Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password Policy
                    </label>
                    <select
                      value={settings.passwordPolicy}
                      onChange={(e) => setSettings({ ...settings, passwordPolicy: e.target.value })}
                      className="input-field"
                    >
                      <option value="low">Low (6+ characters)</option>
                      <option value="medium">Medium (8+ chars, numbers)</option>
                      <option value="high">High (10+ chars, numbers, symbols)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">Audit Logging</h3>
                      <p className="text-sm text-gray-600">Log all admin activities</p>
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
      </div>
    </Layout>
  )
}

export default GroupAdminSettings

