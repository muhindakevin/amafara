import { useState, useContext, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, DollarSign, FileText, MessageCircle, BarChart,
  Settings, LogOut, Menu, X, Bell, Search, Wallet, AlertCircle, Shield, Archive, BookOpen, Building2, UserCheck, FileCheck,
  CreditCard, Globe, Headphones, Database, TrendingUp, Vote, XCircle as XCircleIcon, Calendar, Megaphone
} from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import NotificationDropdown from './NotificationDropdown'
import SearchModal from './SearchModal'
import ThemeIcon from './ThemeIcon'
import ProfileImage from './ProfileImage'
import { getFileUrl } from '../utils/api'
import api from '../utils/api'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { UserContext } from '../App'
import { PERMISSIONS, hasPermission } from '../utils/permissions'

function Layout({ children, userRole = 'Member' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const contextValue = useContext(UserContext)
  const user = (contextValue && contextValue.user) ? contextValue.user : null
  const { setUser } = contextValue || {}
  const { t } = useTranslation('navigation')
  const { t: tCommon } = useTranslation('common')

  const displayName = user?.name || 'User'
  const profileImageUrl = user?.profileImage ? getFileUrl(user.profileImage) : ''

  // Listen for profile image updates and refresh user data
  useEffect(() => {
    const handleProfileUpdate = async () => {
      // Refresh user data to get updated profile image
      const token = localStorage.getItem('uw_token')
      if (!token || !setUser) return

      try {
        const { data } = await api.get('/auth/me')
        if (data?.success && setUser) {
          setUser(data.data)
          // Dispatch event to notify theme system of user change
          window.dispatchEvent(new Event('user-changed'))
        }
      } catch (error) {
        console.error('Failed to refresh user data after profile update:', error)
      }
    }

    window.addEventListener('userProfileUpdated', handleProfileUpdate)
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [setUser])

  const menuItems = {
    Member: [
      {
        title: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', translationKey: 'dashboard', path: '/member' }
        ]
      },
      {
        title: 'Financial',
        items: [
          { icon: Wallet, label: 'My Savings', translationKey: 'mySavings', path: '/member/savings', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS },
          { icon: DollarSign, label: 'My Loans', translationKey: 'myLoans', path: '/member/loans', permission: PERMISSIONS.MANAGE_LOANS },
          { icon: FileText, label: 'Transactions', translationKey: 'transactions', path: '/member/transactions', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS },
          { icon: XCircleIcon, label: 'Fines & Penalties', translationKey: 'finesPenalties', path: '/member/fines', permission: PERMISSIONS.MANAGE_FINES }
        ]
      },
      {
        title: 'Group',
        items: [
          { icon: Building2, label: 'My Group', translationKey: 'myGroup', path: '/member/group' },
          { icon: Vote, label: 'Group Voting', translationKey: 'groupVoting', path: '/member/voting' },
          { icon: Megaphone, label: 'Announcements', translationKey: 'announcements', path: '/member/announcements' }
        ]
      },
      {
        title: 'Communication',
        items: [
          { icon: MessageCircle, label: 'Group Chat', translationKey: 'groupChat', path: '/chat' },
          { icon: Headphones, label: 'Support', translationKey: 'support', path: '/member/support' }
        ]
      },
      {
        title: 'Personal',
        items: [
          { icon: BookOpen, label: 'Learn & Grow', translationKey: 'learnGrow', path: '/member/learn-grow' },
          { icon: Settings, label: 'Settings', translationKey: 'settings', path: '/member/settings' }
        ]
      }
    ],
    'Group Admin': [
      {
        title: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', translationKey: 'dashboard', path: '/admin' }
        ]
      },
      {
        title: 'Financial',
        items: [
          { icon: DollarSign, label: 'Loan Requests', translationKey: 'loanRequests', path: '/admin/loan-requests', permission: PERMISSIONS.MANAGE_LOANS },
          { icon: DollarSign, label: 'Contributions', translationKey: 'contributions', path: '/admin/contributions', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS },
          { icon: AlertCircle, label: 'Fines & Penalties', translationKey: 'finesPenalties', path: '/admin/fines', permission: PERMISSIONS.MANAGE_FINES },
          { icon: FileText, label: 'Transactions', translationKey: 'transactions', path: '/admin/transactions', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS }
        ]
      },
      {
        title: 'Group',
        items: [
          { icon: Users, label: 'Members', translationKey: 'members', path: '/admin/members', permission: PERMISSIONS.MANAGE_USERS },
          { icon: Calendar, label: 'Meetings', translationKey: 'meetings', path: '/admin/meetings', permission: PERMISSIONS.MANAGE_GROUPS },
          { icon: Vote, label: 'Group Voting', translationKey: 'groupVoting', path: '/admin/voting' },
          { icon: BarChart, label: 'Analytics', translationKey: 'analytics', path: '/admin/analytics', permission: PERMISSIONS.VIEW_ANALYTICS },
          { icon: Users, label: 'Applications', translationKey: 'applications', path: '/admin/applications', permission: PERMISSIONS.MANAGE_USERS }
        ]
      },
      {
        title: 'Communication',
        items: [
          { icon: MessageCircle, label: 'Group Chat', translationKey: 'groupChat', path: '/admin/chat' },
          { icon: MessageCircle, label: 'Announcements', translationKey: 'announcements', path: '/admin/announcements', permission: PERMISSIONS.SEND_NOTIFICATIONS },
          { icon: Headphones, label: 'Agent Support', translationKey: 'agentSupport', path: '/admin/agent' }
        ]
      },
      {
        title: 'Personal',
        items: [
          { icon: BookOpen, label: 'Learn & Grow', translationKey: 'learnGrow', path: '/admin/learn-grow' },
          { icon: Settings, label: 'Settings', translationKey: 'settings', path: '/admin/settings' }
        ]
      }
    ],
    Cashier: [
      {
        title: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', translationKey: 'dashboard', path: '/cashier' }
        ]
      },
      {
        title: 'Financial',
        items: [
          { icon: DollarSign, label: 'Contributions', translationKey: 'contributions', path: '/cashier/contributions', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS },
          { icon: DollarSign, label: 'Loan Payments', translationKey: 'loanPayments', path: '/cashier/loans', permission: PERMISSIONS.MANAGE_LOANS },
          { icon: AlertCircle, label: 'Fines & Penalties', translationKey: 'finesPenalties', path: '/cashier/fines', permission: PERMISSIONS.MANAGE_FINES },
          { icon: FileText, label: 'Financial Reports', translationKey: 'financialReports', path: '/cashier/reports', permission: PERMISSIONS.VIEW_REPORTS }
        ]
      },
      {
        title: 'Group',
        items: [
          { icon: Vote, label: 'Group Voting', translationKey: 'groupVoting', path: '/cashier/voting' },
          { icon: BarChart, label: 'Group Overview', translationKey: 'groupOverview', path: '/cashier/overview', permission: PERMISSIONS.VIEW_ANALYTICS }
        ]
      },
      {
        title: 'Communication',
        items: [
          { icon: MessageCircle, label: 'Group Chat', translationKey: 'groupChat', path: '/cashier/chat' },
          { icon: Bell, label: 'Notifications', translationKey: 'notifications', path: '/cashier/notifications' }
        ]
      },
      {
        title: 'Audit',
        items: [
          { icon: Shield, label: 'Audit Records', translationKey: 'auditRecords', path: '/cashier/audit', permission: PERMISSIONS.VIEW_AUDIT_LOGS }
        ]
      },
      {
        title: 'Settings',
        items: [
          { icon: Settings, label: 'Settings', translationKey: 'settings', path: '/cashier/settings' }
        ]
      }
    ],
    Secretary: [
      {
        title: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', translationKey: 'dashboard', path: '/secretary' }
        ]
      },
      {
        title: 'Records',
        items: [
          { icon: Users, label: 'Member Records', translationKey: 'memberRecords', path: '/secretary/members', permission: PERMISSIONS.MANAGE_USERS },
          { icon: FileText, label: 'Meeting Minutes', translationKey: 'meetingMinutes', path: '/secretary/meetings', permission: PERMISSIONS.MANAGE_GROUPS }
        ]
      },
      {
        title: 'Group',
        items: [
          { icon: Vote, label: 'Group Voting', translationKey: 'groupVoting', path: '/secretary/voting' }
        ]
      },
      {
        title: 'Communication',
        items: [
          { icon: MessageCircle, label: 'Group Chat', translationKey: 'groupChat', path: '/secretary/chat' },
          { icon: MessageCircle, label: 'Communications', translationKey: 'communications', path: '/secretary/communications', permission: PERMISSIONS.SEND_NOTIFICATIONS },
          { icon: Bell, label: 'Notifications', translationKey: 'notifications', path: '/secretary/notifications' }
        ]
      },
      {
        title: 'Management',
        items: [
          { icon: Shield, label: 'Compliance', translationKey: 'compliance', path: '/secretary/compliance', permission: PERMISSIONS.VIEW_AUDIT_LOGS },
          { icon: Users, label: 'Support Team', translationKey: 'supportTeam', path: '/secretary/support', permission: PERMISSIONS.MANAGE_USERS },
          { icon: DollarSign, label: 'Transactions', translationKey: 'transactions', path: '/secretary/transactions', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS },
          { icon: BarChart, label: 'Reports', translationKey: 'reports', path: '/secretary/reports', permission: PERMISSIONS.VIEW_REPORTS }
        ]
      },
      {
        title: 'Personal',
        items: [
          { icon: BookOpen, label: 'Learning', translationKey: 'learning', path: '/secretary/learning' },
          { icon: Settings, label: 'Settings', translationKey: 'settings', path: '/secretary/settings' }
        ]
      }
    ],
    Agent: [
      {
        title: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', translationKey: 'dashboard', path: '/agent' }
        ]
      },
      {
        title: 'Management',
        items: [
          { icon: Building2, label: 'Group Management', translationKey: 'groupManagement', path: '/agent/groups', permission: PERMISSIONS.MANAGE_GROUPS },
          { icon: Users, label: 'Member Management', translationKey: 'memberManagement', path: '/agent/members', permission: PERMISSIONS.MANAGE_USERS },
          { icon: UserCheck, label: 'Role Management', translationKey: 'roleManagement', path: '/agent/roles', permission: PERMISSIONS.MANAGE_USERS }
        ]
      },
      {
        title: 'Compliance',
        items: [
          { icon: Shield, label: 'Compliance', translationKey: 'compliance', path: '/agent/compliance', permission: PERMISSIONS.VIEW_AUDIT_LOGS },
          { icon: FileCheck, label: 'Audit', translationKey: 'audit', path: '/agent/audit', permission: PERMISSIONS.VIEW_AUDIT_LOGS }
        ]
      },
      {
        title: 'Reports',
        items: [
          { icon: BarChart, label: 'Reports', translationKey: 'reports', path: '/agent/reports', permission: PERMISSIONS.VIEW_REPORTS }
        ]
      },
      {
        title: 'Communication',
        items: [
          { icon: MessageCircle, label: 'Chat', translationKey: 'chat', path: '/agent/chat' },
          { icon: MessageCircle, label: 'Communications', translationKey: 'communications', path: '/agent/communications', permission: PERMISSIONS.SEND_NOTIFICATIONS },
          { icon: Headphones, label: 'Support Requests', translationKey: 'supportRequests', path: '/agent/support', permission: PERMISSIONS.MANAGE_SUPPORT }
        ]
      },
      {
        title: 'Personal',
        items: [
          { icon: BookOpen, label: 'Training', translationKey: 'training', path: '/agent/training' },
          { icon: Settings, label: 'Settings', translationKey: 'settings', path: '/agent/settings' }
        ]
      }
    ],
    'System Admin': [
      {
        title: 'Overview',
        items: [
          { icon: LayoutDashboard, label: 'Dashboard', translationKey: 'dashboard', path: '/system-admin' }
        ]
      },
      {
        title: 'Management',
        items: [
          { icon: Users, label: 'User Management', translationKey: 'userManagement', path: '/system-admin/users', permission: PERMISSIONS.MANAGE_USERS },
          { icon: Building2, label: 'Branches', translationKey: 'branches', path: '/system-admin/branches', permission: PERMISSIONS.SYSTEM_SETTINGS },
          { icon: UserCheck, label: 'Agent Management', translationKey: 'agentManagement', path: '/system-admin/agents', permission: PERMISSIONS.MANAGE_USERS },
          { icon: Users, label: 'Client Management', translationKey: 'clientManagement', path: '/system-admin/clients', permission: PERMISSIONS.MANAGE_USERS }
        ]
      },
      {
        title: 'Financial',
        items: [
          { icon: DollarSign, label: 'Loan & Credit', translationKey: 'loanCredit', path: '/system-admin/loans', permission: PERMISSIONS.MANAGE_LOANS },
          { icon: CreditCard, label: 'Transactions', translationKey: 'transactions', path: '/system-admin/transactions', permission: PERMISSIONS.MANAGE_CONTRIBUTIONS }
        ]
      },
      {
        title: 'System',
        items: [
          { icon: Settings, label: 'System Config', translationKey: 'systemConfig', path: '/system-admin/system', permission: PERMISSIONS.SYSTEM_SETTINGS },
          { icon: FileCheck, label: 'Audit & Compliance', translationKey: 'auditCompliance', path: '/system-admin/audit', permission: PERMISSIONS.SYSTEM_SETTINGS }
        ]
      },
      {
        title: 'Reports',
        items: [
          { icon: BarChart, label: 'Reports & Analytics', translationKey: 'reportsAnalytics', path: '/system-admin/reports', permission: PERMISSIONS.VIEW_REPORTS }
        ]
      },
      {
        title: 'Communication',
        items: [
          { icon: MessageCircle, label: 'Communications', translationKey: 'communications', path: '/system-admin/communications', permission: PERMISSIONS.SEND_NOTIFICATIONS },
          { icon: Headphones, label: 'Support & Maintenance', translationKey: 'supportMaintenance', path: '/system-admin/support', permission: PERMISSIONS.MANAGE_SUPPORT }
        ]
      },
      {
        title: 'Personal',
        items: [
          { icon: BookOpen, label: 'Learn & Grow', translationKey: 'learnGrow', path: '/system-admin/learn-grow' }
        ]
      }
    ]
  }

  const allGroupsForRole = menuItems[userRole] || menuItems.Member

  // Filter groups and items based on granular permissions
  const menuGroups = allGroupsForRole.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // If no specific permission is required, show it
      if (!item.permission) return true

      // Use shared hasPermission utility
      return hasPermission(user, item.permission)
    })
  })).filter(group => group.items.length > 0)

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(true)
      }
      // Escape to close search
      if (e.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearchModal])

  return (
    <div className={`min-h-screen ${userRole === 'System Admin' ? 'bg-white' : 'bg-gray-50'} dark:bg-gray-900 flex flex-col`}>
      {/* Top Navigation - Fixed */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              {sidebarOpen ? <X size={20} className="text-gray-800 dark:text-gray-200 sm:w-6 sm:h-6" /> : <Menu size={20} className="text-gray-800 dark:text-gray-200 sm:w-6 sm:h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-0.5 overflow-hidden min-w-0 flex-shrink">
              <div className="h-8 w-20 sm:h-10 sm:w-28 overflow-hidden flex items-center justify-center bg-transparent flex-shrink-0">
                <img
                  src="/assets/images/wallet.png"
                  alt="IKIMINA WALLET"
                  className="h-full w-auto object-contain"
                  style={{ maxHeight: '100%', height: '100%', transform: 'scale(1.1)', transformOrigin: 'left center' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
              </div>
              <span className="text-primary-600 dark:text-primary-400 font-bold text-lg hidden">IKIMINA WALLET</span>
              <span className="hidden sm:block text-base sm:text-xl font-bold text-gray-800 dark:text-white truncate">IKIMINA WALLET</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden xs:block">
              <LanguageSelector />
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group relative"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <ThemeIcon size={18} className="transition-transform duration-200 group-hover:rotate-12 sm:w-5 sm:h-5" />
            </button>
            <div className="hidden sm:block">
              <NotificationDropdown />
            </div>
            <div
              className="relative group"
              onMouseEnter={() => { }}
              onMouseLeave={() => { }}
            >
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 relative"
                title="Search (Ctrl+K)"
              >
                <Search size={16} className="text-gray-600 dark:text-gray-300 transition-colors duration-200 sm:w-[18px] sm:h-[18px]" />
              </button>
              {/* Hover-only Ctrl+K indicator */}
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 dark:text-gray-300 px-2 py-1 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 hidden md:block">
                Ctrl+K
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-[120px]">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{user?.role || userRole}</p>
              </div>
              <ProfileImage
                imageUrl={profileImageUrl}
                name={displayName}
                size={32}
                className="sm:w-10 sm:h-10"
                editable={false}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative pt-[60px] sm:pt-[65px] md:pt-[73px]">
        {/* Fixed Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed lg:fixed top-[60px] sm:top-[65px] md:top-[73px] left-0 z-40 h-[calc(100vh-60px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-73px)] w-56 sm:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm transform transition-transform duration-300 ease-in-out flex flex-col`}
        >
          <nav className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-0.5 sm:space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-3">
                <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3">{group.title}</h3>
                {group.items.map((item, index) => {
                  const Icon = item.icon
                  // Use explicit translation key if available, otherwise fallback to label
                  const translationKey = item.translationKey || item.label.toLowerCase()
                    .replace(/&/g, '')
                    .replace(/\s+/g, '')
                    .replace(/[^\w]/g, '')
                  const translatedLabel = t(translationKey, { defaultValue: item.label })
                  return (
                    <Link
                      key={`${groupIndex}-${index}`}
                      to={item.path}
                      className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-500 transition-all duration-200 group text-sm sm:text-base"
                    >
                      <Icon size={18} className="text-gray-600 dark:text-gray-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 flex-shrink-0 sm:w-5 sm:h-5" />
                      <span className="font-normal text-gray-700 dark:text-gray-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 truncate">{translatedLabel}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
          {/* Sticky Footer */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex-shrink-0">
            <div className="text-xs text-gray-500 text-center mb-2">v1.0.0</div>
            <button
              onClick={() => {
                localStorage.removeItem('uw_token')
                window.dispatchEvent(new Event('user-changed'))
                navigate('/login')
              }}
              className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group w-full text-sm sm:text-base"
            >
              <LogOut size={18} className="text-red-600 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 flex-shrink-0 sm:w-5 sm:h-5" />
              <span className="font-medium text-red-600 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">{tCommon('logout', { defaultValue: 'Logout' })}</span>
            </button>
          </div>
        </aside>

        {/* Main Content - Scrollable */}
        <main
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-56 xl:ml-64' : 'lg:ml-0'} p-3 sm:p-4 md:p-6 ${userRole === 'System Admin' ? 'bg-white' : 'bg-transparent'}`}
          style={{
            minHeight: 'calc(100vh - 60px)',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-30 transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Search Modal */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </div>
  )
}

export default Layout


