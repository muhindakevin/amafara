import { useState } from 'react'
import { Archive, FileText, Download, Search, Filter, Eye, Edit, Trash2, Calendar } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryArchive() {
  const [activeTab, setActiveTab] = useState('meetings')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('all')

  const archivedDocuments = {
    meetings: [
      { id: 'M001', title: 'Monthly Group Meeting', date: '2024-01-20', type: 'Minutes', size: '2.3 MB' },
      { id: 'M002', title: 'Emergency Meeting', date: '2024-01-15', type: 'Minutes', size: '1.8 MB' }
    ],
    announcements: [
      { id: 'A001', title: 'Contribution Deadline Reminder', date: '2024-01-20', type: 'Announcement', size: '0.5 MB' },
      { id: 'A002', title: 'Policy Update Notice', date: '2024-01-18', type: 'Notice', size: '0.7 MB' }
    ],
    fines: [
      { id: 'F001', title: 'Late Payment Fines', date: '2024-01-15', type: 'Fine Record', size: '1.2 MB' },
      { id: 'F002', title: 'Attendance Violations', date: '2024-01-10', type: 'Violation Record', size: '0.9 MB' }
    ],
    rules: [
      { id: 'R001', title: 'Group Constitution', date: '2024-01-05', type: 'Constitution', size: '3.1 MB' },
      { id: 'R002', title: 'Updated Loan Policy', date: '2024-01-01', type: 'Policy', size: '2.5 MB' }
    ]
  }

  const getCurrentDocuments = () => {
    return archivedDocuments[activeTab] || []
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Documentation & Archiving</h1>
          <p className="text-gray-600 mt-1">Store and organize group documents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Documents</p>
                <p className="text-2xl font-bold text-gray-800">127</p>
              </div>
              <Archive className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Meeting Minutes</p>
                <p className="text-2xl font-bold text-green-600">45</p>
              </div>
              <FileText className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Announcements</p>
                <p className="text-2xl font-bold text-purple-600">32</p>
              </div>
              <FileText className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Policy Documents</p>
                <p className="text-2xl font-bold text-orange-600">50</p>
              </div>
              <FileText className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['meetings', 'announcements', 'fines', 'rules'].map((tab) => (
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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search documents..."
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Dates</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {getCurrentDocuments().map((doc) => (
                <div key={doc.id} className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        {doc.title[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{doc.title}</h3>
                        <p className="text-sm text-gray-600">{doc.type} • {doc.size}</p>
                        <p className="text-xs text-gray-500">{doc.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary text-sm px-3 py-1 flex items-center gap-1">
                        <Eye size={14} /> View
                      </button>
                      <button className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
                        <Download size={14} /> Download
                      </button>
                      <button className="btn-secondary text-sm px-3 py-1 flex items-center gap-1">
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SecretaryArchive
