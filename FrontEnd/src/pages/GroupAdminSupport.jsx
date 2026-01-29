import { useState, useEffect } from 'react'
import { HelpCircle, Users, FileText, CheckCircle, Clock, AlertCircle, MessageCircle, RefreshCw, Info } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'

function GroupAdminSupport() {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [groupId, setGroupId] = useState(null)

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success && response.data.data.groupId) {
        setGroupId(response.data.data.groupId)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Secretary Support Services
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              How the Secretary can help you manage your group
            </p>
          </div>
          <button
            onClick={fetchUserInfo}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1.5 p-1.5 overflow-x-auto scrollbar-hide">
              {['overview', 'verification', 'loans', 'schedules', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24} />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Secretary Support Overview
                      </h3>
                      <p className="text-blue-800 dark:text-blue-200">
                        Your Secretary is available to assist with member verification, loan documentation, 
                        meeting schedules, and financial reports. Use the tabs above to see what help is available in each area.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="text-primary-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Member Verification</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary can verify new member applications, review documents, and approve or reject applications on your behalf.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="text-green-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Loan Documentation</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary maintains records of all loan requests, approvals, and decisions to help you track loan activities.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="text-purple-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Meeting Schedules</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary can help organize and manage group meetings, track attendance, and maintain meeting records.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="text-orange-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Financial Reports</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary can generate and export financial reports, summaries, and transaction records for your review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Member Verification Support
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The Secretary can help you with member verification by:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Reviewing and verifying new member applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Checking submitted documents for completeness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Approving or rejecting applications based on group criteria</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Maintaining records of all verification activities</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Contact your Secretary directly or check the Secretary Support page to see pending verifications.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'loans' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Loan Documentation Support
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The Secretary maintains comprehensive loan documentation including:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>All loan requests and their status</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Approval and rejection records with reasons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Guarantor information and verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Loan decision history and documentation</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> The Secretary can provide detailed loan reports and documentation upon request.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedules' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Meeting Schedule Support
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The Secretary can assist with meeting management:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Creating and managing meeting schedules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Tracking meeting attendance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Maintaining meeting minutes and records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Organizing meeting agendas and follow-ups</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Contact your Secretary to schedule meetings or view meeting history.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Financial Report Support
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    The Secretary can generate and provide:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Financial report summaries with date ranges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Transaction history and detailed records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Contribution and loan payment summaries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Exportable reports in Excel format</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Request specific reports from your Secretary or access them through the Secretary Support page.
                    </p>
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

export default GroupAdminSupport

