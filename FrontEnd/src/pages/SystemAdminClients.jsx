import { useState, useEffect } from 'react'
import { Users, Plus, Eye, Search, XCircle, Phone, Mail, UserCheck, CreditCard, FileText, Lock, Calendar, Printer, Download, Shield } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function SystemAdminClients() {
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientDetails, setShowClientDetails] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [clientTransactions, setClientTransactions] = useState([])
  const [clientLoans, setClientLoans] = useState([])
  const [clientContributions, setClientContributions] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [clientPassword, setClientPassword] = useState('')
  const [loadingClientData, setLoadingClientData] = useState(false)
  const [transactionStartDate, setTransactionStartDate] = useState('')
  const [transactionEndDate, setTransactionEndDate] = useState('')

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    groupId: ''
  })

  const fetchClients = async () => {
    const { data } = await api.get('/system-admin/users?role=Member').catch(()=>({data:{data:[]}}))
    setClients(data?.data || [])
  }

  useEffect(() => {
    let mounted = true
    ;(async ()=>{ setLoading(true); await fetchClients(); if(mounted) setLoading(false) })()
    return () => { mounted = false }
  }, [])

  const filteredClients = (clients || []).filter(client => {
    const matchesStatus = filterStatus === 'all' || (client.status || '').toLowerCase() === filterStatus
    const matchesSearch = [client.name, client.email, client.phone, client.nationalId].filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const handleAddClient = async () => {
    if (!newClient.name || (!newClient.email && !newClient.phone)) {
      alert(tSystemAdmin('provideNameEmailOrPhone', { defaultValue: 'Please provide name and at least email or phone.' }))
      return
    }
    try {
      await api.post('/system-admin/users', {
        name: newClient.name,
        email: newClient.email || undefined,
        phone: newClient.phone || undefined,
        role: 'Member',
        groupId: newClient.groupId || undefined
      })
      await fetchClients()
    setShowAddClient(false)
      setNewClient({ name: '', email: '', phone: '', nationalId: '', groupId: '' })
    } catch (e) {
      alert(e?.response?.data?.message || tSystemAdmin('failedToRegisterClient', { defaultValue: 'Failed to register client' }))
    }
  }

  const handleViewClientDetails = async (client) => {
    setSelectedClient(client)
    setShowClientDetails(true)
    setActiveTab('details')
    setShowPassword(false)
    setClientPassword('')
    setTransactionStartDate('')
    setTransactionEndDate('')
    
    // Fetch client data
    await fetchClientData(client.id)
  }

  const fetchClientData = async (clientId) => {
    setLoadingClientData(true)
    try {
      // Fetch full client details including group
      const clientRes = await api.get(`/system-admin/users/${clientId}`).catch(() => null)
      if (clientRes?.data?.success && clientRes.data.data) {
        setSelectedClient(clientRes.data.data)
      }

      // Fetch transactions
      const transactionsRes = await api.get('/transactions', { 
        params: { userId: clientId } 
      }).catch(() => ({ data: { data: [] } }))
      setClientTransactions(transactionsRes?.data?.data || [])

      // Fetch loans - fetch all loans and filter by memberId
      const loansRes = await api.get('/loans').catch(() => ({ data: { data: [] } }))
      const allLoans = loansRes?.data?.data || []
      const userLoansData = allLoans.filter(loan => {
        const loanMemberId = loan.memberId || loan.member?.id || loan.memberId
        return loanMemberId === clientId || loanMemberId === parseInt(clientId)
      })
      setClientLoans(userLoansData)

      // Fetch contributions (transactions with type 'contribution')
      const contributions = (transactionsRes?.data?.data || []).filter(t => 
        t.type === 'contribution' || t.type === 'refund'
      )
      setClientContributions(contributions)
    } catch (error) {
      console.error('Failed to fetch client data:', error)
    } finally {
      setLoadingClientData(false)
    }
  }

  const handleGetPassword = async (clientId) => {
    try {
      const { data } = await api.post(`/system-admin/users/${clientId}/remind-password`)
      const temp = data?.data?.temp
      if (temp) {
        setClientPassword(temp)
        setShowPassword(true)
      } else {
        alert('Password could not be retrieved. Please contact the client.')
      }
    } catch (e) {
      alert('Failed to retrieve password')
    }
  }

  const handlePrintPassword = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head><title>Client Password - ${selectedClient?.name}</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h2>IKIMINA WALLET - Client Password</h2>
          <p><strong>Client Name:</strong> ${selectedClient?.name}</p>
          <p><strong>Client ID:</strong> ${selectedClient?.id}</p>
          <p><strong>Email/Phone:</strong> ${selectedClient?.email || selectedClient?.phone || 'N/A'}</p>
          <hr>
          <h3>Password:</h3>
          <p style="font-size: 24px; font-weight: bold; color: #2563eb;">${clientPassword}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">Generated: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExportTransactions = () => {
    try {
      let transactionsToExport = clientTransactions

      // Filter by date if provided
      if (transactionStartDate || transactionEndDate) {
        transactionsToExport = clientTransactions.filter(t => {
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
        worksheetData.push([`IKIMINA WALLET - Transaction History for ${selectedClient?.name || 'Client'}`])
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
        const finalFilename = `transactions_${selectedClient?.name?.replace(/\s+/g, '_')}_${dateStr}.xlsx`

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

  const handleUpdateStatus = async (clientId, status) => {
    try { await api.put(`/system-admin/users/${clientId}`, { status }); await fetchClients() } catch { alert(tSystemAdmin('failedToUpdateStatus', { defaultValue: 'Failed to update status' })) }
  }

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tSystemAdmin('clientManagement', { defaultValue: 'Client Management' })}</h1>
        <p className="text-gray-600 dark:text-gray-400">{tSystemAdmin('viewAndManageGroupMembers', { defaultValue: 'View and manage group members.' })}</p>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder={tSystemAdmin('searchClients', { defaultValue: 'Search clients by name, email, phone or ID...' })} className="input-field pl-10" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">{tSystemAdmin('allStatuses', { defaultValue: 'All Statuses' })}</option>
              <option value="active">{t('active', { defaultValue: 'Active' })}</option>
              <option value="pending">{t('pending', { defaultValue: 'Pending' })}</option>
              <option value="suspended">{t('suspended', { defaultValue: 'Suspended' })}</option>
            </select>
          </div>
          <button onClick={()=>setShowAddClient(true)} className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> {tSystemAdmin('registerClient', { defaultValue: 'Register Client' })}
          </button>
        </div>

        {/* List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{tSystemAdmin('allClients', { defaultValue: 'All Clients' })}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{t('loading', { defaultValue: 'Loading...' })}</td></tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <tr 
                      key={client.id}
                      onClick={() => handleViewClientDetails(client)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{client.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                          {client.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <button onClick={()=>handleViewClientDetails(client)} className="text-primary-600 hover:text-primary-900 mr-3" title="View Details"><Eye size={20} /></button>
                        {(client.status||'').toLowerCase() !== 'active' ? (
                          <button onClick={()=>handleUpdateStatus(client.id,'active')} className="text-green-600 hover:text-green-900 mr-3" title={tSystemAdmin('activate', { defaultValue: 'Activate' })}>{tSystemAdmin('activate', { defaultValue: 'Activate' })}</button>
                        ) : (
                          <button onClick={()=>handleUpdateStatus(client.id,'suspended')} className="text-yellow-600 hover:text-yellow-900 mr-3" title={tSystemAdmin('suspend', { defaultValue: 'Suspend' })}>{tSystemAdmin('suspend', { defaultValue: 'Suspend' })}</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{tSystemAdmin('noClientsFound', { defaultValue: 'No clients found.' })}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Register New Client</h2>
                <button onClick={() => setShowAddClient(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter client details.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={newClient.name} onChange={(e)=>setNewClient({ ...newClient, name: e.target.value })} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" value={newClient.email} onChange={(e)=>setNewClient({ ...newClient, email: e.target.value })} className="input-field" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input type="text" value={newClient.phone} onChange={(e)=>setNewClient({ ...newClient, phone: e.target.value })} className="input-field" placeholder="07XXXXXXXX" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddClient(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddClient} className="btn-primary flex-1">Register Client</button>
              </div>
            </div>
          </div>
        )}

        {/* Client Details Modal */}
        {showClientDetails && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl my-8 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedClient.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Client ID: {selectedClient.id}</p>
                </div>
                <button onClick={() => { setShowClientDetails(false); setSelectedClient(null); setActiveTab('details'); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <XCircle size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                <div className="flex space-x-1 overflow-x-auto">
                  {['details', 'transactions', 'loans', 'contributions', 'password'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab === 'details' && 'Details'}
                      {tab === 'transactions' && `Transactions (${clientTransactions.length})`}
                      {tab === 'loans' && `Loans (${clientLoans.length})`}
                      {tab === 'contributions' && `Contributions (${clientContributions.length})`}
                      {tab === 'password' && 'Password'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingClientData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                              <Mail size={18} /> {selectedClient.email || '-'}
                            </p>
                          </div>
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                              <Phone size={18} /> {selectedClient.phone || '-'}
                            </p>
                          </div>
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(selectedClient.status)}`}>
                                {selectedClient.status || 'pending'}
                              </span>
                            </p>
                          </div>
                          <div className="card p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">National ID</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                              {selectedClient.nationalId || '-'}
                            </p>
                          </div>
                          {selectedClient.group && (
                            <div className="card p-4 md:col-span-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Group</p>
                              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                {selectedClient.group.name || '-'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                            <input
                              type="date"
                              value={transactionStartDate}
                              onChange={(e) => setTransactionStartDate(e.target.value)}
                              className="input-field"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                            <input
                              type="date"
                              value={transactionEndDate}
                              onChange={(e) => setTransactionEndDate(e.target.value)}
                              className="input-field"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={handleExportTransactions}
                              className="btn-primary flex items-center gap-2"
                            >
                              <Download size={18} /> Export to Excel
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {clientTransactions.length > 0 ? (
                                clientTransactions
                                  .filter(t => {
                                    if (!transactionStartDate && !transactionEndDate) return true
                                    const transDate = new Date(t.transactionDate || t.createdAt)
                                    if (transactionStartDate && transDate < new Date(transactionStartDate)) return false
                                    if (transactionEndDate) {
                                      const endDate = new Date(transactionEndDate)
                                      endDate.setHours(23, 59, 59, 999)
                                      if (transDate > endDate) return false
                                    }
                                    return true
                                  })
                                  .map(transaction => (
                                    <tr key={transaction.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleString() : 
                                         transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{transaction.type || '-'}</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {transaction.amount ? Number(transaction.amount).toLocaleString() : '0'} RWF
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {transaction.status || '-'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{transaction.description || transaction.notes || '-'}</td>
                                    </tr>
                                  ))
                              ) : (
                                <tr>
                                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No transactions found</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Loans Tab */}
                    {activeTab === 'loans' && (
                      <div className="space-y-4">
                        {clientLoans.length > 0 ? (
                          <div className="space-y-3">
                            {clientLoans.map(loan => (
                              <div key={loan.id} className="card p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Loan #{loan.id}</h3>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    loan.status === 'approved' || loan.status === 'disbursed' ? 'bg-green-100 text-green-700' :
                                    loan.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {loan.status || 'pending'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Amount</p>
                                    <p className="font-semibold text-gray-800 dark:text-white">{Number(loan.amount || 0).toLocaleString()} RWF</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                                    <p className="font-semibold text-gray-800 dark:text-white">{Number(loan.remainingBalance || 0).toLocaleString()} RWF</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Interest Rate</p>
                                    <p className="font-semibold text-gray-800 dark:text-white">{loan.interestRate || 0}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 dark:text-gray-400">Created</p>
                                    <p className="font-semibold text-gray-800 dark:text-white">
                                      {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : '-'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No loans found</div>
                        )}
                      </div>
                    )}

                    {/* Contributions Tab */}
                    {activeTab === 'contributions' && (
                      <div className="space-y-4">
                        {clientContributions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {clientContributions.map(contribution => (
                                  <tr key={contribution.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                      {contribution.transactionDate ? new Date(contribution.transactionDate).toLocaleString() : 
                                       contribution.createdAt ? new Date(contribution.createdAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                      {Number(contribution.amount || 0).toLocaleString()} RWF
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs ${contribution.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {contribution.status || '-'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{contribution.description || contribution.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No contributions found</div>
                        )}
                      </div>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                      <div className="space-y-4">
                        <div className="card p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Lock className="text-primary-600" size={24} />
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Password Management</h3>
                          </div>
                          {!showPassword ? (
                            <div className="space-y-4">
                              <p className="text-gray-600 dark:text-gray-400">
                                Click the button below to generate a temporary password for this client.
                              </p>
                              <button
                                onClick={() => handleGetPassword(selectedClient.id)}
                                className="btn-primary flex items-center gap-2"
                              >
                                <Shield size={18} /> Reveal Password
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Temporary Password:</p>
                                <p className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400">{clientPassword}</p>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={handlePrintPassword}
                                  className="btn-secondary flex items-center gap-2 flex-1"
                                >
                                  <Printer size={18} /> Print Password
                                </button>
                                <button
                                  onClick={() => { setShowPassword(false); setClientPassword(''); }}
                                  className="btn-secondary flex items-center gap-2 flex-1"
                                >
                                  Hide Password
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminClients

