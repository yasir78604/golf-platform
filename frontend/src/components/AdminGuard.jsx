import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function AdminGuard({ children }) {
  const { user, loading } = useAuth()

  if(loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center 
    justify-center">
      <div className="w-8 h-8 border-2 border-[#00c896] 
      border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if(!user || user.role !== 'admin') return <Navigate to="/login"/>
  return children
}

export default AdminGuard
