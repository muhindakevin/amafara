import { useState, useEffect } from 'react'
import { DollarSign, Users, TrendingUp, AlertCircle, Clock, CheckCircle, FileText, BarChart3, Bell, MessageCircle, Download, Filter, Search, Calendar, CreditCard, Receipt, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function CashierDashboard() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tCashier } = useTranslation('cashier')
  const [selectedTab, setSelectedTab] = useState('overview')

  const { data: stats, setData: setStats, loading, wrap } = useApiState({
    totalSavings: 0,
    pendingApprovals: 0,
    overduePayments: 0,
    members: 0
  })

  const [recentTransactions, setRecentTransactions] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [overduePayments, setOverduePayments] = useState([])
  const [allContributions, setAllContributions] = useState([])
  const [allLoans, setAllLoans] = useState([])
  const [allFines, setAllFines] = useState([])
  const [groupInfo, setGroupInfo] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    let mounted = true
    wrap(async () => {
      try {
        // Get current user and groupId
        const me = await api.get('/auth/me')
        const groupId = me.data?.data?.groupId
        if (!groupId || !mounted) return

        console.log('[CashierDashboard] Fetching data for groupId:', groupId)

        // Fetch all data in parallel - same approach as GroupAdmin
        const [groupRes, statsRes, contributionsRes, loansRes, transactionsRes, finesRes, notificationsRes, activitiesRes] = await Promise.all([
          api.get(`/groups/${groupId}`).catch(err => {
            console.error('[CashierDashboard] Error fetching group:', err)
            return { data: { success: false } }
          }),
          api.get(`/groups/${groupId}/stats`).catch(err => {
            console.error('[CashierDashboard] Error fetching stats:', err)
            return { data: { success: false, data: {} } }
          }),
          api.get('/contributions', { params: { groupId: groupId } }).catch(err => {
            console.error('[CashierDashboard] Error fetching contributions:', err)
            return { data: { success: false, data: [] } }
          }),
          api.get('/loans/requests', { params: { status: 'all' } }).catch(err => {
            console.error('[CashierDashboard] Error fetching loans:', err)
            return { data: { success: false, data: [] } }
          }),
          // Fetch ALL transactions from the database (no limit, no date filter)
          // This ensures cashier sees everything that happened in the system
          api.get('/transactions/report', { params: { groupId: groupId } }).catch(err => {
            console.error('[CashierDashboard] Error fetching transactions:', err)
            console.error('[CashierDashboard] Transaction error details:', err.response?.data || err.message)
            return { data: { success: false, data: [] } }
          }),
          api.get('/fines', { params: { groupId: groupId, status: 'all' } }).catch(err => {
            console.error('[CashierDashboard] Error fetching fines:', err)
            return { data: { success: false, data: [] } }
          }),
          api.get('/notifications', { params: { limit: 100 } }).catch(err => {
            console.error('[CashierDashboard] Error fetching notifications:', err)
            return { data: { success: false, data: [] } }
          }),
          api.get(`/groups/${groupId}/activities?limit=100`).catch(err => {
            console.error('[CashierDashboard] Error fetching activities:', err)
            return { data: { success: false, data: [] } }
          })
        ])

        if (!mounted) return

        console.log('[CashierDashboard] Data received:', {
          transactions: transactionsRes.data?.data?.length || 0,
          activities: activitiesRes.data?.data?.length || 0,
          contributions: contributionsRes.data?.data?.length || 0,
          loans: loansRes.data?.data?.length || 0
        })

        // Set group info
        if (groupRes.data?.success) {
          setGroupInfo(groupRes.data.data)
        }

        // Get stats
        const statsData = statsRes.data?.data || statsRes.data || {}
        const totalMembers = statsData.totalMembers || 0
        const totalSavings = statsData.totalSavings || 0

        // Get ALL contributions from the group (backend already filters by groupId)
        const allContributions = Array.isArray(contributionsRes.data?.data) 
          ? contributionsRes.data.data
          : []
        
        // Get pending contributions for the pending approvals section
        const pendingContributions = allContributions.filter(c => c.status === 'pending')
        
        console.log('[CashierDashboard] Contributions received:', {
          total: allContributions.length,
          pending: pendingContributions.length,
          sample: allContributions.slice(0, 3).map(c => ({
            id: c.id,
            member: c.member?.name || c.user?.name,
            amount: c.amount,
            status: c.status,
            groupId: c.groupId
          }))
        })
        

        // Get all loans for the group - backend should filter by groupId, but we double-check
        const allLoans = Array.isArray(loansRes.data?.data)
          ? loansRes.data.data.filter(l => {
              const loanGroupId = l.groupId || l.member?.groupId || l.user?.groupId || l.group?.id
              return loanGroupId === groupId || loanGroupId === parseInt(groupId)
            })
          : []
        
        console.log('[CashierDashboard] Loans received:', {
          total: loansRes.data?.data?.length || 0,
          filtered: allLoans.length,
          sample: allLoans.slice(0, 3).map(l => ({
            id: l.id,
            member: l.member?.name || l.user?.name,
            amount: l.amount,
            status: l.status,
            groupId: l.groupId
          }))
        })

        // Get pending loan requests for the group
        const pendingLoans = allLoans.filter(l => l.status === 'pending')
        
        // Get overdue loans (loans with overdue payments)
        const today = new Date()
        const overdueLoans = allLoans.filter(loan => {
          if (loan.status !== 'approved' && loan.status !== 'disbursed' && loan.status !== 'active') return false
          if (!loan.nextPaymentDate) return false
          const nextPayment = new Date(loan.nextPaymentDate)
          return nextPayment < today
        })
        
        console.log('[CashierDashboard] Loan statuses:', {
          total: allLoans.length,
          pending: pendingLoans.length,
          overdue: overdueLoans.length,
          pendingSample: pendingLoans.slice(0, 3).map(l => ({
            id: l.id,
            member: l.member?.name || l.user?.name,
            amount: l.amount,
            status: l.status,
            groupId: l.groupId
          }))
        })

        // Get ALL transactions from the group - backend already filters by groupId
        // The /transactions/report endpoint returns all transactions without limits
        const allTransactions = Array.isArray(transactionsRes.data?.data) 
          ? transactionsRes.data.data
          : []

        console.log('[CashierDashboard] Transactions received:', {
          count: allTransactions.length,
          sample: allTransactions.slice(0, 3).map(t => ({
            id: t.transactionId || t.id,
            type: t.rawType || t.type,
            amount: t.amount,
            memberName: t.memberName
          }))
        })

        // Get activities from activities endpoint (supplementary data)
        let activities = []
        if (activitiesRes.data?.success && Array.isArray(activitiesRes.data?.data)) {
          activities = activitiesRes.data.data
        } else if (Array.isArray(activitiesRes.data?.data)) {
          activities = activitiesRes.data.data
        }

        // Format transactions for display - PRIMARY SOURCE
        // Handle both /transactions and /transactions/report endpoint formats
        const formattedTransactions = allTransactions.map(trans => {
          // Handle report endpoint format (transactionId, memberName, transactionType, rawType)
          // or regular endpoint format (id, user.name, type)
          const transactionId = trans.transactionId || trans.id
          const memberName = trans.memberName || trans.user?.name || trans.member?.name || t('unknownMember', { defaultValue: 'Unknown Member' })
          const transactionType = trans.rawType || trans.type
          const transDate = trans.transactionDate ? new Date(trans.transactionDate) : (trans.date ? new Date(trans.date) : (trans.createdAt ? new Date(trans.createdAt) : new Date()))
          const now = Date.now()
          const diffMs = now - transDate.getTime()
          const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
          const minutesAgo = Math.floor(diffMs / (1000 * 60))
          const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: transactionId,
            member: memberName,
            type: formatTransactionType(transactionType),
            amount: Number(trans.amount || 0),
            method: formatPaymentMethod(trans.paymentMethod),
            status: trans.status || 'completed',
            time: timeStr,
            date: transDate,
            description: trans.description || `${formatTransactionType(transactionType)}${trans.referenceId ? ` - ${trans.referenceId}` : ''}`
          }
        })

        // Also add contributions as activities (they may not be in transactions yet)
        const contributionActivities = allContributions.map(contrib => {
          const user = contrib.member || contrib.user || {}
          const contribDate = contrib.createdAt ? new Date(contrib.createdAt) : new Date()
          const now = Date.now()
          const diffMs = now - contribDate.getTime()
          const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
          const minutesAgo = Math.floor(diffMs / (1000 * 60))
          const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: `contrib-${contrib.id}`,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('contribution', { defaultValue: 'Contribution' }),
            amount: Number(contrib.amount || 0),
            method: formatPaymentMethod(contrib.paymentMethod),
            status: contrib.status || 'pending',
            time: timeStr,
            date: contribDate,
            description: `${t('contribution', { defaultValue: 'Contribution' })}${contrib.receiptNumber ? ` - ${contrib.receiptNumber}` : ''}`
          }
        })

        // Format overdue payments as activities
        const overdueActivities = overdueLoans.map(loan => {
          const user = loan.member || loan.user || {}
          const nextPayment = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : new Date()
          const daysOverdue = Math.floor((today - nextPayment) / (1000 * 60 * 60 * 24))
          const now = Date.now()
          const diffMs = now - nextPayment.getTime()
          const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
          const minutesAgo = Math.floor(diffMs / (1000 * 60))
          const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: `overdue-${loan.id}`,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('overdueLoanPayment', { defaultValue: 'Overdue Loan Payment' }),
            amount: Number(loan.monthlyPayment || 0),
            method: '',
            status: 'overdue',
            time: timeStr,
            date: nextPayment,
            description: `${t('loanPayment', { defaultValue: 'Loan Payment' })} - ${daysOverdue} ${t('daysOverdue', { defaultValue: 'days overdue' })}`,
            daysOverdue: daysOverdue
          }
        })

        // Format pending approvals as activities (contributions)
        const pendingActivities = pendingContributions.map(contrib => {
          const user = contrib.member || contrib.user || {}
          const contribDate = contrib.createdAt ? new Date(contrib.createdAt) : new Date()
          const now = Date.now()
          const diffMs = now - contribDate.getTime()
          const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
          const minutesAgo = Math.floor(diffMs / (1000 * 60))
          const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: `pending-${contrib.id}`,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('pendingContribution', { defaultValue: 'Pending Contribution' }),
            amount: Number(contrib.amount || 0),
            method: formatPaymentMethod(contrib.paymentMethod),
            status: 'pending',
            time: timeStr,
            date: contribDate,
            description: `${t('contribution', { defaultValue: 'Contribution' })} - ${t('awaitingApproval', { defaultValue: 'Awaiting Approval' })}${contrib.receiptNumber ? ` - ${contrib.receiptNumber}` : ''}`
          }
        })

        // Format pending loan requests as activities (from group members)
        const pendingLoanActivities = pendingLoans.map(loan => {
          const user = loan.member || loan.user || {}
          const loanDate = loan.createdAt ? new Date(loan.createdAt) : new Date()
          const now = Date.now()
          const diffMs = now - loanDate.getTime()
          const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
          const minutesAgo = Math.floor(diffMs / (1000 * 60))
          const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: `pending-loan-${loan.id}`,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('pendingLoanRequest', { defaultValue: 'Pending Loan Request' }),
            amount: Number(loan.amount || 0),
            method: '',
            status: 'pending',
            time: timeStr,
            date: loanDate,
            description: `${t('loanRequest', { defaultValue: 'Loan Request' })} - ${loan.purpose || t('noPurpose', { defaultValue: 'No purpose specified' })}`
          }
        })

        // Combine and sort all activities by date (most recent first), remove duplicates
        // This includes: transactions, contributions, pending contributions, pending loans, and overdue payments
        const allActivities = [...formattedTransactions, ...contributionActivities, ...pendingActivities, ...pendingLoanActivities, ...overdueActivities]
          .filter((activity, index, self) => 
            index === self.findIndex(a => a.id === activity.id)
          )
          .sort((a, b) => b.date - a.date)
          .filter((activity, index, self) => 
            index === self.findIndex(a => a.id === activity.id)
          )
          .sort((a, b) => b.date - a.date)
        
        const finalTransactions = allActivities

        // Format pending approvals - includes contributions AND loan requests
        const formattedPendingContributions = pendingContributions.map(contrib => {
          const user = contrib.member || contrib.user || {}
          const contribDate = contrib.createdAt ? new Date(contrib.createdAt) : new Date()
          const hoursAgo = Math.floor((Date.now() - contribDate.getTime()) / (1000 * 60 * 60))
          const minutesAgo = Math.floor((Date.now() - contribDate.getTime()) / (1000 * 60))
          const daysAgo = Math.floor((Date.now() - contribDate.getTime()) / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: `contrib-${contrib.id}`,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('contribution', { defaultValue: 'Contribution' }),
            amount: Number(contrib.amount || 0),
            method: formatPaymentMethod(contrib.paymentMethod),
            status: contrib.status || 'pending',
            submitted: timeStr,
            date: contribDate
          }
        })

        // Format pending loan requests for pending approvals section
        const formattedPendingLoans = pendingLoans.map(loan => {
          const user = loan.member || loan.user || {}
          const loanDate = loan.createdAt ? new Date(loan.createdAt) : new Date()
          const hoursAgo = Math.floor((Date.now() - loanDate.getTime()) / (1000 * 60 * 60))
          const minutesAgo = Math.floor((Date.now() - loanDate.getTime()) / (1000 * 60))
          const daysAgo = Math.floor((Date.now() - loanDate.getTime()) / (1000 * 60 * 60 * 24))
          
          let timeStr = t('justNow', { defaultValue: 'Just now' })
          if (daysAgo > 0) {
            timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
          } else if (hoursAgo > 0) {
            timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
          } else if (minutesAgo > 0) {
            timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
          }
          
          return {
            id: `loan-${loan.id}`,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('loanRequest', { defaultValue: 'Loan Request' }),
            amount: Number(loan.amount || 0),
            method: '',
            status: loan.status || 'pending',
            submitted: timeStr,
            date: loanDate,
            purpose: loan.purpose || ''
          }
        })

        // Combine all pending approvals (contributions + loans) and sort by date
        const allPendingApprovals = [...formattedPendingContributions, ...formattedPendingLoans]
          .sort((a, b) => b.date - a.date) // Most recent first
        
        const formattedApprovals = allPendingApprovals.slice(0, 10) // Show up to 10 most recent

        // Format overdue payments
        const formattedOverdue = overdueLoans.slice(0, 3).map(loan => {
          const user = loan.user || {}
          const nextPayment = loan.nextPaymentDate ? new Date(loan.nextPaymentDate) : null
          const daysOverdue = nextPayment ? Math.floor((today - nextPayment) / (1000 * 60 * 60 * 24)) : 0
          
          return {
            id: loan.id,
            member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
            type: t('loanPayment', { defaultValue: 'Loan Payment' }),
            amount: Number(loan.monthlyPayment || 0),
            dueDate: nextPayment ? nextPayment.toISOString().split('T')[0] : '',
            daysOverdue: daysOverdue
          }
        })

        // Get notifications
        const allNotifications = Array.isArray(notificationsRes.data?.data) ? notificationsRes.data.data : []
        const unreadNotifications = allNotifications.filter(n => !n.read)
        setNotifications(allNotifications)
        setUnreadCount(unreadNotifications.length)

        setStats({
          totalSavings: totalSavings,
          pendingApprovals: pendingContributions.length + pendingLoans.length, // Include both contributions and loans
          overduePayments: overdueLoans.length,
          members: totalMembers
        })

        // Format all contributions for display (sorted by date, most recent first)
        const formattedContributions = allContributions
          .map(contrib => {
            const user = contrib.member || contrib.user || {}
            const contribDate = contrib.createdAt ? new Date(contrib.createdAt) : (contrib.approvalDate ? new Date(contrib.approvalDate) : new Date())
            const now = Date.now()
            const diffMs = now - contribDate.getTime()
            const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
            const minutesAgo = Math.floor(diffMs / (1000 * 60))
            const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            
            let timeStr = t('justNow', { defaultValue: 'Just now' })
            if (daysAgo > 0) {
              timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
            } else if (hoursAgo > 0) {
              timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
            } else if (minutesAgo > 0) {
              timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
            }
            
            return {
              id: contrib.id,
              member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
              amount: Number(contrib.amount || 0),
              method: formatPaymentMethod(contrib.paymentMethod),
              status: contrib.status || 'pending',
              time: timeStr,
              date: contribDate,
              receiptNumber: contrib.receiptNumber || '',
              notes: contrib.notes || '',
              createdAt: contrib.createdAt,
              approvalDate: contrib.approvalDate
            }
          })
          .sort((a, b) => b.date - a.date) // Most recent first

        // Format all loans for display (sorted by date, most recent first)
        const formattedLoans = allLoans
          .map(loan => {
            const user = loan.member || loan.user || {}
            const loanDate = loan.createdAt ? new Date(loan.createdAt) : (loan.approvalDate ? new Date(loan.approvalDate) : new Date())
            const now = Date.now()
            const diffMs = now - loanDate.getTime()
            const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
            const minutesAgo = Math.floor(diffMs / (1000 * 60))
            const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            
            let timeStr = t('justNow', { defaultValue: 'Just now' })
            if (daysAgo > 0) {
              timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
            } else if (hoursAgo > 0) {
              timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
            } else if (minutesAgo > 0) {
              timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
            }

            // Calculate days overdue if applicable
            let daysOverdue = 0
            if (loan.nextPaymentDate && (loan.status === 'approved' || loan.status === 'disbursed' || loan.status === 'active')) {
              const nextPayment = new Date(loan.nextPaymentDate)
              const today = new Date()
              if (nextPayment < today) {
                daysOverdue = Math.floor((today - nextPayment) / (1000 * 60 * 60 * 24))
              }
            }
            
            return {
              id: loan.id,
              member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
              amount: Number(loan.amount || 0),
              totalAmount: Number(loan.totalAmount || loan.amount || 0),
              remainingAmount: Number(loan.remainingAmount || loan.totalAmount || loan.amount || 0),
              monthlyPayment: Number(loan.monthlyPayment || 0),
              status: loan.status || 'pending',
              purpose: loan.purpose || '',
              duration: loan.duration || 0,
              interestRate: loan.interestRate || 0,
              time: timeStr,
              date: loanDate,
              createdAt: loan.createdAt,
              approvalDate: loan.approvalDate,
              nextPaymentDate: loan.nextPaymentDate,
              daysOverdue: daysOverdue,
              guarantorName: loan.guarantorName || '',
              guarantorPhone: loan.guarantorPhone || ''
            }
          })
          .sort((a, b) => b.date - a.date) // Most recent first

        // Format all fines for display (sorted by date, most recent first)
        const allFinesData = Array.isArray(finesRes.data?.data) 
          ? finesRes.data.data.filter(f => (f.groupId === groupId || f.groupId === parseInt(groupId)))
          : []

        const formattedFines = allFinesData
          .map(fine => {
            const user = fine.member || fine.user || {}
            const fineDate = fine.issuedDate ? new Date(fine.issuedDate) : (fine.createdAt ? new Date(fine.createdAt) : new Date())
            const paidDate = fine.paidDate ? new Date(fine.paidDate) : null
            const dueDate = fine.dueDate ? new Date(fine.dueDate) : null
            const now = Date.now()
            const diffMs = now - fineDate.getTime()
            const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60))
            const minutesAgo = Math.floor(diffMs / (1000 * 60))
            const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            
            let timeStr = t('justNow', { defaultValue: 'Just now' })
            if (daysAgo > 0) {
              timeStr = `${daysAgo} ${t('daysAgo', { defaultValue: 'days ago', count: daysAgo })}`
            } else if (hoursAgo > 0) {
              timeStr = `${hoursAgo} ${t('hoursAgo', { defaultValue: 'hours ago', count: hoursAgo })}`
            } else if (minutesAgo > 0) {
              timeStr = `${minutesAgo} ${t('minutesAgo', { defaultValue: 'minutes ago', count: minutesAgo })}`
            }

            // Check if fine is overdue
            let isOverdue = false
            if (dueDate && (fine.status === 'pending' || fine.status === 'approved')) {
              isOverdue = dueDate < new Date()
            }
            
            return {
              id: fine.id,
              member: user.name || t('unknownMember', { defaultValue: 'Unknown Member' }),
              memberId: fine.memberId,
              amount: Number(fine.amount || 0),
              reason: fine.reason || '',
              status: fine.status || 'pending',
              time: timeStr,
              date: fineDate,
              issuedDate: fine.issuedDate,
              paidDate: paidDate,
              dueDate: dueDate,
              isOverdue: isOverdue,
              issuedBy: fine.issuedBy,
              approvedBy: fine.approvedBy
            }
          })
          .sort((a, b) => b.date - a.date) // Most recent first

        setRecentTransactions(finalTransactions)
        setPendingApprovals(formattedApprovals)
        setOverduePayments(formattedOverdue)
        setAllContributions(formattedContributions)
        setAllLoans(formattedLoans)
        setAllFines(formattedFines)
      } catch (error) {
        console.error('[CashierDashboard] Error loading data:', error)
      }
    })
    return () => { mounted = false }
  }, [])

  // Update current time every second for countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTransactionType = (type) => {
    const typeMap = {
      'contribution': t('contribution', { defaultValue: 'Contribution' }),
      'loan_payment': t('loanPayment', { defaultValue: 'Loan Payment' }),
      'loan_request': t('loanRequest', { defaultValue: 'Loan Request' }),
      'fine_payment': t('finePayment', { defaultValue: 'Fine Payment' }),
      'interest': t('interest', { defaultValue: 'Interest' }),
      'refund': t('refund', { defaultValue: 'Refund' }),
      'fee': t('fee', { defaultValue: 'Fee' })
    }
    return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatPaymentMethod = (method) => {
    const methodMap = {
      'cash': t('cash', { defaultValue: 'Cash' }),
      'mtn_mobile_money': t('mtnMobileMoney', { defaultValue: 'MTN Mobile Money' }),
      'airtel_money': t('airtelMoney', { defaultValue: 'Airtel Money' }),
      'bank_transfer': t('bankTransfer', { defaultValue: 'Bank Transfer' })
    }
    return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const cashierStats = [
    { 
      label: t('totalSavings'), 
      value: `${stats.totalSavings.toLocaleString()} RWF`, 
      icon: DollarSign, 
      color: 'text-green-600', 
      change: '+0%' 
    },
    { 
      label: t('pendingApprovals'), 
      value: stats.pendingApprovals.toString(), 
      icon: Clock, 
      color: 'text-yellow-600', 
      change: `+${stats.pendingApprovals}` 
    },
    { 
      label: t('overduePayments', { defaultValue: 'Overdue Payments' }), 
      value: stats.overduePayments.toString(), 
      icon: AlertCircle, 
      color: 'text-red-600', 
      change: stats.overduePayments > 0 ? `-${stats.overduePayments}` : '0' 
    },
    { 
      label: t('members'), 
      value: stats.members.toString(), 
      icon: Users, 
      color: 'text-blue-600', 
      change: `+${stats.members}` 
    },
  ]

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'closed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'overdue':
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'approved':
      case 'disbursed':
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: 
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const handleApproveTransaction = async (transactionId) => {
    try {
      const response = await api.put(`/contributions/${transactionId}/approve`)
      if (response.data?.success) {
    alert(tCommon('transactionApproved', { defaultValue: 'Transaction approved successfully!' }))
        // Reload data
        window.location.reload()
      } else {
        alert(tCommon('transactionRejected', { defaultValue: 'Failed to approve transaction' }))
      }
    } catch (error) {
      console.error('Error approving transaction:', error)
      alert(tCommon('transactionRejected', { defaultValue: 'Failed to approve transaction' }))
    }
  }

  const handleRejectTransaction = async (transactionId) => {
    if (!confirm(tCommon('confirmReject', { defaultValue: 'Are you sure you want to reject this transaction?' }))) {
      return
    }
    try {
      const response = await api.put(`/contributions/${transactionId}/reject`)
      if (response.data?.success) {
    alert(tCommon('transactionRejected', { defaultValue: 'Transaction rejected!' }))
        // Reload data
        window.location.reload()
      } else {
        alert(tCommon('transactionRejected', { defaultValue: 'Failed to reject transaction' }))
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error)
      alert(tCommon('transactionRejected', { defaultValue: 'Failed to reject transaction' }))
    }
  }

  const handleSendReminder = async (loanId) => {
    try {
      // TODO: Implement send reminder API call
      alert(t('reminderSentSuccessfully', { defaultValue: 'Reminder sent successfully!' }))
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert(t('reminderSentFailed', { defaultValue: 'Failed to send reminder' }))
    }
  }

  const handleChargeFine = async (loanId) => {
    window.location.href = `/cashier/fines?loanId=${loanId}&action=charge`
  }

  const handleApproveFinePayment = async (fineId) => {
    try {
      const fine = allFines.find(f => f.id === fineId)
      if (!fine) {
        alert(t('fineNotFound', { defaultValue: 'Fine not found' }))
        return
      }

      // Use the verify-payment endpoint for cashiers
      const response = await api.put(`/fines/${fineId}/verify-payment`, {
        paymentMethod: 'cash'
      })

      if (response.data?.success) {
        alert(t('finePaymentApproved', { defaultValue: 'Fine payment approved and all members have been notified!' }))
        window.location.reload()
      } else {
        alert(t('failedToApprovePayment', { defaultValue: 'Failed to approve payment' }))
      }
    } catch (error) {
      console.error('Error approving fine payment:', error)
      alert(error.response?.data?.message || t('failedToApprovePayment', { defaultValue: 'Failed to approve payment' }))
    }
  }

  const handleRecordLoanData = async (loanId) => {
    // Navigate to loans page with the specific loan ID to record payment
    window.location.href = `/cashier/loans?loanId=${loanId}&action=record`
  }

  // Calculate countdown timer for loan
  const calculateCountdown = (loan) => {
    if (!loan.nextPaymentDate) {
      // If no next payment date, calculate based on loan duration
      if (loan.duration && loan.createdAt) {
        const loanStartDate = new Date(loan.createdAt)
        const loanEndDate = new Date(loanStartDate)
        loanEndDate.setMonth(loanEndDate.getMonth() + loan.duration)
        const timeRemaining = loanEndDate - currentTime
        
        if (timeRemaining <= 0) {
          return { expired: true, text: t('loanPeriodEnded', { defaultValue: 'Loan period ended' }) }
        }
        
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
        
        return {
          expired: false,
          days,
          hours,
          minutes,
          text: `${days}d ${hours}h ${minutes}m ${t('remaining', { defaultValue: 'remaining' })}`
        }
      }
      return null
    }

    const nextPayment = new Date(loan.nextPaymentDate)
    const timeRemaining = nextPayment - currentTime
    
    if (timeRemaining <= 0) {
      return { expired: true, text: t('paymentOverdue', { defaultValue: 'Payment overdue' }) }
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
    
    return {
      expired: false,
      days,
      hours,
      minutes,
      seconds,
      text: `${days}d ${hours}h ${minutes}m ${seconds}s ${t('untilNextPayment', { defaultValue: 'until next payment' })}`
    }
  }

  return (
    <Layout userRole="Cashier">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{t('cashierDashboard', { defaultValue: 'Cashier Dashboard' })}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('transactions')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {cashierStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                    {stat.change && (
                      <p className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <Icon className={stat.color} size={32} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              {['overview', 'contributions', 'loans', 'fines', 'reports'].map((tab) => {
                const tabLabels = {
                  overview: t('recentTransactions'),
                  contributions: t('contributions', { defaultValue: 'Contributions' }),
                  loans: t('loans'),
                  fines: t('fines'),
                  reports: t('reports', { defaultValue: 'Reports' })
                }
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedTab === tab
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tabLabels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Transactions */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('recentTransactions')}</h2>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
                    </div>
                  ) : recentTransactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t('noTransactions', { defaultValue: 'No transactions found' })}</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {transaction.member[0]?.toUpperCase() || '?'}
                          </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 dark:text-white">{transaction.member}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {transaction.type} {transaction.method ? `• ${transaction.method}` : ''}
                              </p>
                              {transaction.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 italic">{transaction.description}</p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500">{transaction.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {transaction.amount > 0 && (
                              <span className="font-semibold text-gray-800 dark:text-white">
                            {transaction.amount.toLocaleString()} RWF
                          </span>
                            )}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                      {recentTransactions.length > 0 && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => window.location.href = '/cashier/contributions'}
                            className="btn-secondary text-sm"
                          >
                            {t('viewAllActivities', { defaultValue: 'View All Activities' })}
                          </button>
                        </div>
                      )}
                  </div>
                  )}
                </div>

                {/* Pending Approvals */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('pendingApprovals')}</h2>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
                    </div>
                  ) : pendingApprovals.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t('noPendingApprovals', { defaultValue: 'No pending approvals' })}</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {approval.member[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{approval.member}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {approval.type} {approval.method ? `• ${approval.method}` : ''}
                                {approval.purpose ? ` • ${approval.purpose}` : ''}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('submitted', { defaultValue: 'Submitted' })}: {approval.submitted}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800 dark:text-white">
                              {approval.amount.toLocaleString()} RWF
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(approval.status)}`}>
                              {approval.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {t('awaitingApproval', { defaultValue: 'Awaiting Approval' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Overdue Payments */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('overduePayments')}</h2>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
                    </div>
                  ) : overduePayments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t('noOverduePayments', { defaultValue: 'No overdue payments' })}</p>
                  ) : (
                  <div className="space-y-3">
                      {overduePayments.map((payment) => (
                      <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {payment.member[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                              <p className="font-semibold text-gray-800 dark:text-white">{payment.member}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{payment.type}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('due', { defaultValue: 'Due' })}: {payment.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800 dark:text-white">
                            {payment.amount.toLocaleString()} RWF
                          </span>
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-semibold">
                            {payment.daysOverdue} {t('daysOverdue', { defaultValue: 'days overdue' })}
                          </span>
                            <button 
                              onClick={() => handleSendReminder(payment.id)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                            >
                            {t('sendReminder', { defaultValue: 'Send Reminder' })}
                          </button>
                            <button 
                              onClick={() => handleChargeFine(payment.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {t('chargeFine', { defaultValue: 'Charge Fine' })}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'contributions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('memberContributions', { defaultValue: 'Member Contributions' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('manageContributions', { defaultValue: 'Manage member contributions and payment verification' })}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/cashier/contributions'}
                    className="btn-secondary"
                  >
                    {t('viewFullPage', { defaultValue: 'View Full Page' })}
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : allContributions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('noContributions', { defaultValue: 'No contributions found' })}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {allContributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {contribution.member[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-white">{contribution.member}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('contribution', { defaultValue: 'Contribution' })} {contribution.method ? `• ${contribution.method}` : ''}
                            </p>
                            {contribution.receiptNumber && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {t('receiptNumber', { defaultValue: 'Receipt' })}: {contribution.receiptNumber}
                              </p>
                            )}
                            {contribution.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">{contribution.notes}</p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500">{contribution.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {contribution.amount.toLocaleString()} RWF
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contribution.status)}`}>
                            {contribution.status}
                          </span>
                          {contribution.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveTransaction(contribution.id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                              >
                                {t('approve', { defaultValue: 'Approve' })}
                              </button>
                              <button
                                onClick={() => handleRejectTransaction(contribution.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                              >
                                {t('reject', { defaultValue: 'Reject' })}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'loans' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('loanRepaymentTracking', { defaultValue: 'Loan Repayment Tracking' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('monitorLoanRepayments', { defaultValue: 'Monitor loan repayments and overdue payments' })}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/cashier/loans'}
                    className="btn-secondary"
                  >
                    {t('viewFullPage', { defaultValue: 'View Full Page' })}
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : allLoans.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('noLoans', { defaultValue: 'No loans found' })}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {allLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                          loan.status === 'pending' 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            : loan.daysOverdue > 0
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            loan.status === 'pending'
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                              : loan.daysOverdue > 0
                              ? 'bg-gradient-to-br from-red-400 to-red-600'
                              : 'bg-gradient-to-br from-primary-400 to-primary-600'
                          }`}>
                            {loan.member[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-white">{loan.member}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('loanAmount', { defaultValue: 'Loan Amount' })}: {loan.amount.toLocaleString()} RWF
                              {loan.purpose && ` • ${loan.purpose}`}
                            </p>
                            {loan.status === 'approved' || loan.status === 'disbursed' || loan.status === 'active' ? (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                <p>{t('totalAmount', { defaultValue: 'Total' })}: {loan.totalAmount.toLocaleString()} RWF • {t('remaining', { defaultValue: 'Remaining' })}: {loan.remainingAmount.toLocaleString()} RWF</p>
                                <p>{t('monthlyPayment', { defaultValue: 'Monthly Payment' })}: {loan.monthlyPayment.toLocaleString()} RWF</p>
                                {loan.nextPaymentDate && (
                                  <p>
                                    {t('nextPayment', { defaultValue: 'Next Payment' })}: {new Date(loan.nextPaymentDate).toLocaleDateString()}
                                    {loan.daysOverdue > 0 && (
                                      <span className="text-red-600 dark:text-red-400 font-semibold ml-2">
                                        ({loan.daysOverdue} {t('daysOverdue', { defaultValue: 'days overdue' })})
                                      </span>
                                    )}
                                  </p>
                                )}
                                {/* Countdown Timer */}
                                {(() => {
                                  const countdown = calculateCountdown(loan)
                                  if (!countdown) return null
                                  return (
                                    <p className={`mt-1 font-semibold ${
                                      countdown.expired 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : countdown.days < 3 
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                      ⏱️ {countdown.text}
                                    </p>
                                  )
                                })()}
                              </div>
                            ) : null}
                            {loan.guarantorName && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {t('guarantor', { defaultValue: 'Guarantor' })}: {loan.guarantorName}
                                {loan.guarantorPhone && ` (${loan.guarantorPhone})`}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500">{loan.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('status', { defaultValue: 'Status' })}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
                              {loan.status}
                            </span>
                            {loan.daysOverdue > 0 && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                                {loan.daysOverdue} {t('daysOverdue', { defaultValue: 'days overdue' })}
                              </p>
                            )}
                          </div>
                          {/* Record Data Button - Always visible for active loans */}
                          {(loan.status === 'approved' || loan.status === 'disbursed' || loan.status === 'active') && (
                            <button
                              onClick={() => handleRecordLoanData(loan.id)}
                              className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <FileText size={14} />
                              {t('recordData', { defaultValue: 'Record Data' })}
                            </button>
                          )}
                          {loan.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => window.location.href = `/cashier/loans?loanId=${loan.id}&action=approve`}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                              >
                                {t('review', { defaultValue: 'Review' })}
                              </button>
                            </div>
                          )}
                          {loan.daysOverdue > 0 && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendReminder(loan.id)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                              >
                                {t('sendReminder', { defaultValue: 'Remind' })}
                              </button>
                              <button
                                onClick={() => handleChargeFine(loan.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                              >
                                {t('chargeFine', { defaultValue: 'Fine' })}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'fines' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('fineAndPenaltyManagement', { defaultValue: 'Fine and Penalty Management' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('applyManageTrackFines', { defaultValue: 'Apply, manage, and track member fines' })}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/cashier/fines'}
                    className="btn-secondary"
                  >
                    {t('viewFullPage', { defaultValue: 'View Full Page' })}
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-gray-500 mt-2">{tCommon('loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : allFines.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('noFines', { defaultValue: 'No fines found' })}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {allFines.map((fine) => (
                      <div
                        key={fine.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                          fine.status === 'pending' 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            : fine.status === 'paid'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : fine.isOverdue
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            fine.status === 'pending'
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                              : fine.status === 'paid'
                              ? 'bg-gradient-to-br from-green-400 to-green-600'
                              : fine.isOverdue
                              ? 'bg-gradient-to-br from-red-400 to-red-600'
                              : 'bg-gradient-to-br from-primary-400 to-primary-600'
                          }`}>
                            {fine.member[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-white">{fine.member}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('fineAmount', { defaultValue: 'Fine Amount' })}: {fine.amount.toLocaleString()} RWF
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {t('reason', { defaultValue: 'Reason' })}: {fine.reason}
                            </p>
                            {fine.dueDate && (
                              <p className={`text-xs mt-1 ${
                                fine.isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-500'
                              }`}>
                                {t('dueDate', { defaultValue: 'Due Date' })}: {new Date(fine.dueDate).toLocaleDateString()}
                                {fine.isOverdue && ` (${t('overdue', { defaultValue: 'Overdue' })})`}
                              </p>
                            )}
                            {fine.paidDate && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                                ✓ {t('paidOn', { defaultValue: 'Paid on' })}: {new Date(fine.paidDate).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500">{fine.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('status', { defaultValue: 'Status' })}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fine.status)}`}>
                              {fine.status}
                            </span>
                          </div>
                          {fine.status === 'pending' && (
                            <button
                              onClick={() => handleApproveFinePayment(fine.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            >
                              {t('approve', { defaultValue: 'Approve' })}
                            </button>
                          )}
                          {fine.status === 'approved' && (
                            <button
                              onClick={() => handleApproveFinePayment(fine.id)}
                              className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                            >
                              {t('markAsPaid', { defaultValue: 'Mark as Paid' })}
                            </button>
                          )}
                          {fine.status === 'paid' && (
                            <span className="text-green-600 dark:text-green-400 text-xs font-semibold">
                              ✓ {t('paid', { defaultValue: 'Paid' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'reports' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tCashier('financialReportsAnalytics', { defaultValue: 'Financial Reports & Analytics' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{tCashier('generateComprehensiveFinancialReports', { defaultValue: 'Generate comprehensive financial reports and insights' })}</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/cashier/reports'}
                    className="btn-primary"
                  >
                    {t('goToFinancialReports', { defaultValue: 'Go to Financial Reports' })}
                  </button>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <DollarSign className="text-blue-600 dark:text-blue-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('contributions')}</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {loading ? '...' : stats.totalSavings.toLocaleString()} RWF
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <TrendingUp className="text-green-600 dark:text-green-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tCashier('loanPayments', { defaultValue: 'Loan Payments' })}</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {loading ? '...' : recentTransactions
                        .filter(t => t.type?.toLowerCase().includes('loan'))
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0).toLocaleString()} RWF
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <AlertCircle className="text-orange-600 dark:text-orange-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('fines')}</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {loading ? '...' : allFines
                        .filter(f => f.status === 'paid' || f.status === 'approved')
                        .reduce((sum, f) => sum + f.amount, 0).toLocaleString()} RWF
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <FileText className="text-purple-600 dark:text-purple-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tCashier('newLoans', { defaultValue: 'New Loans' })}</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {loading ? '...' : allLoans.filter(l => l.status === 'approved' || l.status === 'disbursed').length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <Users className="text-indigo-600 dark:text-indigo-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tCashier('activeMembers')}</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {loading ? '...' : stats.members}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <BarChart3 className="text-pink-600 dark:text-pink-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('transactions')}</p>
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                      {loading ? '...' : recentTransactions.length}
                    </p>
                  </div>
                </div>

                {/* Summary Insights */}
                <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{tCashier('financialSummary', { defaultValue: 'Financial Summary' })}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>{t('totalContributions', { defaultValue: 'Total Contributions' })}:</strong>{' '}
                        {allContributions.filter(c => c.status === 'approved' || c.status === 'completed').reduce((sum, c) => sum + c.amount, 0).toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>{tCashier('totalLoanPayments', { defaultValue: 'Total Loan Payments' })}:</strong>{' '}
                        {recentTransactions.filter(t => t.type?.toLowerCase().includes('loan')).reduce((sum, t) => sum + Math.abs(t.amount), 0).toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>{t('totalFinesCollected', { defaultValue: 'Total Fines Collected' })}:</strong>{' '}
                        {allFines.filter(f => f.status === 'paid' || f.status === 'approved').reduce((sum, f) => sum + f.amount, 0).toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>{t('totalTransactions', { defaultValue: 'Total Transactions' })}:</strong>{' '}
                        {recentTransactions.length} {t('transactions', { defaultValue: 'transactions' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('pendingItems', { defaultValue: 'Pending Items' })}</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('pendingContributions', { defaultValue: 'Pending Contributions' })}: {allContributions.filter(c => c.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('pendingLoans', { defaultValue: 'Pending Loans' })}: {allLoans.filter(l => l.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('pendingFines', { defaultValue: 'Pending Fines' })}: {allFines.filter(f => f.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                  <div className="card">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t('overdueItems', { defaultValue: 'Overdue Items' })}</h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('overduePayments', { defaultValue: 'Overdue Payments' })}: {overduePayments.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('overdueFines', { defaultValue: 'Overdue Fines' })}: {allFines.filter(f => f.isOverdue).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={() => window.location.href = '/cashier/reports'}
                    className="btn-primary"
                  >
                    {t('viewFullFinancialReports', { defaultValue: 'View Full Financial Reports' })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('quickActions', { defaultValue: 'Quick Actions' })}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => window.location.href = '/cashier/contributions'}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <CreditCard size={20} /> {t('verifyPayment', { defaultValue: 'Verify Payment' })}
            </button>
            <button 
              onClick={() => window.location.href = '/cashier/contributions'}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Receipt size={20} /> {t('recordCash', { defaultValue: 'Record Cash' })}
            </button>
            <button 
              onClick={() => window.location.href = '/cashier/loans'}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Bell size={20} /> {t('sendReminders', { defaultValue: 'Send Reminders' })}
            </button>
            <button 
              onClick={() => window.location.href = '/cashier/reports'}
              className="btn-secondary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Download size={20} /> {t('generateReport', { defaultValue: 'Generate Report' })}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CashierDashboard
