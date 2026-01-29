import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText, Users, DollarSign, Calendar, MessageCircle, Bell, Shield, TrendingUp, Building2, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

function SearchModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      performSearch()
    } else {
      setResults([])
    }
  }, [searchTerm, activeCategory])

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const searchResults = []
      const keyword = searchTerm.toLowerCase().trim()

      // Get user info to determine role
      const meResponse = await api.get('/auth/me')
      const user = meResponse.data?.data
      const userRole = user?.role
      const userId = user?.id
      const groupId = user?.groupId

      // Search based on user role
      if (userRole === 'Member') {
        // Members can search: transactions, loans, contributions, fines
        const [transactions, loans, contributions, fines] = await Promise.all([
          api.get('/transactions').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/loans').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/contributions').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/fines').catch(() => ({ data: { success: true, data: [] } }))
        ])

        // Filter transactions
        if (transactions.data?.success) {
          transactions.data.data
            .filter(t => 
              (t.description?.toLowerCase().includes(keyword)) ||
              (t.type?.toLowerCase().includes(keyword)) ||
              (t.reference?.toLowerCase().includes(keyword)) ||
              (String(t.amount || '').includes(keyword))
            )
            .forEach(t => {
              searchResults.push({
                type: 'transaction',
                id: t.id,
                title: `${t.type} - ${t.description || 'Transaction'}`,
                subtitle: `Amount: ${t.amount} RWF`,
                icon: TrendingUp,
                path: '/member/transactions',
                data: t
              })
            })
        }

        // Filter loans
        if (loans.data?.success) {
          loans.data.data
            .filter(l =>
              (l.status?.toLowerCase().includes(keyword)) ||
              (String(l.amount || '').includes(keyword)) ||
              (l.purpose?.toLowerCase().includes(keyword))
            )
            .forEach(l => {
              searchResults.push({
                type: 'loan',
                id: l.id,
                title: `Loan ${l.status}`,
                subtitle: `Amount: ${l.amount} RWF`,
                icon: CreditCard,
                path: '/member/loans',
                data: l
              })
            })
        }

        // Filter contributions
        if (contributions.data?.success) {
          contributions.data.data
            .filter(c =>
              (c.status?.toLowerCase().includes(keyword)) ||
              (String(c.amount || '').includes(keyword)) ||
              (c.month?.toLowerCase().includes(keyword))
            )
            .forEach(c => {
              searchResults.push({
                type: 'contribution',
                id: c.id,
                title: `Contribution - ${c.month || 'Monthly'}`,
                subtitle: `Amount: ${c.amount} RWF`,
                icon: DollarSign,
                path: '/member/savings',
                data: c
              })
            })
        }

        // Filter fines
        if (fines.data?.success) {
          fines.data.data
            .filter(f =>
              (f.reason?.toLowerCase().includes(keyword)) ||
              (f.status?.toLowerCase().includes(keyword)) ||
              (String(f.amount || '').includes(keyword))
            )
            .forEach(f => {
              searchResults.push({
                type: 'fine',
                id: f.id,
                title: `Fine - ${f.reason || 'Fine'}`,
                subtitle: `Amount: ${f.amount} RWF`,
                icon: FileText,
                path: '/member/fines',
                data: f
              })
            })
        }
      } else if (userRole === 'Group Admin') {
        // Group Admins can search: members, transactions, loans, contributions, fines, meetings
        const [members, transactions, loans, contributions, fines, meetings] = await Promise.all([
          api.get('/users', { params: { role: 'Member' } }).catch(() => ({ data: { success: true, data: [] } })),
          api.get('/transactions').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/loans').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/contributions').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/fines').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/meetings').catch(() => ({ data: { success: true, data: [] } }))
        ])

        // Filter members
        if (members.data?.success) {
          members.data.data
            .filter(m =>
              (m.name?.toLowerCase().includes(keyword)) ||
              (m.phone?.includes(keyword)) ||
              (m.email?.toLowerCase().includes(keyword)) ||
              (m.nationalId?.includes(keyword))
            )
            .forEach(m => {
              searchResults.push({
                type: 'member',
                id: m.id,
                title: m.name,
                subtitle: `${m.phone || ''} | ${m.role || 'Member'}`,
                icon: Users,
                path: '/admin/members',
                data: m
              })
            })
        }

        // Filter transactions
        if (transactions.data?.success) {
          transactions.data.data
            .filter(t =>
              (t.description?.toLowerCase().includes(keyword)) ||
              (t.type?.toLowerCase().includes(keyword)) ||
              (t.reference?.toLowerCase().includes(keyword)) ||
              (String(t.amount || '').includes(keyword))
            )
            .forEach(t => {
              searchResults.push({
                type: 'transaction',
                id: t.id,
                title: `${t.type} - ${t.description || 'Transaction'}`,
                subtitle: `Amount: ${t.amount} RWF`,
                icon: TrendingUp,
                path: '/admin/transactions',
                data: t
              })
            })
        }

        // Filter loans
        if (loans.data?.success) {
          loans.data.data
            .filter(l =>
              (l.status?.toLowerCase().includes(keyword)) ||
              (String(l.amount || '').includes(keyword)) ||
              (l.purpose?.toLowerCase().includes(keyword)) ||
              (l.memberName?.toLowerCase().includes(keyword))
            )
            .forEach(l => {
              searchResults.push({
                type: 'loan',
                id: l.id,
                title: `Loan Request - ${l.memberName || 'Member'}`,
                subtitle: `Amount: ${l.amount} RWF | Status: ${l.status}`,
                icon: CreditCard,
                path: '/admin/loan-requests',
                data: l
              })
            })
        }

        // Filter contributions
        if (contributions.data?.success) {
          contributions.data.data
            .filter(c =>
              (c.memberName?.toLowerCase().includes(keyword)) ||
              (c.status?.toLowerCase().includes(keyword)) ||
              (String(c.amount || '').includes(keyword)) ||
              (c.month?.toLowerCase().includes(keyword))
            )
            .forEach(c => {
              searchResults.push({
                type: 'contribution',
                id: c.id,
                title: `Contribution - ${c.memberName || 'Member'}`,
                subtitle: `Amount: ${c.amount} RWF | Status: ${c.status}`,
                icon: DollarSign,
                path: '/admin/contributions',
                data: c
              })
            })
        }

        // Filter fines
        if (fines.data?.success) {
          fines.data.data
            .filter(f =>
              (f.memberName?.toLowerCase().includes(keyword)) ||
              (f.reason?.toLowerCase().includes(keyword)) ||
              (f.status?.toLowerCase().includes(keyword)) ||
              (String(f.amount || '').includes(keyword))
            )
            .forEach(f => {
              searchResults.push({
                type: 'fine',
                id: f.id,
                title: `Fine - ${f.memberName || 'Member'}`,
                subtitle: `${f.reason || 'Fine'} | Amount: ${f.amount} RWF`,
                icon: FileText,
                path: '/admin/fines',
                data: f
              })
            })
        }

        // Filter meetings
        if (meetings.data?.success) {
          meetings.data.data
            .filter(m =>
              (m.title?.toLowerCase().includes(keyword)) ||
              (m.agenda?.toLowerCase().includes(keyword)) ||
              (m.location?.toLowerCase().includes(keyword)) ||
              (m.status?.toLowerCase().includes(keyword))
            )
            .forEach(m => {
              searchResults.push({
                type: 'meeting',
                id: m.id,
                title: m.title || 'Meeting',
                subtitle: `${m.location || ''} | ${m.status || 'Scheduled'}`,
                icon: Calendar,
                path: '/admin/meetings',
                data: m
              })
            })
        }
      } else if (userRole === 'Agent' || userRole === 'System Admin') {
        // Agents and System Admins can search: groups, users, transactions, loans
        const [groups, users, transactions, loans] = await Promise.all([
          api.get('/groups').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/users').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/transactions').catch(() => ({ data: { success: true, data: [] } })),
          api.get('/loans').catch(() => ({ data: { success: true, data: [] } }))
        ])

        // Filter groups
        if (groups.data?.success) {
          groups.data.data
            .filter(g =>
              (g.name?.toLowerCase().includes(keyword)) ||
              (g.code?.toLowerCase().includes(keyword)) ||
              (g.description?.toLowerCase().includes(keyword))
            )
            .forEach(g => {
              searchResults.push({
                type: 'group',
                id: g.id,
                title: g.name,
                subtitle: `Code: ${g.code || 'N/A'} | Members: ${g.totalMembers || 0}`,
                icon: Building2,
                path: userRole === 'Agent' ? '/agent/groups' : '/system-admin/groups',
                data: g
              })
            })
        }

        // Filter users
        if (users.data?.success) {
          users.data.data
            .filter(u =>
              (u.name?.toLowerCase().includes(keyword)) ||
              (u.phone?.includes(keyword)) ||
              (u.email?.toLowerCase().includes(keyword)) ||
              (u.role?.toLowerCase().includes(keyword))
            )
            .forEach(u => {
              searchResults.push({
                type: 'user',
                id: u.id,
                title: u.name,
                subtitle: `${u.role || 'User'} | ${u.phone || u.email || ''}`,
                icon: Users,
                path: userRole === 'Agent' ? '/agent/users' : '/system-admin/users',
                data: u
              })
            })
        }

        // Filter transactions
        if (transactions.data?.success) {
          transactions.data.data
            .filter(t =>
              (t.description?.toLowerCase().includes(keyword)) ||
              (t.type?.toLowerCase().includes(keyword)) ||
              (String(t.amount || '').includes(keyword))
            )
            .forEach(t => {
              searchResults.push({
                type: 'transaction',
                id: t.id,
                title: `${t.type} - ${t.description || 'Transaction'}`,
                subtitle: `Amount: ${t.amount} RWF`,
                icon: TrendingUp,
                path: userRole === 'Agent' ? '/agent/transactions' : '/system-admin/transactions',
                data: t
              })
            })
        }

        // Filter loans
        if (loans.data?.success) {
          loans.data.data
            .filter(l =>
              (l.status?.toLowerCase().includes(keyword)) ||
              (String(l.amount || '').includes(keyword)) ||
              (l.purpose?.toLowerCase().includes(keyword))
            )
            .forEach(l => {
              searchResults.push({
                type: 'loan',
                id: l.id,
                title: `Loan ${l.status}`,
                subtitle: `Amount: ${l.amount} RWF`,
                icon: CreditCard,
                path: userRole === 'Agent' ? '/agent/loans' : '/system-admin/loans',
                data: l
              })
            })
        }
      }

      // Filter by category if selected
      const filteredResults = activeCategory === 'all'
        ? searchResults
        : searchResults.filter(r => r.type === activeCategory)

      setResults(filteredResults.slice(0, 20)) // Limit to 20 results
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result) => {
    navigate(result.path)
    onClose()
    setSearchTerm('')
    setResults([])
  }

  const categories = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'member', label: 'Members', icon: Users },
    { id: 'transaction', label: 'Transactions', icon: TrendingUp },
    { id: 'loan', label: 'Loans', icon: CreditCard },
    { id: 'contribution', label: 'Contributions', icon: DollarSign },
    { id: 'fine', label: 'Fines', icon: FileText },
    { id: 'meeting', label: 'Meetings', icon: Calendar },
    { id: 'group', label: 'Groups', icon: Building2 },
    { id: 'user', label: 'Users', icon: Users }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center p-4 pt-20" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for members, transactions, loans, contributions..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 outline-none transition-all"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Categories */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              const count = activeCategory === 'all' || activeCategory === cat.id
                ? results.filter(r => r.type === cat.id).length
                : 0
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                  {count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-white/20' : 'bg-primary-500 text-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : searchTerm.trim().length < 2 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((result, index) => {
                const Icon = result.icon
                return (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all text-left flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                      <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-white truncate">{result.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{result.subtitle}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal

