import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, ArrowLeft, Phone, Mail, User, Clock } from 'lucide-react'
import Layout from '../components/Layout'

function GroupAdminChat() {
  const [selectedMember, setSelectedMember] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef(null)

  const members = [
    {
      id: 'M001',
      name: 'Kamikazi Marie',
      phone: '+250788123456',
      email: 'kamikazi@email.com',
      status: 'online',
      lastSeen: '2 minutes ago',
      unreadCount: 2,
      avatar: 'KM'
    },
    {
      id: 'M002',
      name: 'Mukamana Alice',
      phone: '+250788234567',
      email: 'alice@email.com',
      status: 'offline',
      lastSeen: '1 hour ago',
      unreadCount: 0,
      avatar: 'MA'
    },
    {
      id: 'M003',
      name: 'Ikirezi Jane',
      phone: '+250788345678',
      email: 'jane@email.com',
      status: 'online',
      lastSeen: '5 minutes ago',
      unreadCount: 1,
      avatar: 'IJ'
    },
    {
      id: 'M004',
      name: 'Mutabazi Paul',
      phone: '+250788456789',
      email: 'paul@email.com',
      status: 'offline',
      lastSeen: '3 hours ago',
      unreadCount: 0,
      avatar: 'MP'
    }
  ]

  const [conversations, setConversations] = useState({
    'M001': [
      { id: 1, sender: 'member', message: 'Hello Admin, I have a question about my loan application', time: '10:30 AM', read: true },
      { id: 2, sender: 'admin', message: 'Hello Kamikazi! I can help you with that. What would you like to know?', time: '10:32 AM', read: true },
      { id: 3, sender: 'member', message: 'When will I know if my loan request has been approved?', time: '10:35 AM', read: true },
      { id: 4, sender: 'member', message: 'Also, can I increase the amount I requested?', time: '10:36 AM', read: false }
    ],
    'M002': [
      { id: 1, sender: 'member', message: 'Thank you for approving my loan!', time: 'Yesterday 2:15 PM', read: true },
      { id: 2, sender: 'admin', message: 'You\'re welcome! Make sure to make your payments on time.', time: 'Yesterday 2:17 PM', read: true }
    ],
    'M003': [
      { id: 1, sender: 'member', message: 'I need help with my contribution payment', time: '11:45 AM', read: false }
    ],
    'M004': []
  })

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedMember, conversations])

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedMember) {
      const newMsg = {
        id: Date.now(),
        sender: 'admin',
        message: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true
      }

      setConversations(prev => ({
        ...prev,
        [selectedMember.id]: [...(prev[selectedMember.id] || []), newMsg]
      }))

      setNewMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getStatusColor = (status) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400'
  }

  return (
    <Layout userRole="Group Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Personal Chat</h1>
            <p className="text-gray-600 mt-1">Chat with group members privately</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Members List */}
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Members</h2>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search members..."
                  className="input-field w-48"
                />
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100%-80px)]">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMember?.id === member.id
                      ? 'bg-primary-100 border-2 border-primary-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 truncate">{member.name}</h3>
                        {member.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {member.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{member.phone}</p>
                      <p className="text-xs text-gray-500">{member.lastSeen}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 card h-full flex flex-col">
            {selectedMember ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedMember.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(selectedMember.status)}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedMember.name}</h3>
                      <p className="text-sm text-gray-600">{selectedMember.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Mail size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {conversations[selectedMember.id]?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender === 'admin'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'admin' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="input-field flex-1"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Member</h3>
                  <p className="text-gray-500">Choose a member from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default GroupAdminChat

