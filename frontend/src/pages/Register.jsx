import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getCharities } from '../services/charities'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [charities, setCharities] = useState([])
  const [charityId, setCharityId] = useState('')
  const [charityPercentage, setCharityPercentage] = useState(10)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCharities({ featured: true })
      .then(({ data }) => {
        const options = data.charities || []
        setCharities(options)
        if (options[0]?.id) setCharityId(options[0].id)
      })
      .catch(() => setCharities([]))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, name, charityId || null, Number(charityPercentage))
      navigate('/pricing')
    } catch(err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center 
    justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00c896]/10 rounded-2xl 
          flex items-center justify-center mx-auto mb-4 
          border border-[#00c896]/20">
            <span className="text-3xl">⛳</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Create account
          </h1>
          <p className="text-[#888] text-sm mt-1">
            Join the Golf Platform community
          </p>
        </div>

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
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white 
                placeholder:text-[#444] rounded-lg border border-[#222] 
                focus:outline-none focus:border-[#00c896] 
                transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#888] text-sm font-medium">
                Charity you want to support
              </label>
              <select
                value={charityId}
                onChange={e => setCharityId(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white 
                rounded-lg border border-[#222] focus:outline-none 
                focus:border-[#00c896] transition-colors"
              >
                <option value="">Choose later</option>
                {charities.map(charity => (
                  <option value={charity.id} key={charity.id}>
                    {charity.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#888] text-sm font-medium">
                Charity share: {charityPercentage}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={charityPercentage}
                onChange={e => setCharityPercentage(e.target.value)}
                className="accent-[#00c896]"
              />
              <p className="text-[#666] text-xs">
                Minimum 10%. You can adjust this any time.
              </p>
            </div>

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
                placeholder="Create a password"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <p className="text-center text-[#888] text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" 
            className="text-[#00c896] font-semibold 
            hover:text-[#00b386] transition-colors">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Register
