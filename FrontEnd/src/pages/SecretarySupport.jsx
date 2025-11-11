import { useState } from 'react'
import { Users, FileText, CheckCircle, Clock, AlertCircle, Eye, Edit, Download } from 'lucide-react'
import Layout from '../components/Layout'

function SecretarySupport() {
  const [activeTab, setActiveTab] = useState('verification')
  
  const pendingVerifications = [
    { id: 'V001', member: 'Ikirezi Jane', documents: 'ID, Proof of Address', status: 'pending', submittedDate: '2024-01-20' },
    { id: 'V002', member: 'Uwimana Grace', documents: 'ID, Bank Statement', status: 'pending', submittedDate: '2024-01-19' }
  ]

  const loanDecisions = [
    { id: 'L001', member: 'Kamikazi Marie', amount: 80000, decision: 'approved', date: '2024-01-20' },
    { id: 'L002', member: 'Mukamana Alice', amount: 50000, decision: 'approved', date: '2024-01-18' },
    { id: 'L003', member: 'Mutabazi Paul', amount: 100000, decision: 'rejected', date: '2024-01-15' }
  ]

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Support to Group Admin & Cashier</h1>
          <p className="text-gray-600 mt-1">Assist group leaders and financial team</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['verification', 'loans', 'schedules', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab ? 'bg-primary-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'verification' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Member Verification</h2>
                <div className="space-y-3">
                  {pendingVerifications.map((verification) => (
                    <div key={verification.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{verification.member}</h3>
                          <p className="text-sm text-gray-600">{verification.documents}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm px-3 py-1">Verify</button>
                          <button className="btn-secondary text-sm px-3 py-1">View Docs</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'loans' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Loan Decision Records</h2>
                <div className="space-y-3">
                  {loanDecisions.map((loan) => (
                    <div key={loan.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{loan.member}</h3>
                          <p className="text-sm text-gray-600">Amount: {loan.amount.toLocaleString()} RWF</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            loan.decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {loan.decision}
                          </span>
                          <button className="btn-secondary text-sm px-3 py-1">View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'schedules' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Contribution Schedules</h2>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto mb-2" size={48} />
                  <p>Contribution schedule management</p>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Financial Report Summaries</h2>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto mb-2" size={48} />
                  <p>Financial report summary preparation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretarySupport
