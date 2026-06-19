import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Alert from '../components/ui/Alert'
import { useAuth } from '../context/AuthContext'
import { createCheckout } from '../services/subscriptions'

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    desc: 'Flexible monthly access to all features.',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$99.99',
    period: '/year',
    desc: 'Save with an annual subscription.',
    featured: true,
  },
]

function Pricing() {
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Fallback: if someone lands here with success=true
  useEffect(() => {
    if (searchParams.get('success') !== 'true') return

    const run = async () => {
      try {
        await refreshUser()

        if (user?.subscription_status === 'active') {
          navigate('/dashboard')
          return
        }

        if (user?.subscription_status === 'pending') {
          navigate('/payment-success?success=true', { replace: true })
          return
        }

        setMessage('Payment successful. Checking your membership status...')
      } catch {
        setError('Payment succeeded, but we could not verify your subscription yet.')
      }
    }

    run()
  }, [searchParams, refreshUser, user, navigate])

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user.subscription_status === 'active') {
      navigate('/dashboard')
      return
    }

    setError('')
    setLoading(plan)

    try {
      const { data } = await createCheckout(plan)
      window.location.href = data.url
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Choose your plan</h1>
          <p className="text-[#888]">Subscribe to log scores and enter monthly draws.</p>
        </div>

        <Alert message={error} />
        <Alert message={message} type="success" />

        {user?.subscription_status === 'active' && (
          <Alert message="You already have an active subscription." type="success" />
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {plans.map(plan => (
            <Card
              key={plan.id}
              className={plan.featured ? 'border-accent/40 relative' : ''}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-black text-xs font-bold px-3 py-1 rounded-full">
                  Best value
                </span>
              )}

              <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-[#888] text-sm">{plan.period}</span>
              </div>

              <p className="text-[#888] text-sm mb-6">{plan.desc}</p>

              <ul className="text-[#888] text-sm space-y-2 mb-6">
                <li>✓ Log up to 5 scores</li>
                <li>✓ Monthly prize draws</li>
                <li>✓ Charity contribution</li>
              </ul>

              <Button
                disabled={loading === plan.id || user?.subscription_status === 'active'}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading === plan.id ? 'Redirecting...' : 'Subscribe'}
              </Button>
            </Card>
          ))}
        </div>

        {!user && (
          <p className="text-center text-[#888] text-sm mt-8">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-accent font-semibold hover:text-[#00b386]"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </Layout>
  )
}

export default Pricing

