import { useState, useEffect } from 'react'
import { UserCheck, Plus, Eye, Search, XCircle, Phone, Mail } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminAgents() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [showAgentDetails, setShowAgentDetails] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)

  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  })

  const fetchAgents = async () => {
    const { data } = await api.get('/system-admin/users?role=Agent').catch(()=>({data:{data:[]}}))
    setAgents(data?.data || [])
  }

  useEffect(() => {
    let mounted = true
    ;(async ()=>{ setLoading(true); await fetchAgents(); if(mounted) setLoading(false) })()
    return () => { mounted = false }
  }, [])

  const filteredAgents = (agents || []).filter(agent => {
    const matchesStatus = filterStatus === 'all' || (agent.status || '').toLowerCase() === filterStatus
    const matchesSearch = [agent.name, agent.email, agent.phone].filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const handleAddAgent = async () => {
    if (!newAgent.name || (!newAgent.email && !newAgent.phone)) {
      alert('Please provide name and at least email or phone.')
      return
    }
    try {
      await api.post('/system-admin/users', { name: newAgent.name, email: newAgent.email || undefined, phone: newAgent.phone || undefined, role: 'Agent', password: undefined })
      await fetchAgents()
    setShowAddAgent(false)
      setNewAgent({ name: '', email: '', phone: '', status: 'active' })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create agent')
    }
  }

  const handleViewAgentDetails = (agent) => {
    setSelectedAgent(agent)
    setShowAgentDetails(true)
  }

  const handleUpdateStatus = async (agentId, status) => {
    try { await api.put(`/system-admin/users/${agentId}`, { status }); await fetchAgents() } catch { alert('Failed to update status') }
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>

        {/* Controls */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search agents by name, email, or phone..." className="input-field pl-10" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
          <div className="w-full md:w-auto">
            <select className="input-field" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button onClick={()=>setShowAddAgent(true)} className="btn-primary flex items-center gap-2 w-full md:w-auto">
            <Plus size={20} /> Register Agent
          </button>
        </div>

        {/* List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Agents</h2>
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
                ) : filteredAgents.length > 0 ? (
                  filteredAgents.map(agent => (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ (agent.status||'').toLowerCase()==='active' ? 'bg-green-100 text-green-700' : (agent.status||'').toLowerCase()==='pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700' }`}>
                          {agent.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={()=>handleViewAgentDetails(agent)} className="text-primary-600 hover:text-primary-900 mr-3" title="View Details"><Eye size={20} /></button>
                        { (agent.status||'').toLowerCase() !== 'active' ? (
                          <button onClick={()=>handleUpdateStatus(agent.id,'active')} className="text-green-600 hover:text-green-900 mr-3" title="Activate">Activate</button>
                        ) : (
                          <button onClick={()=>handleUpdateStatus(agent.id,'suspended')} className="text-yellow-600 hover:text-yellow-900 mr-3" title="Suspend">Suspend</button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No agents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Agent Modal */}
        {showAddAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Register New Agent</h2>
                <button onClick={() => setShowAddAgent(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter agent details.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" value={newAgent.name} onChange={(e)=>setNewAgent({ ...newAgent, name: e.target.value })} className="input-field" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" value={newAgent.email} onChange={(e)=>setNewAgent({ ...newAgent, email: e.target.value })} className="input-field" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input type="text" value={newAgent.phone} onChange={(e)=>setNewAgent({ ...newAgent, phone: e.target.value })} className="input-field" placeholder="07XXXXXXXX" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddAgent(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddAgent} className="btn-primary flex-1">Register Agent</button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Details Modal */}
        {showAgentDetails && selectedAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Agent Details</h2>
                <button onClick={() => setShowAgentDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedAgent.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedAgent.name}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Email:</span> <Mail size={16} /> {selectedAgent.email || '-'}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Phone:</span> <Phone size={16} /> {selectedAgent.phone || '-'}</p>
                <p className="text-gray-700"><span className="font-semibold">Status:</span> {selectedAgent.status || 'pending'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAgentDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminAgents

