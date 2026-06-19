import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SubscriptionGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  // If user paid and is waiting for admin approval, keep them in the flow.
  if (user?.subscription_status === 'pending') {
    return <Navigate to="/payment-success?success=true" replace />
  }

  // Any other state (inactive/unknown) -> pricing
  if (user?.subscription_status !== 'active') {
    return <Navigate to="/pricing" replace />
  }

  return children
}

export default SubscriptionGuard
