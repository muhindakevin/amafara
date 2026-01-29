import { useState, useEffect, useRef } from 'react'
import { BarChart3, Download, FileText, Globe, TrendingUp, Users, Building2, CreditCard, DollarSign, PieChart, MapPin, Calendar, Printer, AlertCircle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'
import { formatCurrency, formatDate, formatDateTimeFull, exportToExcel, exportToCSV } from '../utils/pdfExport'

// Google Maps Component
function GeographicMap({ data }) {
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const { t: tCommon } = useTranslation('common')
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])

  useEffect(() => {
    // Check if Google Maps API key is available from environment or system settings
    let apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    // Also check system settings for Google Maps API key
    const checkSystemSettings = async () => {
      try {
        const response = await api.get('/system-admin/settings')
        if (response.data?.success && response.data.data?.integrations?.googleMaps?.apiKey) {
          const systemApiKey = response.data.data.integrations.googleMaps.apiKey
          if (systemApiKey && systemApiKey !== '' && systemApiKey !== 'your_google_maps_api_key_here') {
            apiKey = systemApiKey
            console.log('[GeographicMap] Using Google Maps API key from system settings')
          }
        }
      } catch (error) {
        console.warn('[GeographicMap] Could not fetch system settings:', error)
      }
      
      if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey === 'AIzaSyDummyKeyForDevelopment') {
        console.warn('[GeographicMap] Google Maps API key not configured')
        console.warn('[GeographicMap] Add VITE_GOOGLE_MAPS_API_KEY to your .env file or configure in System Config > Integrations')
        console.warn('[GeographicMap] See GOOGLE_MAPS_SETUP.md for instructions')
        setMapLoaded(false)
        return
      }
      
      loadGoogleMaps(apiKey)
    }
    
    const loadGoogleMaps = (key) => {
      // Load Google Maps script
      if (!window.google) {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => {
          if (window.google && window.google.maps) {
            setMapLoaded(true)
            setTimeout(initializeMap, 100) // Small delay to ensure DOM is ready
          } else {
            console.error('[GeographicMap] Google Maps API loaded but google.maps is not available')
            setMapLoaded(false)
          }
        }
        script.onerror = () => {
          console.error('[GeographicMap] Failed to load Google Maps script. Check your API key.')
          setMapLoaded(false)
        }
        document.head.appendChild(script)
      } else {
        setMapLoaded(true)
        setTimeout(initializeMap, 100)
      }
    }
    
    checkSystemSettings()
    
    return () => {
      // Cleanup markers
      setMarkers(prevMarkers => {
        if (prevMarkers.length > 0) {
          prevMarkers.forEach(marker => {
            if (marker && marker.setMap) {
              marker.setMap(null)
            }
          })
        }
        return []
      })
    }
  }, [data])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      console.log('[GeographicMap] Map ref or Google Maps not available')
      return
    }

    if (!data || data.length === 0) {
      console.log('[GeographicMap] No data available')
      return
    }

    // Default center to Kigali, Rwanda
    const center = { lat: -1.9441, lng: 30.0619 }

    // Initialize map
    const googleMap = new window.google.maps.Map(mapRef.current, {
      zoom: 8,
      center: center,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    setMap(googleMap)

    // Clear existing markers
    if (markers.length > 0) {
      markers.forEach(marker => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
    }

    // Add markers for each branch
    const newMarkers = []
    data.forEach((branch) => {
      if (branch.latitude && branch.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(branch.latitude), lng: parseFloat(branch.longitude) },
          map: googleMap,
          title: branch.region,
          animation: window.google.maps.Animation.DROP
        })

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${branch.region || 'Unknown'}</h3>
              ${branch.address ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">${branch.address}</p>` : ''}
              ${branch.district ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">${branch.district}</p>` : ''}
              <div style="margin-top: 8px; font-size: 12px;">
                <p style="margin: 4px 0;"><strong>Users:</strong> ${(branch.users || 0).toLocaleString()}</p>
                <p style="margin: 4px 0;"><strong>Transactions:</strong> ${(branch.transactions || 0).toLocaleString()}</p>
                <p style="margin: 4px 0;"><strong>Savings:</strong> ${branch.savingsFormatted || formatCurrency(branch.savings || 0)}</p>
                <p style="margin: 4px 0;"><strong>Market Share:</strong> ${branch.marketShare || 0}%</p>
              </div>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(googleMap, marker)
        })

        newMarkers.push(marker)
      }
    })

    setMarkers(newMarkers)

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()))
      googleMap.fitBounds(bounds)
      
      // Don't zoom in too much if only one marker
      if (newMarkers.length === 1) {
        googleMap.setZoom(12)
      }
    } else {
      // If no markers, center on Kigali
      googleMap.setCenter(center)
      googleMap.setZoom(8)
    }
  }

  // Re-initialize map when data changes
  useEffect(() => {
    if (mapLoaded && data && data.length > 0 && mapRef.current) {
      initializeMap()
    }
  }, [data, mapLoaded])

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" style={{ minHeight: '400px' }} />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <MapPin className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
            {!mapLoaded ? (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2 font-semibold">{tSystemAdmin('googleMapsNotConfigured', { defaultValue: 'Google Maps API key not configured' })}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {tSystemAdmin('addGoogleMapsKey', { defaultValue: 'Add VITE_GOOGLE_MAPS_API_KEY to your .env file or configure in System Config > Integrations' })}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                  <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="underline">
                    Get API Key from Google Cloud Console
                  </a>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">See GOOGLE_MAPS_SETUP.md for detailed instructions</p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('loadingMap', { defaultValue: 'Loading map...' })}</p>
            )}
          </div>
        </div>
      )}
      {mapLoaded && (!data || data.length === 0) && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <MapPin className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
            <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('noGeographicDataAvailable', { defaultValue: 'No geographic data available' })}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SystemAdminReports() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [activeTab, setActiveTab] = useState('analytics')
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  const [analyticsData, setAnalyticsData] = useState({
    users: { total: 0, active: 0, newThisPeriod: 0, growth: 0 },
    transactions: { total: 0, volume: 0, volumeFormatted: '0 RWF', averageValue: 0, growth: 0 },
    loans: { total: 0, active: 0, overdue: 0, defaultRate: 0 },
    branches: { total: 0, active: 0, performance: 0 }
  })

  const [transactionTrends, setTransactionTrends] = useState([])
  const [userGrowthData, setUserGrowthData] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const [geographicData, setGeographicData] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState([])
  const [transactionReportLoading, setTransactionReportLoading] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState('all')
  const [groups, setGroups] = useState([])
  const [exportLoading, setExportLoading] = useState({
    user: false,
    financial: false,
    branch: false,
    analytics: false,
    custom: false
  })

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      console.log('[SystemAdminReports] Fetching analytics with period:', selectedPeriod)
      
      const [analyticsRes, groupsRes] = await Promise.all([
        api.get('/analytics', { params: { period: selectedPeriod } }).catch((err) => {
          console.error('[SystemAdminReports] Analytics API error:', err)
          return { data: { success: false, data: {} } }
        }),
        api.get('/groups').catch(() => ({ data: { data: [] } }))
      ])

      console.log('[SystemAdminReports] Analytics response:', analyticsRes?.data)
      
      if (analyticsRes?.data?.success && analyticsRes?.data?.data) {
        const data = analyticsRes.data.data
        console.log('[SystemAdminReports] Setting analytics data:', data.summary)
        
        if (data.summary) {
          setAnalyticsData({
            users: {
              total: data.summary.users?.total || 0,
              active: data.summary.users?.active || 0,
              newThisPeriod: data.summary.users?.newThisPeriod || 0,
              growth: data.summary.users?.growth || '0'
            },
            transactions: {
              total: data.summary.transactions?.total || 0,
              volume: data.summary.transactions?.volume || 0,
              volumeFormatted: data.summary.transactions?.volumeFormatted || '0 RWF',
              averageValue: data.summary.transactions?.averageValue || 0,
              growth: data.summary.transactions?.growth || '0'
            },
            loans: {
              total: data.summary.loans?.total || 0,
              active: data.summary.loans?.active || 0,
              overdue: data.summary.loans?.overdue || 0,
              defaultRate: data.summary.loans?.defaultRate || '0'
            },
            branches: {
              total: data.summary.branches?.total || 0,
              active: data.summary.branches?.active || 0,
              performance: data.summary.branches?.performance || '0'
            }
          })
        }
        
        setTransactionTrends(data.charts?.transactionTrends || [])
        setUserGrowthData(data.charts?.userGrowth || [])
        setAiInsights(data.aiInsights || [])
        setGeographicData(data.geographic || [])
        setPerformanceMetrics(data.performance || [])
      } else {
        console.warn('[SystemAdminReports] Analytics response not successful:', analyticsRes?.data)
      }
      
      const groupsList = groupsRes?.data?.data || []
      setGroups(groupsList)
    } catch (e) {
      console.error('[SystemAdminReports] Failed to load analytics:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const generateTransactionReport = async (format = 'excel') => {
    try {
      setTransactionReportLoading(true)
      
      const params = {
        groupId: selectedGroupId !== 'all' ? selectedGroupId : undefined,
        status: 'all'
      }

      const response = await api.get('/transactions/report', { params })
      
      if (!response.data?.success) {
        alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
        return
      }

      const reportData = response.data.data || []
      const groupInfo = response.data.groupInfo
      const reportSummary = response.data.summary || {
        totalTransactions: 0,
        totalAmount: 0,
        byType: {},
        byStatus: { completed: 0, pending: 0 },
        byPaymentMethod: {}
      }
      const dateRange = response.data.dateRange || {}

      // Even if empty, we'll still generate the report with zero values

      const reportTitle = selectedGroupId !== 'all' && groupInfo
        ? tSystemAdmin('transactionReportGroup', { defaultValue: 'Transaction Report - {{groupName}}', groupName: groupInfo.name })
        : tSystemAdmin('transactionReportAllGroups', { defaultValue: 'Transaction Report - All Groups' })

      const headers = ['Transaction ID', 'Member Name', 'Date & Time', 'Transaction Type', 'Amount', 'Payment Method', 'Status', 'Description / Notes']
      // If no transactions, create a row with zero/empty values
      const rows = reportData.length === 0
        ? [['No transactions', 'N/A', 'N/A', 'N/A', 0, 'N/A', 'N/A', 'No transactions found for the selected criteria.']]
        : reportData.map(t => {
          // Format date and time for Excel
          let dateTimeStr = 'N/A'
          if (t.transactionDate || t.date) {
            const transDate = t.transactionDate ? new Date(t.transactionDate) : new Date(t.date)
            if (!isNaN(transDate.getTime())) {
              const dateStr = transDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
              const timeStr = transDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })
              dateTimeStr = `${dateStr} ${timeStr}`
            } else {
              dateTimeStr = t.date || 'N/A'
            }
          }
          return [
            t.transactionId,
            t.memberName,
            dateTimeStr,
            t.transactionType,
            t.amount,
            t.paymentMethod,
            t.status.toUpperCase(),
            t.description || ''
          ]
        })

      if (format === 'csv') {
        exportToCSV(rows, headers, `Transaction_Report_${selectedGroupId !== 'all' ? groupInfo?.name?.replace(/\s+/g, '_') : 'All_Groups'}`, {
          title: reportTitle,
          groupName: groupInfo?.name || 'All Groups',
          dateRange,
          summary: reportSummary
        })
      } else {
        exportToExcel(rows, headers, `Transaction_Report_${selectedGroupId !== 'all' ? groupInfo?.name?.replace(/\s+/g, '_') : 'All_Groups'}`, {
          title: reportTitle,
          groupName: groupInfo?.name || 'All Groups',
          dateRange,
          summary: reportSummary
        })
      }
      } catch (error) {
        console.error('[SystemAdminReports] Error generating transaction report:', error)
        alert(t('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
      } finally {
        setTransactionReportLoading(false)
      }
    }

  // Export User Report
  const generateUserReport = async (format = 'excel') => {
    try {
      setExportLoading(prev => ({ ...prev, user: true }))
      const response = await api.get('/reports/users')
      
      if (!response.data?.success) {
        alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
        return
      }

      const userData = response.data.data || []
      const summary = response.data.summary || {}
      
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Group', 'Branch', 'Created At', 'Last Login']
      const rows = userData.map(u => [
        u.ID,
        u.Name,
        u.Email,
        u.Phone,
        u.Role,
        u.Status,
        u.Group,
        u.Branch,
        u['Created At'],
        u['Last Login']
      ])

      const options = {
        title: 'User Report - Complete User Statistics',
        summary: {
          totalUsers: summary.totalUsers || 0,
          byRole: summary.byRole || {},
          byStatus: summary.byStatus || {}
        }
      }

      if (format === 'csv') {
        exportToCSV(rows, headers, 'User_Report', options)
      } else {
        exportToExcel(rows, headers, 'User_Report', options)
      }
    } catch (error) {
      console.error('[SystemAdminReports] Error generating user report:', error)
      alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
    } finally {
      setExportLoading(prev => ({ ...prev, user: false }))
    }
  }

  // Export Financial Report
  const generateFinancialReport = async (format = 'excel') => {
    try {
      setExportLoading(prev => ({ ...prev, financial: true }))
      const response = await api.get('/reports/financial')
      
      if (!response.data?.success) {
        alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
        return
      }

      const { transactions, contributions, loans } = response.data.data || {}
      const summary = response.data.summary || {}
      
      // Export transactions
      const transHeaders = ['ID', 'Date', 'Type', 'Amount', 'Status', 'User', 'Group', 'Payment Method', 'Description']
      const transRows = (transactions || []).map(t => [
        t.ID,
        t.Date,
        t.Type,
        t.Amount,
        t.Status,
        t.User,
        t.Group,
        t['Payment Method'],
        t.Description
      ])

      const options = {
        title: 'Financial Report - Savings, Loans, and Financial Performance',
        summary: {
          totalSavings: summary.totalSavings || '0.00',
          totalLoans: summary.totalLoans || '0.00',
          totalLoanPayments: summary.totalLoanPayments || '0.00',
          totalTransactions: summary.totalTransactions || '0.00',
          transactionCount: summary.transactionCount || 0,
          contributionCount: summary.contributionCount || 0,
          loanCount: summary.loanCount || 0
        }
      }

      if (format === 'csv') {
        exportToCSV(transRows, transHeaders, 'Financial_Report', options)
      } else {
        exportToExcel(transRows, transHeaders, 'Financial_Report', options)
      }
    } catch (error) {
      console.error('[SystemAdminReports] Error generating financial report:', error)
      alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
    } finally {
      setExportLoading(prev => ({ ...prev, financial: false }))
    }
  }

  // Export Branch Report
  const generateBranchReport = async (format = 'excel') => {
    try {
      setExportLoading(prev => ({ ...prev, branch: true }))
      const response = await api.get('/reports/branches')
      
      if (!response.data?.success) {
        alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
        return
      }

      const branchData = response.data.data || []
      const summary = response.data.summary || {}
      
      const headers = ['ID', 'Name', 'Code', 'Address', 'Phone', 'Email', 'Agent', 'Users', 'Transactions', 'Total Savings', 'Created At']
      const rows = branchData.map(b => [
        b.ID,
        b.Name,
        b.Code,
        b.Address,
        b.Phone,
        b.Email,
        b.Agent,
        b.Users,
        b.Transactions,
        b['Total Savings'],
        b['Created At']
      ])

      const options = {
        title: 'Branch Report - Branch Performance and Coverage Analysis',
        summary: {
          totalBranches: summary.totalBranches || 0,
          totalUsers: summary.totalUsers || 0,
          totalTransactions: summary.totalTransactions || 0
        }
      }

      if (format === 'csv') {
        exportToCSV(rows, headers, 'Branch_Report', options)
      } else {
        exportToExcel(rows, headers, 'Branch_Report', options)
      }
    } catch (error) {
      console.error('[SystemAdminReports] Error generating branch report:', error)
      alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
    } finally {
      setExportLoading(prev => ({ ...prev, branch: false }))
    }
  }

  // Export Analytics Report
  const generateAnalyticsReport = async (format = 'excel') => {
    try {
      setExportLoading(prev => ({ ...prev, analytics: true }))
      const response = await api.get('/reports/analytics', { params: { period: selectedPeriod } })
      
      if (!response.data?.success) {
        alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
        return
      }

      const analyticsData = response.data.data || {}
      const breakdowns = response.data.breakdowns || {}
      
      const headers = ['Metric', 'Value']
      const rows = Object.entries(analyticsData).map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value
      ])

      // Add breakdowns
      if (breakdowns.transactionByType) {
        rows.push([])
        rows.push(['Transaction Type Breakdown', ''])
        Object.entries(breakdowns.transactionByType).forEach(([type, data]) => {
          rows.push([`  ${type}`, `Count: ${data.count}, Total: ${data.total.toFixed(2)}`])
        })
      }

      if (breakdowns.loanByStatus) {
        rows.push([])
        rows.push(['Loan Status Breakdown', ''])
        Object.entries(breakdowns.loanByStatus).forEach(([status, count]) => {
          rows.push([`  ${status}`, count])
        })
      }

      const options = {
        title: `Analytics Report - Comprehensive Analytics and Insights (${selectedPeriod})`
      }

      if (format === 'csv') {
        exportToCSV(rows, headers, 'Analytics_Report', options)
      } else {
        exportToExcel(rows, headers, 'Analytics_Report', options)
      }
    } catch (error) {
      console.error('[SystemAdminReports] Error generating analytics report:', error)
      alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
    } finally {
      setExportLoading(prev => ({ ...prev, analytics: false }))
    }
  }

  // Custom Report (combines multiple data sources)
  const generateCustomReport = async (format = 'excel') => {
    try {
      setExportLoading(prev => ({ ...prev, custom: true }))
      alert(tSystemAdmin('customReportInfo', { defaultValue: 'Custom report combines data from all sources. Generating...' }))
      
      // Fetch all data
      const [usersRes, financialRes, branchesRes, analyticsRes] = await Promise.all([
        api.get('/reports/users').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/financial').catch(() => ({ data: { success: false, data: {} } })),
        api.get('/reports/branches').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/reports/analytics', { params: { period: selectedPeriod } }).catch(() => ({ data: { success: false, data: {} } }))
      ])

      const headers = ['Category', 'Metric', 'Value']
      const rows = []

      // Add user data
      if (usersRes.data?.success) {
        rows.push(['USERS', 'Total Users', usersRes.data.summary?.totalUsers || 0])
        if (usersRes.data.summary?.byRole) {
          Object.entries(usersRes.data.summary.byRole).forEach(([role, count]) => {
            rows.push(['USERS', `Role: ${role}`, count])
          })
        }
      }

      // Add financial data
      if (financialRes.data?.success) {
        const finSummary = financialRes.data.summary || {}
        rows.push(['FINANCIAL', 'Total Savings', finSummary.totalSavings || '0.00'])
        rows.push(['FINANCIAL', 'Total Loans', finSummary.totalLoans || '0.00'])
        rows.push(['FINANCIAL', 'Total Transactions', finSummary.totalTransactions || '0.00'])
      }

      // Add branch data
      if (branchesRes.data?.success) {
        const branchSummary = branchesRes.data.summary || {}
        rows.push(['BRANCHES', 'Total Branches', branchSummary.totalBranches || 0])
        rows.push(['BRANCHES', 'Total Users', branchSummary.totalUsers || 0])
      }

      // Add analytics data
      if (analyticsRes.data?.success) {
        const analyticsData = analyticsRes.data.data || {}
        Object.entries(analyticsData).forEach(([key, value]) => {
          rows.push(['ANALYTICS', key.replace(/([A-Z])/g, ' $1'), value])
        })
      }

      const options = {
        title: 'Custom Report - Comprehensive System Overview'
      }

      if (format === 'csv') {
        exportToCSV(rows, headers, 'Custom_Report', options)
      } else {
        exportToExcel(rows, headers, 'Custom_Report', options)
      }
    } catch (error) {
      console.error('[SystemAdminReports] Error generating custom report:', error)
      alert(tSystemAdmin('failedToGenerateReport', { defaultValue: 'Failed to generate report. Please try again.' }))
    } finally {
      setExportLoading(prev => ({ ...prev, custom: false }))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'text-green-600'
      case 'met': return 'text-blue-600'
      case 'below': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('reportingAnalytics', { defaultValue: 'Reporting & Analytics' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('accessAnalyticsDashboards', { defaultValue: 'Access analytics dashboards and generate comprehensive reports' })}</p>

        {/* Period Selector */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{tSystemAdmin('reportPeriod', { defaultValue: 'Report Period' })}</h2>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tSystemAdmin(`period.${period}`, { defaultValue: period.charAt(0).toUpperCase() + period.slice(1) })}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['analytics', 'geographic', 'performance', 'exports'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tSystemAdmin(`tab.${tab}`, { defaultValue: tab.charAt(0).toUpperCase() + tab.slice(1) })}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('analyticsDashboard')}</h2>
                
                {/* Key Metrics */}
                {loading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('loadingAnalytics')}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalUsers')}</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-white">{analyticsData.users.total.toLocaleString()}</p>
                          {parseFloat(analyticsData.users.growth) > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+{analyticsData.users.growth}% {tSystemAdmin('thisPeriod', { defaultValue: 'this period' })}</p>
                          )}
                          {parseFloat(analyticsData.users.growth) < 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{analyticsData.users.growth}% {tSystemAdmin('decline', { defaultValue: 'decline' })}</p>
                          )}
                        </div>
                        <Users className="text-blue-600" size={32} />
                      </div>
                    </div>
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('transactionVolume', { defaultValue: 'Transaction Volume' })}</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-white">{analyticsData.transactions.volumeFormatted || analyticsData.transactions.volume}</p>
                          {parseFloat(analyticsData.transactions.growth) > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">+{analyticsData.transactions.growth}% {tSystemAdmin('growth', { defaultValue: 'growth' })}</p>
                          )}
                          {parseFloat(analyticsData.transactions.growth) < 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{analyticsData.transactions.growth}% {tSystemAdmin('decline', { defaultValue: 'decline' })}</p>
                          )}
                        </div>
                        <CreditCard className="text-green-600" size={32} />
                      </div>
                    </div>
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeLoans')}</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-white">{analyticsData.loans.active}</p>
                          {analyticsData.loans.defaultRate > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{analyticsData.loans.defaultRate}% {tSystemAdmin('defaultRate', { defaultValue: 'default rate' })}</p>
                          )}
                        </div>
                        <DollarSign className="text-purple-600" size={32} />
                      </div>
                    </div>
                    <div className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{tSystemAdmin('branchPerformance', { defaultValue: 'Branch Performance' })}</p>
                          <p className="text-2xl font-bold text-gray-800 dark:text-white">{analyticsData.branches.performance}%</p>
                          {analyticsData.branches.coverage !== '0%' && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{analyticsData.branches.coverage} {tSystemAdmin('coverage', { defaultValue: 'coverage' })}</p>
                          )}
                        </div>
                        <Building2 className="text-orange-600" size={32} />
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiInsights.map((insight, index) => {
                      const Icon = insight.type === 'success' ? CheckCircle : insight.type === 'error' ? AlertCircle : AlertCircle
                      const bgColor = insight.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                                     insight.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                                     'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      const iconColor = insight.type === 'success' ? 'text-green-600' :
                                       insight.type === 'error' ? 'text-red-600' :
                                       'text-yellow-600'
                      return (
                        <div key={index} className={`card border-2 ${bgColor}`}>
                          <div className="flex items-start gap-3">
                            <Icon className={`${iconColor} flex-shrink-0`} size={24} />
                            <div>
                              <h3 className="font-bold mb-2 text-gray-800 dark:text-white">{insight.title}</h3>
                              <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">{insight.description}</p>
                              <button className="text-sm font-semibold underline text-primary-600 dark:text-primary-400">
                                {insight.action}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{tSystemAdmin('transactionTrends', { defaultValue: 'Transaction Trends' })}</h3>
                    {loading ? (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('loading', { defaultValue: 'Loading...' })}</p>
                      </div>
                    ) : transactionTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={transactionTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${(value / 1000000).toFixed(2)}M RWF`, 'Volume']}
                          />
                          <Legend />
                          <Bar dataKey="value" fill="#3B82F6" name="Transaction Volume" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
                          <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('noDataAvailable', { defaultValue: 'No transaction data available for this period' })}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{tSystemAdmin('userGrowth', { defaultValue: 'User Growth' })}</h3>
                    {loading ? (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('loading', { defaultValue: 'Loading...' })}</p>
                      </div>
                    ) : userGrowthData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="New Users" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={48} />
                          <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('noDataAvailable', { defaultValue: 'No user growth data available for this period' })}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('geographicDistribution', { defaultValue: 'Geographic Distribution' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('viewUserDistributionPerformance', { defaultValue: 'View user distribution and performance across different regions' })}</p>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('region', { defaultValue: 'Region' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users', { defaultValue: 'Users' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactions')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('totalSavings', { defaultValue: 'Total Savings' })}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{tSystemAdmin('marketShare', { defaultValue: 'Market Share' })}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              {t('loading', { defaultValue: 'Loading...' })}
                            </td>
                          </tr>
                        ) : geographicData.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              {tSystemAdmin('noGeographicDataAvailable', { defaultValue: 'No geographic data available' })}
                            </td>
                          </tr>
                        ) : (
                          geographicData.map((region, index) => (
                            <tr key={region.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{region.region}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{region.users.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{region.transactions.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{region.savingsFormatted || formatCurrency(region.savings || 0)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {region.marketShare}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{tSystemAdmin('geographicMap', { defaultValue: 'Geographic Map' })}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {tSystemAdmin('mapShowsBranchLocations', { defaultValue: 'Interactive map showing branch locations and savings activity across Rwanda' })}
                  </p>
                  <GeographicMap data={geographicData} />
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('performanceMetrics', { defaultValue: 'Performance Metrics' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('trackKeyPerformanceIndicators', { defaultValue: 'Track key performance indicators and targets' })}</p>

                <div className="space-y-4">
                  {performanceMetrics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">{tSystemAdmin('noPerformanceMetricsAvailable', { defaultValue: 'No performance metrics available' })}</div>
                  ) : (
                    performanceMetrics.map((metric, index) => (
                    <div key={index} className="card">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{metric.metric}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          metric.status === 'exceeded' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          metric.status === 'met' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {metric.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>{tSystemAdmin('current', { defaultValue: 'Current' })}: {metric.value}%</span>
                            <span>{tSystemAdmin('target', { defaultValue: 'Target' })}: {metric.target}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                metric.value >= metric.target ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getStatusColor(metric.status)} dark:text-gray-300`}>
                            {metric.value}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'exports' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{tSystemAdmin('exportReports', { defaultValue: 'Export Reports' })}</h2>
                <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('generateDownloadReports', { defaultValue: 'Generate and download reports in various formats' })}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card text-center">
                    <FileText className="mx-auto text-blue-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{tSystemAdmin('userReport', { defaultValue: 'User Report' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tSystemAdmin('completeUserStatistics', { defaultValue: 'Complete user statistics and demographics' })}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateUserReport('csv')}
                        className="btn-primary flex-1 text-sm"
                        disabled={exportLoading.user}
                      >
                        <Download size={16} className="inline mr-1" /> CSV
                      </button>
                      <button
                        onClick={() => generateUserReport('excel')}
                        className="btn-secondary flex-1 text-sm"
                        disabled={exportLoading.user}
                      >
                        <Download size={16} className="inline mr-1" /> Excel
                      </button>
                    </div>
                  </div>
                  <div className="card text-center">
                    <CreditCard className="mx-auto text-green-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('transactionsReport')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tSystemAdmin('completeTransactionHistory', { defaultValue: 'Complete transaction history with all details' })}</p>
                    <div className="space-y-2">
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="input-field text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      >
                        <option value="all">{tSystemAdmin('allGroups', { defaultValue: 'All Groups' })}</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generateTransactionReport('csv')}
                          className="btn-primary flex-1 text-sm"
                          disabled={transactionReportLoading}
                        >
                          <Download size={16} className="inline mr-1" /> CSV
                        </button>
                        <button
                          onClick={() => generateTransactionReport('excel')}
                          className="btn-secondary flex-1 text-sm"
                          disabled={transactionReportLoading}
                        >
                          <Download size={16} className="inline mr-1" /> Excel
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card text-center">
                    <DollarSign className="mx-auto text-purple-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{tSystemAdmin('financialReport', { defaultValue: 'Financial Report' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tSystemAdmin('savingsLoansFinancialPerformance', { defaultValue: 'Savings, loans, and financial performance' })}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateFinancialReport('csv')}
                        className="btn-primary flex-1 text-sm"
                        disabled={exportLoading.financial}
                      >
                        <Download size={16} className="inline mr-1" /> CSV
                      </button>
                      <button
                        onClick={() => generateFinancialReport('excel')}
                        className="btn-secondary flex-1 text-sm"
                        disabled={exportLoading.financial}
                      >
                        <Download size={16} className="inline mr-1" /> Excel
                      </button>
                    </div>
                  </div>
                  <div className="card text-center">
                    <Building2 className="mx-auto text-orange-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{tSystemAdmin('branchReport', { defaultValue: 'Branch Report' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tSystemAdmin('branchPerformanceCoverageAnalysis', { defaultValue: 'Branch performance and coverage analysis' })}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateBranchReport('csv')}
                        className="btn-primary flex-1 text-sm"
                        disabled={exportLoading.branch}
                      >
                        <Download size={16} className="inline mr-1" /> CSV
                      </button>
                      <button
                        onClick={() => generateBranchReport('excel')}
                        className="btn-secondary flex-1 text-sm"
                        disabled={exportLoading.branch}
                      >
                        <Download size={16} className="inline mr-1" /> Excel
                      </button>
                    </div>
                  </div>
                  <div className="card text-center">
                    <BarChart3 className="mx-auto text-red-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{tSystemAdmin('analyticsReport', { defaultValue: 'Analytics Report' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tSystemAdmin('comprehensiveAnalyticsInsights', { defaultValue: 'Comprehensive analytics and insights' })}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateAnalyticsReport('csv')}
                        className="btn-primary flex-1 text-sm"
                        disabled={exportLoading.analytics}
                      >
                        <Download size={16} className="inline mr-1" /> CSV
                      </button>
                      <button
                        onClick={() => generateAnalyticsReport('excel')}
                        className="btn-secondary flex-1 text-sm"
                        disabled={exportLoading.analytics}
                      >
                        <Download size={16} className="inline mr-1" /> Excel
                      </button>
                    </div>
                  </div>
                  <div className="card text-center">
                    <Calendar className="mx-auto text-indigo-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{tSystemAdmin('customReport', { defaultValue: 'Custom Report' })}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tSystemAdmin('createCustomReports', { defaultValue: 'Create custom reports with selected data' })}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateCustomReport('csv')}
                        className="btn-primary flex-1 text-sm"
                        disabled={exportLoading.custom}
                      >
                        <Download size={16} className="inline mr-1" /> CSV
                      </button>
                      <button
                        onClick={() => generateCustomReport('excel')}
                        className="btn-secondary flex-1 text-sm"
                        disabled={exportLoading.custom}
                      >
                        <Download size={16} className="inline mr-1" /> Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  )
}

export default SystemAdminReports

