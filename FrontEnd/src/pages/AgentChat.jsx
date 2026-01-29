import { useContext } from 'react'
import Layout from '../components/Layout'
import ChatInterface from '../components/ChatInterface'
import { UserContext } from '../App'

function AgentChat() {
  const { user } = useContext(UserContext)
  const userRole = user?.role || 'Agent'
  
  return (
    <Layout userRole={userRole}>
      <div className="h-[calc(100vh-120px)]">
        <ChatInterface />
      </div>
    </Layout>
  )
}

export default AgentChat

