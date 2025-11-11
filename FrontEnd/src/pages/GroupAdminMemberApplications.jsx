import { useEffect, useState } from 'react'
import { Users, CheckCircle, XCircle, Eye, Search, Filter, Calendar, Phone, Mail, MapPin, Briefcase, User } from 'lucide-react'
import Layout from '../components/Layout'
import api from '../utils/api'
import useApiState from '../hooks/useApiState'

function GroupAdminMemberApplications() {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [showApplicantDetails, setShowApplicantDetails] = useState(false)

  const [applicants, setApplicants] = useState([])
  const { data: summary, setData: setSummary, loading, wrap } = useApiState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  useEffect(() => {
    wrap(async () => {
      const me = await api.get('/auth/me')
      const gid = me.data?.data?.groupId
      const res = await api.get('/member-applications', { params: { status: 'all', groupId: gid } })
      const list = (res.data?.data || []).map(a => ({
        id: a.id,
        firstName: (a.user?.name || '').split(' ')[0] || '-',
        lastName: (a.user?.name || '').split(' ').slice(1).join(' ') || '-',
        phone: a.user?.phone || '',
        email: a.user?.email || '',
        nationalId: a.user?.nationalId || '',
        dateOfBirth: a.user?.dateOfBirth || '',
        address: a.address || '',
        occupation: a.occupation || '',
        monthlyIncome: 0,
        emergencyContact: '',
        emergencyPhone: '',
        guarantorName: '',
        guarantorPhone: '',
        guarantorAddress: '',
        applicationDate: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
        status: a.status,
        motivation: a.reason || '',
        bankAccount: '',
        bankName: '',
        referralSource: ''
      }))
      setApplicants(list)
      setSummary({
        total: list.length,
        pending: list.filter(x=>x.status==='pending').length,
        approved: list.filter(x=>x.status==='approved').length,
        rejected: list.filter(x=>x.status==='rejected').length
      })
    })
  }, [])

  const filteredApplicants = applicants.filter(applicant => {
    const matchesStatus = filterStatus === 'all' || applicant.status === filterStatus
    const matchesSearch = 
      applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.phone.includes(searchTerm) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="text-green-600" size={20} />
      case 'pending': return <Calendar className="text-yellow-600" size={20} />
      case 'rejected': return <XCircle className="text-red-600" size={20} />
      default: return <Calendar className="text-gray-600" size={20} />
    }
  }

  const handleApproveApplicant = async (applicantId) => {
    try {
      await api.put(`/member-applications/${applicantId}/approve`)
      setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status: 'approved' } : a))
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to approve application')
    }
  }

  const handleRejectApplicant = async (applicantId) => {
    try {
      await api.put(`/member-applications/${applicantId}/reject`, { reason: 'Not eligible' })
      setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status: 'rejected' } : a))
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reject application')
    }
  }

  const handleViewApplicantDetails = (applicant) => {
    setSelectedApplicant(applicant)
    setShowApplicantDetails(true)
  }

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Member Applications</h1>
            <p className="text-gray-600 mt-1">Review and approve new member applications</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Applications</p>
                <p className="text-2xl font-bold text-gray-800">
                  {applicants.length}
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applicants.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Calendar className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {applicants.filter(a => a.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {applicants.filter(a => a.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Applicants
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Applications ({loading ? 0 : filteredApplicants.length})
            </h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Fetching data…</div>
            ) : filteredApplicants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No records found</div>
            ) : filteredApplicants.map((applicant) => (
              <div
                key={applicant.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {applicant.firstName[0]}{applicant.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{applicant.firstName} {applicant.lastName}</h3>
                      <p className="text-sm text-gray-600">{applicant.phone} • {applicant.email}</p>
                      <p className="text-sm text-gray-500">Applied: {applicant.applicationDate} • Age: {calculateAge(applicant.dateOfBirth)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(applicant.status)}`}>
                      {applicant.status}
                    </span>
                    {getStatusIcon(applicant.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Occupation</p>
                    <p className="font-semibold">{applicant.occupation}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Income</p>
                    <p className="font-semibold">{applicant.monthlyIncome.toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Guarantor</p>
                    <p className="font-semibold">{applicant.guarantorName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Referral</p>
                    <p className="font-semibold">{applicant.referralSource}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Motivation:</p>
                  <p className="text-sm text-gray-800 italic">"{applicant.motivation}"</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewApplicantDetails(applicant)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {applicant.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveApplicant(applicant.id)}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectApplicant(applicant.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applicant Details Modal */}
        {showApplicantDetails && selectedApplicant && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
                <button
                  onClick={() => setShowApplicantDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {selectedApplicant.firstName[0]}{selectedApplicant.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedApplicant.firstName} {selectedApplicant.lastName}</h3>
                    <p className="text-gray-600">{selectedApplicant.phone} • {selectedApplicant.email}</p>
                    <p className="text-sm text-gray-500">Application ID: {selectedApplicant.id} • Applied: {selectedApplicant.applicationDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Details */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User size={20} /> Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">National ID:</span>
                        <span className="font-semibold">{selectedApplicant.nationalId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-semibold">{selectedApplicant.dateOfBirth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-semibold">{calculateAge(selectedApplicant.dateOfBirth)} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-semibold text-right">{selectedApplicant.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Briefcase size={20} /> Financial Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occupation:</span>
                        <span className="font-semibold">{selectedApplicant.occupation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Income:</span>
                        <span className="font-semibold">{selectedApplicant.monthlyIncome.toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank Account:</span>
                        <span className="font-semibold">{selectedApplicant.bankAccount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank Name:</span>
                        <span className="font-semibold">{selectedApplicant.bankName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Phone size={20} /> Emergency Contact
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{selectedApplicant.emergencyContact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{selectedApplicant.emergencyPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guarantor Information */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User size={20} /> Guarantor Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{selectedApplicant.guarantorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold">{selectedApplicant.guarantorPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-semibold text-right">{selectedApplicant.guarantorAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivation */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">Motivation for Joining</h3>
                  <p className="text-gray-700 italic">"{selectedApplicant.motivation}"</p>
                </div>

                {/* Referral Information */}
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-3">Referral Information</h3>
                  <p className="text-gray-700">How they heard about the group: <span className="font-semibold">{selectedApplicant.referralSource}</span></p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowApplicantDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  {selectedApplicant.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApproveApplicant(selectedApplicant.id)
                          setShowApplicantDetails(false)
                        }}
                        className="btn-primary flex-1"
                      >
                        Approve Application
                      </button>
                      <button
                        onClick={() => {
                          handleRejectApplicant(selectedApplicant.id)
                          setShowApplicantDetails(false)
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex-1 transition-colors"
                      >
                        Reject Application
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminMemberApplications


