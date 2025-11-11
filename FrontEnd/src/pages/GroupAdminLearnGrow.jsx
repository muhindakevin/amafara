import { useState } from 'react'
import { BookOpen, Users, TrendingUp, Award, Calendar, Eye, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminLearnGrow() {
  const [activeTab, setActiveTab] = useState('progress')
  const [selectedMember, setSelectedMember] = useState(null)

  const modules = [
    {
      id: 1,
      title: 'Financial Planning Basics',
      category: 'Financial Literacy',
      duration: '2 hours',
      difficulty: 'Beginner',
      completionRate: 75,
      enrolledMembers: 38
    },
    {
      id: 2,
      title: 'Savings & Investment Strategies',
      category: 'Financial Literacy',
      duration: '3 hours',
      difficulty: 'Intermediate',
      completionRate: 62,
      enrolledMembers: 32
    },
    {
      id: 3,
      title: 'Loan Management & Repayment',
      category: 'Credit Management',
      duration: '2.5 hours',
      difficulty: 'Intermediate',
      completionRate: 58,
      enrolledMembers: 28
    },
    {
      id: 4,
      title: 'Group Savings Best Practices',
      category: 'Group Management',
      duration: '1.5 hours',
      difficulty: 'Beginner',
      completionRate: 88,
      enrolledMembers: 42
    },
    {
      id: 5,
      title: 'Entrepreneurship Fundamentals',
      category: 'Business Skills',
      duration: '4 hours',
      difficulty: 'Advanced',
      completionRate: 45,
      enrolledMembers: 22
    }
  ]

  const memberProgress = [
    {
      memberId: 'M001',
      memberName: 'Kamikazi Marie',
      phone: '+250788123456',
      totalModules: 5,
      completedModules: 4,
      inProgress: 1,
      completionPercentage: 80,
      lastActivity: '2024-01-20',
      certificates: 3,
      currentModule: 'Entrepreneurship Fundamentals'
    },
    {
      memberId: 'M002',
      memberName: 'Mukamana Alice',
      phone: '+250788234567',
      totalModules: 5,
      completedModules: 3,
      inProgress: 1,
      completionPercentage: 60,
      lastActivity: '2024-01-18',
      certificates: 2,
      currentModule: 'Loan Management & Repayment'
    },
    {
      memberId: 'M004',
      memberName: 'Mutabazi Paul',
      phone: '+250788456789',
      totalModules: 5,
      completedModules: 5,
      inProgress: 0,
      completionPercentage: 100,
      lastActivity: '2024-01-19',
      certificates: 5,
      currentModule: 'All Completed!'
    },
    {
      memberId: 'M005',
      memberName: 'Uwimana Grace',
      phone: '+250788567890',
      totalModules: 5,
      completedModules: 1,
      inProgress: 0,
      completionPercentage: 20,
      lastActivity: '2024-01-10',
      certificates: 1,
      currentModule: 'Financial Planning Basics'
    },
    {
      memberId: 'M003',
      memberName: 'Ikirezi Jane',
      phone: '+250788345678',
      totalModules: 5,
      completedModules: 0,
      inProgress: 0,
      completionPercentage: 0,
      lastActivity: null,
      certificates: 0,
      currentModule: 'Not Started'
    }
  ]

  const weeklyChallenges = [
    {
      id: 1,
      title: 'Complete Financial Planning Module',
      week: 'Week of Jan 15-21',
      participants: 28,
      completed: 20,
      status: 'completed'
    },
    {
      id: 2,
      title: 'Watch Investment Strategies Video',
      week: 'Week of Jan 22-28',
      participants: 32,
      completed: 15,
      status: 'active'
    }
  ]

  const overallStats = {
    totalMembers: 45,
    enrolledMembers: 35,
    completionRate: Math.round(
      memberProgress.reduce((sum, m) => sum + m.completionPercentage, 0) / memberProgress.length
    ),
    totalCertificates: memberProgress.reduce((sum, m) => sum + m.certificates, 0),
    activeLearners: memberProgress.filter(m => m.completionPercentage > 0 && m.completionPercentage < 100).length
  }

  const getCompletionColor = (percentage) => {
    if (percentage === 100) return 'bg-green-100 text-green-700'
    if (percentage >= 70) return 'bg-blue-100 text-blue-700'
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Learn & Grow Management</h1>
            <p className="text-gray-600 mt-1">Track member learning progress and educational participation</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Download size={18} /> Export Progress Report
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Calendar size={18} /> Create Challenge
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Enrolled Members</p>
                <p className="text-2xl font-bold text-gray-800">
                  {overallStats.enrolledMembers}/{overallStats.totalMembers}
                </p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Avg Completion</p>
                <p className="text-2xl font-bold text-blue-600">
                  {overallStats.completionRate}%
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Certificates</p>
                <p className="text-2xl font-bold text-green-600">
                  {overallStats.totalCertificates}
                </p>
              </div>
              <Award className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Learners</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {overallStats.activeLearners}
                </p>
              </div>
              <BookOpen className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Available Modules</p>
                <p className="text-2xl font-bold text-purple-600">
                  {modules.length}
                </p>
              </div>
              <BookOpen className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-2">
              {[
                { id: 'progress', label: 'Member Progress', icon: TrendingUp },
                { id: 'modules', label: 'Learning Modules', icon: BookOpen },
                { id: 'challenges', label: 'Weekly Challenges', icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} /> {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Member Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Member Learning Progress</h3>
                <button
                  onClick={() => alert('Sending reminders to members with incomplete modules...')}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <AlertCircle size={16} /> Send Reminders
                </button>
              </div>

              <div className="space-y-3">
                {memberProgress.map((member) => (
                  <div
                    key={member.memberId}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {member.memberName[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{member.memberName}</h4>
                          <p className="text-sm text-gray-600">{member.phone} • {member.memberId}</p>
                          <p className="text-xs text-gray-500">
                            {member.lastActivity ? `Last Activity: ${member.lastActivity}` : 'No activity yet'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCompletionColor(member.completionPercentage)}`}>
                        {member.completionPercentage}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="font-semibold text-green-600">{member.completedModules}/{member.totalModules}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="font-semibold text-blue-600">{member.inProgress}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Certificates</p>
                        <p className="font-semibold text-purple-600">{member.certificates}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Module</p>
                        <p className="font-semibold text-gray-800 text-xs">{member.currentModule}</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{member.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            member.completionPercentage === 100 ? 'bg-green-500' :
                            member.completionPercentage >= 70 ? 'bg-blue-500' :
                            member.completionPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMember(member)}
                      className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Available Learning Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{module.title}</h4>
                        <p className="text-sm text-gray-600">{module.category}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock size={14} /> {module.duration}
                          </div>
                          <span className={`px-2 py-1 rounded-full ${
                            module.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            module.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {module.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Completion Rate</span>
                        <span>{module.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${module.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {module.enrolledMembers} members enrolled
                      </p>
                      <button className="btn-secondary text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Weekly Learning Challenges</h3>
                <button
                  onClick={() => alert('Creating new weekly challenge...')}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Calendar size={16} /> Create Challenge
                </button>
              </div>

              <div className="space-y-3">
                {weeklyChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{challenge.title}</h4>
                        <p className="text-sm text-gray-600">{challenge.week}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {challenge.completed}/{challenge.participants} members completed
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        challenge.status === 'completed' ? 'bg-green-100 text-green-700' :
                        challenge.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {challenge.status}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Completion</span>
                        <span>{Math.round((challenge.completed / challenge.participants) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(challenge.completed / challenge.participants) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button className="btn-secondary text-sm">
                        View Participants
                      </button>
                      {challenge.status === 'active' && (
                        <button
                          onClick={() => alert('Reminder sent to all participants!')}
                          className="btn-primary text-sm"
                        >
                          Send Reminder
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">Motivate Members</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Create weekly learning challenges to encourage consistent participation. Track completion and recognize top performers.
                </p>
                <button className="btn-primary text-sm">
                  Create New Challenge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminLearnGrow

