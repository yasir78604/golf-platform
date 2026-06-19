import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/useAuth'
import { confirmCheckout } from '../services/subscriptions'

function PaymentSuccess() {
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(() => searchParams.get('success') === 'true')
  const [error, setError] = useState('')

  const status = user?.subscription_status

  const message = useMemo(() => {
    if (status === 'active') {
      return {
        type: 'success',
        text: 'Payment successful! Your membership is active.'
      }
    }

    return {
      type: 'info',
      text: 'Payment successful. Activating your membership...'
    }
  }, [status])

  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')

    if (success !== 'true') {
      return
    }

    const run = async () => {
      try {
        if (sessionId) {
          await confirmCheckout(sessionId)
        }

        const refreshedUser = await refreshUser()

        if (refreshedUser?.subscription_status === 'active') {
          navigate('/dashboard', { replace: true })
        }
      } catch {
        setError('Payment succeeded, but we could not activate your subscription yet. Please try refreshing this page.')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [searchParams, refreshUser, navigate])

  useEffect(() => {
    if (loading) return
    if (status === 'active') {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, status, navigate])

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Success</h1>
          <p className="text-[#888]">Activating your subscription and opening your dashboard.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Card>
            <Alert message={error || message.text} type={error ? 'error' : message.type} />

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
              <Button type="button" className="flex-1" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default PaymentSuccess
