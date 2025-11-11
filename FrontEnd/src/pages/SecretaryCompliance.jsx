import { useState } from 'react'
import { Shield, FileText, AlertCircle, CheckCircle, Users, Eye, Edit, Download, Plus, XCircle } from 'lucide-react'
import Layout from '../components/Layout'

function SecretaryCompliance() {
  const [activeTab, setActiveTab] = useState('rules')
  const [showAddRule, setShowAddRule] = useState(false)
  const [showReportViolation, setShowReportViolation] = useState(false)

  const groupRules = [
    {
      id: 'R001',
      title: 'Monthly Contribution Requirement',
      description: 'All members must contribute a minimum of RWF 5,000 per month',
      category: 'Financial',
      status: 'active',
      lastUpdated: '2024-01-15',
      violations: 2
    },
    {
      id: 'R002',
      title: 'Meeting Attendance Policy',
      description: 'Members must attend at least 80% of monthly meetings',
      category: 'Attendance',
      status: 'active',
      lastUpdated: '2024-01-10',
      violations: 1
    },
    {
      id: 'R003',
      title: 'Loan Repayment Schedule',
      description: 'All loan payments must be made on time as per agreed schedule',
      category: 'Financial',
      status: 'active',
      lastUpdated: '2024-01-05',
      violations: 3
    }
  ]

  const violations = [
    {
      id: 'V001',
      member: 'Mutabazi Paul',
      rule: 'Monthly Contribution Requirement',
      description: 'Failed to make contribution for 2 consecutive months',
      date: '2024-01-18',
      status: 'pending',
      severity: 'high',
      reportedBy: 'Cashier'
    },
    {
      id: 'V002',
      member: 'Uwimana Grace',
      rule: 'Meeting Attendance Policy',
      description: 'Missed 4 consecutive meetings',
      date: '2024-01-15',
      status: 'resolved',
      severity: 'medium',
      reportedBy: 'Secretary'
    },
    {
      id: 'V003',
      member: 'Nkurunziza Peter',
      rule: 'Loan Repayment Schedule',
      description: 'Late payment for 3 consecutive months',
      date: '2024-01-12',
      status: 'under-review',
      severity: 'high',
      reportedBy: 'Cashier'
    }
  ]

  const agreements = [
    {
      id: 'AG001',
      title: 'Group Constitution Amendment',
      description: 'Updated contribution amounts and meeting policies',
      date: '2024-01-20',
      signedBy: 'Group Admin',
      status: 'active',
      members: 45
    },
    {
      id: 'AG002',
      title: 'Loan Policy Agreement',
      description: 'New loan approval process and repayment terms',
      date: '2024-01-15',
      signedBy: 'Group Admin',
      status: 'active',
      members: 45
    }
  ]

  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    category: 'General'
  })

  const [newViolation, setNewViolation] = useState({
    member: '',
    rule: '',
    description: '',
    severity: 'medium'
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'resolved': return 'bg-blue-100 text-blue-700'
      case 'under-review': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleAddRule = () => {
    console.log('Adding new rule:', newRule)
    alert('Rule added successfully!')
    setShowAddRule(false)
    setNewRule({
      title: '',
      description: '',
      category: 'General'
    })
  }

  const handleReportViolation = () => {
    console.log('Reporting violation:', newViolation)
    alert('Violation reported successfully!')
    setShowReportViolation(false)
    setNewViolation({
      member: '',
      rule: '',
      description: '',
      severity: 'medium'
    })
  }

  const handleViewRule = (ruleId) => {
    console.log('Viewing rule:', ruleId)
    alert('Rule details would open here')
  }

  const handleEditRule = (ruleId) => {
    console.log('Editing rule:', ruleId)
    alert('Edit rule dialog would open here')
  }

  const handleResolveViolation = (violationId) => {
    console.log('Resolving violation:', violationId)
    alert('Violation resolved successfully!')
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Compliance & Transparency</h1>
            <p className="text-gray-600 mt-1">Ensure group compliance and maintain transparency</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddRule(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Add Rule
            </button>
            <button
              onClick={() => setShowReportViolation(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <AlertCircle size={18} /> Report Violation
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Rules</p>
                <p className="text-2xl font-bold text-gray-800">
                  {groupRules.filter(r => r.status === 'active').length}
                </p>
              </div>
              <Shield className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Violations</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {violations.filter(v => v.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Resolved Violations</p>
                <p className="text-2xl font-bold text-green-600">
                  {violations.filter(v => v.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Agreements</p>
                <p className="text-2xl font-bold text-purple-600">
                  {agreements.filter(a => a.status === 'active').length}
                </p>
              </div>
              <FileText className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['rules', 'violations', 'agreements', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
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
            {activeTab === 'rules' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Group Rules</h2>
                <div className="space-y-4">
                  {groupRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{rule.title}</h3>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Category: {rule.category} • Last Updated: {rule.lastUpdated}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rule.status)}`}>
                            {rule.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {rule.violations} violations
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewRule(rule.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Eye size={16} /> View Details
                        </button>
                        <button
                          onClick={() => handleEditRule(rule.id)}
                          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Download size={16} /> Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'violations' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Rule Violations</h2>
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <div
                      key={violation.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{violation.member}</h3>
                          <p className="text-sm text-gray-600">{violation.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Rule: {violation.rule} • Reported by: {violation.reportedBy}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(violation.status)}`}>
                            {violation.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(violation.severity)}`}>
                            {violation.severity}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveViolation(violation.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> Resolve
                        </button>
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Eye size={16} /> View Details
                        </button>
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Edit size={16} /> Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'agreements' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Signed Agreements</h2>
                <div className="space-y-4">
                  {agreements.map((agreement) => (
                    <div
                      key={agreement.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{agreement.title}</h3>
                          <p className="text-sm text-gray-600">{agreement.description}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Signed by: {agreement.signedBy} • Date: {agreement.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(agreement.status)}`}>
                            {agreement.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {agreement.members} members
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                          <Eye size={16} /> View Agreement
                        </button>
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Download size={16} /> Download
                        </button>
                        <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                          <Edit size={16} /> Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Compliance Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Monthly Compliance Report</h3>
                    <p className="text-sm text-gray-600 mb-3">Generate monthly compliance summary</p>
                    <button className="btn-primary text-sm px-3 py-1">Generate Report</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Violation Analysis</h3>
                    <p className="text-sm text-gray-600 mb-3">Analyze violation patterns and trends</p>
                    <button className="btn-primary text-sm px-3 py-1">View Analysis</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Member Compliance Status</h3>
                    <p className="text-sm text-gray-600 mb-3">Check individual member compliance</p>
                    <button className="btn-primary text-sm px-3 py-1">Check Status</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Policy Effectiveness</h3>
                    <p className="text-sm text-gray-600 mb-3">Evaluate rule effectiveness</p>
                    <button className="btn-primary text-sm px-3 py-1">Evaluate</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Rule Modal */}
        {showAddRule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Add New Rule</h2>
                <button
                  onClick={() => setShowAddRule(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rule Title
                  </label>
                  <input
                    type="text"
                    value={newRule.title}
                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter rule title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="General">General</option>
                    <option value="Financial">Financial</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Conduct">Conduct</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter rule description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddRule(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRule}
                    className="btn-primary flex-1"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Violation Modal */}
        {showReportViolation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Report Violation</h2>
                <button
                  onClick={() => setShowReportViolation(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Member
                  </label>
                  <select
                    value={newViolation.member}
                    onChange={(e) => setNewViolation({ ...newViolation, member: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select member...</option>
                    <option value="Mutabazi Paul">Mutabazi Paul</option>
                    <option value="Uwimana Grace">Uwimana Grace</option>
                    <option value="Nkurunziza Peter">Nkurunziza Peter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rule Violated
                  </label>
                  <select
                    value={newViolation.rule}
                    onChange={(e) => setNewViolation({ ...newViolation, rule: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select rule...</option>
                    <option value="Monthly Contribution Requirement">Monthly Contribution Requirement</option>
                    <option value="Meeting Attendance Policy">Meeting Attendance Policy</option>
                    <option value="Loan Repayment Schedule">Loan Repayment Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={newViolation.severity}
                    onChange={(e) => setNewViolation({ ...newViolation, severity: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newViolation.description}
                    onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Describe the violation..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowReportViolation(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportViolation}
                    className="btn-primary flex-1"
                  >
                    Report Violation
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

export default SecretaryCompliance
