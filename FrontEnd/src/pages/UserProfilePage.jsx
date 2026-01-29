import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Phone, Shield, Building2, Users, FileText, Clock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import ProfileImage from '../components/ProfileImage'
import { useTranslation } from 'react-i18next'
import api, { getFileUrl } from '../utils/api'

function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const { t: tSystemAdmin } = useTranslation('systemAdmin')
  
  const [user, setUser] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [userRes, ticketsRes] = await Promise.all([
        api.get(`/system-admin/users/${id}`).catch(() => ({ data: { success: false } })),
        api.get(`/system-admin/users/${id}/tickets`).catch(() => ({ data: { success: false, data: [] } }))
      ])
      
      if (userRes.data?.success) {
        setUser(userRes.data.data)
      }
      
      if (ticketsRes.data?.success) {
        setTickets(ticketsRes.data.data || [])
      }
    } catch (error) {
      console.error('[UserProfilePage] Error fetching user data:', error)
      alert('Failed to load user profile')
      navigate('/system-admin/support')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'open': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <Layout userRole="System Admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading user profile...</div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout userRole="System Admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">User not found</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout userRole="System Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/system-admin/support')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">User Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Details */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">User Details</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <ProfileImage
                    imageUrl={user.profileImage ? getFileUrl(user.profileImage) : ''}
                    name={user.name || 'User'}
                    size={64}
                    editable={false}
                  />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.role}</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-gray-800 dark:text-white">{user.email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-gray-800 dark:text-white">{user.phone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Role</p>
                      <p className="text-gray-800 dark:text-white">{user.role || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {user.group && (
                    <div className="flex items-start gap-3">
                      <Users size={20} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Group</p>
                        <p className="text-gray-800 dark:text-white">{user.group.name || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.branch && (
                    <div className="flex items-start gap-3">
                      <Building2 size={20} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Branch</p>
                        <p className="text-gray-800 dark:text-white">{user.branch.name || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Member Since</p>
                      <p className="text-gray-800 dark:text-white">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Support Tickets</h2>
              
              {tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tickets submitted by this user
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tickets.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{ticket.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{ticket.message}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                              {ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1).replace('_', ' ') || 'Open'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(ticket.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => navigate(`/system-admin/support/tickets/${ticket.id}`)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default UserProfilePage

