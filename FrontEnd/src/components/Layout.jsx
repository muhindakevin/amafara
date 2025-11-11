import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, DollarSign, FileText, MessageCircle, BarChart, 
  Settings, LogOut, Menu, X, Bell, Search, Wallet, AlertCircle, Shield, Archive, BookOpen, Building2, UserCheck, FileCheck,
  CreditCard, Globe, Headphones, Database, TrendingUp, Vote, XCircle as XCircleIcon, Calendar
} from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import NotificationDropdown from './NotificationDropdown'
import { getTranslation } from '../utils/translations'
import { useLanguage } from '../contexts/LanguageContext'
import { UserContext } from '../App'

function Layout({ children, userRole = 'Member' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { user } = useContext(UserContext)

  const displayName = user?.name || 'User'
  const initials = (displayName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('') || 'U'

  const menuItems = {
    Member: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/member' },
      { icon: Wallet, label: 'My Savings', path: '/member/savings' },
      { icon: DollarSign, label: 'My Loans', path: '/member/loans' },
      { icon: FileText, label: 'Transactions', path: '/member/transactions' },
      { icon: XCircleIcon, label: 'Fines & Penalties', path: '/member/fines' },
      { icon: BookOpen, label: 'Learn & Grow', path: '/member/learn-grow' },
      { icon: Vote, label: 'Group Voting', path: '/member/voting' },
      { icon: Building2, label: 'My Group', path: '/member/group' },
      { icon: MessageCircle, label: 'Group Chat', path: '/chat' },
      { icon: Headphones, label: 'Support', path: '/member/support' },
      { icon: Settings, label: 'Settings', path: '/member/settings' },
    ],
    'Group Admin': [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Users, label: 'Members', path: '/admin/members' },
      { icon: DollarSign, label: 'Loan Requests', path: '/admin/loan-requests' },
      { icon: DollarSign, label: 'Contributions', path: '/admin/contributions' },
      { icon: AlertCircle, label: 'Fines & Penalties', path: '/admin/fines' },
      { icon: Calendar, label: 'Meetings', path: '/admin/meetings' },
      { icon: Vote, label: 'Group Voting', path: '/admin/voting' },
      { icon: BarChart, label: 'Analytics', path: '/admin/analytics' },
      { icon: MessageCircle, label: 'Announcements', path: '/admin/announcements' },
      { icon: Users, label: 'Applications', path: '/admin/applications' },
      { icon: FileText, label: 'Transactions', path: '/admin/transactions' },
      { icon: Headphones, label: 'Agent Support', path: '/admin/agent' },
      { icon: BookOpen, label: 'Learn & Grow', path: '/admin/learn-grow' },
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ],
    Cashier: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/cashier' },
      { icon: DollarSign, label: 'Contributions', path: '/cashier/contributions' },
      { icon: DollarSign, label: 'Loan Payments', path: '/cashier/loans' },
      { icon: AlertCircle, label: 'Fines & Penalties', path: '/cashier/fines' },
      { icon: FileText, label: 'Financial Reports', path: '/cashier/reports' },
      { icon: Bell, label: 'Notifications', path: '/cashier/notifications' },
      { icon: Shield, label: 'Audit Records', path: '/cashier/audit' },
      { icon: BarChart, label: 'Group Overview', path: '/cashier/overview' },
    ],
    Secretary: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/secretary' },
      { icon: Users, label: 'Member Records', path: '/secretary/members' },
      { icon: FileText, label: 'Meeting Minutes', path: '/secretary/meetings' },
      { icon: MessageCircle, label: 'Communications', path: '/secretary/communications' },
      { icon: Shield, label: 'Compliance', path: '/secretary/compliance' },
      { icon: Users, label: 'Support Team', path: '/secretary/support' },
      { icon: Archive, label: 'Documentation', path: '/secretary/archive' },
      { icon: BookOpen, label: 'Training', path: '/secretary/training' },
      { icon: Bell, label: 'Notifications', path: '/secretary/notifications' },
      { icon: BarChart, label: 'Reports', path: '/secretary/reports' },
    ],
    Agent: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/agent' },
      { icon: Building2, label: 'Group Management', path: '/agent/groups' },
      { icon: Users, label: 'Member Management', path: '/agent/members' },
      { icon: UserCheck, label: 'Role Management', path: '/agent/roles' },
      { icon: Shield, label: 'Compliance', path: '/agent/compliance' },
      { icon: BarChart, label: 'Reports', path: '/agent/reports' },
      { icon: BookOpen, label: 'Training', path: '/agent/training' },
      { icon: FileCheck, label: 'Audit', path: '/agent/audit' },
      { icon: MessageCircle, label: 'Communications', path: '/agent/communications' },
    ],
    'System Admin': [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/system-admin' },
      { icon: Users, label: 'User Management', path: '/system-admin/users' },
      { icon: Building2, label: 'Branches', path: '/system-admin/branches' },
      { icon: UserCheck, label: 'Agent Management', path: '/system-admin/agents' },
      { icon: Users, label: 'Client Management', path: '/system-admin/clients' },
      { icon: DollarSign, label: 'Loan & Credit', path: '/system-admin/loans' },
      { icon: CreditCard, label: 'Transactions', path: '/system-admin/transactions' },
      { icon: Settings, label: 'System Config', path: '/system-admin/system' },
      { icon: FileCheck, label: 'Audit & Compliance', path: '/system-admin/audit' },
      { icon: BarChart, label: 'Reports & Analytics', path: '/system-admin/reports' },
      { icon: MessageCircle, label: 'Communications', path: '/system-admin/communications' },
      { icon: Headphones, label: 'Support & Maintenance', path: '/system-admin/support' },
      { icon: BookOpen, label: 'Learn & Grow', path: '/system-admin/learn-grow' },
    ],
  }

  const items = menuItems[userRole] || menuItems.Member

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation - Fixed */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">UW</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-800">UMURENGE WALLET</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <NotificationDropdown />
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="text-xs text-gray-500">{user?.role || userRole}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative pt-[73px]">
        {/* Fixed Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:fixed top-[73px] left-0 z-40 h-[calc(100vh-73px)] w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out`}
          style={{ overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}
        >
          <nav className="p-4 space-y-2">
            {items.map((item, index) => {
              const Icon = item.icon
              // Generate translation key from label (remove spaces, special chars, lowercase)
              const translationKey = item.label.toLowerCase()
                .replace(/&/g, '')
                .replace(/\s+/g, '')
                .replace(/[^\w]/g, '')
              const translatedLabel = getTranslation(translationKey, language) || item.label
              return (
                <Link
                  key={index}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all duration-200 group"
                >
                  <Icon size={20} className="text-gray-600 group-hover:text-primary-600" />
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">{translatedLabel}</span>
                </Link>
              )
            })}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 group w-full"
            >
              <LogOut size={20} className="text-gray-600 group-hover:text-red-600" />
              <span className="font-medium text-gray-700 group-hover:text-red-600">{getTranslation('logout', language)}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content - Scrollable */}
        <main 
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} p-6`}
          style={{ 
            minHeight: 'calc(100vh - 73px)',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout


