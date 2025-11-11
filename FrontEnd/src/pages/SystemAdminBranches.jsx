import { useState, useEffect } from 'react'
import { Building2, Plus, Edit, Eye, Search, XCircle, Users, MapPin } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'

function SystemAdminBranches() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [showBranchDetails, setShowBranchDetails] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    type: 'Rural',
    manager: '',
    phone: '',
    email: '',
    establishedDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  })

  useEffect(() => {
    let isMounted = true
    async function fetchBranches() {
      try {
        setLoading(true)
        const { data } = await api.get('/branches')
        if (isMounted) setBranches(data?.data || [])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchBranches()
    return () => { isMounted = false }
  }, [])

  const filteredBranches = (branches || []).filter(branch => {
    const matchesStatus = filterStatus === 'all' || (branch.status || 'Active') === filterStatus
    const matchesSearch = [branch.name, branch.location].filter(Boolean).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const refresh = async () => {
    const { data } = await api.get('/branches').catch(()=>({data:{data:[]}}))
    setBranches(data?.data || [])
  }

  const handleAddBranch = async () => {
    if (!newBranch.name) {
      alert('Please provide branch name.')
      return
    }
    try {
      await api.post('/branches', { name: newBranch.name, code: undefined, address: newBranch.location })
      await refresh()
      setShowAddBranch(false)
      setNewBranch({ name: '', location: '', type: 'Rural', manager: '', phone: '', email: '', establishedDate: new Date().toISOString().split('T')[0], status: 'Active' })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create branch')
    }
  }

  const handleViewBranchDetails = (branch) => {
    setSelectedBranch(branch)
    setShowBranchDetails(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700'
      case 'Pending': return 'bg-yellow-100 text-yellow-700'
      case 'Suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Urban': return 'bg-blue-100 text-blue-700'
      case 'Rural': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPerformanceColor = (performance) => {
    const score = parseInt(performance)
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Branch & Location Management</h1>

        {/* Search and Filter */}
        <div className="card flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search branches by name or location..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddBranch(true)}
            className="btn-primary flex items-center gap-2 w-full md:w-auto"
          >
            <Plus size={20} /> Create Branch
          </button>
        </div>

        {/* Branch List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Branches</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Loading…</td></tr>
                ) : filteredBranches.length > 0 ? (
                  filteredBranches.map(branch => (
                    <tr key={branch.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.address || branch.location || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor('Active')}`}>
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewBranchDetails(branch)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No branches found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Branch Modal */}
        {showAddBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create New Branch</h2>
                <button onClick={() => setShowAddBranch(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-gray-600">Enter the new branch details.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Name</label>
                  <input type="text" value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} className="input-field" placeholder="Kigali Central" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input type="text" value={newBranch.location} onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })} className="input-field" placeholder="Kigali City Center" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddBranch(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAddBranch} className="btn-primary flex-1">Create Branch</button>
              </div>
            </div>
          </div>
        )}

        {/* Branch Details Modal */}
        {showBranchDetails && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Branch Details</h2>
                <button onClick={() => setShowBranchDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-semibold">ID:</span> {selectedBranch.id}</p>
                <p className="text-gray-700"><span className="font-semibold">Name:</span> {selectedBranch.name}</p>
                <p className="text-gray-700 flex items-center gap-2"><span className="font-semibold">Location:</span> <MapPin size={16} /> {selectedBranch.address || selectedBranch.location || '-'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowBranchDetails(false)} className="btn-secondary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SystemAdminBranches
