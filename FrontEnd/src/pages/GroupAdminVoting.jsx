import { useState, useEffect } from 'react'
import { Vote, Plus, Users, Clock, CheckCircle, XCircle, TrendingUp, Calendar, Eye, Send, X, CalendarPlus } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function GroupAdminVoting() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [showCreateVote, setShowCreateVote] = useState(false)
  const [selectedVote, setSelectedVote] = useState(null)
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalMembers, setTotalMembers] = useState(0)

  useEffect(() => {
    loadVotes()
    // Refresh every 30 seconds to check for new votes
    const interval = setInterval(loadVotes, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadVotes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/voting?status=all')
      
      if (response.data?.success) {
        const allVotes = response.data.data || []
        
        // Enrich votes with vote counts and member info
        const enrichedVotes = await Promise.all(
          allVotes.map(async (vote) => {
            try {
              // Get vote details with responses
              const voteDetailResponse = await api.get(`/voting/${vote.id}`).catch(() => null)
              const voteDetail = voteDetailResponse?.data?.data || vote
              
              // Clean description - remove metadata
              let cleanDescription = voteDetail.description || vote.description || ''
              // Remove metadata markers
              cleanDescription = cleanDescription.replace(/\[VOTE_METADATA_START\].*?\[VOTE_METADATA_END\]/s, '')
              cleanDescription = cleanDescription.replace(/<!-- METADATA:.*?-->/s, '')
              cleanDescription = cleanDescription.trim()
              
              // Calculate votes for/against from options
              let votesFor = 0
              let votesAgainst = 0
              let totalMembers = 0
              
              if (voteDetail.options) {
                voteDetail.options.forEach(opt => {
                  const count = opt.voteCount || (opt.responses ? opt.responses.length : 0)
                  const optionText = (opt.option || '').toLowerCase()
                  if (optionText.includes('for') || optionText.includes('approve') || optionText.includes('yes')) {
                    votesFor = count
                  } else if (optionText.includes('against') || optionText.includes('reject') || optionText.includes('no')) {
                    votesAgainst = count
                  }
                })
              }
              
              // Get total members from group info
              if (voteDetail.group) {
                try {
                  const groupResponse = await api.get(`/groups/${vote.groupId}`).catch(() => null)
                  if (groupResponse?.data?.success) {
                    totalMembers = groupResponse.data.data.members?.length || 0
                  }
                } catch (e) {
                  totalMembers = voteDetail.totalVotes || 0
                }
              }
              
              return {
                ...vote,
                ...voteDetail,
                description: cleanDescription, // Use cleaned description
                votesFor,
                votesAgainst,
                totalVoters: totalMembers || (votesFor + votesAgainst) || 0,
                createdDate: vote.createdAt ? new Date(vote.createdAt).toISOString().split('T')[0] : '',
                deadline: vote.endDate ? new Date(vote.endDate).toISOString().split('T')[0] : '',
                creator: voteDetail.creator?.name || 'System',
                options: voteDetail.options || []
              }
            } catch (e) {
              console.warn(`Error enriching vote ${vote.id}:`, e)
              // Clean description even on error
              let cleanDesc = vote.description || ''
              cleanDesc = cleanDesc.replace(/\[VOTE_METADATA_START\].*?\[VOTE_METADATA_END\]/s, '')
              cleanDesc = cleanDesc.replace(/<!-- METADATA:.*?-->/s, '')
              return {
                ...vote,
                description: cleanDesc.trim(),
                votesFor: 0,
                votesAgainst: 0,
                totalVoters: 0,
                createdDate: vote.createdAt ? new Date(vote.createdAt).toISOString().split('T')[0] : '',
                deadline: vote.endDate ? new Date(vote.endDate).toISOString().split('T')[0] : '',
                options: []
              }
            }
          })
        )
        
        setVotes(enrichedVotes)
        setTotalMembers(enrichedVotes[0]?.totalVoters || 0)
      } else {
        setVotes([])
      }
    } catch (error) {
      console.error('Error loading votes:', error)
      setVotes([])
    } finally {
      setLoading(false)
    }
  }

  const [newVote, setNewVote] = useState({
    title: '',
    description: '',
    type: 'general',
    deadline: ''
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getResultColor = (result) => {
    switch (result) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'contribution_change': return 'bg-green-100 text-green-700'
      case 'saving_amount_change': return 'bg-teal-100 text-teal-700'
      case 'fine_amount_change': return 'bg-yellow-100 text-yellow-700'
      case 'interest_rate_change': return 'bg-pink-100 text-pink-700'
      case 'loan_approval_override': return 'bg-red-100 text-red-700'
      case 'loan_approval': return 'bg-indigo-100 text-indigo-700'
      case 'withdrawal_approval': return 'bg-blue-100 text-blue-700'
      case 'fine_change': return 'bg-orange-100 text-orange-700'
      case 'member_admission': return 'bg-purple-100 text-purple-700'
      case 'policy_change': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  const handleCreateVote = async () => {
    try {
      if (!newVote.title || !newVote.description || !newVote.deadline) {
        alert(tCommon('fillRequiredFields', { defaultValue: 'Please fill in all required fields' }))
        return
      }

      const endDate = new Date(newVote.deadline)
      endDate.setHours(23, 59, 59) // End of day

      const response = await api.post('/voting', {
        title: newVote.title,
        description: newVote.description,
        type: newVote.type || 'other',
        endDate: endDate.toISOString(),
        options: [t('approve', { defaultValue: 'Approve' }), t('reject', { defaultValue: 'Reject' })]
      })

      if (response.data?.success) {
        alert(t('voteCreatedSuccessfully', { defaultValue: 'Vote created successfully! All members will be notified.' }))
        setShowCreateVote(false)
        setNewVote({
          title: '',
          description: '',
          type: 'other',
          deadline: ''
        })
        await loadVotes()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('failedToCreateVote', { defaultValue: 'Failed to create vote' })
      alert(errorMessage)
    }
  }

  const votingStats = {
    totalVotes: votes.length,
    activeVotes: votes.filter(v => v.status === 'open').length,
    completedVotes: votes.filter(v => v.status === 'closed').length,
    averageParticipation: votes.filter(v => v.status === 'closed').length > 0
      ? Math.round(
          votes
            .filter(v => v.status === 'closed')
            .reduce((sum, v) => {
              const total = v.totalVoters || 1
              const voted = (v.votesFor || 0) + (v.votesAgainst || 0)
              return sum + (voted / total) * 100
            }, 0) /
          votes.filter(v => v.status === 'closed').length
        )
      : 0
  }

  // Determine user role from context or props
  const getUserRole = () => {
    // This will be determined by the Layout component based on the route
    if (window.location.pathname.includes('/cashier')) return 'Cashier'
    if (window.location.pathname.includes('/secretary')) return 'Secretary'
    return 'Group Admin'
  }

  return (
    <Layout userRole={getUserRole()}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('groupDecisionGovernance', { defaultValue: 'Group Decision & Governance' })}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('launchPollsVotes', { defaultValue: 'Launch polls and votes for major group decisions' })}</p>
          </div>
          <button
            onClick={() => setShowCreateVote(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> {t('createNewVote', { defaultValue: 'Create New Vote' })}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalVotes', { defaultValue: 'Total Votes' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {votingStats.totalVotes}
                </p>
              </div>
              <Vote className="text-gray-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeVotes')}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {votingStats.activeVotes}
                </p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('completed', { defaultValue: 'Completed' })}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {votingStats.completedVotes}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('avgParticipation', { defaultValue: 'Avg Participation' })}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {votingStats.averageParticipation}%
                </p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Votes List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('allVotes', { defaultValue: 'All Votes' })} ({votes.length})
            </h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="mx-auto mb-4 text-gray-400 animate-spin" size={48} />
                <p className="font-semibold">Loading votes...</p>
              </div>
            ) : votes.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Vote className="mx-auto mb-4 text-gray-400" size={64} />
                <p className="text-xl font-semibold mb-2">No Votes Found</p>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  There are currently no votes in the system. Votes will appear here automatically when:
                </p>
                <ul className="text-sm text-gray-600 mt-4 max-w-md mx-auto text-left list-disc list-inside">
                  <li>Members request loans exceeding their savings or AI credit limits</li>
                  <li>Group Admin, Cashier, or Secretary proposes to raise saving amounts</li>
                  <li>Group Admin, Cashier, or Secretary proposes to raise fine amounts or interest rates</li>
                </ul>
              </div>
            ) : (
              votes.map((vote) => (
                <div
                  key={vote.id}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{vote.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(vote.type)}`}>
                        {vote.type ? vote.type.replace(/_/g, ' ') : 'other'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(vote.status)}`}>
                        {vote.status}
                      </span>
                      {vote.result && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getResultColor(vote.result)}`}>
                          {vote.result}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{vote.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} /> Created: {vote.createdDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} /> Deadline: {vote.deadline}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={16} /> {(vote.votesFor || 0) + (vote.votesAgainst || 0)}/{vote.totalVoters || 0} voted
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voting Results */}
                {vote.status === 'open' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Live Voting Progress</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-700 font-semibold">For</span>
                          <span className="text-gray-600">{(vote.votesFor || 0)} votes ({calculatePercentage(vote.votesFor || 0, vote.totalVoters || 1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${calculatePercentage(vote.votesFor || 0, vote.totalVoters || 1)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-red-700 font-semibold">Against</span>
                          <span className="text-gray-600">{(vote.votesAgainst || 0)} votes ({calculatePercentage(vote.votesAgainst || 0, vote.totalVoters || 1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${calculatePercentage(vote.votesAgainst || 0, vote.totalVoters || 1)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {vote.status === 'closed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                    <p className="text-sm font-semibold text-green-800 mb-2">Final Results</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">For</p>
                        <p className="text-lg font-bold text-green-700">{vote.votesFor || 0}</p>
                        <p className="text-xs text-gray-500">{calculatePercentage(vote.votesFor || 0, vote.totalVoters || 1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Against</p>
                        <p className="text-lg font-bold text-red-700">{vote.votesAgainst || 0}</p>
                        <p className="text-xs text-gray-500">{calculatePercentage(vote.votesAgainst || 0, vote.totalVoters || 1)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm font-semibold text-green-800">
                        Result: <span className="capitalize">
                          {(vote.votesFor || 0) > (vote.votesAgainst || 0) ? 'Approved' : 'Rejected'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedVote(vote)}
                    className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  {vote.status === 'open' && (
                    <>
                      {new Date(vote.endDate) < new Date() ? (
                        // Deadline passed - show approve/reject buttons
                        <div className="flex gap-2">
                          {vote.type === 'contribution_change' ? (
                            <button
                              onClick={async () => {
                                const approveVotes = vote.votesFor || 0
                                const rejectVotes = vote.votesAgainst || 0
                                const totalVotes = approveVotes + rejectVotes
                                const majorityApproved = approveVotes > rejectVotes
                                
                                if (confirm(`Process vote result based on majority?\n\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes\n\nResult: ${majorityApproved ? 'APPROVED' : 'REJECTED'}\n\nThis will ${majorityApproved ? 'apply' : 'reject'} the proposed changes and notify all members.`)) {
                                  try {
                                    // Don't pass approved parameter - let backend auto-determine based on majority
                                    const response = await api.post(`/voting/${vote.id}/approve-result`, {})
                                    alert(response.data?.message || 'Vote processed successfully! Changes have been applied based on majority vote.')
                                    await loadVotes()
                                  } catch (error) {
                                    console.error('Failed to process vote:', error)
                                    alert(error.response?.data?.message || 'Failed to process vote result')
                                  }
                                }
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle size={16} /> Process Vote (Auto)
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  const approveVotes = vote.votesFor || 0
                                  const rejectVotes = vote.votesAgainst || 0
                                  if (confirm(`Approve this vote result?\n\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes\n\nThis will apply the proposed changes and notify all members.`)) {
                                    try {
                                      await api.post(`/voting/${vote.id}/approve-result`, { approved: true })
                                      alert('Vote result approved! Changes have been applied and members have been notified.')
                                      await loadVotes()
                                    } catch (error) {
                                      console.error('Failed to approve vote:', error)
                                      alert(error.response?.data?.message || 'Failed to approve vote result')
                                    }
                                  }
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <CheckCircle size={16} /> Approve Result
                              </button>
                              <button
                                onClick={async () => {
                                  const approveVotes = vote.votesFor || 0
                                  const rejectVotes = vote.votesAgainst || 0
                                  if (confirm(`Reject this vote result?\n\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes\n\nThis will reject the proposed changes and notify all members.`)) {
                                    try {
                                      await api.post(`/voting/${vote.id}/approve-result`, { approved: false })
                                      alert('Vote result rejected! Members have been notified.')
                                      await loadVotes()
                                    } catch (error) {
                                      console.error('Failed to reject vote:', error)
                                      alert(error.response?.data?.message || 'Failed to reject vote result')
                                    }
                                  }
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                              >
                                <XCircle size={16} /> Reject Result
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        // Voting still active - show deadline and extend option
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock size={14} />
                            <span>Voting ends: {new Date(vote.endDate).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              const currentDeadline = new Date(vote.endDate)
                              const defaultNewDeadline = new Date(currentDeadline)
                              defaultNewDeadline.setDate(defaultNewDeadline.getDate() + 7)
                              
                              const newDeadlineStr = prompt(
                                `Extend voting deadline?\n\nCurrent deadline: ${currentDeadline.toLocaleString()}\n\nEnter new deadline (YYYY-MM-DD):\n(Default: ${defaultNewDeadline.toISOString().split('T')[0]})`,
                                defaultNewDeadline.toISOString().split('T')[0]
                              )
                              
                              if (!newDeadlineStr) return
                              
                              try {
                                const newDeadline = new Date(newDeadlineStr)
                                newDeadline.setHours(23, 59, 59)
                                
                                if (newDeadline <= new Date()) {
                                  alert('New deadline must be in the future')
                                  return
                                }
                                
                                if (newDeadline <= currentDeadline) {
                                  alert('New deadline must be after the current deadline')
                                  return
                                }
                                
                                const response = await api.put(`/voting/${vote.id}/extend-deadline`, {
                                  newEndDate: newDeadline.toISOString()
                                })
                                
                                alert(response.data?.message || 'Voting deadline extended!')
                                await loadVotes()
                              } catch (error) {
                                console.error('Failed to extend deadline:', error)
                                alert(error.response?.data?.message || 'Failed to extend deadline')
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                            title="Extend voting deadline"
                          >
                            <CalendarPlus size={14} /> Extend
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Decision Log */}
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={24} />
            Decision Log
          </h2>
          <div className="space-y-2">
            {votes.filter(v => v.status === 'closed').map((vote) => (
              <div key={vote.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{vote.title}</p>
                    <p className="text-xs text-gray-500">Completed: {vote.deadline}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getResultColor((vote.votesFor || 0) > (vote.votesAgainst || 0) ? 'approved' : 'rejected')}`}>
                    {(vote.votesFor || 0) > (vote.votesAgainst || 0) ? 'Approved' : 'Rejected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Vote Details Modal */}
        {selectedVote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Vote Details</h2>
                <button
                  onClick={() => setSelectedVote(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Vote Info */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedVote.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedVote.type)}`}>
                      {selectedVote.type ? selectedVote.type.replace(/_/g, ' ') : 'other'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedVote.status)}`}>
                      {selectedVote.status}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{selectedVote.description}</p>
                </div>

                {/* Voting Statistics */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Voting Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedVote.totalVoters || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Votes Cast</p>
                      <p className="text-2xl font-bold text-gray-800">{(selectedVote.votesFor || 0) + (selectedVote.votesAgainst || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-semibold">Approve Votes</p>
                      <p className="text-2xl font-bold text-green-700">{selectedVote.votesFor || 0}</p>
                      <p className="text-xs text-gray-500">
                        {calculatePercentage(selectedVote.votesFor || 0, selectedVote.totalVoters || 1)}% of members
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-red-700 font-semibold">Reject Votes</p>
                      <p className="text-2xl font-bold text-red-700">{selectedVote.votesAgainst || 0}</p>
                      <p className="text-xs text-gray-500">
                        {calculatePercentage(selectedVote.votesAgainst || 0, selectedVote.totalVoters || 1)}% of members
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-700 font-semibold">Approve</span>
                        <span className="text-gray-600">{selectedVote.votesFor || 0} votes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${calculatePercentage(selectedVote.votesFor || 0, selectedVote.totalVoters || 1)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-700 font-semibold">Reject</span>
                        <span className="text-gray-600">{selectedVote.votesAgainst || 0} votes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full transition-all"
                          style={{ width: `${calculatePercentage(selectedVote.votesAgainst || 0, selectedVote.totalVoters || 1)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vote Timeline */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Created: {selectedVote.createdDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>Deadline: {selectedVote.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>Created by: {selectedVote.creator || 'System'}</span>
                  </div>
                </div>

                {/* Action Buttons - Show when voting deadline has passed OR vote is open and ready to process */}
                {selectedVote.status === 'open' && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    {new Date(selectedVote.endDate) < new Date() ? (
                      // Voting deadline has passed - show approve/reject buttons
                      <div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-yellow-800 font-semibold">
                            ⏰ Voting deadline has passed. You can now process the vote result.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          {selectedVote.type === 'contribution_change' ? (
                            <button
                              onClick={async () => {
                                const approveVotes = selectedVote.votesFor || 0
                                const rejectVotes = selectedVote.votesAgainst || 0
                                const totalVotes = approveVotes + rejectVotes
                                const majorityApproved = approveVotes > rejectVotes
                                
                                if (confirm(`Process vote result based on majority?\n\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes\n\nResult: ${majorityApproved ? 'APPROVED' : 'REJECTED'}\n\nThis will ${majorityApproved ? 'apply' : 'reject'} the proposed changes.`)) {
                                  try {
                                    const response = await api.post(`/voting/${selectedVote.id}/approve-result`, {})
                                    alert(response.data?.message || 'Vote processed successfully!')
                                    setSelectedVote(null)
                                    await loadVotes()
                                  } catch (error) {
                                    console.error('Failed to process vote:', error)
                                    alert(error.response?.data?.message || 'Failed to process vote result')
                                  }
                                }
                              }}
                              className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={18} /> Process Vote (Auto)
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  const approveVotes = selectedVote.votesFor || 0
                                  const rejectVotes = selectedVote.votesAgainst || 0
                                  if (confirm(`Approve this vote result?\n\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes`)) {
                                    try {
                                      await api.post(`/voting/${selectedVote.id}/approve-result`, { approved: true })
                                      alert('Vote result approved!')
                                      setSelectedVote(null)
                                      await loadVotes()
                                    } catch (error) {
                                      console.error('Failed to approve vote:', error)
                                      alert(error.response?.data?.message || 'Failed to approve vote result')
                                    }
                                  }
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                              >
                                <CheckCircle size={18} /> Approve (Yes)
                              </button>
                              <button
                                onClick={async () => {
                                  const approveVotes = selectedVote.votesFor || 0
                                  const rejectVotes = selectedVote.votesAgainst || 0
                                  if (confirm(`Reject this vote result?\n\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes`)) {
                                    try {
                                      await api.post(`/voting/${selectedVote.id}/approve-result`, { approved: false })
                                      alert('Vote result rejected!')
                                      setSelectedVote(null)
                                      await loadVotes()
                                    } catch (error) {
                                      console.error('Failed to reject vote:', error)
                                      alert(error.response?.data?.message || 'Failed to reject vote result')
                                    }
                                  }
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                              >
                                <XCircle size={18} /> Reject (No)
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Voting is still active - show countdown and extend deadline option
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <Clock size={16} className="inline mr-2" />
                            Voting is still active. Deadline: {new Date(selectedVote.endDate).toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Approve/Reject buttons will appear after the voting deadline passes.
                          </p>
                        </div>
                        {/* Extend Deadline Button */}
                        <button
                          onClick={async () => {
                            const currentDeadline = new Date(selectedVote.endDate)
                            const defaultNewDeadline = new Date(currentDeadline)
                            defaultNewDeadline.setDate(defaultNewDeadline.getDate() + 7) // Add 7 days by default
                            
                            const newDeadlineStr = prompt(
                              `Extend voting deadline?\n\nCurrent deadline: ${currentDeadline.toLocaleString()}\n\nEnter new deadline (YYYY-MM-DD format):\n(Default: ${defaultNewDeadline.toISOString().split('T')[0]})`,
                              defaultNewDeadline.toISOString().split('T')[0]
                            )
                            
                            if (!newDeadlineStr) return
                            
                            try {
                              // Parse the date and set time to end of day
                              const newDeadline = new Date(newDeadlineStr)
                              newDeadline.setHours(23, 59, 59)
                              
                              if (newDeadline <= new Date()) {
                                alert('New deadline must be in the future')
                                return
                              }
                              
                              if (newDeadline <= currentDeadline) {
                                alert('New deadline must be after the current deadline')
                                return
                              }
                              
                              const response = await api.put(`/voting/${selectedVote.id}/extend-deadline`, {
                                newEndDate: newDeadline.toISOString()
                              })
                              
                              alert(response.data?.message || 'Voting deadline extended successfully! All members have been notified.')
                              setSelectedVote(null)
                              await loadVotes()
                            } catch (error) {
                              console.error('Failed to extend deadline:', error)
                              alert(error.response?.data?.message || 'Failed to extend voting deadline')
                            }
                          }}
                          className="btn-secondary w-full flex items-center justify-center gap-2 py-2"
                        >
                          <CalendarPlus size={18} /> Extend Voting Deadline
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Send Announcement Button (for closed votes) */}
                {selectedVote.status === 'closed' && (
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={async () => {
                        const approveVotes = selectedVote.votesFor || 0
                        const rejectVotes = selectedVote.votesAgainst || 0
                        const result = approveVotes > rejectVotes ? 'APPROVED' : 'REJECTED'
                        
                        if (confirm(`Send announcement about this vote result to all members?\n\nResult: ${result}\nApprove: ${approveVotes} votes\nReject: ${rejectVotes} votes`)) {
                          try {
                            // Get groupId from vote
                            const me = await api.get('/auth/me')
                            const groupId = me.data?.data?.groupId
                            
                            if (!groupId) {
                              alert('Group ID not found')
                              return
                            }

                            const announcementTitle = `Vote Result: ${selectedVote.title}`
                            let announcementContent = `The voting proposal "${selectedVote.title}" has been ${result.toLowerCase()}.\n\n`
                            announcementContent += `Vote Results:\n`
                            announcementContent += `• Approve: ${approveVotes} votes\n`
                            announcementContent += `• Reject: ${rejectVotes} votes\n\n`
                            
                            if (result === 'APPROVED' && selectedVote.type === 'contribution_change') {
                              announcementContent += `The contribution settings have been updated as proposed. All members must now contribute at least the new minimum amount.`
                            } else if (result === 'REJECTED') {
                              announcementContent += `The proposed changes have been rejected and will not be applied.`
                            }

                            // Create and send announcement
                            const annRes = await api.post('/announcements', {
                              groupId: groupId,
                              title: announcementTitle,
                              content: announcementContent,
                              priority: 'high'
                            })

                            if (annRes.data?.success) {
                              // Send the announcement
                              await api.put(`/announcements/${annRes.data.data.id}/send`)
                              alert('Announcement sent successfully to all group members!')
                              setSelectedVote(null)
                            } else {
                              alert('Failed to create announcement')
                            }
                          } catch (error) {
                            console.error('Failed to send announcement:', error)
                            alert(error.response?.data?.message || 'Failed to send announcement')
                          }
                        }
                      }}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                    >
                      <Send size={18} /> Send Announcement to Members
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Vote Modal */}
        {showCreateVote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Create New Vote</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vote Title
                  </label>
                  <input
                    type="text"
                    value={newVote.title}
                    onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Increase Minimum Contribution"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newVote.description}
                    onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                    className="input-field"
                    rows="4"
                    placeholder="Describe the proposal, reason, and expected impact..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vote Type
                    </label>
                    <select
                      value={newVote.type}
                      onChange={(e) => setNewVote({ ...newVote, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="other">General</option>
                      <option value="policy_change">Policy Change</option>
                      <option value="member_admission">Member Admission</option>
                      <option value="withdrawal_approval">Withdrawal Approval</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Voting Deadline
                    </label>
                    <input
                      type="date"
                      value={newVote.deadline}
                      onChange={(e) => setNewVote({ ...newVote, deadline: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateVote(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateVote}
                    className="btn-primary flex-1"
                    disabled={!newVote.title || !newVote.description || !newVote.deadline}
                  >
                    Create Vote
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default GroupAdminVoting

