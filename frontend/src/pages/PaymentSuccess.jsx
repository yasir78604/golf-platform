import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import { confirmCheckout } from '../services/subscriptions'
import { useAuth } from '../context/useAuth'

function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const sessionId = searchParams.get('session_id')

        if (!sessionId) {
          throw new Error("No session id")
        }

        await confirmCheckout(sessionId)

        await new Promise((resolve) =>
          setTimeout(resolve, 2000)
        )

        const user = await refreshUser()

        if (user?.subscription_status === 'active') {
          navigate('/dashboard')
          return
        }

        setError("Subscription not activated yet")

      } catch (err) {
        setError("Payment done now Refresh the Page")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-20">
        {loading ? (
          <Spinner />
        ) : (
          <Card>
            <Alert
              message={error || "Payment successful"}
              type={error ? "error" : "success"}
            />
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default PaymentSuccess