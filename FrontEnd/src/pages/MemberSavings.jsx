import { useEffect, useState } from 'react'
import { DollarSign, Plus, TrendingUp, Calendar, Clock, CheckCircle, AlertCircle, Download, Filter, Search, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

function MemberSavings() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionMethod, setContributionMethod] = useState('mobile-money')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const { data: savingsData, setData: setSavingsData, loading, wrap } = useApiState({
    totalSavings: 0,
    monthlyTarget: 0,
    contributionsThisMonth: 0,
    lastContribution: null,
    nextDueDate: null,
    groupName: '',
    memberName: '' // Store member name for receipts
  })

  const [contributionHistory, setContributionHistory] = useState([])
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render key
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successContribution, setSuccessContribution] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [minimumContribution, setMinimumContribution] = useState(0)
  const itemsPerPage = 10

  // Function to generate beautiful blue & white PDF receipt
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
      doc.setFont('helvetica', 'bold')
      doc.text(t('newTotalSavings', { defaultValue: 'New Total Savings' }) + ':', margin + 10, yPos)
      doc.setFont('helvetica', 'normal')
      const totalText = `${Number(contributionData.totalSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`
      doc.text(totalText, margin + 50, yPos)
      
      yPos += 15
      
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
      
      console.log(`[MemberSavings] PDF receipt generated: ${filename}`)
      return true
    } catch (error) {
      console.error('[MemberSavings] Error generating PDF receipt:', error)
      return false
    }
  }

  const refreshSavingsData = async () => {
    // Check if token exists before making requests
    const token = localStorage.getItem('uw_token')
    if (!token) {
      console.warn('No token found. Redirecting to login...')
      window.location.href = '/login'
      return
    }

    wrap(async () => {
      try {
        // Fetch user data first to get groupId
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        
        // Fetch other data in parallel
        const [dash, contributions, groupData] = await Promise.all([
          api.get('/members/dashboard'),
          api.get('/contributions/member'), // Fetch contributions directly from database
          groupId ? api.get(`/groups/${groupId}`).catch(() => ({ data: { success: false } })) : Promise.resolve({ data: { success: false } }) // Get group data for minimum contribution
        ])
        
        // Get minimum contribution amount from group
        if (groupData.data?.success && groupData.data.data) {
          const minAmount = Number(groupData.data.data.contributionAmount || 0)
          setMinimumContribution(minAmount)
          console.log(`[MemberSavings] Minimum contribution amount: ${minAmount} RWF`)
        }
        
        // Calculate totalSavings from actual approved contributions (source of truth)
        let totalSavings = 0
        if (contributions.data?.success) {
          const approvedContributions = (contributions.data.data || []).filter(c => c.status === 'approved')
          totalSavings = approvedContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
          console.log(`[MemberSavings] Calculated totalSavings from contributions: ${totalSavings.toFixed(2)} RWF`)
          console.log(`[MemberSavings] Number of approved contributions: ${approvedContributions.length}`)
        } else {
          // Fallback to database value if contributions fetch fails
          const userTotalSavings = me.data?.data?.totalSavings || 0
          const dashboardTotalSavings = dash.data?.data?.stats?.totalSavings || 0
          totalSavings = Math.max(Number(userTotalSavings) || 0, Number(dashboardTotalSavings) || 0)
          console.warn(`[MemberSavings] Using fallback database totalSavings: ${totalSavings.toFixed(2)} RWF`)
        }
        
        if (dash.data?.success) {
          const stats = dash.data.data.stats || {}
          // Get group name from /auth/me or dashboard stats
          const groupName = me.data?.data?.group?.name || 
                           dash.data.data.stats?.group?.name || 
                           ''
          
          console.log(`[MemberSavings] Group name from /auth/me:`, me.data?.data?.group?.name)
          console.log(`[MemberSavings] Group name from dashboard:`, dash.data.data.stats?.group?.name)
          console.log(`[MemberSavings] Final group name:`, groupName)
          
          setSavingsData({
            totalSavings: totalSavings, // Use verified totalSavings
            monthlyTarget: 0,
            contributionsThisMonth: stats.contributionsThisMonth || 0,
            lastContribution: stats.lastContribution ? {
              date: stats.lastContribution.date,
              amount: stats.lastContribution.amount
            } : null,
            nextDueDate: null,
            groupName: groupName,
            memberName: me.data?.data?.name || '' // Store member name from database
          })
        }
        
        // Map contributions from the Contributions table (source of truth)
        if (contributions.data?.success) {
          const rawContributions = contributions.data.data || []
          console.log(`[MemberSavings] Fetched ${rawContributions.length} contributions from database`)
          console.log(`[MemberSavings] Raw contributions data:`, rawContributions)
          
          // Log all contribution statuses for debugging
          const statusCounts = rawContributions.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1
            return acc
          }, {})
          console.log(`[MemberSavings] Contribution status breakdown:`, statusCounts)
          
          // Map payment method from database format to display format
          const paymentMethodMap = {
            'mtn_mobile_money': t('mtnMobileMoney', { defaultValue: 'MTN Mobile Money' }),
            'airtel_money': t('airtelMoney', { defaultValue: 'Airtel Money' }),
            'cash': t('cash', { defaultValue: 'Cash' }),
            'bank_transfer': t('bankTransfer', { defaultValue: 'Bank Transfer' })
          }
          
          // Map status from database format to display format
          const statusMap = {
            'approved': 'completed',
            'pending': 'pending',
            'rejected': 'failed'
          }
          
          // Map ALL contributions (including approved ones) for display
          const list = rawContributions.map((c, index) => {
            // Ensure we have a valid date
            let contributionDate = ''
            let createdAtDate = null
            
            if (c.createdAt) {
              try {
                createdAtDate = new Date(c.createdAt)
                if (!isNaN(createdAtDate.getTime())) {
                  contributionDate = createdAtDate.toISOString().split('T')[0]
                }
              } catch (e) {
                console.warn(`[MemberSavings] Invalid date for contribution ${c.id}:`, c.createdAt)
              }
            }
            
            const mapped = {
              id: c.id || `contrib-${index}-${Date.now()}`,
            amount: Number(c.amount || 0),
              date: contributionDate,
            method: paymentMethodMap[c.paymentMethod] || c.paymentMethod || 'Cash',
            status: statusMap[c.status] || c.status || 'pending',
            receiptNumber: c.receiptNumber || null,
            notes: c.notes || null,
              createdAt: c.createdAt || createdAtDate,
            // Store original values for reference
            originalStatus: c.status,
            originalPaymentMethod: c.paymentMethod
            }
            
            console.log(`[MemberSavings] Mapped contribution ${mapped.id}:`, {
              amount: mapped.amount,
              date: mapped.date,
              method: mapped.method,
              status: mapped.status
            })
            
            return mapped
          })
          
          // Sort by date descending (most recent first)
          list.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0)
            const dateB = new Date(b.createdAt || b.date || 0)
            return dateB - dateA
          })
          
          console.log(`[MemberSavings] Setting contribution history with ${list.length} contributions`)
          setContributionHistory(list)
          console.log(`[MemberSavings] Mapped and sorted ${list.length} contributions for display`)
          console.log(`[MemberSavings] Approved contributions: ${list.filter(c => c.originalStatus === 'approved').length}`)
        } else {
          console.warn('[MemberSavings] Failed to fetch contributions:', contributions.data)
          console.warn('[MemberSavings] Contributions response:', contributions)
          setContributionHistory([])
        }
      } catch (error) {
        // If 401, the interceptor will handle redirect
        if (error.response?.status === 401) {
          console.error('Authentication failed. Please log in again.')
        } else {
          console.error('Error fetching savings data:', error)
        }
      }
    })
  }

  useEffect(() => {
    refreshSavingsData()
    
    // Set up periodic refresh to keep data synced with database (every 30 seconds)
    const refreshInterval = setInterval(() => {
      console.log('[MemberSavings] Periodic refresh triggered')
      refreshSavingsData()
    }, 30000) // 30 seconds
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval)
    }
  }, [])
  
  // Also refresh when refreshKey changes (manual trigger)
  useEffect(() => {
    if (refreshKey > 0) {
      refreshSavingsData()
    }
  }, [refreshKey])

  const handleContribution = async () => {
    if (!contributionAmount || contributionAmount <= 0) {
      alert('Please enter a valid contribution amount')
      return
    }

    // Prevent double submission
    if (isSubmitting) {
      return
    }

    // Check if token exists before making request
    const token = localStorage.getItem('uw_token')
    if (!token) {
      alert('You are not logged in. Please log in again.')
      window.location.href = '/login'
      return
    }

    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      // Map frontend payment method to backend format
      const paymentMethodMap = {
        'mobile-money': 'mtn_mobile_money',
        'airtel-money': 'airtel_money',
        'cash': 'cash'
      }

      const amount = parseFloat(contributionAmount)

      // Note: We'll update the UI after the server confirms the contribution is saved
      // This prevents showing contributions that might not be persisted

      // Use longer timeout for contributions (30 seconds) as it may need to process notifications
      const response = await api.post('/contributions', {
        amount: amount,
        paymentMethod: paymentMethodMap[contributionMethod] || 'mtn_mobile_money',
        notes: `Contribution made via ${contributionMethod}`
      }, {
        timeout: 30000 // 30 seconds timeout for contributions
      })

      if (response.data?.success) {
        const contributionId = response.data.data?.id
        const newTotalSavings = response.data.data?.memberTotalSavings
        const receiptNumber = response.data.data?.receiptNumber
        const paymentMethod = response.data.data?.paymentMethod
        
        console.log(`[MemberSavings] Contribution submitted successfully. ID: ${contributionId}, Amount: ${amount} RWF`)
        console.log(`[MemberSavings] Server reports totalSavings: ${newTotalSavings || 'N/A'} RWF`)
        
        // Store success contribution data for modal
        const paymentMethodDisplay = {
          'mtn_mobile_money': 'MTN Mobile Money',
          'airtel_money': 'Airtel Money',
          'cash': 'Cash',
          'bank_transfer': 'Bank Transfer'
        }[paymentMethod] || paymentMethod || contributionMethod
        
        setSuccessContribution({
          id: contributionId,
          amount: amount,
          receiptNumber: receiptNumber,
          paymentMethod: paymentMethodDisplay,
          totalSavings: newTotalSavings,
          date: new Date().toLocaleString()
        })
        
        // Fetch member name from API if not in response
        let memberName = 'Member'
        try {
          const meResponse = await api.get('/auth/me')
          if (meResponse.data?.success) {
            memberName = meResponse.data.data?.name || 'Member'
          }
        } catch (e) {
          console.warn('[MemberSavings] Could not fetch member name for receipt:', e)
        }
        
        const groupName = savingsData.groupName || 'Group'
        
        // Store success contribution data for modal
        const receiptData = {
          amount: amount,
          receiptNumber: receiptNumber,
          paymentMethod: paymentMethodDisplay,
          totalSavings: newTotalSavings,
          date: new Date().toLocaleString()
        }
        
        setSuccessContribution({
          id: contributionId,
          ...receiptData,
          memberName: memberName,
          groupName: groupName
        })
        
        // Show success modal
        setShowSuccessModal(true)
        setSuccessMessage('Contribution recorded successfully! Your savings have been updated.')
        
        // Immediately update the UI optimistically with the server response
        // This ensures the Total Savings card updates immediately and stays fixed
        setSavingsData(prev => ({
          ...prev,
          totalSavings: newTotalSavings || (prev.totalSavings + amount),
          contributionsThisMonth: (prev.contributionsThisMonth || 0) + 1
        }))
        
        // Auto-generate and download PDF receipt after a short delay
        setTimeout(() => {
          const pdfGenerated = generatePDFReceipt(receiptData, memberName, groupName)
          if (pdfGenerated) {
            console.log('[MemberSavings] PDF receipt auto-downloaded successfully')
          } else {
            console.warn('[MemberSavings] PDF receipt generation failed, but contribution was saved')
          }
        }, 1500) // Wait 1.5 seconds for modal to show first
        
        // Wait a moment to ensure backend has fully committed the transaction
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Retry mechanism to ensure contribution appears in history
        let retries = 0
        const maxRetries = 5
        let contributionFound = false
        
        while (retries < maxRetries && !contributionFound) {
          console.log(`[MemberSavings] Refreshing data (attempt ${retries + 1}/${maxRetries}) to show new contribution...`)
          
          // Force a complete refresh from server to get all updated data
          try {
            const token = localStorage.getItem('uw_token')
            if (token) {
              const [me, dash, contributions] = await Promise.all([
                api.get('/auth/me'),
                api.get('/members/dashboard'),
                api.get('/contributions/member')
              ])
              
              // Calculate totalSavings from actual approved contributions
              let totalSavings = 0
              if (contributions.data?.success) {
                const approvedContributions = (contributions.data.data || []).filter(c => c.status === 'approved')
                totalSavings = approvedContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
                console.log(`[MemberSavings] Refreshed: Calculated totalSavings from contributions: ${totalSavings.toFixed(2)} RWF`)
                console.log(`[MemberSavings] Refreshed: Number of approved contributions: ${approvedContributions.length}`)
              }
              
              if (dash.data?.success) {
                const stats = dash.data.data.stats || {}
                const finalTotalSavings = totalSavings || newTotalSavings || 0
                console.log(`[MemberSavings] Setting totalSavings to: ${finalTotalSavings} RWF`)
                
                setSavingsData({
                  totalSavings: finalTotalSavings,
                  monthlyTarget: 0,
                  contributionsThisMonth: stats.contributionsThisMonth || 0,
                  lastContribution: stats.lastContribution ? {
                    date: stats.lastContribution.date,
                    amount: stats.lastContribution.amount
                  } : null,
                  nextDueDate: null,
                  groupName: me.data?.data?.group?.name || ''
                })
              }
              
              // Update contribution history
              if (contributions.data?.success) {
                const rawContributions = contributions.data.data || []
                console.log(`[MemberSavings] Refreshed: Fetched ${rawContributions.length} contributions from database`)
                
                // Check if the new contribution exists
                const newContribution = rawContributions.find(c => c.id === contributionId)
                if (newContribution) {
                  console.log(`[MemberSavings] ✓ Found new contribution in list:`, {
                    id: newContribution.id,
                    amount: newContribution.amount,
                    status: newContribution.status,
                    createdAt: newContribution.createdAt
                  })
                  contributionFound = true
                } else {
                  console.warn(`[MemberSavings] New contribution ${contributionId} not found yet, retrying...`)
                }
                
                const paymentMethodMap = {
                  'mtn_mobile_money': 'MTN Mobile Money',
                  'airtel_money': 'Airtel Money',
                  'cash': 'Cash',
                  'bank_transfer': 'Bank Transfer'
                }
                
                const statusMap = {
                  'approved': 'completed',
                  'pending': 'pending',
                  'rejected': 'failed'
                }
                
                // Map contributions with proper date handling
                const list = rawContributions.map((c, index) => {
                  // Ensure we have a valid date
                  let contributionDate = ''
                  let createdAtDate = null
                  
                  if (c.createdAt) {
                    try {
                      createdAtDate = new Date(c.createdAt)
                      if (!isNaN(createdAtDate.getTime())) {
                        contributionDate = createdAtDate.toISOString().split('T')[0]
                      }
                    } catch (e) {
                      console.warn(`[MemberSavings] Invalid date for contribution ${c.id}:`, c.createdAt)
                    }
                  }
                  
                  return {
                    id: c.id || `contrib-${index}-${Date.now()}`,
                    amount: Number(c.amount || 0),
                    date: contributionDate,
                    method: paymentMethodMap[c.paymentMethod] || c.paymentMethod || 'Cash',
                    status: statusMap[c.status] || c.status || 'pending',
                    receiptNumber: c.receiptNumber || null,
                    notes: c.notes || null,
                    createdAt: c.createdAt || createdAtDate,
                    originalStatus: c.status,
                    originalPaymentMethod: c.paymentMethod
                  }
                })
                
                list.sort((a, b) => {
                  const dateA = new Date(a.createdAt || a.date || 0)
                  const dateB = new Date(b.createdAt || b.date || 0)
                  return dateB - dateA
                })
                
                console.log(`[MemberSavings] Setting contribution history with ${list.length} contributions`)
                setContributionHistory(list)
                
                // Force React to re-render by updating refresh key
                setRefreshKey(prev => prev + 1)
                
                if (contributionFound) {
                  console.log(`[MemberSavings] ✓ Contribution history updated successfully with new contribution`)
                  break
                }
              }
            }
          } catch (refreshError) {
            console.error('[MemberSavings] Error refreshing data:', refreshError)
          }
          
          if (!contributionFound && retries < maxRetries - 1) {
            retries++
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 500 * retries))
          } else {
            break
          }
        }
        
        if (!contributionFound) {
          console.warn(`[MemberSavings] Contribution ${contributionId} not found after ${maxRetries} attempts, but server confirmed it was saved`)
          // Still refresh one more time as fallback
        await refreshSavingsData()
        }
        
        // Also refresh dashboard
        if (window.refreshMemberDashboard) {
          window.refreshMemberDashboard()
        }
        
        // Close contribution modal but keep success modal open
        setShowContributionModal(false)
        setContributionAmount('')
        setSuccessMessage(null)
      } else {
        alert(response.data?.message || 'Failed to submit contribution')
      }
    } catch (error) {
      console.error('Contribution error:', error)
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Check if we got a response before timeout (partial success)
        if (error.response?.data?.success) {
          // Server processed it but response was slow - contribution likely succeeded
          setSuccessMessage('Contribution may have been recorded. Please check your savings balance.')
          setTimeout(() => {
            setShowContributionModal(false)
            setContributionAmount('')
            setSuccessMessage(null)
            refreshSavingsData()
            if (window.refreshMemberDashboard) {
              window.refreshMemberDashboard()
            }
          }, 2000)
          return
        }
        alert('Request timed out. The contribution may still have been processed. Please check your savings balance or try again.')
        // Refresh data to check if contribution went through
        await refreshSavingsData()
        return
      }
      
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to submit contribution. Please try again.'
      
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.')
        window.location.href = '/login'
      } else if (error.response?.status === 400) {
        alert(`Invalid request: ${errorMessage}`)
      } else if (error.response?.status === 500) {
        alert(`Server error: ${errorMessage}. Please try again later.`)
      } else {
        alert(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('mySavings')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('group', { defaultValue: 'Group' })}: {loading ? tCommon('loading') : (savingsData.groupName || '—')}</p>
          </div>
          <button
            onClick={() => setShowContributionModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> {t('makeContribution', { defaultValue: 'Make Contribution' })}
          </button>
        </div>

        {/* Savings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card transition-all duration-500 hover:shadow-lg" key={`total-savings-${savingsData.totalSavings}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalSavings')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-all duration-300">
                  {loading ? 'Loading…' : `${Number(savingsData.totalSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`}
                </p>
                {!loading && savingsData.totalSavings !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">From database • Updated in real-time</p>
                )}
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('monthlyTarget', { defaultValue: 'Monthly Target' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loading ? tCommon('loading') : `${Number(savingsData.monthlyTarget||0).toLocaleString()} RWF`}
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('thisMonth', { defaultValue: 'This Month' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loading ? tCommon('loading') : `${savingsData.contributionsThisMonth || 0} ${t('contributions', { defaultValue: 'contributions' })}`}
                </p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('nextDue', { defaultValue: 'Next Due' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {loading ? tCommon('loading') : (savingsData.nextDueDate || '—')}
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </div>
        </div>

        {/* Contribution History */}
        <div className="card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('contributionHistory', { defaultValue: 'Contribution History' })}</h2>
            <div className="flex flex-wrap gap-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={t('searchByAmountMethod', { defaultValue: 'Search by amount, method...' })}
                  className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                />
              </div>
              
              {/* Filter Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(1) // Reset to first page on filter change
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('allStatus', { defaultValue: 'All Status' })}</option>
                <option value="completed">{t('approved')}</option>
                <option value="pending">{tCommon('pending')}</option>
                <option value="failed">{t('rejected', { defaultValue: 'Rejected' })}</option>
              </select>
              
              <button 
                onClick={() => {
                  console.log('[MemberSavings] Manual refresh triggered')
                  setRefreshKey(prev => prev + 1)
                  refreshSavingsData()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Fetch ALL transactions (not just contributions) to match the report format
                    const transactionsRes = await api.get('/transactions?limit=1000')
                    const allTransactions = transactionsRes.data?.success ? (transactionsRes.data.data || []) : []
                    
                    // Get member name
                    const memberName = savingsData.memberName || 'Member'
                    
                    // Process transactions to match the report format
                    const processedTransactions = allTransactions.map(t => {
                      // Format date and time
                      let dateTimeStr = 'N/A'
                      if (t.transactionDate) {
                        try {
                          const dateObj = new Date(t.transactionDate)
                          if (!isNaN(dateObj.getTime())) {
                            const dateStr = dateObj.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })
                            const timeStr = dateObj.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })
                            dateTimeStr = `${dateStr} ${timeStr}`
                          }
                        } catch (e) {
                          dateTimeStr = String(t.transactionDate)
                        }
                      } else if (t.createdAt) {
                        try {
                          const dateObj = new Date(t.createdAt)
                          if (!isNaN(dateObj.getTime())) {
                            const dateStr = dateObj.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })
                            const timeStr = dateObj.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })
                            dateTimeStr = `${dateStr} ${timeStr}`
                          }
                        } catch (e) {
                          dateTimeStr = String(t.createdAt)
                        }
                      }
                      
                      // Format transaction type
                      let transactionType = 'Transaction'
                      if (t.type === 'contribution') {
                        transactionType = 'Contribution'
                      } else if (t.type === 'loan_payment') {
                        transactionType = 'Loan Payment'
                      } else if (t.type === 'loan_disbursement') {
                        transactionType = 'Loan Request'
                      } else if (t.type === 'fine_payment') {
                        transactionType = 'Fine Payment'
                      } else if (t.type === 'interest') {
                        transactionType = 'Interest'
                      } else if (t.type === 'refund') {
                        transactionType = 'Refund'
                      } else {
                        transactionType = t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1).replace(/_/g, ' ') : 'Transaction'
                      }
                      
                      // Format payment method
                      const paymentMethod = t.paymentMethod || t.method || 'N/A'
                      
                      // Format status
                      const status = (t.status || 'completed').toUpperCase()
                      
                      // Format description
                      let description = t.description || ''
                      if (t.type === 'contribution' && t.referenceId) {
                        description = `Contribution: ${t.referenceId}`
                      } else if (t.type === 'loan_payment') {
                        description = description || 'Loan payment'
                      } else if (t.type === 'loan_disbursement') {
                        description = description || 'Loan disbursement'
                      }
                      
                      return {
                        'Transaction ID': t.id || 'N/A',
                        'Member Name': memberName,
                        'Date & Time': dateTimeStr,
                        'Transaction Type': transactionType,
                        'Amount': Number(t.amount || 0).toFixed(2),
                        'Payment Method': paymentMethod,
                        'Status': status,
                        'Description / Notes': description
                      }
                    })
                    
                    // Sort by date (newest first)
                    processedTransactions.sort((a, b) => {
                      const dateA = a['Date & Time'] === 'N/A' ? new Date(0) : new Date(a['Date & Time'])
                      const dateB = b['Date & Time'] === 'N/A' ? new Date(0) : new Date(b['Date & Time'])
                      return dateB - dateA
                    })
                    
                    // Calculate summary statistics
                    const totalTransactions = processedTransactions.length
                    const totalAmount = processedTransactions.reduce((sum, t) => sum + Number(t.Amount || 0), 0)
                    
                    // Transaction type breakdown
                    const typeBreakdown = {}
                    processedTransactions.forEach(t => {
                      const type = t['Transaction Type']
                      if (!typeBreakdown[type]) {
                        typeBreakdown[type] = { count: 0, amount: 0 }
                      }
                      typeBreakdown[type].count++
                      typeBreakdown[type].amount += Number(t.Amount || 0)
                    })
                    
                    // Create workbook
                    const workbook = XLSX.utils.book_new()
                    
                    // Summary sheet (matching the report format from the image)
                    const summaryData = [
                      ['TRANSACTION REPORT'],
                      ['Generated:', new Date().toLocaleString()],
                      ['Member:', memberName],
                      ['Group:', savingsData.groupName || 'N/A'],
                      [''],
                      ['SUMMARY'],
                      ['Total Transactions:', totalTransactions],
                      ['Total Amount:', `${totalAmount.toFixed(2)} RWF`],
                      [''],
                      ['TRANSACTION TYPE BREAKDOWN']
                    ]
                    
                    // Add transaction type breakdown (matching the format: "type: Count: X, Amount: Y RWF")
                    // Sort by type name for consistency
                    Object.keys(typeBreakdown).sort().forEach(type => {
                      const breakdown = typeBreakdown[type]
                      summaryData.push([`${type}:`, `Count: ${breakdown.count}, Amount: ${breakdown.amount.toFixed(2)} RWF`])
                    })
                    
                    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
                    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
                    
                    // Transactions detail sheet
                    const transactionsSheet = XLSX.utils.json_to_sheet(processedTransactions)
                    
                    // Set column widths
                    transactionsSheet['!cols'] = [
                      { wch: 12 }, // Transaction ID
                      { wch: 20 }, // Member Name
                      { wch: 25 }, // Date & Time
                      { wch: 18 }, // Transaction Type
                      { wch: 12 }, // Amount
                      { wch: 18 }, // Payment Method
                      { wch: 12 }, // Status
                      { wch: 40 }  // Description / Notes
                    ]
                    
                    // Freeze header row
                    transactionsSheet['!freeze'] = { xSplit: 0, ySplit: 1 }
                    
                    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions')
                    
                    // Generate Excel file
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
                    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `transactions-report-${new Date().toISOString().split('T')[0]}.xlsx`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    
                    console.log('[MemberSavings] Transaction report generated successfully', {
                      totalTransactions,
                      totalAmount,
                      typeBreakdown
                    })
                  } catch (err) {
                    console.error('[MemberSavings] Error generating transaction report:', err)
                    alert('Failed to generate transaction report. Please try again.')
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Download transaction report as Excel"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Filtered and Paginated Contribution History */}
          {(() => {
            // Filter contributions based on search term and status
            const filteredContributions = contributionHistory.filter(c => {
              const matchesSearch = !searchTerm || 
                c.amount.toString().includes(searchTerm) ||
                c.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.receiptNumber && c.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
              
              const matchesStatus = filterStatus === 'all' || c.status === filterStatus
              
              return matchesSearch && matchesStatus
            })
            
            // Calculate pagination
            const totalPages = Math.max(1, Math.ceil(filteredContributions.length / itemsPerPage))
            const startIndex = (currentPage - 1) * itemsPerPage
            const endIndex = startIndex + itemsPerPage
            const paginatedContributions = filteredContributions.slice(startIndex, endIndex)
            
            // Reset to page 1 if current page is out of bounds
            if (currentPage > totalPages && totalPages > 0) {
              setCurrentPage(1)
            }
            
            return (
              <>
          <div className="space-y-3">
                  {loading && contributionHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Fetching data…</div>
                  ) : filteredContributions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">No contributions found</p>
                      <p className="text-xs text-gray-400">
                        {contributionHistory.length === 0 
                          ? 'Start by making your first contribution'
                          : 'Try adjusting your search or filter criteria'}
                      </p>
                    </div>
                  ) : (
                    paginatedContributions.map((contribution) => {
                // Format date properly
                let formattedDate = 'N/A'
                if (contribution.date) {
                  try {
                    const dateObj = new Date(contribution.date)
                    if (!isNaN(dateObj.getTime())) {
                      formattedDate = dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  } catch (e) {
                    formattedDate = contribution.date
                  }
                } else if (contribution.createdAt) {
                  try {
                    const dateObj = new Date(contribution.createdAt)
                    if (!isNaN(dateObj.getTime())) {
                      formattedDate = dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  } catch (e) {
                    formattedDate = String(contribution.createdAt)
                  }
                }

                return (
                  <div
                    key={contribution.id || `contrib-${contribution.date}-${contribution.amount}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors border border-gray-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        <DollarSign size={20} />
                  </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-lg text-gray-800 dark:text-gray-100">
                            {Number(contribution.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(contribution.status)}`}>
                            {contribution.status === 'completed' ? 'Approved' : 
                             contribution.status === 'pending' ? 'Pending' : 
                             contribution.status === 'failed' ? 'Rejected' : contribution.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span className="font-medium">{formattedDate}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Method:</span>
                            <span>{contribution.method || 'Cash'}</span>
                          </div>
                      {contribution.receiptNumber && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Receipt:</span>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{contribution.receiptNumber}</span>
                              </div>
                            </>
                          )}
                  </div>
                </div>
                </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          // Generate PDF receipt for this contribution
                          const receiptData = {
                            amount: contribution.amount,
                            receiptNumber: contribution.receiptNumber,
                            paymentMethod: contribution.method,
                            totalSavings: savingsData.totalSavings,
                            date: formattedDate || contribution.date || new Date().toLocaleString()
                          }
                          generatePDFReceipt(receiptData, savingsData.memberName || 'Member', savingsData.groupName || 'Group')
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PDF receipt"
                      >
                        <Download size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
                  )
                })
              )}
          </div>
            
                {/* Pagination Controls */}
                {filteredContributions.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredContributions.length)} of {filteredContributions.length} contributions
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                currentPage === pageNum
                                  ? 'bg-blue-500 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Group Rules */}
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">{t('groupContributionRules', { defaultValue: 'Group Contribution Rules' })}</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={16} />
              <span>Monthly contribution: 5,000 RWF</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={16} />
              <span>Due date: 1st of every month</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="text-yellow-600" size={16} />
              <span>Late fee: 500 RWF per day</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={16} />
              <span>Accepted methods: Mobile Money, Cash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Success Modal */}
      {showSuccessModal && successContribution && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-in">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('paymentSuccessful', { defaultValue: 'Payment Successful!' })}</h2>
                <p className="text-gray-600">Your contribution has been recorded successfully</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {Number(successContribution.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{successContribution.paymentMethod}</span>
                </div>
                {successContribution.receiptNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Receipt Number:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded border">{successContribution.receiptNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">{t('newTotalSavings', { defaultValue: 'New Total Savings' })}:</span>
                  <span className="font-bold text-xl text-green-600">
                    {Number(successContribution.totalSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="text-sm text-gray-700">{successContribution.date}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>✓ Notifications sent:</strong> Confirmation sent to you and alerts sent to Group Admin, Secretary, and Cashier.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setSuccessContribution(null)
                  }}
                  className="btn-primary flex-1"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    // Generate and download PDF receipt
                    const receiptData = {
                      amount: successContribution.amount,
                      receiptNumber: successContribution.receiptNumber,
                      paymentMethod: successContribution.paymentMethod,
                      totalSavings: successContribution.totalSavings,
                      date: successContribution.date
                    }
                    generatePDFReceipt(receiptData, successContribution.memberName || 'Member', successContribution.groupName || 'Group')
                  }}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download PDF Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {showContributionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-in">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('makeContribution')}</h2>
              
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="font-semibold">{successMessage}</span>
                </div>
              )}
              
              <div className="space-y-4">
                {minimumContribution > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle size={16} />
                      <span className="text-sm font-semibold">
                        Minimum Contribution: {minimumContribution.toLocaleString()} RWF
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Your contribution must be at least {minimumContribution.toLocaleString()} RWF
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (RWF)
                    {minimumContribution > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Minimum: {minimumContribution.toLocaleString()} RWF)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder={minimumContribution > 0 ? minimumContribution.toString() : "5000"}
                    min={minimumContribution > 0 ? minimumContribution : undefined}
                    className={`input-field ${contributionAmount && parseFloat(contributionAmount) < minimumContribution && minimumContribution > 0 ? 'border-red-300 bg-red-50' : ''}`}
                    disabled={isSubmitting}
                  />
                  {contributionAmount && parseFloat(contributionAmount) < minimumContribution && minimumContribution > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Amount must be at least {minimumContribution.toLocaleString()} RWF
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={contributionMethod}
                    onChange={(e) => setContributionMethod(e.target.value)}
                    className="input-field"
                    disabled={isSubmitting}
                  >
                    <option value="mobile-money">MTN Mobile Money</option>
                    <option value="airtel-money">Airtel Money</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{t('contributionSummary', { defaultValue: 'Contribution Summary' })}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold">
                        {contributionAmount ? Number(contributionAmount).toLocaleString() : '0'} RWF
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-semibold">
                        {contributionMethod === 'mobile-money' ? 'MTN Mobile Money' : 
                         contributionMethod === 'airtel-money' ? 'Airtel Money' : 
                         contributionMethod === 'cash' ? 'Cash' : contributionMethod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="font-semibold">0 RWF</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1 flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{contributionAmount ? Number(contributionAmount).toLocaleString() : '0'} RWF</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (!isSubmitting) {
                      setShowContributionModal(false)
                      setContributionAmount('')
                      setSuccessMessage(null)
                    }
                  }}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {successMessage ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={handleContribution}
                  disabled={!contributionAmount || contributionAmount <= 0 || (minimumContribution > 0 && parseFloat(contributionAmount) < minimumContribution) || isSubmitting}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : successMessage ? (
                    <>
                      <CheckCircle size={18} />
                      Success!
                    </>
                  ) : (
                    'Make Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MemberSavings


