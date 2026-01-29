import { useState, useEffect } from 'react'
import { BookOpen, Users, Video, FileText, MessageCircle, Calendar, Plus, Eye, Download, Play, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

function AgentTraining() {
  const { t } = useTranslation('common')
  const { t: tAgent } = useTranslation('agent')
  const [selectedTab, setSelectedTab] = useState('materials')
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [showTrainingDetails, setShowTrainingDetails] = useState(false)
  const [trainingMaterials, setTrainingMaterials] = useState([])
  const [trainingSessions, setTrainingSessions] = useState([])
  const [supportRequests, setSupportRequests] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const [trainingProgress, setTrainingProgress] = useState(null)
  const [myRank, setMyRank] = useState(null)
  const [rankings, setRankings] = useState([])

  // Fetch training materials from database (only for agents)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        // Fetch agent training progress with rankings
        const { data } = await api.get('/learn-grow/agent/progress')
        if (mounted && data?.success) {
          setTrainingMaterials(data.data.trainings || [])
          setTrainingProgress(data.data)
          setMyRank(data.data.myRank)
          setRankings(data.data.rankings || [])
        }
      } catch (err) {
        console.error('Failed to fetch training materials:', err)
        if (mounted) {
          setTrainingMaterials([])
          setTrainingProgress(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch support requests
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/support')
        if (mounted) {
          setSupportRequests(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch support requests:', err)
        if (mounted) {
          setSupportRequests([])
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Fetch groups
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/groups')
        if (mounted) {
          setGroups(data?.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err)
        if (mounted) {
          setGroups([])
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Training sessions - no backend endpoint yet, so keep empty for now


  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video': return <Video className="text-red-600" size={20} />
      case 'pdf': return <FileText className="text-blue-600" size={20} />
      case 'article': return <FileText className="text-blue-600" size={20} />
      case 'live': return <Users className="text-green-600" size={20} />
      case 'online': return <Video className="text-purple-600" size={20} />
      default: return <FileText className="text-gray-600" size={20} />
    }
  }

  const getLevelColor = (category) => {
    // Use category as level indicator
    switch (category?.toLowerCase()) {
      case 'financial education': return 'bg-green-100 text-green-700'
      case 'savings': return 'bg-yellow-100 text-yellow-700'
      case 'loans': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'open': return 'bg-yellow-100 text-yellow-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }


  const handleViewTrainingDetails = async (training) => {
    setSelectedTraining(training)
    setShowTrainingDetails(true)
    
    // Mark as in_progress if not started
    if (training.progress?.status === 'not_started') {
      try {
        await api.post('/learn-grow/progress', {
          contentId: training.id,
          status: 'in_progress',
          progressPercentage: 0
        })
      } catch (err) {
        console.error('Failed to update progress:', err)
      }
    }
  }
  
  const handleCompleteTraining = async (trainingId) => {
    try {
      await api.post('/learn-grow/progress', {
        contentId: trainingId,
        status: 'completed',
        progressPercentage: 100
      })
      // Refresh training list
      const { data } = await api.get('/learn-grow/agent/progress')
      if (data?.success) {
        setTrainingMaterials(data.data.trainings || [])
        setTrainingProgress(data.data)
        setMyRank(data.data.myRank)
        setRankings(data.data.rankings || [])
      }
      alert('Training marked as completed!')
    } catch (err) {
      console.error('Failed to complete training:', err)
      alert('Failed to mark training as completed')
    }
  }

  const handleDownloadMaterial = async (material) => {
    try {
      if (material.fileUrl) {
        window.open(material.fileUrl, '_blank')
      } else {
        alert('No file available for download')
      }
    } catch (err) {
      console.error('Failed to download material:', err)
      alert('Failed to download material')
    }
  }


  const handleResolveSupport = async (requestId) => {
    try {
      await api.put(`/support/${requestId}`, { status: 'resolved' })
      // Refresh support requests
      const { data } = await api.get('/support')
      setSupportRequests(data?.data || [])
      alert('Support request resolved successfully!')
    } catch (err) {
      console.error('Failed to resolve support request:', err)
      alert(err?.response?.data?.message || 'Failed to resolve support request')
    }
  }

  return (
    <Layout userRole="Agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Training & Support</h1>
            <p className="text-gray-600 mt-1">Provide training and support to groups and members</p>
          </div>
          <div className="flex gap-2">
            {myRank && (
              <div className="bg-primary-50 px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-700">
                  My Rank: #{myRank} | Completed: {trainingProgress?.myCompletedCount || 0}/{trainingProgress?.totalTrainings || 0}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Available Trainings</p>
                <p className="text-2xl font-bold text-gray-800">{trainingMaterials.length}</p>
              </div>
              <BookOpen className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed Trainings</p>
                <p className="text-2xl font-bold text-green-600">
                  {trainingProgress?.myCompletedCount || 0}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Open Support</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {supportRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length}
                </p>
              </div>
              <MessageCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">My Ranking</p>
                <p className="text-2xl font-bold text-purple-600">
                  #{myRank || 'N/A'}
                </p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {['materials', 'sessions', 'support'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedTab === tab
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
            {selectedTab === 'materials' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Available Trainings</h2>
                  {rankings.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Top Performers: {rankings.slice(0, 3).map((r, i) => (
                        <span key={r.agentId} className="ml-2">
                          #{r.rank} {r.agentName} ({r.completedCount})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading training materials...</div>
                ) : trainingMaterials.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No training materials available. Training content will appear here once posted by the System Admin for agents.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainingMaterials.map((material) => {
                      const progress = material.progress || { status: 'not_started', progressPercentage: 0, timeSpent: 0 }
                      const isCompleted = progress.status === 'completed'
                      const isInProgress = progress.status === 'in_progress'
                      
                      return (
                      <div
                        key={material.id}
                        className={`card hover:shadow-xl transition-shadow ${isCompleted ? 'border-2 border-green-500' : ''}`}
                      >
                        <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center relative">
                          {getTypeIcon(material.type)}
                          {isCompleted && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <CheckCircle size={12} /> Completed
                            </div>
                          )}
                          {isInProgress && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Clock size={12} /> In Progress
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-gray-800">{material.title}</h3>
                            <p className="text-sm text-gray-600">{material.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelColor(material.category)}`}>
                              {material.category || 'General'}
                            </span>
                            {material.duration && <span className="text-xs text-gray-500">{material.duration} min</span>}
                          </div>
                          {isInProgress && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${progress.progressPercentage}%` }}
                              ></div>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{material.views || 0} views</span>
                            {progress.timeSpent > 0 && <span>{progress.timeSpent} min spent</span>}
                          </div>
                          <div className="flex gap-2">
                            {material.fileUrl && (
                              <button
                                onClick={() => handleDownloadMaterial(material)}
                                className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2"
                              >
                                <Download size={16} /> {isCompleted ? 'Review' : 'Start'}
                              </button>
                            )}
                            <button 
                              onClick={() => handleViewTrainingDetails(material)}
                              className="btn-secondary text-sm py-2 px-3 flex items-center gap-2"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'sessions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Agent Rankings</h2>
                </div>

                {rankings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No rankings available yet. Complete trainings to appear on the leaderboard.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rankings.map((agent) => (
                    <div
                      key={agent.agentId}
                      className={`p-4 rounded-xl transition-colors ${
                        agent.agentId === trainingProgress?.myRank ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                            agent.rank === 1 ? 'bg-yellow-500' : 
                            agent.rank === 2 ? 'bg-gray-400' : 
                            agent.rank === 3 ? 'bg-orange-500' : 
                            'bg-primary-500'
                          }`}>
                            #{agent.rank}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">
                              {agent.agentName}
                              {agent.agentId === trainingProgress?.myRank && (
                                <span className="ml-2 text-primary-600 text-sm">(You)</span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Completed {agent.completedCount} out of {agent.totalTrainings} trainings
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary-600">{agent.completedCount}</span>
                          <p className="text-xs text-gray-500">completed</p>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'support' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Support Requests</h2>
                  <div className="flex gap-2">
                    <button className="btn-secondary flex items-center gap-2">
                      <MessageCircle size={18} /> New Request
                    </button>
                  </div>
                </div>

                {supportRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No support requests. Support requests will appear here once submitted.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{request.title || request.issue || request.subject}</h3>
                          <p className="text-sm text-gray-600">{request.description || request.message}</p>
                          <p className="text-sm text-gray-500">ID: {request.id} • Date: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority || 'medium')}`}>
                            {request.priority || 'medium'} priority
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status || 'open')}`}>
                            {request.status || 'open'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Status: <span className="font-semibold">{request.status || 'open'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                            <Eye size={16} /> View Details
                          </button>
                          {request.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolveSupport(request.id)}
                              className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle size={16} /> Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Training Details Modal */}
        {showTrainingDetails && selectedTraining && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Training Session Details</h2>
                <button
                  onClick={() => setShowTrainingDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {getTypeIcon(selectedTraining.type)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedTraining.title}</h3>
                    <p className="text-gray-600">{selectedTraining.description}</p>
                    <p className="text-sm text-gray-500">Session ID: {selectedTraining.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Session Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-semibold">{selectedTraining.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-semibold">{selectedTraining.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{selectedTraining.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-semibold">{selectedTraining.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Participation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTraining.status)}`}>
                          {selectedTraining.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTrainingDetails(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  {selectedTraining && selectedTraining.progress?.status !== 'completed' && (
                    <button 
                      onClick={() => {
                        handleCompleteTraining(selectedTraining.id)
                        setShowTrainingDetails(false)
                      }}
                      className="btn-primary flex-1"
                    >
                      Mark as Completed
                    </button>
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

export default AgentTraining
