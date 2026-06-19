import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SubscriptionGuard({ children }) {
  const { user } = useAuth()

  if (user?.subscription_status === 'pending') {
    return <Navigate to="/pricing?success=true" replace={true} />
  }

  if (user?.subscription_status !== 'active') {
    return <Navigate to="/pricing" replace={true} />
  }

  return children
}

export default SubscriptionGuard