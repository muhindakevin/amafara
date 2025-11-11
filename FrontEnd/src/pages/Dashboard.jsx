import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to member dashboard for now
    navigate('/member')
  }, [navigate])

  return null
}

export default Dashboard


