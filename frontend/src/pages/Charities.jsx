import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { getCharities, selectCharity } from '../services/charities'

function Charities() {
  const { user, refreshUser } = useAuth()
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [percentage, setPercentage] = useState(10)

  useEffect(() => {
    loadCharities()
  }, [])

  useEffect(() => {
    if (user?.charity_id) {
      setSelectedId(user.charity_id)
      setPercentage(user.charity_percentage || 10)
    }
  }, [user])

  const loadCharities = async () => {
    try {
      const { data } = await getCharities()
      setCharities(data.charities || [])
    } catch {
      setError('Failed to load charities.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await selectCharity(selectedId, Number(percentage))
      await refreshUser?.()
      setSuccess('Charity preference saved.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preference.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <Spinner />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Charities</h1>
          <p className="text-[#888] text-sm mt-1">
            10% of subscription revenue supports charities. Choose where your share goes.
          </p>
        </div>

        <Alert message={error} />
        <Alert message={success} type="success" />

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {charities.length === 0 ? (
            <Card className="sm:col-span-2 text-center">
              <p className="text-[#888] text-sm">No charities available yet.</p>
            </Card>
          ) : (
            charities.map(charity => (
              <Card
                key={charity.id}
                className={`cursor-pointer transition-colors ${
                  selectedId === charity.id ? 'border-accent/50' : 'hover:border-[#333]'
                }`}
                onClick={() => user && setSelectedId(charity.id)}
              >
                {charity.featured && (
                  <span className="text-accent text-xs font-semibold mb-2 block">Featured</span>
                )}
                <h3 className="text-white font-semibold mb-1">{charity.name}</h3>
                <p className="text-[#888] text-sm">{charity.description}</p>
              </Card>
            ))
          )}
        </div>

        {user ? (
          <Card>
            <h2 className="text-white font-semibold mb-4">Your contribution</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[#888] text-sm font-medium">
                  Contribution: {percentage}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={percentage}
                  onChange={e => setPercentage(e.target.value)}
                  className="w-full mt-2 accent-accent"
                />
                <p className="text-[#888] text-xs mt-1">Minimum 10% of your winnings go to charity.</p>
              </div>
              <Button type="submit" disabled={submitting || !selectedId}>
                {submitting ? 'Saving...' : 'Save Preference'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="text-center">
            <p className="text-[#888] text-sm mb-4">Sign in to select your charity.</p>
            <Link to="/login">
              <Button className="w-auto px-8 mx-auto">Sign In</Button>
            </Link>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default Charities
