import { useState } from 'react'
import { CreditCard, Plus, Edit, Eye, Search, Filter, CheckCircle, XCircle, AlertCircle, Shield, Clock, TrendingUp, DollarSign, Percent, Calendar, FileText, Users } from 'lucide-react'
import Layout from '../components/Layout'

function SystemAdminLoans() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showAddLoanProduct, setShowAddLoanProduct] = useState(false)
  const [showLoanDetails, setShowLoanDetails] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [activeTab, setActiveTab] = useState('products')

  const loanProducts = [
    { 
      id: 'LP001', 
      name: 'Personal Loan', 
      type: 'Personal', 
      minAmount: '50,000 RWF',
      maxAmount: '500,000 RWF',
      interestRate: '12%',
      termMonths: '12',
      requirements: 'ID, Proof of Income',
      status: 'Active',
      applications: 45,
      approved: 38,
      rejected: 7
    },
    { 
      id: 'LP002', 
      name: 'Business Loan', 
      type: 'Business', 
      minAmount: '100,000 RWF',
      maxAmount: '2,000,000 RWF',
      interestRate: '15%',
      termMonths: '24',
      requirements: 'Business License, Financial Statements',
      status: 'Active',
      applications: 23,
      approved: 18,
      rejected: 5
    },
    { 
      id: 'LP003', 
      name: 'Emergency Loan', 
      type: 'Emergency', 
      minAmount: '25,000 RWF',
      maxAmount: '200,000 RWF',
      interestRate: '18%',
      termMonths: '6',
      requirements: 'ID, Emergency Documentation',
      status: 'Active',
      applications: 67,
      approved: 52,
      rejected: 15
    },
    { 
      id: 'LP004', 
      name: 'Agricultural Loan', 
      type: 'Agricultural', 
      minAmount: '75,000 RWF',
      maxAmount: '1,500,000 RWF',
      interestRate: '10%',
      termMonths: '18',
      requirements: 'Land Title, Farming Plan',
      status: 'Pending',
      applications: 12,
      approved: 8,
      rejected: 4
    },
  ]

  const loanRequests = [
    { 
      id: 'LR001', 
      clientName: 'Client John', 
      clientId: 'C001',
      productName: 'Personal Loan', 
      amount: '300,000 RWF',
      termMonths: '12',
      purpose: 'Home Improvement',
      status: 'Pending',
      applicationDate: '2024-01-15',
      creditScore: 'A',
      agentName: 'Agent Marie',
      branch: 'Kigali Central',
      documents: 'Complete',
      riskLevel: 'Low'
    },
    { 
      id: 'LR002', 
      clientName: 'Client Alice', 
      clientId: 'C002',
      productName: 'Business Loan', 
      amount: '1,500,000 RWF',
      termMonths: '24',
      purpose: 'Business Expansion',
      status: 'Approved',
      applicationDate: '2024-01-14',
      creditScore: 'A+',
      agentName: 'Agent John',
      branch: 'Musanze Branch',
      documents: 'Complete',
      riskLevel: 'Low'
    },
    { 
      id: 'LR003', 
      clientName: 'Client Bob', 
      clientId: 'C003',
      productName: 'Emergency Loan', 
      amount: '150,000 RWF',
      termMonths: '6',
      purpose: 'Medical Emergency',
      status: 'Flagged',
      applicationDate: '2024-01-13',
      creditScore: 'C',
      agentName: 'Agent Alice',
      branch: 'Huye Branch',
      documents: 'Incomplete',
      riskLevel: 'High'
    },
    { 
      id: 'LR004', 
      clientName: 'Client Eve', 
      clientId: 'C004',
      productName: 'Agricultural Loan', 
      amount: '800,000 RWF',
      termMonths: '18',
      purpose: 'Farm Equipment',
      status: 'Rejected',
      applicationDate: '2024-01-12',
      creditScore: 'B',
      agentName: 'Agent Bob',
      branch: 'Rubavu Branch',
      documents: 'Complete',
      riskLevel: 'Medium'
    },
  ]

  const [newLoanProduct, setNewLoanProduct] = useState({
    name: '',
    type: 'Personal',
    minAmount: '',
    maxAmount: '',
    interestRate: '',
    termMonths: '',
    requirements: '',
    status: 'Pending'
  })

  const filteredLoanProducts = loanProducts.filter(product => {
    const matchesType = filterType === 'all' || product.type === filterType
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesType && matchesStatus && matchesSearch
  })

  const filteredLoanRequests = loanRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesSearch =
      request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.purpose.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const handleAddLoanProduct = () => {
    if (!newLoanProduct.name || !newLoanProduct.minAmount || !newLoanProduct.maxAmount) {
      alert('Please fill in all required fields.')
      return
    }
    console.log('Adding new loan product:', newLoanProduct)
    alert('Loan product created successfully!')
    setShowAddLoanProduct(false)
    setNewLoanProduct({
      name: '',
      type: 'Personal',
      minAmount: '',
      maxAmount: '',
      interestRate: '',
      termMonths: '',
      requirements: '',
      status: 'Pending'
    })
  }

  const handleViewLoanDetails = (loan) => {
    setSelectedLoan(loan)
    setShowLoanDetails(true)
  }

  const handleApproveLoan = (loanId) => {
    alert(`Loan ${loanId} approved successfully!`)
  }

  const handleRejectLoan = (loanId) => {
    alert(`Loan ${loanId} rejected!`)
  }

  const handleConfigureCreditScoring = () => {
    alert('Opening credit scoring configuration...')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Suspended': return 'bg-red-100 text-red-700'
      case 'Approved': return 'bg-green-100 text-green-700'
      case 'Rejected': return 'bg-red-100 text-red-700'
      case 'Flagged': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'High': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCreditScoreColor = (score) => {
    switch (score) {
      case 'A+': return 'bg-green-100 text-green-700'
      case 'A': return 'bg-green-100 text-green-700'
      case 'B': return 'bg-yellow-100 text-yellow-700'
      case 'C': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Loan & Credit Management</h1>
        <p className="text-gray-600">Define loan products, configure credit scoring, and approve large loan requests</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Products</p>
                <p className="text-2xl font-bold text-gray-800">{loanProducts.filter(p => p.status === 'Active').length}</p>
              </div>
              <CreditCard className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-800">{loanRequests.filter(r => r.status === 'Pending').length}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Approved</p>
                <p className="text-2xl font-bold text-gray-800">{loanRequests.filter(r => r.status === 'Approved').length}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Value</p>
                <p className="text-2xl font-bold text-gray-800">2.75M RWF</p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['products', 'requests', 'scoring'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
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
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Loan Products</h2>
                  <button
                    onClick={() => setShowAddLoanProduct(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={20} /> Create Product
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search loan products..."
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="Personal">Personal</option>
                      <option value="Business">Business</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Agricultural">Agricultural</option>
                    </select>
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Loan Products Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Range</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoanProducts.map(product => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.minAmount} - {product.maxAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.interestRate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.termMonths} months</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.applications}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewLoanDetails(product)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                              title="View Details"
                            >
                              <Eye size={20} />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Edit Product"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Deactivate"
                            >
                              <XCircle size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Loan Requests</h2>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search loan requests..."
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Flagged">Flagged</option>
                    </select>
                  </div>
                </div>

                {/* Loan Requests Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoanRequests.map(request => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{request.clientName}</p>
                              <p className="text-xs text-gray-500">{request.clientId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.purpose}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCreditScoreColor(request.creditScore)}`}>
                              {request.creditScore}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(request.riskLevel)}`}>
                              {request.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewLoanDetails(request)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                              title="View Details"
                            >
                              <Eye size={20} />
                            </button>
                            <button
                              onClick={() => handleApproveLoan(request.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Approve Loan"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleRejectLoan(request.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject Loan"
                            >
                              <XCircle size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'scoring' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Credit Scoring Configuration</h2>
                <p className="text-gray-600">Configure credit scoring parameters and risk assessment criteria</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Scoring Parameters</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Income Stability</span>
                        <span className="text-sm font-semibold text-gray-800">30%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Credit History</span>
                        <span className="text-sm font-semibold text-gray-800">25%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Savings Pattern</span>
                        <span className="text-sm font-semibold text-gray-800">20%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Loan Purpose</span>
                        <span className="text-sm font-semibold text-gray-800">15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Collateral</span>
                        <span className="text-sm font-semibold text-gray-800">10%</span>
                      </div>
                    </div>
                    <button
                      onClick={handleConfigureCreditScoring}
                      className="btn-primary w-full mt-4"
                    >
                      Configure Parameters
                    </button>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Thresholds</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Low Risk</span>
                        <span className="text-sm font-semibold text-green-600">80-100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Medium Risk</span>
                        <span className="text-sm font-semibold text-yellow-600">60-79</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">High Risk</span>
                        <span className="text-sm font-semibold text-red-600">0-59</span>
                      </div>
                    </div>
                    <button
                      onClick={handleConfigureCreditScoring}
                      className="btn-secondary w-full mt-4"
                    >
                      Adjust Thresholds
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add New Loan Product Modal */}
        {showAddLoanProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create Loan Product</h2>
                <button onClick={() => setShowAddLoanProduct(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Define a new loan product with terms and requirements.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newLoanProduct.name}
                    onChange={(e) => setNewLoanProduct({ ...newLoanProduct, name: e.target.value })}
                    className="input-field"
                    placeholder="Personal Loan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={newLoanProduct.type}
                    onChange={(e) => setNewLoanProduct({ ...newLoanProduct, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Agricultural">Agricultural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Amount</label>
                  <input
                    type="text"
                    value={newLoanProduct.minAmount}
                    onChange={(e) => setNewLoanProduct({ ...newLoanProduct, minAmount: e.target.value })}
                    className="input-field"
                    placeholder="50,000 RWF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Amount</label>
                  <input
                    type="text"
                    value={newLoanProduct.maxAmount}
                    onChange={(e) => setNewLoanProduct({ ...newLoanProduct, maxAmount: e.target.value })}
                    className="input-field"
                    placeholder="500,000 RWF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate</label>
                  <input
                    type="text"
                    value={newLoanProduct.interestRate}
                    onChange={(e) => setNewLoanProduct({ ...newLoanProduct, interestRate: e.target.value })}
                    className="input-field"
                    placeholder="12%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Term (Months)</label>
                  <input
                    type="text"
                    value={newLoanProduct.termMonths}
                    onChange={(e) => setNewLoanProduct({ ...newLoanProduct, termMonths: e.target.value })}
                    className="input-field"
                    placeholder="12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements</label>
                <textarea
                  value={newLoanProduct.requirements}
                  onChange={(e) => setNewLoanProduct({ ...newLoanProduct, requirements: e.target.value })}
                  className="input-field h-24"
                  placeholder="List required documents and criteria..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddLoanProduct(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLoanProduct}
                  className="btn-primary flex-1"
                >
                  Create Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {showLoanDetails && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Loan Details</h2>
                <button onClick={() => setShowLoanDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedLoan.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedLoan.name || selectedLoan.clientName}</p>
                {selectedLoan.type && <p className="text-gray-700"><span className="font-semibold">Type:</span> {selectedLoan.type}</p>}
                {selectedLoan.productName && <p className="text-gray-700"><span className="font-semibold">Product:</span> {selectedLoan.productName}</p>}
                {selectedLoan.amount && <p className="text-gray-700"><span className="font-semibold">Amount:</span> {selectedLoan.amount}</p>}
                {selectedLoan.purpose && <p className="text-gray-700"><span className="font-semibold">Purpose:</span> {selectedLoan.purpose}</p>}
                {selectedLoan.interestRate && <p className="text-gray-700"><span className="font-semibold">Interest Rate:</span> {selectedLoan.interestRate}</p>}
                {selectedLoan.termMonths && <p className="text-gray-700"><span className="font-semibold">Term:</span> {selectedLoan.termMonths} months</p>}
                {selectedLoan.creditScore && (
                  <p className="text-gray-700"><span className="font-semibold">Credit Score:</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCreditScoreColor(selectedLoan.creditScore)}`}>
                      {selectedLoan.creditScore}
                    </span>
                  </p>
                )}
                {selectedLoan.riskLevel && (
                  <p className="text-gray-700"><span className="font-semibold">Risk Level:</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(selectedLoan.riskLevel)}`}>
                      {selectedLoan.riskLevel}
                    </span>
                  </p>
                )}
                <p className="text-gray-700"><span className="font-semibold">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedLoan.status)}`}>
                    {selectedLoan.status}
                  </span>
                </p>
                {selectedLoan.applicationDate && <p className="text-gray-700"><span className="font-semibold">Application Date:</span> {selectedLoan.applicationDate}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowLoanDetails(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminLoans

