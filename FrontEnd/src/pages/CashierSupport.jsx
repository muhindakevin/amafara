import { useState, useEffect } from 'react'
import { HelpCircle, Users, FileText, CheckCircle, Clock, AlertCircle, MessageCircle, RefreshCw, Info, DollarSign } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'

function CashierSupport() {
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

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
              Secretary Support Services
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              How the Secretary can help you with financial management
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
                        meeting schedules, and financial reports. This helps ensure accurate financial records and smooth operations.
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
                      The Secretary verifies new members, ensuring all documentation is complete before they can make contributions or request loans.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="text-green-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Loan Documentation</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary maintains complete loan records, helping you track which loans have been approved and need to be recorded.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="text-purple-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Financial Reports</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary can generate financial summaries and reports that help you verify your records and ensure accuracy.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="text-orange-600" size={24} />
                      <h3 className="font-semibold text-gray-800 dark:text-white">Meeting Records</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The Secretary tracks meeting attendance and decisions that may affect financial transactions and member accounts.
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
                    The Secretary's verification work helps you by:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Ensuring only verified members can make contributions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Verifying member identity before processing financial transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Maintaining accurate member records for financial tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Providing documentation for audit purposes</span>
                    </li>
                  </ul>
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
                    The Secretary's loan documentation helps you:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Know which loans have been approved and need to be recorded</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Track loan amounts, terms, and guarantor information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Maintain accurate records of loan disbursements and payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Verify loan details before processing transactions</span>
                    </li>
                  </ul>
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
                    Meeting records help you:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Understand financial decisions made during meetings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Track member attendance for contribution verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Reference meeting minutes for financial transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Maintain accurate records for audit purposes</span>
                    </li>
                  </ul>
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
                    The Secretary can provide reports to help you:
                  </p>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Verify your financial records against group summaries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Cross-check contribution totals and loan payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Identify discrepancies in financial records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={18} />
                      <span>Generate comprehensive reports for audits and reviews</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> Request specific reports from your Secretary to ensure your records match group records.
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

export default CashierSupport

