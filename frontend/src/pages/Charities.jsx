import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/useAuth'
import { createDonationCheckout, getCharities, selectCharity } from '../services/charities'

function Charities() {
  const { user, refreshUser } = useAuth()
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [percentage, setPercentage] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [donationAmount, setDonationAmount] = useState(10)

  const activeSelectedId = selectedId || user?.charity_id || ''
  const activePercentage = percentage ?? user?.charity_percentage ?? 10

  const loadCharities = useCallback(async () => {
    try {
      const { data } = await getCharities({ search, category })
      setCharities(data.charities || [])
    } catch {
      setError('Failed to load charities.')
    } finally {
      setLoading(false)
    }
  }, [search, category])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) loadCharities()
    })
    return () => {
      cancelled = true
    }
  }, [loadCharities])

  const handleDonate = async (charityId) => {
    setError('')
    setSuccess('')
    try {
      const { data } = await createDonationCheckout(charityId, Number(donationAmount))
      window.location.assign(data.url)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start donation checkout.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await selectCharity(activeSelectedId, Number(activePercentage))
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

        <Card className="mb-8">
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="text-[#888] text-sm font-medium">Search charities</label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name"
                className="w-full mt-1 px-4 py-3 bg-elevated text-white rounded-lg border border-border focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[#888] text-sm font-medium">Category</label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Optional"
                className="w-full mt-1 px-4 py-3 bg-elevated text-white rounded-lg border border-border focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </Card>

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
                  activeSelectedId === charity.id ? 'border-accent/50' : 'hover:border-[#333]'
                }`}
                onClick={() => user && setSelectedId(charity.id)}
              >
                {charity.featured && (
                  <span className="text-accent text-xs font-semibold mb-2 block">Featured</span>
                )}
                <h3 className="text-white font-semibold mb-1">{charity.name}</h3>
                {charity.category && (
                  <p className="text-accent text-xs mb-2">{charity.category}</p>
                )}
                <p className="text-[#888] text-sm">{charity.description}</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {charity.website_url && (
                    <a href={charity.website_url} target="_blank" rel="noreferrer" className="text-accent text-xs">
                      Profile
                    </a>
                  )}
                  {charity.events_url && (
                    <a href={charity.events_url} target="_blank" rel="noreferrer" className="text-accent text-xs">
                      Events
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDonate(charity.id)
                    }}
                    className="text-accent text-xs"
                  >
                    Donate ${donationAmount}
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        {user ? (
          <Card>
            <h2 className="text-white font-semibold mb-4">Your contribution</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[#888] text-sm font-medium">One-off donation amount</label>
                <input
                  type="number"
                  min={1}
                  value={donationAmount}
                  onChange={e => setDonationAmount(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-elevated text-white rounded-lg border border-border focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-[#888] text-sm font-medium">
                  Contribution: {activePercentage}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={activePercentage}
                  onChange={e => setPercentage(e.target.value)}
                  className="w-full mt-2 accent-accent"
                />
                <p className="text-[#888] text-xs mt-1">Minimum 10% of your winnings go to charity.</p>
              </div>
              <Button type="submit" disabled={submitting || !activeSelectedId}>
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
