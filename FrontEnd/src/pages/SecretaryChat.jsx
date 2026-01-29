import Layout from '../components/Layout'
import ChatInterface from '../components/ChatInterface'

function SecretaryChat() {
  return (
    <Layout userRole="Secretary">
      <div className="h-[calc(100vh-120px)]">
        <ChatInterface />
      </div>
    </Layout>
  )
}

export default SecretaryChat

