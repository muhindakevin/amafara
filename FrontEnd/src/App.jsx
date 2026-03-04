import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './i18n' // Initialize i18next
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'

// Import pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import MemberDashboard from './pages/MemberDashboard'
import MemberSavings from './pages/MemberSavings'
import MemberLoans from './pages/MemberLoans'
import MemberTransactions from './pages/MemberTransactions'
import MemberSettings from './pages/MemberSettings'
import CashierSettings from './pages/CashierSettings'
import SecretarySettings from './pages/SecretarySettings'
import AgentSettings from './pages/AgentSettings'
import MemberFines from './pages/MemberFines'
import MemberLearnGrow from './pages/MemberLearnGrow'
import MemberVoting from './pages/MemberVoting'
import MemberGroup from './pages/MemberGroup'
import MemberSupport from './pages/MemberSupport'
import MemberAnnouncements from './pages/MemberAnnouncements'
import GroupAdminLoanRequests from './pages/GroupAdminLoanRequests'
import GroupAdminMembers from './pages/GroupAdminMembers'
import GroupAdminAnalytics from './pages/GroupAdminAnalytics'
import GroupAdminAnnouncements from './pages/GroupAdminAnnouncements'
import GroupAdminTransactions from './pages/GroupAdminTransactions'
import AddNewMember from './pages/AddNewMember'
import GroupAdminMemberApplications from './pages/GroupAdminMemberApplications'
import GroupAdminSettings from './pages/GroupAdminSettings'
import GroupAdminChat from './pages/GroupAdminChat'
import GroupAdminDashboard from './pages/GroupAdminDashboard'
import GroupAdminContributions from './pages/GroupAdminContributions'
import GroupAdminFines from './pages/GroupAdminFines'
import GroupAdminMeetings from './pages/GroupAdminMeetings'
import GroupAdminVoting from './pages/GroupAdminVoting'
import GroupAdminAgent from './pages/GroupAdminAgent'
import GroupAdminLearnGrow from './pages/GroupAdminLearnGrow'
import CashierDashboard from './pages/CashierDashboard'
import CashierContributions from './pages/CashierContributions'
import CashierLoans from './pages/CashierLoans'
import CashierFines from './pages/CashierFines'
import CashierReports from './pages/CashierReports'
import CashierRecords from './pages/CashierRecords'
import CashierNotifications from './pages/CashierNotifications'
import CashierAudit from './pages/CashierAudit'
import CashierOverview from './pages/CashierOverview'
import CashierSchedule from './pages/CashierSchedule'
import CashierChat from './pages/CashierChat'
import SecretaryDashboard from './pages/SecretaryDashboard'
import SecretaryChat from './pages/SecretaryChat'
import SecretaryMembers from './pages/SecretaryMembers'
import SecretaryMeetings from './pages/SecretaryMeetings'
import SecretaryCommunications from './pages/SecretaryCommunications'
import SecretaryCompliance from './pages/SecretaryCompliance'
import SecretarySupport from './pages/SecretarySupport'
import SecretaryArchive from './pages/SecretaryArchive'
import SecretaryTraining from './pages/SecretaryTraining'
import SecretaryTransactions from './pages/SecretaryTransactions'
import SecretaryNotifications from './pages/SecretaryNotifications'
import SecretaryReports from './pages/SecretaryReports'
import AgentDashboard from './pages/AgentDashboard'
import AgentGroups from './pages/AgentGroups'
import AgentMembers from './pages/AgentMembers'
import AgentRoles from './pages/AgentRoles'
import AgentCompliance from './pages/AgentCompliance'
import AgentReports from './pages/AgentReports'
import AgentTraining from './pages/AgentTraining'
import AgentChat from './pages/AgentChat'
import AgentAudit from './pages/AgentAudit'
import AgentCommunications from './pages/AgentCommunications'
import AgentSupport from './pages/AgentSupport'
import SystemAdminDashboard from './pages/SystemAdminDashboard'
import SystemAdminUsers from './pages/SystemAdminUsers'
import SystemAdminBranches from './pages/SystemAdminBranches'
import SystemAdminAgents from './pages/SystemAdminAgents'
import SystemAdminGroups from './pages/SystemAdminGroups'
import SystemAdminClients from './pages/SystemAdminClients'
import SystemAdminLoans from './pages/SystemAdminLoans'
import SystemAdminTransactions from './pages/SystemAdminTransactions'
import SystemAdminSystem from './pages/SystemAdminSystem'
import SystemAdminAudit from './pages/SystemAdminAudit'
import SystemAdminReports from './pages/SystemAdminReports'
import SystemAdminCommunications from './pages/SystemAdminCommunications'
import SystemAdminChat from './pages/SystemAdminChat'
import SystemAdminSupport from './pages/SystemAdminSupport'
import SystemAdminLearnGrow from './pages/SystemAdminLearnGrow'
import TicketDetailsPage from './pages/TicketDetailsPage'
import UserProfilePage from './pages/UserProfilePage'
import ChatPage from './pages/ChatPage'
import AnalyticsPage from './pages/AnalyticsPage'

// User context for role-based routing
export const UserContext = React.createContext({ user: null, setUser: () => { } })
import api from './utils/api'

// Listen for profile image updates
if (typeof window !== 'undefined') {
  window.addEventListener('userProfileUpdated', async (event) => {
    // This will be handled by components that need to refresh
    console.log('Profile image updated:', event.detail)
  })
}

import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const [user, setUser] = useState(null) // { role, name, email, userId }
  const [isInitializing, setIsInitializing] = useState(true)

  // Function to load user data
  const loadUser = async () => {
    const token = localStorage.getItem('uw_token')
    if (!token) {
      return
    }

    try {
      const { data } = await api.get('/auth/me')
      if (data?.success) {
        setUser(data.data)
        // Dispatch event to notify theme system of user change
        window.dispatchEvent(new Event('user-changed'))
      }
    } catch (e) {
      // ignore if not logged in or timeout
      // Clear invalid token
      if (e.response?.status === 401) {
        localStorage.removeItem('uw_token')
      }
    }
  }

  // Initialize user from token on app load
  useEffect(() => {
    let mounted = true
    let timeoutId

    async function loadMe() {
      // Only fetch if user is authenticated (has token)
      const token = localStorage.getItem('uw_token')
      if (!token) {
        setIsInitializing(false)
        return
      }

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 5000)
        })

        const { data } = await Promise.race([
          api.get('/auth/me'),
          timeoutPromise
        ])

        if (timeoutId) clearTimeout(timeoutId)

        if (mounted && data?.success) {
          setUser(data.data)
          // Dispatch event to notify theme system of user change
          window.dispatchEvent(new Event('user-changed'))
        }
      } catch (e) {
        // ignore if not logged in or timeout
        // Clear invalid token
        if (e.response?.status === 401 || e.message?.includes('timeout')) {
          localStorage.removeItem('uw_token')
        }
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    loadMe()



    // Listen for profile image updates
    const handleProfileUpdate = () => {
      if (mounted) {
        loadUser()
      }
    }

    window.addEventListener('userProfileUpdated', handleProfileUpdate)

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [])

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading IKIMINA WALLET..." fullScreen={false} />
      </div>
    )
  }

  return (
    <LanguageProvider>
      <ToastProvider>
        <NotificationProvider>
          <UserContext.Provider value={{ user, setUser }}>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
            <Routes>
              {/* Landing Page - Always Light Mode */}
              <Route path="/" element={
                <ThemeProvider forceLightMode={true}>
                  <LandingPage />
                </ThemeProvider>
              } />

              {/* All other routes - Normal ThemeProvider (supports dark/light mode) */}
              <Route path="/*" element={
                <ThemeProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/member" element={<MemberDashboard />} />
                    <Route path="/member/savings" element={<MemberSavings />} />
                    <Route path="/member/loans" element={<MemberLoans />} />
                    <Route path="/member/transactions" element={<MemberTransactions />} />
                    <Route path="/member/fines" element={<MemberFines />} />
                    <Route path="/member/learn-grow" element={<MemberLearnGrow />} />
                    <Route path="/member/voting" element={<MemberVoting />} />
                    <Route path="/member/group" element={<MemberGroup />} />
                    <Route path="/member/support" element={<MemberSupport />} />
                    <Route path="/member/announcements" element={<MemberAnnouncements />} />
                    <Route path="/member/settings" element={<MemberSettings />} />
                    <Route path="/admin" element={<GroupAdminDashboard />} />
                    <Route path="/admin/loan-requests" element={<GroupAdminLoanRequests />} />
                    <Route path="/admin/members" element={<GroupAdminMembers />} />
                    <Route path="/admin/contributions" element={<GroupAdminContributions />} />
                    <Route path="/admin/fines" element={<GroupAdminFines />} />
                    <Route path="/admin/meetings" element={<GroupAdminMeetings />} />
                    <Route path="/admin/voting" element={<GroupAdminVoting />} />
                    <Route path="/admin/announcements" element={<GroupAdminAnnouncements />} />
                    <Route path="/admin/applications" element={<GroupAdminMemberApplications />} />
                    <Route path="/admin/analytics" element={<GroupAdminAnalytics />} />
                    <Route path="/admin/transactions" element={<GroupAdminTransactions />} />
                    <Route path="/admin/agent" element={<GroupAdminAgent />} />
                    <Route path="/admin/learn-grow" element={<GroupAdminLearnGrow />} />
                    <Route path="/admin/settings" element={<GroupAdminSettings />} />
                    <Route path="/admin/add-member" element={<AddNewMember />} />
                    <Route path="/admin/chat" element={<GroupAdminChat />} />
                    <Route path="/cashier" element={<CashierDashboard />} />
                    <Route path="/cashier/contributions" element={<CashierContributions />} />
                    <Route path="/cashier/loans" element={<CashierLoans />} />
                    <Route path="/cashier/fines" element={<CashierFines />} />
                    <Route path="/cashier/reports" element={<CashierReports />} />
                    <Route path="/cashier/records" element={<CashierRecords />} />
                    <Route path="/cashier/notifications" element={<CashierNotifications />} />
                    <Route path="/cashier/audit" element={<CashierAudit />} />
                    <Route path="/cashier/overview" element={<CashierOverview />} />
                    <Route path="/cashier/schedule" element={<CashierSchedule />} />
                    <Route path="/cashier/chat" element={<CashierChat />} />
                    <Route path="/cashier/voting" element={<GroupAdminVoting />} />
                    <Route path="/cashier/settings" element={<CashierSettings />} />
                    <Route path="/secretary" element={<SecretaryDashboard />} />
                    <Route path="/secretary/voting" element={<GroupAdminVoting />} />
                    <Route path="/secretary/members" element={<SecretaryMembers />} />
                    <Route path="/secretary/meetings" element={<SecretaryMeetings />} />
                    <Route path="/secretary/communications" element={<SecretaryCommunications />} />
                    <Route path="/secretary/compliance" element={<SecretaryCompliance />} />
                    <Route path="/secretary/support" element={<SecretarySupport />} />
                    <Route path="/secretary/archive" element={<SecretaryArchive />} />
                    <Route path="/secretary/learning" element={<SecretaryTraining />} />
                    <Route path="/secretary/transactions" element={<SecretaryTransactions />} />
                    <Route path="/secretary/notifications" element={<SecretaryNotifications />} />
                    <Route path="/secretary/reports" element={<SecretaryReports />} />
                    <Route path="/secretary/chat" element={<SecretaryChat />} />
                    <Route path="/secretary/settings" element={<SecretarySettings />} />
                    <Route path="/agent" element={<AgentDashboard />} />
                    <Route path="/agent/groups" element={<AgentGroups />} />
                    <Route path="/agent/members" element={<AgentMembers />} />
                    <Route path="/agent/roles" element={<AgentRoles />} />
                    <Route path="/agent/compliance" element={<AgentCompliance />} />
                    <Route path="/agent/reports" element={<AgentReports />} />
                    <Route path="/agent/training" element={<AgentTraining />} />
                    <Route path="/agent/chat" element={<AgentChat />} />
                    <Route path="/agent/audit" element={<AgentAudit />} />
                    <Route path="/agent/communications" element={<AgentCommunications />} />
                    <Route path="/agent/support" element={<AgentSupport />} />
                    <Route path="/agent/settings" element={<AgentSettings />} />
                    <Route path="/system-admin" element={<SystemAdminDashboard />} />
                    <Route path="/system-admin/users" element={<SystemAdminUsers />} />
                    <Route path="/system-admin/branches" element={<SystemAdminBranches />} />
                    <Route path="/system-admin/agents" element={<SystemAdminAgents />} />
                    <Route path="/system-admin/groups" element={<SystemAdminGroups />} />
                    <Route path="/system-admin/clients" element={<SystemAdminClients />} />
                    <Route path="/system-admin/loans" element={<SystemAdminLoans />} />
                    <Route path="/system-admin/transactions" element={<SystemAdminTransactions />} />
                    <Route path="/system-admin/system" element={<SystemAdminSystem />} />
                    <Route path="/system-admin/audit" element={<SystemAdminAudit />} />
                    <Route path="/system-admin/reports" element={<SystemAdminReports />} />
                    <Route path="/system-admin/communications" element={<SystemAdminCommunications />} />
                    <Route path="/system-admin/chat" element={<SystemAdminChat />} />
                    <Route path="/system-admin/support" element={<SystemAdminSupport />} />
                    <Route path="/system-admin/support/tickets/:id" element={<TicketDetailsPage />} />
                    <Route path="/system-admin/users/:id" element={<UserProfilePage />} />
                    <Route path="/system-admin/learn-grow" element={<SystemAdminLearnGrow />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                  </Routes>
                </ThemeProvider>
              } />
            </Routes>
          </Router>
        </UserContext.Provider>
      </NotificationProvider>
    </ToastProvider>
  </LanguageProvider>
)
}

export default App








