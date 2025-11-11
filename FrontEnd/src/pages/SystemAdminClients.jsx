import { useState, useEffect } from 'react'
import { Users, Plus, Eye, Search, XCircle, Phone, Mail, UserCheck } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminClients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientDetails, setShowClientDetails] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)

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
      alert('Please provide name and at least email or phone.')
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
      alert(e?.response?.data?.message || 'Failed to register client')
    }
  }

  const handleViewClientDetails = (client) => {
    setSelectedClient(client)
    setShowClientDetails(true)
  }

  const handleUpdateStatus = async (clientId, status) => {
    try { await api.put(`/system-admin/users/${clientId}`, { status }); await fetchClients() } catch { alert('Failed to update status') }
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
        <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
        <p className="text-gray-600">View and manage group members.</p>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search clients by name, email, phone or ID..." className="input-field pl-10" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button onClick={()=>setShowAddClient(true)} className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> Register Client
          </button>
        </div>

        {/* List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Clients</h2>
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
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading…</td></tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                          {client.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={()=>handleViewClientDetails(client)} className="text-primary-600 hover:text-primary-900 mr-3" title="View Details"><Eye size={20} /></button>
                        {(client.status||'').toLowerCase() !== 'active' ? (
                          <button onClick={()=>handleUpdateStatus(client.id,'active')} className="text-green-600 hover:text-green-900 mr-3" title="Activate">Activate</button>
                        ) : (
                          <button onClick={()=>handleUpdateStatus(client.id,'suspended')} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Suspend">Suspend</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No clients found.</td></tr>
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

        {/* Details */}
        {showClientDetails && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Client Details</h2>
                <button onClick={() => setShowClientDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedClient.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedClient.name}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Email:</span> <Mail size={16} /> {selectedClient.email || '-'}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Phone:</span> <Phone size={16} /> {selectedClient.phone || '-'}</p>
                <p className="text-gray-700"><span className="font-semibold">Status:</span> {selectedClient.status || 'pending'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowClientDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminClients

