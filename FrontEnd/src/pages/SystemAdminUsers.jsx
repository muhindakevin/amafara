import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Eye, Search, XCircle, Download, Phone, Mail, Shield, CreditCard, FileText, Lock, Calendar, Printer } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'


function SystemAdminUsers() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [userTransactions, setUserTransactions] = useState([])
  const [userLoans, setUserLoans] = useState([])
  const [userContributions, setUserContributions] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [userPassword, setUserPassword] = useState('')
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [transactionStartDate, setTransactionStartDate] = useState('')
  const [transactionEndDate, setTransactionEndDate] = useState('')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])

  const ALLOWED_ROLES = ['System Admin', 'Agent', 'Group Admin', 'Secretary', 'Cashier', 'Member']

  useEffect(() => {
    let isMounted = true
    async function fetchAll() {
      try {
        setLoading(true)
        const [usersRes, groupsRes] = await Promise.all([
          api.get('/system-admin/users').catch(() => ({ data: { data: [] } })),
          api.get('/public/groups').catch(() => ({ data: { data: [] } }))
        ])
        if (isMounted) {
          setUsers(usersRes?.data?.data || [])
          setGroups(groupsRes?.data?.data || [])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchAll()
    return () => { isMounted = false }
  }, [])

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    role: 'Member',
    groupId: '',
    password: ''
  })
  const [newGroupName, setNewGroupName] = useState('')

  const filteredUsers = (users || []).filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || (user.status || '').toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = [user.name, user.email, user.phone, user?.group?.name]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesRole && matchesStatus && matchesSearch
  })

  const refreshUsers = async () => {
    const res = await api.get('/system-admin/users').catch(() => ({ data: { data: [] } }))
    setUsers(res?.data?.data || [])
  }

  const handleAddUser = async () => {
    if (!newUser.name || (!newUser.email && !newUser.phone) || !newUser.role || !newUser.nationalId) {
      alert(tForms('provideNameNationalIdEmailPhoneRole', { defaultValue: 'Please provide name, national ID, and at least email or phone, and role.' }))
      return
    }
    if (newUser.role === 'Group Admin' && !newUser.groupId && !newGroupName.trim()) {
      alert('For Group Admin, select an existing group or enter a new group name.')
      return
    }
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email || undefined,
        phone: newUser.phone || undefined,
        nationalId: newUser.nationalId,
        role: newUser.role,
        groupId: newGroupName.trim() ? undefined : (newUser.groupId || undefined),
        groupName: newUser.role === 'Group Admin' && newGroupName.trim() ? newGroupName.trim() : undefined,
        password: newUser.password || undefined
      }
      await api.post('/system-admin/users', payload)
      await refreshUsers()
      setShowAddUser(false)
      setNewUser({ name: '', email: '', phone: '', nationalId: '', role: 'Member', groupId: '', password: '' })
      setNewGroupName('')
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create user')
    }
  }

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user)
    setShowUserDetails(true)
    setActiveTab('details')
    setShowPassword(false)
    setUserPassword('')
    setTransactionStartDate('')
    setTransactionEndDate('')

    // Fetch user data
    await fetchUserData(user.id)
  }

  const fetchUserData = async (userId) => {
    setLoadingUserData(true)
    try {
      // Fetch transactions
      const transactionsRes = await api.get('/transactions', {
        params: { userId }
      }).catch(() => ({ data: { data: [] } }))
      setUserTransactions(transactionsRes?.data?.data || [])

      // Fetch loans - fetch all loans and filter by memberId
      const loansRes = await api.get('/loans').catch(() => ({ data: { data: [] } }))
      const allLoans = loansRes?.data?.data || []
      const userLoansData = allLoans.filter(loan => {
        const loanMemberId = loan.memberId || loan.member?.id || loan.memberId
        return loanMemberId === userId || loanMemberId === parseInt(userId)
      })
      setUserLoans(userLoansData)

      // Fetch contributions (transactions with type 'contribution')
      const contributions = (transactionsRes?.data?.data || []).filter(t =>
        t.type === 'contribution' || t.type === 'refund'
      )
      setUserContributions(contributions)

      // Fetch user password (if system admin has access)
      try {
        const userRes = await api.get(`/system-admin/users/${userId}`).catch(() => null)
        // Note: Password is hashed, so we'll need to get it from remind-password endpoint
      } catch (e) {
        console.log('Could not fetch password')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoadingUserData(false)
    }
  }

  const handleGetPassword = async (userId) => {
    if (!window.confirm('This will reset the user\'s password to a new temporary one and display it. Proceed?')) return
    try {
      const { data } = await api.post(`/system-admin/users/${userId}/reset-and-show-password`)
      if (data?.success) {
        setUserPassword(data.plainPassword)
        setShowPassword(true)
        alert('New temporary password generated. It is now visible in the Password tab.')
      } else {
        alert('Failed to generate new password')
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to retrieve password')
    }
  }

  const handleUpdatePermissions = async (userId, permissions) => {
    try {
      const { data } = await api.put(`/system-admin/users/${userId}/permissions`, { permissions })
      if (data?.success) {
        setSelectedUser({ ...selectedUser, permissions: data.data })
        // Update the user in the main list too
        setUsers(users.map(u => u.id === userId ? { ...u, permissions: data.data } : u))
        alert('Permissions updated successfully')
      }
    } catch (e) {
      alert('Failed to update permissions')
    }
  }

  const handlePrintPassword = () => {
    if (!selectedUser || !userPassword) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>User Password - ${selectedUser.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            .info { margin: 10px 0; }
            .password { font-size: 24px; font-weight: bold; color: #059669; margin: 20px 0; padding: 10px; background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>IKIMINA WALLET - User Password</h1>
          <div class="info"><strong>User ID:</strong> ${selectedUser.id}</div>
          <div class="info"><strong>Name:</strong> ${selectedUser.name}</div>
          <div class="info"><strong>Email:</strong> ${selectedUser.email || 'N/A'}</div>
          <div class="info"><strong>Phone:</strong> ${selectedUser.phone || 'N/A'}</div>
          <div class="password">Password: ${userPassword}</div>
          <div class="info"><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExportTransactions = () => {
    try {
      let transactionsToExport = userTransactions

      // Filter by date if provided
      if (transactionStartDate || transactionEndDate) {
        transactionsToExport = userTransactions.filter(t => {
          const transDate = new Date(t.transactionDate || t.createdAt)
          if (transactionStartDate && transDate < new Date(transactionStartDate)) return false
          if (transactionEndDate) {
            const endDate = new Date(transactionEndDate)
            endDate.setHours(23, 59, 59, 999)
            if (transDate > endDate) return false
          }
          return true
        })
      }

      if (transactionsToExport.length === 0) {
        alert('No transactions to export for the selected date range.')
        return
      }

      // Import XLSX for direct Excel export
      import('xlsx').then(XLSX => {
        const workbook = XLSX.utils.book_new()
        const worksheetData = []

        // Add title
        worksheetData.push([`IKIMINA WALLET - Transaction History for ${selectedUser?.name || 'User'}`])
        worksheetData.push([])

        // Add filter information
        if (transactionStartDate || transactionEndDate) {
          worksheetData.push(['Date Range:',
            `${transactionStartDate || 'Start'} to ${transactionEndDate || 'End'}`
          ])
        }
        worksheetData.push(['Total Transactions:', transactionsToExport.length])
        worksheetData.push(['Generated:', new Date().toLocaleString()])
        worksheetData.push([])

        // Add headers
        const headers = ['Date', 'Type', 'Amount (RWF)', 'Status', 'Payment Method', 'Reference ID', 'Description']
        worksheetData.push(headers)

        // Add data rows
        transactionsToExport.forEach(transaction => {
          worksheetData.push([
            transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() :
              transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '-',
            transaction.type || '-',
            transaction.amount ? Number(transaction.amount).toLocaleString() : '0',
            transaction.status || '-',
            transaction.paymentMethod || '-',
            transaction.referenceId || '-',
            transaction.description || transaction.notes || '-'
          ])
        })

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

        // Set column widths
        const colWidths = headers.map((_, index) => {
          const maxLength = Math.max(
            ...worksheetData.map(row => {
              const cell = row[index]
              return cell ? String(cell).length : 0
            })
          )
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
        })
        worksheet['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

        // Generate filename
        const dateStr = new Date().toISOString().split('T')[0]
        const finalFilename = `transactions_${selectedUser?.name?.replace(/\s+/g, '_')}_${dateStr}.xlsx`

        // Save file
        XLSX.writeFile(workbook, finalFilename)
        console.log(`[Excel Export] Transaction history saved: ${finalFilename}`)

        alert(`Successfully exported ${transactionsToExport.length} transaction(s) to Excel!`)
      }).catch(error => {
        console.error('Failed to load xlsx library:', error)
        alert('Failed to export transactions. Please try again.')
      })
    } catch (error) {
      console.error('Failed to export transactions:', error)
      alert('Failed to export transactions. Please try again.')
    }
  }

  const handleUpdateStatus = async (userId, status) => {
    try {
      await api.put(`/system-admin/users/${userId}`, { status })
      await refreshUsers()
    } catch (e) {
      alert('Failed to update status')
    }
  }

  const handleResetPassword = async (userId) => {
    try {
      const { data } = await api.post(`/system-admin/users/${userId}/remind-password`)
      alert(data.message || 'Password reset instructions sent to user')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send password reminder')
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Agent': return 'bg-blue-100 text-blue-700'
      case 'Member': return 'bg-green-100 text-green-700'
      case 'Group Admin': return 'bg-purple-100 text-purple-700'
      case 'Secretary': return 'bg-yellow-100 text-yellow-700'
      case 'Cashier': return 'bg-orange-100 text-orange-700'
      case 'System Admin': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleExportUsers = () => {
    try {
      if (filteredUsers.length === 0) {
        alert(t('noUsersToExport', { defaultValue: 'No users to export. Please adjust your filters.' }))
        return
      }

      // Import XLSX for direct Excel export
      import('xlsx').then(XLSX => {
        const workbook = XLSX.utils.book_new()
        const worksheetData = []

        // Add title
        worksheetData.push(['IKIMINA WALLET - User Management Report'])
        worksheetData.push([])

        // Add filter information
        const filterInfo = []
        if (searchTerm) {
          filterInfo.push(`Search: "${searchTerm}"`)
        }
        if (filterRole !== 'all') {
          filterInfo.push(`Role: ${filterRole}`)
        }
        if (filterStatus !== 'all') {
          filterInfo.push(`Status: ${filterStatus}`)
        }

        if (filterInfo.length > 0) {
          worksheetData.push(['Filters Applied:', filterInfo.join(', ')])
        } else {
          worksheetData.push(['Filters Applied:', 'All Users'])
        }
        worksheetData.push(['Total Users:', filteredUsers.length])
        worksheetData.push(['Generated:', new Date().toLocaleString()])
        worksheetData.push([])

        // Add headers
        const headers = ['ID', 'Name', 'Email', 'Phone', 'National ID', 'Role', 'Group', 'Status', 'Last Login', 'Created At']
        worksheetData.push(headers)

        // Add data rows
        filteredUsers.forEach(user => {
          worksheetData.push([
            user.id,
            user.name || '',
            user.email || '',
            user.phone || '',
            user.nationalId || '',
            user.role || '',
            user?.group?.name || '-',
            user.status || 'pending',
            user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-',
            user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'
          ])
        })

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

        // Set column widths
        const colWidths = headers.map((_, index) => {
          const maxLength = Math.max(
            ...worksheetData.map(row => {
              const cell = row[index]
              return cell ? String(cell).length : 0
            })
          )
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
        })
        worksheet['!cols'] = colWidths

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

        // Generate filename
        const dateStr = new Date().toISOString().split('T')[0]
        const finalFilename = `user-management-report_${dateStr}.xlsx`

        // Save file
        XLSX.writeFile(workbook, finalFilename)
        console.log(`[Excel Export] User report saved: ${finalFilename}`)

        alert(t('usersExportedSuccessfully', { defaultValue: `Successfully exported ${filteredUsers.length} user(s) to Excel!` }))
      }).catch(error => {
        console.error('Failed to load xlsx library:', error)
        alert(t('failedToExportUsers', { defaultValue: 'Failed to export users. Please try again.' }))
      })
    } catch (error) {
      console.error('Failed to export users:', error)
      alert(t('failedToExportUsers', { defaultValue: 'Failed to export users. Please try again.' }))
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('userManagement', { defaultValue: 'User Management' })}</h1>

        {/* Search and Filter */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('searchUsersByNameEmailPhone', { defaultValue: 'Search users by name, email, phone, or group...' })}
              className="input-field pl-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">{t('allRoles', { defaultValue: 'All Roles' })}</option>
              {ALLOWED_ROLES.map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="w-full md:w-auto">
            <select
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('allStatuses', { defaultValue: 'All Statuses' })}</option>
              <option value="active">{t('active', { defaultValue: 'Active' })}</option>
              <option value="pending">{tCommon('pending')}</option>
              <option value="suspended">{t('suspended', { defaultValue: 'Suspended' })}</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="btn-primary flex items-center gap-2 w-full md:w-auto"
          >
            <Plus size={20} /> {t('registerUser', { defaultValue: 'Register User' })}
          </button>
          <button
            onClick={handleExportUsers}
            className="btn-secondary flex items-center gap-2 w-full md:w-auto"
          >
            <Download size={20} /> {t('export', { defaultValue: 'Export' })}
          </button>
        </div>

        {/* User List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('allUsers', { defaultValue: 'All Users' })}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Loading…</td></tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleViewUserDetails(user)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user?.group?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.permissions && Object.values(user.permissions).some(v => v === true) ? (
                          <div className="flex -space-x-1 overflow-hidden" title="Custom permissions active">
                            <Shield size={16} className="text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium ml-1">Custom</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewUserDetails(user)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                        {user.status !== 'active' ? (
                          <button onClick={() => handleUpdateStatus(user.id, 'active')} className="text-green-600 hover:text-green-900 mr-3" title="Activate">
                            Activate
                          </button>
                        ) : (
                          <button onClick={() => handleUpdateStatus(user.id, 'suspended')} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Suspend">
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Reset Password"
                        >
                          <Shield size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Register New User</h2>
                <button onClick={() => setShowAddUser(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter the new user's details and assign their role.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="input-field" placeholder="john.doe@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input type="text" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="input-field" placeholder="07XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">National ID</label>
                  <input type="text" value={newUser.nationalId} onChange={(e) => setNewUser({ ...newUser, nationalId: e.target.value })} className="input-field" placeholder="National ID" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="input-field">
                    {ALLOWED_ROLES.map(r => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
                {(newUser.role === 'Group Admin' || newUser.role === 'Secretary' || newUser.role === 'Cashier' || newUser.role === 'Member') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Group</label>
                    <select value={newUser.groupId} onChange={(e) => setNewUser({ ...newUser, groupId: e.target.value })} className="input-field">
                      <option value="">Select Group</option>
                      {groups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                    {newUser.role === 'Group Admin' && (
                      <div className="mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Or create new group (name)</label>
                        <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="input-field" placeholder="New group name" />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Password</label>
                  <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="input-field" placeholder="Set user password" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddUser(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddUser} className="btn-primary flex-1">Register User</button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced User Details Modal with Tabs */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedUser.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User ID: {selectedUser.id}</p>
                </div>
                <button onClick={() => setShowUserDetails(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <XCircle size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                {[
                  { id: 'details', label: 'Details', icon: Users },
                  { id: 'transactions', label: 'Transactions', icon: CreditCard },
                  { id: 'loans', label: 'Loans', icon: FileText },
                  { id: 'contributions', label: 'Contributions', icon: Download },
                  { id: 'permissions', label: 'Permissions', icon: Shield },
                  { id: 'password', label: 'Password', icon: Lock }
                ].map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {loadingUserData ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading user data...</p>
                  </div>
                ) : (
                  <>
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Full Name</label>
                            <p className="text-gray-800 dark:text-white mt-1">{selectedUser.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email</label>
                            <p className="text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                              <Mail size={16} /> {selectedUser.email || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</label>
                            <p className="text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                              <Phone size={16} /> {selectedUser.phone || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">National ID</label>
                            <p className="text-gray-800 dark:text-white mt-1">{selectedUser.nationalId || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Role</label>
                            <p className="mt-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                                {selectedUser.role}
                              </span>
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                            <p className="mt-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                                {selectedUser.status || 'pending'}
                              </span>
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Group</label>
                            <p className="text-gray-800 dark:text-white mt-1">{selectedUser?.group?.name || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Last Login</label>
                            <p className="text-gray-800 dark:text-white mt-1">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Created At</label>
                            <p className="text-gray-800 dark:text-white mt-1">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Transaction History</h3>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={transactionStartDate}
                              onChange={(e) => setTransactionStartDate(e.target.value)}
                              className="input-field text-sm"
                              placeholder="Start Date"
                            />
                            <input
                              type="date"
                              value={transactionEndDate}
                              onChange={(e) => setTransactionEndDate(e.target.value)}
                              className="input-field text-sm"
                              placeholder="End Date"
                            />
                            <button
                              onClick={handleExportTransactions}
                              className="btn-secondary flex items-center gap-2"
                            >
                              <Download size={16} /> Export
                            </button>
                          </div>
                        </div>
                        {userTransactions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {userTransactions.map((transaction, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                                      {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() :
                                        transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">{transaction.type || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                                      {transaction.amount ? Number(transaction.amount).toLocaleString() + ' RWF' : '0 RWF'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`px-2 py-1 text-xs rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                        {transaction.status || 'pending'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">{transaction.paymentMethod || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions found.</p>
                        )}
                      </div>
                    )}

                    {/* Loans Tab */}
                    {activeTab === 'loans' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Loan History</h3>
                        {userLoans.length > 0 ? (
                          <div className="space-y-4">
                            {userLoans.map((loan, idx) => (
                              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Amount</label>
                                    <p className="text-gray-800 dark:text-white">{Number(loan.amount || 0).toLocaleString()} RWF</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</label>
                                    <p className="text-gray-800 dark:text-white">{loan.status || 'pending'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Requested Date</label>
                                    <p className="text-gray-800 dark:text-white">{loan.createdAt ? new Date(loan.createdAt).toLocaleString() : '-'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Purpose</label>
                                    <p className="text-gray-800 dark:text-white">{loan.purpose || '-'}</p>
                                  </div>
                                  {loan.paidAmount && (
                                    <div>
                                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Paid Amount</label>
                                      <p className="text-gray-800 dark:text-white">{Number(loan.paidAmount).toLocaleString()} RWF</p>
                                    </div>
                                  )}
                                  {loan.remainingAmount && (
                                    <div>
                                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Remaining</label>
                                      <p className="text-gray-800 dark:text-white">{Number(loan.remainingAmount).toLocaleString()} RWF</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No loans found.</p>
                        )}
                      </div>
                    )}

                    {/* Contributions Tab */}
                    {activeTab === 'contributions' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Contribution History</h3>
                        {userContributions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {userContributions.map((contribution, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                                      {contribution.transactionDate ? new Date(contribution.transactionDate).toLocaleString() :
                                        contribution.createdAt ? new Date(contribution.createdAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">{contribution.type || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                                      {contribution.amount ? Number(contribution.amount).toLocaleString() + ' RWF' : '0 RWF'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`px-2 py-1 text-xs rounded-full ${contribution.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {contribution.status || 'pending'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No contributions found.</p>
                        )}
                      </div>
                    )}

                    {/* Permissions Tab */}


                    {/* Password Tab */}
                    {activeTab === 'password' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Password Management</h3>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Note:</strong> This feature allows you to retrieve and print the user's password for account recovery purposes.
                          </p>
                        </div>
                        {!showPassword ? (
                          <div className="text-center py-8">
                            <Lock size={48} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 mb-4">Password is hidden for security</p>
                            <button
                              onClick={() => handleGetPassword(selectedUser.id)}
                              className="btn-primary"
                            >
                              Reveal Password
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Temporary Password</label>
                              <div className="flex items-center gap-4">
                                <code className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 flex-1">
                                  {userPassword}
                                </code>
                                <button
                                  onClick={handlePrintPassword}
                                  className="btn-secondary flex items-center gap-2"
                                >
                                  <Printer size={18} /> Print
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                This is a temporary password. The user should change it after logging in.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setShowPassword(false)
                                setUserPassword('')
                              }}
                              className="btn-secondary"
                            >
                              Hide Password
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setShowUserDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminUsers
