import { useState, useEffect } from 'react'
import { Vote, CheckCircle, XCircle, Clock, Users, FileText, Calendar, AlertCircle, History } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function MemberVoting() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('active')
  const [activeVotes, setActiveVotes] = useState([])
  const [voteHistory, setVoteHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalMembers, setTotalMembers] = useState(0)
  const [myVotes, setMyVotes] = useState(0)

  // Relevant vote types for members (all voting types)
  const relevantVoteTypes = [
    'withdrawal_approval', 
    'contribution_change', 
    'fine_change',
    'loan_approval_override',
    'saving_amount_change',
    'fine_amount_change',
    'interest_rate_change',
    'loan_approval',
    'member_admission',
    'policy_change'
  ]

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
        
        // Filter to only show relevant vote types for members
        const relevantVotes = allVotes.filter(vote => 
          relevantVoteTypes.includes(vote.type)
        )
        
        // Separate active and closed votes
        const active = relevantVotes.filter(v => v.status === 'open')
        const history = relevantVotes.filter(v => v.status === 'closed' || v.status === 'cancelled')
        
        // Enrich active votes with vote counts and user's vote
        const enrichedActive = await Promise.all(
          active.map(async (vote) => {
            try {
              // Get vote details with responses
              const voteDetailResponse = await api.get(`/voting/${vote.id}`).catch(() => null)
              const voteDetail = voteDetailResponse?.data?.data || vote
              
              // Calculate votes for/against from options
              let votesFor = 0
              let votesAgainst = 0
              let yourVote = null
              let totalMembers = 0
              
              if (voteDetail.options) {
                voteDetail.options.forEach(opt => {
                  const count = opt.voteCount || 0
                  const optionText = (opt.option || '').toLowerCase()
                  if (optionText.includes('for') || optionText.includes('approve')) {
                    votesFor = count
                  } else if (optionText.includes('against') || optionText.includes('reject')) {
                    votesAgainst = count
                  }
                })
              }
              
              // Check if user has voted
              try {
                const myVoteResponse = await api.get(`/voting/${vote.id}/my-vote`).catch(() => null)
                if (myVoteResponse?.data?.success) {
                  const optionText = (myVoteResponse.data.data.option?.option || '').toLowerCase()
                  yourVote = optionText.includes('for') || optionText.includes('approve') ? 'for' : 'against'
                }
              } catch (e) {
                // User hasn't voted yet
              }
              
              // Get total members from group info
              if (voteDetail.group) {
                try {
                  const groupResponse = await api.get(`/groups/${vote.groupId}`).catch(() => null)
                  if (groupResponse?.data?.success) {
                    totalMembers = groupResponse.data.data.members?.length || 0
                  }
                } catch (e) {
                  // Use default
                  totalMembers = voteDetail.totalVotes || 0
                }
              }
              
              return {
                ...vote,
                ...voteDetail,
                votesFor,
                votesAgainst,
                totalMembers: totalMembers || (votesFor + votesAgainst) || 0,
                yourVote
              }
            } catch (e) {
              console.warn(`Error enriching vote ${vote.id}:`, e)
              return {
                ...vote,
                votesFor: 0,
                votesAgainst: 0,
                totalMembers: 0,
                yourVote: null
              }
            }
          })
        )
        
        setActiveVotes(enrichedActive)
        setVoteHistory(history)
        setTotalMembers(enrichedActive[0]?.totalMembers || 0)
        setMyVotes(enrichedActive.filter(v => v.yourVote).length)
      } else {
        setActiveVotes([])
        setVoteHistory([])
      }
    } catch (error) {
      console.error('Error loading votes:', error)
      setActiveVotes([])
      setVoteHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (voteId, voteType) => {
    try {
      // Find the vote to get its options
      const vote = activeVotes.find(v => v.id === voteId)
      if (!vote || !vote.options) {
        alert(t('voteOptionsNotFound', { defaultValue: 'Vote options not found' }))
        return
      }
      
      // Find the option ID for "For" or "Against"
      const optionText = voteType === 'for' ? 'For' : 'Against'
      const option = vote.options.find(opt => 
        opt.option.toLowerCase().includes(optionText.toLowerCase()) ||
        opt.option.toLowerCase().includes(voteType === 'for' ? 'approve' : 'reject')
      )
      
      if (!option) {
        alert(t('voteOptionNotFound', { defaultValue: 'Vote option not found' }))
        return
      }
      
      const response = await api.post(`/voting/${voteId}/vote`, {
        optionId: option.id
      })
      
      if (response.data?.success) {
        alert(t('voteRecordedSuccessfully', { defaultValue: 'Your vote has been recorded successfully!' }))
        await loadVotes() // Refresh votes
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('failedToCastVote', { defaultValue: 'Failed to cast vote' })
      alert(errorMessage)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'withdrawal_approval': return 'bg-blue-100 text-blue-700'
      case 'contribution_change': return 'bg-green-100 text-green-700'
      case 'fine_change': return 'bg-orange-100 text-orange-700'
      case 'loan_approval_override': return 'bg-red-100 text-red-700'
      case 'saving_amount_change': return 'bg-teal-100 text-teal-700'
      case 'fine_amount_change': return 'bg-yellow-100 text-yellow-700'
      case 'interest_rate_change': return 'bg-pink-100 text-pink-700'
      case 'member_admission': return 'bg-purple-100 text-purple-700'
      case 'loan_approval': return 'bg-indigo-100 text-indigo-700'
      case 'policy_change': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getVotePercentage = (votes, total) => {
    return Math.round((votes / total) * 100)
  }

  return (
    <Layout userRole="Member">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('groupVoting', { defaultValue: 'Group Voting' })}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('participateInDecisions', { defaultValue: 'Participate in group decisions and governance' })}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('activeVotes')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeVotes.length}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('myVotes', { defaultValue: 'My Votes' })}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{myVotes}</p>
              </div>
              <Vote className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('totalMembers')}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalMembers || 0}</p>
              </div>
              <Users className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['active', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('activeVotes')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t('proposalsNeedVote', { defaultValue: 'These proposals need your vote' })}</p>

                {activeVotes.map((vote) => (
                  <div key={vote.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{vote.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(vote.type)}`}>
                            {vote.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(vote.status)}`}>
                            {vote.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{vote.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> Ends: {new Date(vote.endDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {vote.votesFor + vote.votesAgainst}/{vote.totalMembers || 0} voted
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vote Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Vote Progress</span>
                        <span className="text-gray-600">
                          {getVotePercentage(vote.votesFor + vote.votesAgainst, vote.totalMembers)}% participation
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div className="flex h-4 rounded-full">
                          <div 
                            className="bg-green-500 rounded-l-full"
                            style={{ width: `${getVotePercentage(vote.votesFor, vote.totalMembers)}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 rounded-r-full"
                            style={{ width: `${getVotePercentage(vote.votesAgainst, vote.totalMembers)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">
                          ✓ For: {vote.votesFor} ({getVotePercentage(vote.votesFor, vote.totalMembers)}%)
                        </span>
                        <span className="text-red-600">
                          ✗ Against: {vote.votesAgainst} ({getVotePercentage(vote.votesAgainst, vote.totalMembers)}%)
                        </span>
                      </div>
                    </div>

                    {/* Vote Actions */}
                    {!vote.yourVote ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVote(vote.id, 'for')}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} /> Vote For
                        </button>
                        <button
                          onClick={() => handleVote(vote.id, 'against')}
                          className="btn-secondary flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <XCircle size={18} /> Vote Against
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-center gap-2">
                          <CheckCircle size={16} />
                          You voted <span className="font-semibold">{vote.yourVote === 'for' ? 'FOR' : 'AGAINST'}</span> this proposal
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="mx-auto mb-4 text-gray-400 animate-spin" size={48} />
                    <p className="font-semibold">Loading votes...</p>
                  </div>
                ) : activeVotes.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <Vote className="mx-auto mb-4 text-gray-400" size={64} />
                    <p className="text-xl font-semibold mb-2">No Active Votes</p>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      There are currently no voting proposals that require your approval. 
                      Votes will appear here when the Group Admin creates proposals for:
                    </p>
                    <ul className="text-sm text-gray-600 mt-4 max-w-md mx-auto text-left list-disc list-inside">
                      <li>Loan requests exceeding savings or AI credit limits</li>
                      <li>Changes to saving/contribution amounts</li>
                      <li>Changes to fine amounts</li>
                      <li>Changes to loan interest rates</li>
                      <li>Large bank account withdrawals</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Vote History</h2>
                <p className="text-gray-600">View past voting decisions and results</p>

                {voteHistory.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <History className="mx-auto mb-4 text-gray-400" size={64} />
                    <p className="text-xl font-semibold mb-2">No Vote History</p>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      You haven't participated in any completed votes yet. Completed votes will appear here.
                    </p>
                  </div>
                ) : (
                  voteHistory.map((vote) => (
                  <div key={vote.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{vote.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(vote.type)}`}>
                            {vote.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(vote.result)}`}>
                            {vote.result.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span>Completed: {vote.completedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Final Results</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                        <div className="flex h-4 rounded-full">
                          <div 
                            className="bg-green-500 rounded-l-full"
                            style={{ width: `${getVotePercentage(vote.votesFor, vote.totalMembers)}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 rounded-r-full"
                            style={{ width: `${getVotePercentage(vote.votesAgainst, vote.totalMembers)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">
                          ✓ For: {vote.votesFor} ({getVotePercentage(vote.votesFor, vote.totalMembers)}%)
                        </span>
                        <span className="text-red-600">
                          ✗ Against: {vote.votesAgainst} ({getVotePercentage(vote.votesAgainst, vote.totalMembers)}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Vote size={16} />
                        Your vote: <span className="font-semibold">{vote.yourVote === 'for' ? 'FOR' : 'AGAINST'}</span>
                      </p>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MemberVoting
