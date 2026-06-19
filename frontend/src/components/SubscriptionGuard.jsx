import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SubscriptionGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  // Allow dashboard only for active subscribers.
  if (user?.subscription_status === 'active') {
    return children
  }

  // Any other state (pending/inactive/unknown) -> pricing
  return <Navigate to="/pricing" replace />
}


export default SubscriptionGuard
