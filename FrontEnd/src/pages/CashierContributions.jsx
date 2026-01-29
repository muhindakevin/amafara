import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Receipt, Calendar, CheckCircle, XCircle, Search, Filter, DollarSign, Clock, AlertCircle, Phone, Mail, Database, Download, Printer } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import jsPDF from 'jspdf'

function CashierContributions() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRecordCash, setShowRecordCash] = useState(false)
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState(null)
  const [recordedContributions, setRecordedContributions] = useState([]) // Track recorded contributions
  const [selectedReceipt, setSelectedReceipt] = useState(null) // Selected contribution for receipt view
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setLoading(true)
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        // Load recorded transactions from localStorage
        const recorded = JSON.parse(localStorage.getItem('cashierRecordedTransactions') || '[]')
        setRecordedContributions(recorded.filter(r => r.type === 'contribution'))

        const [groupRes, contribsRes] = await Promise.all([
          api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } })),
          api.get('/contributions', { params: { groupId } }).catch(() => ({ data: { success: false, data: [] } }))
        ])

        if (!mounted) return

        if (groupRes.data?.success) {
          setGroupInfo(groupRes.data.data)
        }

        const contribs = Array.isArray(contribsRes.data?.data) ? contribsRes.data.data : []
        setContributions(contribs.map(c => ({
          id: c.id,
          memberId: c.memberId,
          memberName: c.member?.name || c.user?.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
          phone: c.member?.phone || c.user?.phone || '',
          amount: Number(c.amount || 0),
          method: formatPaymentMethod(c.paymentMethod),
          rawMethod: c.paymentMethod,
          status: c.status || 'pending',
          submittedDate: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
          approvedDate: c.approvalDate ? new Date(c.approvalDate).toISOString().split('T')[0] : null,
          transactionId: c.transactionId || c.receiptNumber || '',
          verifiedBy: c.approvedBy ? 'Cashier' : null,
          notes: c.notes || ''
        })))
      } catch (error) {
        console.error('[CashierContributions] Error:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const formatPaymentMethod = (method) => {
    const methodMap = {
      'cash': t('cash', { defaultValue: 'Cash' }),
      'mtn_mobile_money': t('mtnMobileMoney', { defaultValue: 'MTN Mobile Money' }),
      'airtel_money': t('airtelMoney', { defaultValue: 'Airtel Money' }),
      'bank_transfer': t('bankTransfer', { defaultValue: 'Bank Transfer' })
    }
    return methodMap[method] || method?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''
  }

  // Function to generate PDF receipt (same as member sees)
  const generatePDFReceipt = (contributionData, memberName, groupName) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - (margin * 2)
      
      // Blue color: #1E88E5
      const blueColor = [30, 136, 229]
      const lightBlue = [227, 242, 253]
      
      // Header with blue background
      doc.setFillColor(...blueColor)
      doc.roundedRect(margin, margin, contentWidth, 35, 3, 3, 'F')
      
      // White text on blue background
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('IKIMINA WALLET', pageWidth / 2, margin + 15, { align: 'center' })
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text(t('paymentReceipt', { defaultValue: 'Payment Receipt' }), pageWidth / 2, margin + 25, { align: 'center' })
      
      let yPos = margin + 50
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0)
      
      // Receipt details section with light blue background
      doc.setFillColor(...lightBlue)
      doc.roundedRect(margin, yPos, contentWidth, 80, 3, 3, 'F')
      
      yPos += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(t('transactionDetails', { defaultValue: 'Transaction Details' }), margin + 10, yPos)
      
      yPos += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      // Payer Name
      doc.setFont('helvetica', 'bold')
      doc.text('Payer:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(memberName || 'Member', margin + 40, yPos)
      yPos += 7
      
      // Amount
      doc.setFont('helvetica', 'bold')
      doc.text('Amount:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      const amountText = `${Number(contributionData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`
      doc.text(amountText, margin + 40, yPos)
      yPos += 7
      
      // Payment Method
      doc.setFont('helvetica', 'bold')
      doc.text(t('paymentMethod', { defaultValue: 'Payment Method' }) + ':', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(contributionData.paymentMethod || 'Cash', margin + 50, yPos)
      yPos += 7
      
      // Receipt Number
      if (contributionData.receiptNumber) {
        doc.setFont('helvetica', 'bold')
        doc.text(t('receiptNumber', { defaultValue: 'Receipt Number' }) + ':', margin + 10, yPos)
        doc.setFont('helvetica', 'normal')
        doc.setFont('courier', 'normal')
        doc.text(contributionData.receiptNumber, margin + 50, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 7
      }
      
      // Date & Time
      doc.setFont('helvetica', 'bold')
      doc.text('Date & Time:', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(contributionData.date || new Date().toLocaleString(), margin + 45, yPos)
      yPos += 7
      
      // New Total Savings
      if (contributionData.totalSavings) {
        doc.setFont('helvetica', 'bold')
        doc.text(t('newTotalSavings', { defaultValue: 'New Total Savings' }) + ':', margin + 10, yPos)
        doc.setFont('helvetica', 'normal')
        const totalText = `${Number(contributionData.totalSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`
        doc.text(totalText, margin + 50, yPos)
        yPos += 7
      }
      
      yPos += 8
      
      // Thank you message with blue text
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...blueColor)
      doc.text(t('thankYouForContributing', { defaultValue: 'Thank you for contributing to your group savings!' }), pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 10
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.setFont('helvetica', 'normal')
      doc.text(t('officialReceipt', { defaultValue: 'This is an official receipt from IKIMINA WALLET' }), pageWidth / 2, pageHeight - 15, { align: 'center' })
      doc.text(t('forInquiriesContactAdmin', { defaultValue: 'For inquiries, please contact your group administrator' }), pageWidth / 2, pageHeight - 10, { align: 'center' })
      
      // Generate filename
      const receiptNum = contributionData.receiptNumber || `REC-${Date.now()}`
      const filename = `Receipt_${receiptNum}.pdf`
      
      // Save PDF
      doc.save(filename)
      
      console.log(`[CashierContributions] PDF receipt generated: ${filename}`)
      return true
    } catch (error) {
      console.error('[CashierContributions] Error generating PDF receipt:', error)
      return false
    }
  }

  const handleViewReceipt = async (contribution) => {
    try {
      // Fetch member's total savings to show on receipt
      let memberTotalSavings = 0
      try {
        const memberRes = await api.get(`/system-admin/users/${contribution.memberId}`).catch(() => null)
        if (memberRes?.data?.success) {
          memberTotalSavings = memberRes.data.data?.totalSavings || 0
        }
      } catch (e) {
        console.warn('Could not fetch member total savings:', e)
      }

      const receiptData = {
        amount: contribution.amount,
        receiptNumber: contribution.transactionId || contribution.id,
        paymentMethod: formatPaymentMethod(contribution.rawMethod),
        totalSavings: memberTotalSavings,
        date: contribution.approvedDate ? new Date(contribution.approvedDate).toLocaleString() : (contribution.submittedDate ? new Date(contribution.submittedDate).toLocaleString() : new Date().toLocaleString())
      }

      setSelectedReceipt({
        ...contribution,
        receiptData,
        memberName: contribution.memberName,
        groupName: groupInfo?.name || 'Group'
      })
      setShowReceiptModal(true)
    } catch (error) {
      console.error('Error loading receipt:', error)
      alert(t('errorLoadingReceipt', { defaultValue: 'Error loading receipt. Please try again.' }))
    }
  }

  const filteredContributions = contributions.filter(contribution => {
    const matchesStatus = filterStatus === 'all' || contribution.status === filterStatus
    const matchesSearch = 
      contribution.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.memberId?.toString().includes(searchTerm) ||
      contribution.phone.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const handleApproveContribution = async (contributionId) => {
    try {
      const response = await api.put(`/contributions/${contributionId}/approve`)
      if (response.data?.success) {
        alert(t('contributionApprovedSuccessfully', { defaultValue: 'Contribution approved successfully!' }))
        window.location.reload()
      } else {
        alert(t('contributionRejected', { defaultValue: 'Failed to approve contribution' }))
      }
    } catch (error) {
      console.error('Error approving contribution:', error)
      alert(error.response?.data?.message || t('contributionRejected', { defaultValue: 'Failed to approve contribution' }))
    }
  }

  const handleRejectContribution = async (contributionId) => {
    const reason = prompt(t('provideRejectionReason', { defaultValue: 'Please provide a reason for rejection:' }))
    if (!reason) return
    
    try {
      const response = await api.put(`/contributions/${contributionId}/reject`, { reason })
      if (response.data?.success) {
        alert(t('contributionRejected', { defaultValue: 'Contribution rejected!' }))
        window.location.reload()
      } else {
        alert(t('contributionRejected', { defaultValue: 'Failed to reject contribution' }))
      }
    } catch (error) {
      console.error('Error rejecting contribution:', error)
      alert(error.response?.data?.message || t('contributionRejected', { defaultValue: 'Failed to reject contribution' }))
    }
  }

  const handleRecordContribution = async (contributionId) => {
    if (!confirm(t('confirmRecordContribution', { defaultValue: 'Are you sure you want to record this contribution transaction?' }))) {
      return
    }

    try {
      const contribution = contributions.find(c => c.id === contributionId)
      if (contribution) {
        const recordedContribution = {
          id: `contrib-${contributionId}`,
          contributionId: contributionId,
          memberName: contribution.memberName,
          memberId: contribution.memberId,
          amount: contribution.amount,
          paymentMethod: contribution.method,
          recordedDate: new Date().toISOString(),
          recordedBy: 'Cashier',
          type: 'contribution',
          transactionId: contribution.transactionId
        }
        
        // Save to localStorage (or call backend API if available)
        const existing = JSON.parse(localStorage.getItem('cashierRecordedTransactions') || '[]')
        const updated = [...existing.filter(r => r.contributionId !== contributionId), recordedContribution]
        localStorage.setItem('cashierRecordedTransactions', JSON.stringify(updated))
        setRecordedContributions(updated.filter(r => r.type === 'contribution'))
        
        alert(t('contributionRecordedSuccessfully', { defaultValue: 'Contribution transaction recorded successfully!' }))
        window.location.reload()
      }
    } catch (error) {
      console.error('Error recording contribution:', error)
      alert(error.response?.data?.message || t('contributionRecordFailed', { defaultValue: 'Failed to record contribution' }))
    }
  }

  const handleRecordCashPayment = async () => {
    if (!cashPayment.memberId || !cashPayment.amount) {
      alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
      return
    }

    try {
      // Find member by ID or name
      const membersRes = await api.get('/system-admin/users').catch(() => ({ data: { success: false, data: [] } }))
      const members = Array.isArray(membersRes.data?.data) ? membersRes.data.data : []
      const member = members.find(m => 
        m.id.toString() === cashPayment.memberId || 
        m.name.toLowerCase() === cashPayment.memberName.toLowerCase()
      )

      if (!member) {
        alert(t('memberNotFound', { defaultValue: 'Member not found' }))
        return
      }

      const response = await api.post('/contributions', {
        amount: parseFloat(cashPayment.amount),
        paymentMethod: 'cash',
        transactionId: cashPayment.receiptNumber || `CASH-${Date.now()}`,
        notes: cashPayment.notes || `Cash payment recorded by Cashier. Receipt: ${cashPayment.receiptNumber}`
      })

      if (response.data?.success) {
        alert(t('cashPaymentRecordedSuccessfully', { defaultValue: 'Cash payment recorded successfully!' }))
        setShowRecordCash(false)
        setCashPayment({ memberId: '', memberName: '', amount: '', receiptNumber: '', notes: '' })
        window.location.reload()
      }
    } catch (error) {
      console.error('Error recording cash payment:', error)
      alert(error.response?.data?.message || t('cashPaymentRecordedFailed', { defaultValue: 'Failed to record cash payment' }))
    }
  }

  const [cashPayment, setCashPayment] = useState({
    memberId: '',
    memberName: '',
    amount: '',
    receiptNumber: '',
    notes: ''
  })

  const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0)
  const pendingCount = contributions.filter(c => c.status === 'pending').length
  const completedCount = contributions.filter(c => c.status === 'approved' || c.status === 'completed').length

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('memberContributions', { defaultValue: 'Member Contributions' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('manageVerifyContributionPayments', { defaultValue: 'Manage and verify member contribution payments' })}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/cashier/records')}
              className="btn-primary flex items-center gap-2"
            >
              <Database size={18} /> {t('viewAllRecords', { defaultValue: 'View All Records' })}
            </button>
            <button
              onClick={() => setShowRecordCash(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Receipt size={18} /> {t('recordCashPayment', { defaultValue: 'Record Cash Payment' })}
            </button>
            <button 
              onClick={() => navigate('/cashier/schedule')}
              className="btn-secondary flex items-center gap-2"
            >
              <Calendar size={18} /> {t('viewSchedule', { defaultValue: 'View Schedule' })}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalContributions')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{contributions.length}</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('pendingApprovals')}</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('completed', { defaultValue: 'Completed' })}</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalAmount', { defaultValue: 'Total Amount' })}</p>
                <p className="text-2xl font-bold text-purple-600">{totalAmount.toLocaleString()} RWF</p>
              </div>
              <CreditCard className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('search', { defaultValue: 'Search' })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchByMemberNameIdPhone', { defaultValue: 'Search by member name, ID, or phone...' })}
                  className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('filterByStatus', { defaultValue: 'Filter by Status' })}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">{t('all', { defaultValue: 'All' })}</option>
                <option value="pending">{t('pending', { defaultValue: 'Pending' })}</option>
                <option value="approved">{t('completed', { defaultValue: 'Approved' })}</option>
                <option value="rejected">{t('rejected', { defaultValue: 'Rejected' })}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('contributionPayments', { defaultValue: 'Contribution Payments' })} ({filteredContributions.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : filteredContributions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noContributionsFound', { defaultValue: 'No contributions found' })}</p>
          ) : (
            <div className="space-y-4">
              {filteredContributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {contribution.memberName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{contribution.memberName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{contribution.phone} • ID: {contribution.memberId}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">{t('submitted', { defaultValue: 'Submitted' })}: {contribution.submittedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contribution.status)}`}>
                        {contribution.status}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {contribution.amount.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('paymentMethod', { defaultValue: 'Payment Method' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{contribution.method}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('transactionId', { defaultValue: 'Transaction ID' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{contribution.transactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('verifiedBy', { defaultValue: 'Verified By' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{contribution.verifiedBy || t('pending', { defaultValue: 'Pending' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{t('approvedDate', { defaultValue: 'Approved Date' })}</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{contribution.approvedDate || t('pending', { defaultValue: 'Pending' })}</p>
                    </div>
                  </div>

                  {contribution.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('notes', { defaultValue: 'Notes' })}:</p>
                      <p className="text-sm text-gray-800 dark:text-white italic">"{contribution.notes}"</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {contribution.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveContribution(contribution.id)}
                          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                        >
                          <CheckCircle size={16} /> {tCommon('approve')}
                        </button>
                        <button
                          onClick={() => handleRejectContribution(contribution.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <XCircle size={16} /> {tCommon('reject')}
                        </button>
                        {contribution.rawMethod?.includes('mobile_money') && (
                          <button
                            onClick={() => handleApproveContribution(contribution.id)}
                            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <CreditCard size={16} /> {t('verifyPayment', { defaultValue: 'Verify Payment' })}
                          </button>
                        )}
                      </>
                    )}
                    {contribution.status === 'approved' && !recordedContributions.find(r => r.contributionId === contribution.id) && (
                      <button
                        onClick={() => handleRecordContribution(contribution.id)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <Database size={16} /> {t('recordTransaction', { defaultValue: 'Record Transaction' })}
                      </button>
                    )}
                    {contribution.status === 'approved' && recordedContributions.find(r => r.contributionId === contribution.id) && (
                      <span className="text-sm text-green-600 dark:text-green-400 px-3 py-2 flex items-center gap-2">
                        <CheckCircle size={16} /> {t('recorded', { defaultValue: 'Recorded' })}
                      </span>
                    )}
                    {contribution.status === 'approved' && (
                      <button 
                        onClick={() => handleViewReceipt(contribution)}
                        className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <Receipt size={16} /> {t('viewReceipt', { defaultValue: 'View Receipt' })}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showRecordCash && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('recordCashPayment', { defaultValue: 'Record Cash Payment' })}</h2>
                <button
                  onClick={() => setShowRecordCash(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('memberId', { defaultValue: 'Member ID' })}
                    </label>
                    <input
                      type="text"
                      value={cashPayment.memberId}
                      onChange={(e) => setCashPayment({ ...cashPayment, memberId: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={t('enterMemberId', { defaultValue: 'Enter member ID...' })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('memberName', { defaultValue: 'Member Name' })}
                    </label>
                    <input
                      type="text"
                      value={cashPayment.memberName}
                      onChange={(e) => setCashPayment({ ...cashPayment, memberName: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={t('enterMemberName', { defaultValue: 'Enter member name...' })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('amount', { defaultValue: 'Amount' })} (RWF)
                    </label>
                    <input
                      type="number"
                      value={cashPayment.amount}
                      onChange={(e) => setCashPayment({ ...cashPayment, amount: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={t('enterAmount', { defaultValue: 'Enter amount...' })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('receiptNumber', { defaultValue: 'Receipt Number' })}
                    </label>
                    <input
                      type="text"
                      value={cashPayment.receiptNumber}
                      onChange={(e) => setCashPayment({ ...cashPayment, receiptNumber: e.target.value })}
                      className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder={t('enterReceiptNumber', { defaultValue: 'Enter receipt number...' })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('notes', { defaultValue: 'Notes' })}
                  </label>
                  <textarea
                    value={cashPayment.notes}
                    onChange={(e) => setCashPayment({ ...cashPayment, notes: e.target.value })}
                    className="input-field h-24 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder={t('enterAdditionalNotes', { defaultValue: 'Enter any additional notes...' })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRecordCash(false)}
                    className="btn-secondary flex-1"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    onClick={handleRecordCashPayment}
                    className="btn-primary flex-1"
                  >
                    {t('recordPayment', { defaultValue: 'Record Payment' })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && selectedReceipt && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('paymentReceipt', { defaultValue: 'Payment Receipt' })}</h2>
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setSelectedReceipt(null)
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Receipt Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white text-center">
                  <h1 className="text-3xl font-bold mb-2">IKIMINA WALLET</h1>
                  <p className="text-lg">{t('paymentReceipt', { defaultValue: 'Payment Receipt' })}</p>
                </div>

                {/* Receipt Details */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('payer', { defaultValue: 'Payer' })}:</span>
                    <span className="font-bold text-lg text-gray-800 dark:text-white">{selectedReceipt.memberName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('amount', { defaultValue: 'Amount' })}:</span>
                    <span className="font-bold text-xl text-gray-800 dark:text-white">
                      {Number(selectedReceipt.receiptData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('paymentMethod', { defaultValue: 'Payment Method' })}:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{selectedReceipt.receiptData.paymentMethod}</span>
                  </div>
                  
                  {selectedReceipt.receiptData.receiptNumber && (
                    <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('receiptNumber', { defaultValue: 'Receipt Number' })}:</span>
                      <span className="font-mono text-sm bg-white dark:bg-gray-700 px-3 py-1 rounded border border-blue-200 dark:border-blue-800 text-gray-800 dark:text-white">
                        {selectedReceipt.receiptData.receiptNumber}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('dateAndTime', { defaultValue: 'Date & Time' })}:</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{selectedReceipt.receiptData.date}</span>
                  </div>
                  
                  {selectedReceipt.receiptData.totalSavings > 0 && (
                    <div className="flex justify-between items-center pt-3">
                      <span className="text-gray-700 dark:text-gray-300 font-bold">{t('newTotalSavings', { defaultValue: 'New Total Savings' })}:</span>
                      <span className="font-bold text-xl text-green-600 dark:text-green-400">
                        {Number(selectedReceipt.receiptData.totalSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
                      </span>
                    </div>
                  )}
                </div>

                {/* Thank you message */}
                <div className="text-center mb-6">
                  <p className="text-blue-600 dark:text-blue-400 italic font-semibold">
                    {t('thankYouForContributing', { defaultValue: 'Thank you for contributing to your group savings!' })}
                  </p>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>{t('officialReceipt', { defaultValue: 'This is an official receipt from IKIMINA WALLET' })}</p>
                  <p>{t('forInquiriesContactAdmin', { defaultValue: 'For inquiries, please contact your group administrator' })}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowReceiptModal(false)
                      setSelectedReceipt(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    {tCommon('close', { defaultValue: 'Close' })}
                  </button>
                  <button
                    onClick={() => {
                      generatePDFReceipt(selectedReceipt.receiptData, selectedReceipt.memberName, selectedReceipt.groupName)
                    }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Download size={18} /> {t('downloadPDF', { defaultValue: 'Download PDF' })}
                  </button>
                  <button
                    onClick={() => {
                      window.print()
                    }}
                    className="btn-secondary flex items-center justify-center gap-2 px-4"
                  >
                    <Printer size={18} /> {t('print', { defaultValue: 'Print' })}
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

export default CashierContributions
