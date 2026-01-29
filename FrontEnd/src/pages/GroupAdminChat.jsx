import Layout from '../components/Layout'
import ChatInterface from '../components/ChatInterface'

function GroupAdminChat() {
  return (
    <Layout userRole="Group Admin">
      <div className="h-[calc(100vh-120px)]">
        <ChatInterface />
      </div>
    </Layout>
  )
}

export default GroupAdminChat

