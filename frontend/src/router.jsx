import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Charities from './pages/Charities'
import AdminDashboard from './pages/AdminDashboard'
import PaymentSuccess from './pages/PaymentSuccess'
import ProtectedRoute from './components/ProtectedRoute'
import SubscriptionGuard from './components/SubscriptionGuard'
import AdminGuard from './components/AdminGuard'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/charities', element: <Charities /> },
  { path: '/payment-success', element: <PaymentSuccess /> },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <SubscriptionGuard>
          <Dashboard />
        </SubscriptionGuard>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    )
  }
])