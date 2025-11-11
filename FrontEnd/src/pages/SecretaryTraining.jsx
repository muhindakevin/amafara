import { useState } from 'react'
import { BookOpen, Upload, Eye, Download, Plus, Users, MessageCircle } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryTraining() {
  const [activeTab, setActiveTab] = useState('materials')
  
  const educationalMaterials = [
    { id: 'E001', title: 'Financial Literacy Basics', type: 'PDF', category: 'Finance', uploadDate: '2024-01-20' },
    { id: 'E002', title: 'Savings Strategies', type: 'Video', category: 'Finance', uploadDate: '2024-01-18' },
    { id: 'E003', title: 'Loan Management', type: 'Article', category: 'Loans', uploadDate: '2024-01-15' }
  ]

  const policyUpdates = [
    { id: 'P001', title: 'New Contribution Rules', source: 'System Admin', date: '2024-01-20', status: 'active' },
    { id: 'P002', title: 'Updated Loan Policy', source: 'Agent', date: '2024-01-18', status: 'active' }
  ]

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Training & Member Education</h1>
          <p className="text-gray-600 mt-1">Provide educational resources and support</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['materials', 'support', 'policies'].map((tab) => (
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
            {activeTab === 'materials' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Educational Materials</h2>
                  <button className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Upload Material
                  </button>
                </div>
                <div className="space-y-3">
                  {educationalMaterials.map((material) => (
                    <div key={material.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{material.title}</h3>
                          <p className="text-sm text-gray-600">{material.type} • {material.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm px-3 py-1">View</button>
                          <button className="btn-secondary text-sm px-3 py-1">Download</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Member Support</h2>
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="mx-auto mb-2" size={48} />
                  <p>Member support chat and help system</p>
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Policy Updates</h2>
                <div className="space-y-3">
                  {policyUpdates.map((policy) => (
                    <div key={policy.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{policy.title}</h3>
                          <p className="text-sm text-gray-600">From: {policy.source}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {policy.status}
                          </span>
                          <button className="btn-primary text-sm px-3 py-1">View</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryTraining
