import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/pricing', label: 'Pricing', show: true },
    { to: '/charities', label: 'Charities', show: true },
    {
      to: '/dashboard',
      label: 'Dashboard',
      show: user?.subscription_status === 'active',
    },
    { to: '/admin', label: 'Admin', show: user?.role === 'admin' },
  ]

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
              <span className="text-lg">⛳</span>
            </div>
            <span className="font-bold text-white hidden sm:block">Golf Platform</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-4">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[#888] text-sm hover:text-white transition-colors px-2 py-1"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <span className="text-[#888] text-sm hidden md:block">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-accent hover:text-[#00b386] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="text-sm text-[#888] hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-accent text-black font-semibold px-4 py-1.5 rounded-full hover:bg-[#00b386] transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 text-center text-[#888] text-sm">
        © {new Date().getFullYear()} Golf Platform. Play. Win. Give back.
      </footer>
    </div>
  )
}

export default Layout
