import { useState } from 'react'
import { Vote, Plus, Users, Clock, CheckCircle, XCircle, TrendingUp, Calendar, Eye } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminVoting() {
  const [showCreateVote, setShowCreateVote] = useState(false)
  const [selectedVote, setSelectedVote] = useState(null)

  const votes = [
    {
      id: 1,
      title: 'Increase Minimum Contribution to RWF 7,500',
      description: 'Proposal to increase the minimum monthly contribution from RWF 5,000 to RWF 7,500 to help achieve group savings goals faster.',
      type: 'contribution',
      status: 'active',
      createdDate: '2024-01-20',
      deadline: '2024-01-27',
      totalVoters: 45,
      votesFor: 28,
      votesAgainst: 12,
      abstain: 5,
      result: null,
      creator: 'Group Admin'
    },
    {
      id: 2,
      title: 'Approve Member Suspension - Ikirezi Jane',
      description: 'Vote on whether to suspend member Ikirezi Jane (M003) for repeated rule violations and late payments.',
      type: 'disciplinary',
      status: 'completed',
      createdDate: '2024-01-10',
      deadline: '2024-01-17',
      totalVoters: 45,
      votesFor: 30,
      votesAgainst: 10,
      abstain: 5,
      result: 'approved',
      creator: 'Group Admin'
    },
    {
      id: 3,
      title: 'Add New Group Officer - Cashier Position',
      description: 'Proposal to add Mukamana Alice as the new Cashier officer for the group.',
      type: 'governance',
      status: 'completed',
      createdDate: '2024-01-05',
      deadline: '2024-01-12',
      totalVoters: 45,
      votesFor: 35,
      votesAgainst: 8,
      abstain: 2,
      result: 'approved',
      creator: 'Group Admin'
    },
    {
      id: 4,
      title: 'Change Meeting Schedule to Sundays',
      description: 'Proposal to change regular meeting day from Saturday to Sunday at 2:00 PM.',
      type: 'governance',
      status: 'pending',
      createdDate: '2024-01-22',
      deadline: '2024-01-29',
      totalVoters: 45,
      votesFor: 0,
      votesAgainst: 0,
      abstain: 0,
      result: null,
      creator: 'Group Admin'
    }
  ]

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
      case 'contribution': return 'bg-purple-100 text-purple-700'
      case 'disciplinary': return 'bg-red-100 text-red-700'
      case 'governance': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  const handleCreateVote = () => {
    alert('Vote created successfully! All members will be notified.')
    setShowCreateVote(false)
    setNewVote({
      title: '',
      description: '',
      type: 'general',
      deadline: ''
    })
  }

  const votingStats = {
    totalVotes: votes.length,
    activeVotes: votes.filter(v => v.status === 'active').length,
    completedVotes: votes.filter(v => v.status === 'completed').length,
    averageParticipation: Math.round(
      votes
        .filter(v => v.status === 'completed')
        .reduce((sum, v) => sum + ((v.votesFor + v.votesAgainst + v.abstain) / v.totalVoters) * 100, 0) /
      votes.filter(v => v.status === 'completed').length
    )
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Group Decision & Governance</h1>
            <p className="text-gray-600 mt-1">Launch polls and votes for major group decisions</p>
          </div>
          <button
            onClick={() => setShowCreateVote(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Create New Vote
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Votes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {votingStats.totalVotes}
                </p>
              </div>
              <Vote className="text-gray-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Votes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {votingStats.activeVotes}
                </p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {votingStats.completedVotes}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Avg Participation</p>
                <p className="text-2xl font-bold text-purple-600">
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
            <h2 className="text-xl font-bold text-gray-800">
              All Votes ({votes.length})
            </h2>
          </div>

          <div className="space-y-4">
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{vote.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(vote.type)}`}>
                        {vote.type}
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
                        <Users size={16} /> {vote.votesFor + vote.votesAgainst + vote.abstain}/{vote.totalVoters} voted
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voting Results */}
                {vote.status === 'active' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Live Voting Progress</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-700 font-semibold">For</span>
                          <span className="text-gray-600">{vote.votesFor} votes ({calculatePercentage(vote.votesFor, vote.totalVoters)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${calculatePercentage(vote.votesFor, vote.totalVoters)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-red-700 font-semibold">Against</span>
                          <span className="text-gray-600">{vote.votesAgainst} votes ({calculatePercentage(vote.votesAgainst, vote.totalVoters)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${calculatePercentage(vote.votesAgainst, vote.totalVoters)}%` }}
                          ></div>
                        </div>
                      </div>
                      {vote.abstain > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-semibold">Abstain</span>
                            <span className="text-gray-600">{vote.abstain} votes ({calculatePercentage(vote.abstain, vote.totalVoters)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gray-400 h-2 rounded-full"
                              style={{ width: `${calculatePercentage(vote.abstain, vote.totalVoters)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {vote.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                    <p className="text-sm font-semibold text-green-800 mb-2">Final Results</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">For</p>
                        <p className="text-lg font-bold text-green-700">{vote.votesFor}</p>
                        <p className="text-xs text-gray-500">{calculatePercentage(vote.votesFor, vote.totalVoters)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Against</p>
                        <p className="text-lg font-bold text-red-700">{vote.votesAgainst}</p>
                        <p className="text-xs text-gray-500">{calculatePercentage(vote.votesAgainst, vote.totalVoters)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Abstain</p>
                        <p className="text-lg font-bold text-gray-700">{vote.abstain}</p>
                        <p className="text-xs text-gray-500">{calculatePercentage(vote.abstain, vote.totalVoters)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm font-semibold text-green-800">
                        Result: <span className="capitalize">{vote.result}</span>
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
                  {vote.status === 'pending' && (
                    <button
                      onClick={() => alert('Vote activated! Members can now vote.')}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Activate Vote
                    </button>
                  )}
                  {vote.status === 'active' && (
                    <button
                      onClick={() => alert('Vote closed and results finalized!')}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <XCircle size={16} /> Close Vote
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Log */}
        <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary-600" size={24} />
            Decision Log
          </h2>
          <div className="space-y-2">
            {votes.filter(v => v.status === 'completed').map((vote) => (
              <div key={vote.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{vote.title}</p>
                    <p className="text-xs text-gray-500">Completed: {vote.deadline}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getResultColor(vote.result)}`}>
                    {vote.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

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
                      <option value="general">General</option>
                      <option value="contribution">Contribution</option>
                      <option value="disciplinary">Disciplinary</option>
                      <option value="governance">Governance</option>
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

