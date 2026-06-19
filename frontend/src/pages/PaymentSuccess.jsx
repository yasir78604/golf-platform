import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'

function PaymentSuccess() {
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // status may be stale until refreshUser() finishes.
  const status = user?.subscription_status

  const message = useMemo(() => {
    if (status === 'active') {
      return {
        type: 'success',
        text: 'Payment successful! Your membership is active.'
      }
    }

    if (status === 'pending') {
      return {
        type: 'info',
        text: 'Payment received. Checking your membership status…'
      }
    }

    return {
      type: 'info',
      text: 'Payment received. Checking your membership status…'
    }

  }, [status])

  useEffect(() => {
    const success = searchParams.get('success')

    // If someone visits this page without the success param, just stop loading.
    if (success !== 'true') {
      setLoading(false)
      return
    }

    const run = async () => {
      try {
        await refreshUser()
      } catch {
        setError('Payment succeeded, but we could not verify your subscription yet.')
      } finally {
        setLoading(false)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, refreshUser])

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
          <p className="text-[#888]">Payment received—verifying your membership access…</p>

        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Card>
            <Alert message={error || message.text} type={error ? 'error' : message.type} />

            {status !== 'active' && (
              <div className="mt-4 text-center text-[#888] text-sm">
                If access isn’t unlocked yet, it may be taking a moment to sync.
              </div>
            )}


            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
              <Button type="button" className="flex-1" onClick={() => navigate('/charities')}>
                Go to App
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default PaymentSuccess

