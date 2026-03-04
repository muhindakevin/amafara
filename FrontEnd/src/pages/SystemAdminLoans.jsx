import { useState, useEffect } from 'react'
import { CreditCard, Plus, Edit, Eye, Search, Filter, CheckCircle, XCircle, AlertCircle, Shield, Clock, TrendingUp, DollarSign, Percent, Calendar, FileText, Users } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminLoans() {
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showAddLoanProduct, setShowAddLoanProduct] = useState(false)
  const [showLoanDetails, setShowLoanDetails] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [activeTab, setActiveTab] = useState('products')
  const [loanProducts, setLoanProducts] = useState([])
  const [loanRequests, setLoanRequests] = useState([])
  const [stats, setStats] = useState({
    activeProducts: 0,
    pendingRequests: 0,
    totalApproved: 0,
    totalValue: '0'
  })
  const [loading, setLoading] = useState(true)
  const [scoringConfig, setScoringConfig] = useState(null)
  const [showScoringConfigModal, setShowScoringConfigModal] = useState(false)
  const [editingScoringParams, setEditingScoringParams] = useState(false)
  const [editingThresholds, setEditingThresholds] = useState(false)

  useEffect(() => {
    fetchData()
    fetchScoringConfig()
  }, [])

  const fetchScoringConfig = async () => {
    try {
      const { data } = await api.get('/loans/scoring/config')
      if (data?.success) {
        setScoringConfig(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch scoring config:', error)
      // Set default config if fetch fails
      setScoringConfig({
        scoringParameters: {
          contributionConsistency: 40,
          loanPaymentHistory: 30,
          savingsAmount: 20,
          accountAge: 10
        },
        riskThresholds: {
          lowRisk: { min: 800, max: 1000 },
          mediumRisk: { min: 500, max: 799 },
          highRisk: { min: 0, max: 499 }
        },
        aiRecommendationThresholds: {
          approve: { min: 650, max: 1000 },
          review: { min: 300, max: 649 },
          reject: { min: 0, max: 299 }
        },
        mlModelEnabled: true
      })
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch loan products
      const productsRes = await api.get('/loans/products').catch(() => ({ data: { data: [] } }))
      setLoanProducts(productsRes?.data?.data || [])

      // Fetch all loan requests (System Admin sees all)
      const requestsRes = await api.get('/loans').catch(() => ({ data: { data: [] } }))
      setLoanRequests(requestsRes?.data?.data || [])

      // Fetch statistics
      const statsRes = await api.get('/loans/stats').catch(() => ({ data: { data: {} } }))
      if (statsRes?.data?.success) {
        setStats(statsRes.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch loan data:', error)
    } finally {
      setLoading(false)
    }
  }


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

  const filteredLoanProducts = (loanProducts || []).filter(product => {
    const matchesType = filterType === 'all' || (product.type || '').toLowerCase() === filterType.toLowerCase()
    const matchesStatus = filterStatus === 'all' || (product.status || 'Active').toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())

    return matchesType && matchesStatus && matchesSearch
  })

  const filteredLoanRequests = (loanRequests || []).filter(request => {
    const matchesStatus = filterStatus === 'all' || (request.status || '').toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      (request.member?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.purpose || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.group?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(request.amount || '').includes(searchTerm)

    return matchesStatus && matchesSearch
  })

  const handleAddLoanProduct = async () => {
    if (!newLoanProduct.name || !newLoanProduct.minAmount || !newLoanProduct.maxAmount || !newLoanProduct.interestRate || !newLoanProduct.termMonths) {
      alert(tSystemAdmin('fillAllRequiredFields', { defaultValue: 'Please fill in all required fields.' }))
      return
    }
    try {
      await api.post('/loans/products', {
        name: newLoanProduct.name,
        description: newLoanProduct.requirements || null,
        minAmount: newLoanProduct.minAmount.replace(/[^0-9.]/g, ''),
        maxAmount: newLoanProduct.maxAmount.replace(/[^0-9.]/g, ''),
        interestRate: newLoanProduct.interestRate.replace(/[^0-9.]/g, ''),
        termMonths: parseInt(newLoanProduct.termMonths)
      })
    alert(tSystemAdmin('loanProductCreatedSuccessfully', { defaultValue: 'Loan product created successfully!' }))
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
      await fetchData()
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to create loan product')
    }
  }

  const handleViewLoanDetails = (loan) => {
    setSelectedLoan(loan)
    setShowLoanDetails(true)
  }

  const handleApproveLoan = async (loanId) => {
    try {
      await api.put(`/loans/${loanId}/approve`)
      alert('Loan approved successfully!')
      await fetchData()
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to approve loan')
    }
  }

  const handleRejectLoan = async (loanId) => {
    if (!confirm('Are you sure you want to reject this loan?')) return
    try {
      await api.put(`/loans/${loanId}/reject`)
      alert('Loan rejected!')
      await fetchData()
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to reject loan')
    }
  }

  const handleConfigureCreditScoring = (type) => {
    if (type === 'parameters') {
      setEditingScoringParams(true)
      setEditingThresholds(false)
    } else {
      setEditingScoringParams(false)
      setEditingThresholds(true)
    }
    setShowScoringConfigModal(true)
  }

  const handleSaveScoringConfig = async () => {
    try {
      const configToSave = {
        scoringParameters: editingScoringParams ? scoringConfig.scoringParameters : undefined,
        riskThresholds: editingThresholds ? scoringConfig.riskThresholds : undefined,
        aiRecommendationThresholds: editingThresholds ? scoringConfig.aiRecommendationThresholds : undefined
      }

      await api.put('/loans/scoring/config', configToSave)
      alert(tSystemAdmin('scoringConfigSaved', { defaultValue: 'Credit scoring configuration saved successfully!' }))
      setShowScoringConfigModal(false)
      setEditingScoringParams(false)
      setEditingThresholds(false)
      await fetchScoringConfig()
    } catch (error) {
      alert(error.response?.data?.message || tSystemAdmin('failedToSaveConfig', { defaultValue: 'Failed to save configuration' }))
    }
  }

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase()
    switch (statusLower) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'approved': return 'bg-blue-100 text-blue-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'disbursed': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'defaulted': return 'bg-red-100 text-red-700'
      case 'suspended': return 'bg-red-100 text-red-700'
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
    if (typeof score === 'number') {
      if (score >= 800) return 'bg-green-100 text-green-700'
      if (score >= 650) return 'bg-yellow-100 text-yellow-700'
      if (score >= 500) return 'bg-orange-100 text-orange-700'
      return 'bg-red-100 text-red-700'
    }
    switch (score) {
      case 'A+': return 'bg-green-100 text-green-700'
      case 'A': return 'bg-green-100 text-green-700'
      case 'B': return 'bg-yellow-100 text-yellow-700'
      case 'C': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRiskLevel = (loan) => {
    const creditScore = loan.member?.creditScore || loan.creditScore || 500
    if (creditScore >= 800) return 'Low'
    if (creditScore >= 650) return 'Medium'
    return 'High'
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loan & Credit Management</h1>
        <p className="text-gray-600">Define loan products, configure credit scoring, and approve large loan requests</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Products</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{loading ? '...' : stats.activeProducts}</p>
              </div>
              <CreditCard className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{loading ? '...' : stats.pendingRequests}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Approved</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{loading ? '...' : stats.totalApproved}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Value</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{loading ? '...' : `${stats.totalValue} RWF`}</p>
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
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Loan Products</h2>
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
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="disbursed">Disbursed</option>
                      <option value="completed">Completed</option>
                      <option value="defaulted">Defaulted</option>
                    </select>
                  </div>
                </div>

                {/* Loan Products Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading loan products...</div>
                  ) : filteredLoanProducts.length > 0 ? (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type || 'General'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Number(product.minAmount || 0).toLocaleString()} - {Number(product.maxAmount || 0).toLocaleString()} RWF
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.interestRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.termMonths} months</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.applications || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status || 'Active')}`}>
                                {product.status || 'Active'}
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
                                onClick={async () => {
                                  const newName = prompt('Enter new product name:', product.name)
                                  if (newName) {
                                    try {
                                      await api.put(`/loans/products/${product.id}`, { name: newName })
                                      await fetchData()
                                    } catch (error) {
                                      alert('Failed to update product')
                                    }
                                  }
                                }}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Edit Product"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this product?')) {
                                    try {
                                      await api.delete(`/loans/products/${product.id}`)
                                      await fetchData()
                                    } catch (error) {
                                      alert('Failed to delete product')
                                    }
                                  }
                                }}
                              className="text-red-600 hover:text-red-900"
                                title="Delete Product"
                            >
                              <XCircle size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  ) : (
                    <div className="text-center py-12 text-gray-500">No loan products found. Create your first product!</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Loan Requests</h2>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search loan requests..."
                      className="input-field pl-9 py-2 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="input-field py-2 text-sm"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="disbursed">Disbursed</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="defaulted">Defaulted</option>
                    </select>
                  </div>
                </div>

                {/* Loan Requests Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading loan requests...</div>
                  ) : filteredLoanRequests.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLoanRequests.map(request => {
                          const creditScore = request.member?.creditScore || 500
                          const riskLevel = getRiskLevel(request)
                          return (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.member?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">ID: {request.memberId}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.group?.name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {Number(request.amount || 0).toLocaleString()} RWF
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.purpose || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCreditScoreColor(creditScore)}`}>
                                  {creditScore}/100
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(riskLevel)}`}>
                                  {riskLevel}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                  {request.status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleViewLoanDetails(request)}
                                  className="text-primary-600 hover:text-primary-900 mr-3"
                                  title="View Details"
                                >
                                  <Eye size={20} />
                                </button>
                                {request.status === 'pending' && (
                                  <>
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
                                  </>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12 text-gray-500">No loan requests found</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'scoring' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Credit Scoring Configuration</h2>
                <p className="text-gray-600">Configure credit scoring parameters and risk assessment criteria</p>

                {scoringConfig && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Scoring Parameters</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Contribution Consistency</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{scoringConfig.scoringParameters?.contributionConsistency || 40}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Loan Payment History</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{scoringConfig.scoringParameters?.loanPaymentHistory || 30}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Savings Amount</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{scoringConfig.scoringParameters?.savingsAmount || 20}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Account Age</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{scoringConfig.scoringParameters?.accountAge || 10}%</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {(scoringConfig.scoringParameters?.contributionConsistency || 40) +
                               (scoringConfig.scoringParameters?.loanPaymentHistory || 30) +
                               (scoringConfig.scoringParameters?.savingsAmount || 20) +
                               (scoringConfig.scoringParameters?.accountAge || 10)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfigureCreditScoring('parameters')}
                        className="btn-primary w-full mt-4"
                      >
                        Configure Parameters
                      </button>
                    </div>

                    <div className="card">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Risk Thresholds</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Low Risk</span>
                          <span className="text-sm font-semibold text-green-600">
                            {scoringConfig.riskThresholds?.lowRisk?.min || 800}-{scoringConfig.riskThresholds?.lowRisk?.max || 1000}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Medium Risk</span>
                          <span className="text-sm font-semibold text-yellow-600">
                            {scoringConfig.riskThresholds?.mediumRisk?.min || 500}-{scoringConfig.riskThresholds?.mediumRisk?.max || 799}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">High Risk</span>
                          <span className="text-sm font-semibold text-red-600">
                            {scoringConfig.riskThresholds?.highRisk?.min || 0}-{scoringConfig.riskThresholds?.highRisk?.max || 499}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Recommendation Thresholds</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Approve:</span>
                            <span className="text-green-600">
                              {scoringConfig.aiRecommendationThresholds?.approve?.min || 650}+
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Review:</span>
                            <span className="text-yellow-600">
                              {scoringConfig.aiRecommendationThresholds?.review?.min || 300}-{scoringConfig.aiRecommendationThresholds?.review?.max || 649}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reject:</span>
                            <span className="text-red-600">
                              &lt;{scoringConfig.aiRecommendationThresholds?.reject?.max || 299}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfigureCreditScoring('thresholds')}
                        className="btn-secondary w-full mt-4"
                      >
                        Adjust Thresholds
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add New Loan Product Modal */}
        {showAddLoanProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create Loan Product</h2>
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Loan Details</h2>
                <button onClick={() => setShowLoanDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedLoan.id}</p>
                {selectedLoan.name && <p className="text-gray-700"><span className="font-semibold">Product Name:</span> {selectedLoan.name}</p>}
                {selectedLoan.member && <p className="text-gray-700"><span className="font-semibold">Member:</span> {selectedLoan.member.name} (ID: {selectedLoan.memberId})</p>}
                {selectedLoan.group && <p className="text-gray-700"><span className="font-semibold">Group:</span> {selectedLoan.group.name}</p>}
                {selectedLoan.type && <p className="text-gray-700"><span className="font-semibold">Type:</span> {selectedLoan.type}</p>}
                {selectedLoan.amount && <p className="text-gray-700"><span className="font-semibold">Amount:</span> {Number(selectedLoan.amount).toLocaleString()} RWF</p>}
                {selectedLoan.purpose && <p className="text-gray-700"><span className="font-semibold">Purpose:</span> {selectedLoan.purpose}</p>}
                {selectedLoan.interestRate && <p className="text-gray-700"><span className="font-semibold">Interest Rate:</span> {selectedLoan.interestRate}%</p>}
                {selectedLoan.duration && <p className="text-gray-700"><span className="font-semibold">Term:</span> {selectedLoan.duration} months</p>}
                {selectedLoan.termMonths && <p className="text-gray-700"><span className="font-semibold">Term:</span> {selectedLoan.termMonths} months</p>}
                {selectedLoan.member?.creditScore && (
                  <p className="text-gray-700"><span className="font-semibold">Credit Score:</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCreditScoreColor(selectedLoan.member.creditScore)}`}>
                      {selectedLoan.member.creditScore}/1000
                    </span>
                  </p>
                )}
                {selectedLoan.member && (
                  <p className="text-gray-700"><span className="font-semibold">Risk Level:</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(getRiskLevel(selectedLoan))}`}>
                      {getRiskLevel(selectedLoan)}
                    </span>
                  </p>
                )}
                <p className="text-gray-700"><span className="font-semibold">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedLoan.status)}`}>
                    {selectedLoan.status || 'pending'}
                  </span>
                </p>
                {selectedLoan.requestDate && <p className="text-gray-700"><span className="font-semibold">Request Date:</span> {new Date(selectedLoan.requestDate).toLocaleString()}</p>}
                {selectedLoan.approvalDate && <p className="text-gray-700"><span className="font-semibold">Approval Date:</span> {new Date(selectedLoan.approvalDate).toLocaleString()}</p>}
                {selectedLoan.totalAmount && <p className="text-gray-700"><span className="font-semibold">Total Amount:</span> {Number(selectedLoan.totalAmount).toLocaleString()} RWF</p>}
                {selectedLoan.remainingAmount && <p className="text-gray-700"><span className="font-semibold">Remaining:</span> {Number(selectedLoan.remainingAmount).toLocaleString()} RWF</p>}
                {selectedLoan.paidAmount && <p className="text-gray-700"><span className="font-semibold">Paid:</span> {Number(selectedLoan.paidAmount).toLocaleString()} RWF</p>}
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

        {/* Credit Scoring Configuration Modal */}
        {showScoringConfigModal && scoringConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingScoringParams ? 'Configure Scoring Parameters' : 'Adjust Risk Thresholds'}
                </h2>
                <button onClick={() => setShowScoringConfigModal(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>

              {editingScoringParams && (
                <div className="space-y-4">
                  <p className="text-gray-600">Adjust the weight of each factor in credit score calculation. Total must equal 100%.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Contribution Consistency (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoringConfig.scoringParameters?.contributionConsistency || 40}
                        onChange={(e) => setScoringConfig({
                          ...scoringConfig,
                          scoringParameters: {
                            ...scoringConfig.scoringParameters,
                            contributionConsistency: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Payment History (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoringConfig.scoringParameters?.loanPaymentHistory || 30}
                        onChange={(e) => setScoringConfig({
                          ...scoringConfig,
                          scoringParameters: {
                            ...scoringConfig.scoringParameters,
                            loanPaymentHistory: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Savings Amount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoringConfig.scoringParameters?.savingsAmount || 20}
                        onChange={(e) => setScoringConfig({
                          ...scoringConfig,
                          scoringParameters: {
                            ...scoringConfig.scoringParameters,
                            savingsAmount: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Age (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoringConfig.scoringParameters?.accountAge || 10}
                        onChange={(e) => setScoringConfig({
                          ...scoringConfig,
                          scoringParameters: {
                            ...scoringConfig.scoringParameters,
                            accountAge: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total</span>
                        <span className={`text-sm font-semibold ${
                          ((scoringConfig.scoringParameters?.contributionConsistency || 40) +
                           (scoringConfig.scoringParameters?.loanPaymentHistory || 30) +
                           (scoringConfig.scoringParameters?.savingsAmount || 20) +
                           (scoringConfig.scoringParameters?.accountAge || 10)) === 100
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(scoringConfig.scoringParameters?.contributionConsistency || 40) +
                           (scoringConfig.scoringParameters?.loanPaymentHistory || 30) +
                           (scoringConfig.scoringParameters?.savingsAmount || 20) +
                           (scoringConfig.scoringParameters?.accountAge || 10)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingThresholds && (
                <div className="space-y-4">
                  <p className="text-gray-600">Adjust risk thresholds and AI recommendation ranges (0-1000 scale).</p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Thresholds</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Low Risk Min</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.riskThresholds?.lowRisk?.min || 800}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              riskThresholds: {
                                ...scoringConfig.riskThresholds,
                                lowRisk: { ...scoringConfig.riskThresholds?.lowRisk, min: parseInt(e.target.value) || 0 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Low Risk Max</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.riskThresholds?.lowRisk?.max || 1000}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              riskThresholds: {
                                ...scoringConfig.riskThresholds,
                                lowRisk: { ...scoringConfig.riskThresholds?.lowRisk, max: parseInt(e.target.value) || 1000 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Medium Risk Min</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.riskThresholds?.mediumRisk?.min || 500}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              riskThresholds: {
                                ...scoringConfig.riskThresholds,
                                mediumRisk: { ...scoringConfig.riskThresholds?.mediumRisk, min: parseInt(e.target.value) || 0 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Medium Risk Max</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.riskThresholds?.mediumRisk?.max || 799}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              riskThresholds: {
                                ...scoringConfig.riskThresholds,
                                mediumRisk: { ...scoringConfig.riskThresholds?.mediumRisk, max: parseInt(e.target.value) || 799 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">High Risk Min</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.riskThresholds?.highRisk?.min || 0}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              riskThresholds: {
                                ...scoringConfig.riskThresholds,
                                highRisk: { ...scoringConfig.riskThresholds?.highRisk, min: parseInt(e.target.value) || 0 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">High Risk Max</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.riskThresholds?.highRisk?.max || 499}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              riskThresholds: {
                                ...scoringConfig.riskThresholds,
                                highRisk: { ...scoringConfig.riskThresholds?.highRisk, max: parseInt(e.target.value) || 499 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Recommendation Thresholds</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Approve Min</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.aiRecommendationThresholds?.approve?.min || 650}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              aiRecommendationThresholds: {
                                ...scoringConfig.aiRecommendationThresholds,
                                approve: { ...scoringConfig.aiRecommendationThresholds?.approve, min: parseInt(e.target.value) || 650 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Review Min</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.aiRecommendationThresholds?.review?.min || 300}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              aiRecommendationThresholds: {
                                ...scoringConfig.aiRecommendationThresholds,
                                review: { ...scoringConfig.aiRecommendationThresholds?.review, min: parseInt(e.target.value) || 300 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Review Max</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.aiRecommendationThresholds?.review?.max || 649}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              aiRecommendationThresholds: {
                                ...scoringConfig.aiRecommendationThresholds,
                                review: { ...scoringConfig.aiRecommendationThresholds?.review, max: parseInt(e.target.value) || 649 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Reject Max</label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={scoringConfig.aiRecommendationThresholds?.reject?.max || 299}
                            onChange={(e) => setScoringConfig({
                              ...scoringConfig,
                              aiRecommendationThresholds: {
                                ...scoringConfig.aiRecommendationThresholds,
                                reject: { ...scoringConfig.aiRecommendationThresholds?.reject, max: parseInt(e.target.value) || 299 }
                              }
                            })}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScoringConfigModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveScoringConfig}
                  className="btn-primary flex-1"
                  disabled={editingScoringParams && (
                    ((scoringConfig.scoringParameters?.contributionConsistency || 40) +
                     (scoringConfig.scoringParameters?.loanPaymentHistory || 30) +
                     (scoringConfig.scoringParameters?.savingsAmount || 20) +
                     (scoringConfig.scoringParameters?.accountAge || 10)) !== 100
                  )}
                >
                  Save Configuration
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

