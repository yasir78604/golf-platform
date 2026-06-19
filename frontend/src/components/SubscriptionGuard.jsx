import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function SubscriptionGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (user?.subscription_status !== 'active') {
    return <Navigate to="/pricing" replace />
  }

  return children
}

export default SubscriptionGuard
