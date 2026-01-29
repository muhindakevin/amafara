import Layout from '../components/Layout'
import ChatInterface from '../components/ChatInterface'

function CashierChat() {
  return (
    <Layout userRole="Cashier">
      <div className="h-[calc(100vh-120px)]">
        <ChatInterface />
      </div>
    </Layout>
  )
}

export default CashierChat

