import { useState, useEffect } from 'react'
import { Shield, FileText, AlertCircle, CheckCircle, Users, Eye, Edit, Download, Plus, XCircle, RefreshCw, Save } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import { api } from '../utils/api'

function SecretaryCompliance() {
  const { t } = useTranslation('common')
  const { t: tSecretary } = useTranslation('secretary')
  const [activeTab, setActiveTab] = useState('rules')
  const [showAddRule, setShowAddRule] = useState(false)
  const [showReportViolation, setShowReportViolation] = useState(false)
  const [showEditRule, setShowEditRule] = useState(false)
  const [showViewRule, setShowViewRule] = useState(false)
  const [showResolveViolation, setShowResolveViolation] = useState(false)
  const [showFineRules, setShowFineRules] = useState(false)
  const [rules, setRules] = useState([])
  const [violations, setViolations] = useState([])
  const [agreements, setAgreements] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [summary, setSummary] = useState({ activeRules: 0, pendingViolations: 0, resolvedViolations: 0, activeAgreements: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState(null)
  const [selectedViolation, setSelectedViolation] = useState(null)
  const [groupId, setGroupId] = useState(null)
  const [fineRules, setFineRules] = useState([])
  const [editingRule, setEditingRule] = useState(null)
  const [savingRules, setSavingRules] = useState(false)

  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    category: 'General'
  })

  const [editRule, setEditRule] = useState({
    title: '',
    description: '',
    category: 'General',
    status: 'active'
  })

  const [newViolation, setNewViolation] = useState({
    ruleId: '',
    memberId: '',
    description: '',
    severity: 'medium'
  })

  const [resolveViolation, setResolveViolation] = useState({
    status: 'resolved',
    resolutionNotes: ''
  })

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Get user info to get groupId
      const userResponse = await api.get('/auth/me')
      if (userResponse.data.success && userResponse.data.data.groupId) {
        setGroupId(userResponse.data.data.groupId)
      }

      // Fetch summary
      await fetchSummary()
      
      // Fetch data based on active tab
      if (activeTab === 'rules') {
        await fetchRules()
      } else if (activeTab === 'violations') {
        await fetchViolations()
      } else if (activeTab === 'agreements') {
        await fetchAgreements()
      }

      // Fetch group members for violation reporting
      if (userResponse.data.success && userResponse.data.data.groupId) {
        await fetchGroupMembers()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await api.get('/compliance/summary')
      if (response.data.success) {
        setSummary(response.data.data || { activeRules: 0, pendingViolations: 0, resolvedViolations: 0, activeAgreements: 0 })
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const fetchRules = async () => {
    try {
      const response = await api.get('/compliance/rules')
      if (response.data.success) {
        setRules(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    }
  }

  const fetchViolations = async () => {
    try {
      const response = await api.get('/compliance/violations')
      if (response.data.success) {
        setViolations(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching violations:', error)
    }
  }

  const fetchAgreements = async () => {
    try {
      const response = await api.get('/compliance/agreements')
      if (response.data.success) {
        setAgreements(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching agreements:', error)
    }
  }

  const fetchGroupMembers = async () => {
    try {
      if (!groupId) return
      const response = await api.get(`/groups/${groupId}/members`)
      if (response.data.success) {
        setGroupMembers(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching group members:', error)
      // Fallback: try to get members from secretary members endpoint
      try {
        const fallbackResponse = await api.get('/secretary/members')
        if (fallbackResponse.data.success && fallbackResponse.data.data) {
          setGroupMembers(fallbackResponse.data.data.members || fallbackResponse.data.data || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching members from fallback endpoint:', fallbackError)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'resolved': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'under-review': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'dismissed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'archived': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const handleAddRule = async () => {
    try {
      if (!newRule.title || !newRule.description) {
        alert('Please fill in title and description')
        return
      }

      const response = await api.post('/compliance/rules', newRule)
      if (response.data.success) {
        alert('Rule added successfully!')
        setShowAddRule(false)
        setNewRule({
          title: '',
          description: '',
          category: 'General'
        })
        await fetchRules()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error adding rule:', error)
      alert(error.response?.data?.message || 'Failed to add rule')
    }
  }

  const handleReportViolation = async () => {
    try {
      if (!newViolation.ruleId || !newViolation.memberId || !newViolation.description) {
        alert('Please fill in all required fields')
        return
      }

      const response = await api.post('/compliance/violations', newViolation)
      if (response.data.success) {
        alert('Violation reported successfully!')
        setShowReportViolation(false)
        setNewViolation({
          ruleId: '',
          memberId: '',
          description: '',
          severity: 'medium'
        })
        await fetchViolations()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error reporting violation:', error)
      alert(error.response?.data?.message || 'Failed to report violation')
    }
  }

  const handleViewRule = async (rule) => {
    // If it's a fine rule, open the fine rules modal (same as Manage Fine Rules)
    if (rule.isFineRule) {
      await loadFineRules()
      setShowFineRules(true)
      return
    }
    
    // For regular rules, show the view modal
    try {
      const response = await api.get(`/compliance/rules/${rule.id}`)
      if (response.data.success) {
        setSelectedRule(response.data.data)
        setShowViewRule(true)
      }
    } catch (error) {
      console.error('Error fetching rule details:', error)
      alert('Failed to load rule details')
    }
  }

  const handleEditRule = (rule) => {
    setSelectedRule(rule)
    setEditRule({
      title: rule.title,
      description: rule.description,
      category: rule.category,
      status: rule.status
    })
    setShowEditRule(true)
  }

  const handleUpdateRule = async () => {
    try {
      if (!editRule.title || !editRule.description) {
        alert('Please fill in title and description')
        return
      }

      const response = await api.put(`/compliance/rules/${selectedRule.id}`, editRule)
      if (response.data.success) {
        alert('Rule updated successfully!')
        setShowEditRule(false)
        setSelectedRule(null)
        await fetchRules()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error updating rule:', error)
      alert(error.response?.data?.message || 'Failed to update rule')
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const response = await api.delete(`/compliance/rules/${ruleId}`)
      if (response.data.success) {
        alert('Rule deleted successfully!')
        await fetchRules()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert(error.response?.data?.message || 'Failed to delete rule')
    }
  }

  const handleResolveViolation = (violation) => {
    setSelectedViolation(violation)
    setResolveViolation({
      status: 'resolved',
      resolutionNotes: ''
    })
    setShowResolveViolation(true)
  }

  const handleUpdateViolationStatus = async () => {
    try {
      const response = await api.put(`/compliance/violations/${selectedViolation.id}/status`, resolveViolation)
      if (response.data.success) {
        alert('Violation status updated successfully!')
        setShowResolveViolation(false)
        setSelectedViolation(null)
        await fetchViolations()
        await fetchSummary()
      }
    } catch (error) {
      console.error('Error updating violation status:', error)
      alert(error.response?.data?.message || 'Failed to update violation status')
    }
  }

  // Load fine rules from API
  const loadFineRules = async () => {
    if (!groupId) return
    
    try {
      // Fetch fine rules from backend API
      const response = await api.get(`/fine-rules/${groupId}`)
      if (response.data.success && response.data.data) {
        // Map backend response to frontend format
        const mappedRules = response.data.data.map((rule, index) => ({
          id: rule.id || index + 1,
          type: rule.name || rule.type || 'Fine Rule',
          description: rule.description || '',
          amount: parseFloat(rule.amount) || 0,
          maxLimit: parseFloat(rule.maxLimit) || (parseFloat(rule.amount) || 0) * 10, // Default maxLimit if not provided
          conditions: rule.conditions || `Grace period: ${rule.gracePeriod || 0} days`,
          enabled: rule.isActive !== undefined ? rule.isActive : true
        }))
        setFineRules(mappedRules)
      } else {
        // If no rules found, set empty array
        setFineRules([])
      }
    } catch (error) {
      console.error('Error loading fine rules:', error)
      // On error, set empty array instead of dummy data
      setFineRules([])
      alert('Failed to load fine rules. Please try again.')
    }
  }

  // Handle edit fine rule
  const handleEditFineRule = (rule) => {
    setEditingRule({ ...rule })
  }

  // Handle save fine rule changes
  const handleSaveFineRule = (updatedRule) => {
    setFineRules(rules => rules.map(r => r.id === updatedRule.id ? updatedRule : r))
    setEditingRule(null)
  }

  // Handle save all fine rules
  const handleSaveFineRules = async () => {
    if (!groupId) {
      alert('Group information not available')
      return
    }
    
    try {
      setSavingRules(true)
      
      // Map frontend format to backend format
      const rulesToSave = fineRules.map(rule => ({
        id: rule.id,
        name: rule.type,
        description: rule.description,
        amount: rule.amount,
        gracePeriod: rule.conditions ? parseInt(rule.conditions.match(/\d+/)?.[0] || '0') : 0,
        isActive: rule.enabled
      }))
      
      // Propose fine rules changes (creates a vote)
      const response = await api.post(`/fine-rules/${groupId}/propose`, {
        rules: rulesToSave
      })
      
      if (response.data.success) {
        alert('Fine rules change proposal created. Voting is now open. The changes will be applied once the vote is approved.')
        setShowFineRules(false)
        setEditingRule(null)
        // Reload fine rules to show current state
        await loadFineRules()
      } else {
        alert(response.data.message || 'Failed to save fine rules')
      }
    } catch (error) {
      console.error('Error saving fine rules:', error)
      alert(error.response?.data?.message || 'Failed to save fine rules')
    } finally {
      setSavingRules(false)
    }
  }

  const handleExportRule = async (rule) => {
    try {
      // Fetch full rule details
      const response = await api.get(`/compliance/rules/${rule.id}`)
      if (response.data.success) {
        const ruleData = response.data.data
        
        // Create export content
        const content = `
COMPLIANCE RULE EXPORT
=====================

Rule ID: RULE${ruleData.id}
Title: ${ruleData.title}
Category: ${ruleData.category}
Status: ${ruleData.status}
Created: ${formatDate(ruleData.createdAt)}
Last Updated: ${formatDate(ruleData.updatedAt)}
Created By: ${ruleData.creator?.name || 'Unknown'}

DESCRIPTION:
${ruleData.description}

VIOLATIONS:
Total Violations: ${ruleData.violations || 0}
        `.trim()

        const blob = new Blob([content], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `compliance_rule_${ruleData.id}_${Date.now()}.txt`)
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
    } catch (error) {
      console.error('Error exporting rule:', error)
      alert('Failed to export rule')
    }
  }

  if (loading) {
    return (
      <Layout userRole="Secretary">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading compliance data...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="Secretary">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Compliance & Transparency</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Ensure group compliance and maintain transparency</p>
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
            <button
              onClick={fetchData}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Rules</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{summary.activeRules}</p>
              </div>
              <Shield className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Violations</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pendingViolations}</p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Resolved Violations</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.resolvedViolations}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Agreements</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.activeAgreements}</p>
              </div>
              <FileText className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['rules', 'violations', 'agreements', 'reports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Group Rules</h2>
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Shield className="mx-auto mb-2" size={48} />
                    <p>No rules found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">
                              {rule.title}
                              {rule.isFineRule && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  Fine Rule
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                            {rule.amount && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Amount: {rule.amount.toLocaleString()} RWF
                                {rule.gracePeriod !== null && rule.gracePeriod !== undefined && (
                                  <span> • Grace Period: {rule.gracePeriod} day(s)</span>
                                )}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              Category: {rule.category} • Last Updated: {formatDate(rule.updatedAt || rule.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rule.status)}`}>
                              {rule.status}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {rule.violations || 0} violations
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewRule(rule)}
                            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <Eye size={16} /> View Details
                          </button>
                          {!rule.isFineRule && (
                            <>
                              <button
                                onClick={() => handleEditRule(rule)}
                                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                              >
                                <Edit size={16} /> Edit
                              </button>
                              <button
                                onClick={() => handleExportRule(rule)}
                                className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                              >
                                <Download size={16} /> Export
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <XCircle size={16} /> Delete
                              </button>
                            </>
                          )}
                          {rule.isFineRule && (
                            <button
                              onClick={async () => {
                                await loadFineRules()
                                setShowFineRules(true)
                              }}
                              className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                            >
                              <Edit size={16} /> Manage Fine Rules
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'violations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rule Violations</h2>
                  {violations.filter(v => v.status === 'pending').length > 0 && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-semibold">
                      {violations.filter(v => v.status === 'pending').length} Pending
                    </span>
                  )}
                </div>
                {violations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <AlertCircle className="mx-auto mb-2" size={48} />
                    <p>No violations found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {violations.map((violation) => (
                      <div
                        key={violation.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">{violation.member?.name || 'Unknown Member'}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{violation.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              Rule: {violation.rule?.title || 'Unknown Rule'} • Reported by: {violation.reporter?.name || 'Unknown'} ({violation.reporter?.role || 'Unknown'}) • Date: {formatDate(violation.reportedDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(violation.status)}`}>
                              {violation.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(violation.severity)}`}>
                              {violation.severity}
                            </span>
                          </div>
                        </div>

                        {/* Action Items Section */}
                        {violation.status === 'pending' && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                              <AlertCircle size={18} /> Action Required
                            </h4>
                            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                              <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Review the violation details and verify the reported issue</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Contact the member ({violation.member?.name || 'Unknown'}) to discuss the violation</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Check the rule ({violation.rule?.title || 'Unknown Rule'}) to understand the compliance requirement</span>
                              </li>
                              {violation.severity === 'high' && (
                                <li className="flex items-start gap-2">
                                  <span className="mt-1">•</span>
                                  <span className="font-semibold">High severity - requires immediate attention and resolution</span>
                                </li>
                              )}
                              <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Document the resolution process and outcome</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>Update the violation status once resolved</span>
                              </li>
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          {violation.status === 'pending' || violation.status === 'under-review' ? (
                            <button
                              onClick={() => handleResolveViolation(violation)}
                              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                            >
                              <CheckCircle size={16} /> Resolve
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleViewRule(violation.rule)}
                            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <Eye size={16} /> View Rule
                          </button>
                          {violation.status === 'resolved' && violation.resolutionNotes && (
                            <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">Resolution:</p>
                              <p className="text-sm text-green-700 dark:text-green-300">{violation.resolutionNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'agreements' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Signed Agreements</h2>
                {agreements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="mx-auto mb-2" size={48} />
                    <p>No active agreements found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agreements.map((agreement) => (
                      <div
                        key={agreement.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">{agreement.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{agreement.description}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                              Signed by: {agreement.creator?.name || 'Unknown'} • Date: {formatDate(agreement.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('active')}`}>
                              active
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {agreement.members || 0} members
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/secretary/voting/${agreement.id}`, '_blank')}
                            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <Eye size={16} /> View Agreement
                          </button>
                          <button className="btn-secondary text-sm px-4 py-2 flex items-center gap-2">
                            <Download size={16} /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Compliance Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Monthly Compliance Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Generate monthly compliance summary</p>
                    <button className="btn-primary text-sm px-3 py-1">Generate Report</button>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Violation Analysis</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Analyze violation patterns and trends</p>
                    <button className="btn-primary text-sm px-3 py-1">View Analysis</button>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Member Compliance Status</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Check individual member compliance</p>
                    <button className="btn-primary text-sm px-3 py-1">Check Status</button>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Policy Effectiveness</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Evaluate rule effectiveness</p>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Rule</h2>
                <button
                  onClick={() => setShowAddRule(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rule Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRule.title}
                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter rule title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter rule description..."
                    required
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

        {/* Edit Rule Modal */}
        {showEditRule && selectedRule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Rule</h2>
                <button
                  onClick={() => {
                    setShowEditRule(false)
                    setSelectedRule(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rule Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editRule.title}
                    onChange={(e) => setEditRule({ ...editRule, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={editRule.category}
                    onChange={(e) => setEditRule({ ...editRule, category: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editRule.status}
                    onChange={(e) => setEditRule({ ...editRule, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editRule.description}
                    onChange={(e) => setEditRule({ ...editRule, description: e.target.value })}
                    className="input-field h-32 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditRule(false)
                      setSelectedRule(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateRule}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Rule Details Modal */}
        {showViewRule && selectedRule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Rule Details</h2>
                <button
                  onClick={() => {
                    setShowViewRule(false)
                    setSelectedRule(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedRule.title}</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRule.status)}`}>
                      {selectedRule.status}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category: {selectedRule.category}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedRule.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created By</p>
                    <p className="font-semibold dark:text-white">{selectedRule.creator?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created Date</p>
                    <p className="font-semibold dark:text-white">{formatDate(selectedRule.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="font-semibold dark:text-white">{formatDate(selectedRule.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Violations</p>
                    <p className="font-semibold dark:text-white">{selectedRule.violations || 0}</p>
                  </div>
                </div>

                {selectedRule.violations > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Related Violations</h4>
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(`/compliance/rules/${selectedRule.id}/violations`)
                          if (response.data.success) {
                            const violations = response.data.data
                            if (violations.length > 0) {
                              setViolations(violations)
                              setActiveTab('violations')
                              setShowViewRule(false)
                              setSelectedRule(null)
                            } else {
                              alert('No violations found for this rule')
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching violations:', error)
                        }
                      }}
                      className="btn-primary"
                    >
                      View All Violations ({selectedRule.violations})
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowViewRule(false)
                      setSelectedRule(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewRule(false)
                      handleEditRule(selectedRule)
                    }}
                    className="btn-primary flex-1"
                  >
                    Edit Rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Violation Modal */}
        {showReportViolation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Report Violation</h2>
                <button
                  onClick={() => setShowReportViolation(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rule Violated <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newViolation.ruleId}
                    onChange={(e) => setNewViolation({ ...newViolation, ruleId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select rule...</option>
                    {rules.filter(r => r.status === 'active').map((rule) => (
                      <option key={rule.id} value={rule.id}>{rule.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newViolation.memberId}
                    onChange={(e) => setNewViolation({ ...newViolation, memberId: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select member...</option>
                    {groupMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.name} ({member.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newViolation.description}
                    onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Describe the violation..."
                    required
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

        {/* Resolve Violation Modal */}
        {showResolveViolation && selectedViolation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Resolve Violation</h2>
                <button
                  onClick={() => {
                    setShowResolveViolation(false)
                    setSelectedViolation(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Member: <span className="font-semibold dark:text-white">{selectedViolation.member?.name}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rule: <span className="font-semibold dark:text-white">{selectedViolation.rule?.title}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Description: <span className="dark:text-white">{selectedViolation.description}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Resolution Status
                  </label>
                  <select
                    value={resolveViolation.status}
                    onChange={(e) => setResolveViolation({ ...resolveViolation, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="under-review">Under Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolveViolation.resolutionNotes}
                    onChange={(e) => setResolveViolation({ ...resolveViolation, resolutionNotes: e.target.value })}
                    className="input-field h-32 resize-none"
                    placeholder="Enter resolution notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowResolveViolation(false)
                      setSelectedViolation(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateViolationStatus}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fine Rules Modal */}
        {showFineRules && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Fine Rules Configuration</h2>
                <button
                  onClick={() => {
                    setShowFineRules(false)
                    setEditingRule(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Manage fine types, amounts, and conditions. These rules are used when Cashier or Secretary imposes fines.
                </p>

                <div className="space-y-3">
                  {fineRules.map((rule) => (
                    <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                      {editingRule?.id === rule.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fine Type</label>
                            <input
                              type="text"
                              value={editingRule.type}
                              onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value })}
                              className="input-field w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                              value={editingRule.description}
                              onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                              className="input-field w-full"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount (RWF)</label>
                              <input
                                type="number"
                                value={editingRule.amount}
                                onChange={(e) => setEditingRule({ ...editingRule, amount: parseFloat(e.target.value) || 0 })}
                                className="input-field w-full"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Max Limit (RWF)</label>
                              <input
                                type="number"
                                value={editingRule.maxLimit}
                                onChange={(e) => setEditingRule({ ...editingRule, maxLimit: parseFloat(e.target.value) || 0 })}
                                className="input-field w-full"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Conditions</label>
                            <input
                              type="text"
                              value={editingRule.conditions}
                              onChange={(e) => setEditingRule({ ...editingRule, conditions: e.target.value })}
                              className="input-field w-full"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingRule.enabled}
                                onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                            </label>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setEditingRule(null)}
                              className="btn-secondary text-sm px-4 py-2"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveFineRule(editingRule)}
                              className="btn-primary text-sm px-4 py-2"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-white">{rule.type}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rule.description}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Amount: </span>
                                <span className="font-semibold dark:text-white">{rule.amount.toLocaleString()} RWF</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Max Limit: </span>
                                <span className="font-semibold dark:text-white">{rule.maxLimit.toLocaleString()} RWF</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Conditions: {rule.conditions}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditFineRule(rule)}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                              <Edit size={18} className="text-blue-600 dark:text-blue-400" />
                            </button>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              rule.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}>
                              {rule.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowFineRules(false)
                      setEditingRule(null)
                    }}
                    className="btn-secondary flex-1"
                    disabled={savingRules}
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveFineRules}
                    disabled={savingRules || editingRule !== null}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingRules ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
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
