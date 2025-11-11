import Layout from '../components/Layout'
import ChatInterface from '../components/ChatInterface'

function ChatPage() {
  return (
    <Layout userRole="Member">
      <div className="h-[calc(100vh-120px)]">
        <ChatInterface />
      </div>
    </Layout>
  )
}

export default ChatPage


