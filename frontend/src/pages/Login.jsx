import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if(user.role === 'admin') {
        navigate('/admin')
      } else if(user.subscription_status === 'active') {
        navigate('/dashboard')
      } else {
        navigate('/pricing')
      }
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center 
    justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00c896]/10 rounded-2xl 
          flex items-center justify-center mx-auto mb-4 
          border border-[#00c896]/20">
            <span className="text-3xl">⛳</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back
          </h1>
          <p className="text-[#888] text-sm mt-1">
            Sign in to your Golf Platform account
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#111111] rounded-2xl p-8 
        border border-[#222]">

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 
            border border-red-500/20 rounded-lg 
            text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#888] text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white 
                placeholder:text-[#444] rounded-lg border border-[#222] 
                focus:outline-none focus:border-[#00c896] 
                transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#888] text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white 
                placeholder:text-[#444] rounded-lg border border-[#222] 
                focus:outline-none focus:border-[#00c896] 
                transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-[#00c896] text-black 
              font-bold rounded-full hover:bg-[#00b386] 
              transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#888] text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" 
            className="text-[#00c896] font-semibold 
            hover:text-[#00b386] transition-colors">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login
