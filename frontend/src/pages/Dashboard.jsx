import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/useAuth'
import { getScores, addScore, updateScore, deleteScore } from '../services/scores'
import { getMyResults, getDraws, submitWinnerProof } from '../services/draws'
import { cancelSubscription } from '../services/subscriptions'

function Dashboard() {
  const { user, refreshUser, updateProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const [scores, setScores] = useState([])
  const [results, setResults] = useState([])
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(() =>
    searchParams.get('success') === 'true' ? 'Subscription activated! You can now log scores.' : ''
  )
  const [submitting, setSubmitting] = useState(false)

  const [score, setScore] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [editingId, setEditingId] = useState(null)
  const [profileForm, setProfileForm] = useState(null)
  const [proofFiles, setProofFiles] = useState({})

  const activeProfileForm = profileForm ?? { name: user?.name || '', country: user?.country || '' }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [scoresRes, resultsRes, drawsRes] = await Promise.all([
        getScores(),
        getMyResults(),
        getDraws()
      ])
      setScores(scoresRes.data.scores || [])
      setResults(resultsRes.data.results || [])
      setDraws(drawsRes.data.draws || [])
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      if (searchParams.get('success') === 'true') {
        refreshUser?.()
      }
      loadData()
    })
    return () => {
      cancelled = true
    }
  }, [loadData, refreshUser, searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      if (editingId) {
        await updateScore(editingId, Number(score), date)
        setSuccess('Score updated.')
        setEditingId(null)
      } else {
        await addScore(Number(score), date)
        setSuccess('Score added.')
      }
      setScore('')
      setDate(new Date().toISOString().split('T')[0])
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save score.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (s) => {
    setEditingId(s.id)
    setScore(String(s.score))
    setDate(s.date)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this score?')) return
    try {
      await deleteScore(id)
      setSuccess('Score deleted.')
      await loadData()
    } catch {
      setError('Failed to delete score.')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setScore('')
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await updateProfile?.(activeProfileForm)
      setProfileForm(null)
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.')
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Cancel at the end of your current billing period?')) return
    setError('')
    setSuccess('')
    try {
      const { data } = await cancelSubscription()
      await refreshUser?.()
      setSuccess(data.message || 'Subscription cancellation scheduled.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel subscription.')
    }
  }

  const handleProofSubmit = async (resultId) => {
    const file = proofFiles[resultId]
    if (!file) {
      setError('Choose a proof file before submitting.')
      return
    }
    setError('')
    setSuccess('')
    try {
      await submitWinnerProof(resultId, file)
      setSuccess('Proof uploaded. Admin will verify your win.')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof.')
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#888] text-sm mt-1">
            Welcome back, {user?.name}. Log your latest 5 golf scores.
          </p>
        </div>

        <Alert message={error} />
        <Alert message={success} type="success" />

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-white font-semibold mb-4">
              {editingId ? 'Edit Score' : 'Add Score'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormField
                label="Score (1–45)"
                type="number"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="Enter your score"
                min={1}
                max={45}
              />
              <FormField
                label="Date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Score'}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={cancelEdit} className="flex-1">
                    Cancel
                  </Button>
                )}
              </div>
            </form>
            <p className="text-[#888] text-xs mt-4">
              Only your latest 5 scores are kept. One score per date.
            </p>
          </Card>

          <Card>
            <h2 className="text-white font-semibold mb-4">
              Your Scores ({scores.length}/5)
            </h2>
            {scores.length === 0 ? (
              <p className="text-[#888] text-sm">No scores yet. Add your first round above.</p>
            ) : (
              <div className="space-y-3">
                {scores.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-elevated rounded-lg px-4 py-3 border border-border"
                  >
                    <div>
                      <span className="text-white font-bold text-lg">{s.score}</span>
                      <span className="text-[#888] text-sm ml-3">{s.date}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-accent text-sm hover:text-[#00b386]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-6">
          <div className="grid sm:grid-cols-3 gap-6">
            <Card>
              <p className="text-[#888] text-sm mb-2">Subscription status</p>
              <p className="text-white font-bold text-xl capitalize">{user?.subscription_status || 'inactive'}</p>
              <p className="text-[#888] text-sm mt-2">Renewal: {user?.subscription_end_date || 'N/A'}</p>
              {user?.subscription_status === 'active' && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="text-red-300 text-xs mt-3 hover:text-red-200"
                >
                  Cancel at period end
                </button>
              )}
            </Card>
            <Card>
              <p className="text-[#888] text-sm mb-2">Charity</p>
              <p className="text-white font-bold text-xl">{user?.charity_name || 'None selected'}</p>
              <p className="text-[#888] text-sm mt-2">Contribution: {user?.charity_percentage || 10}%</p>
            </Card>
            <Card>
              <p className="text-[#888] text-sm mb-2">Draw tickets entered</p>
              <p className="text-white font-bold text-xl">{scores.length}</p>
              <p className="text-[#888] text-sm mt-2">Latest draw: {draws[0]?.month || 'N/A'}/{draws[0]?.year || ''}</p>
            </Card>
          </div>

          <Card>
            <h2 className="text-white font-semibold mb-4">Profile settings</h2>
            <form onSubmit={handleProfileSubmit} className="grid sm:grid-cols-3 gap-4 items-end">
              <FormField
                label="Name"
                value={activeProfileForm.name}
                onChange={e => setProfileForm(p => ({ ...(p ?? activeProfileForm), name: e.target.value }))}
              />

              <Button type="submit">Save Profile</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-white font-semibold mb-4">Draw Results</h2>
            {results.length === 0 ? (
              <p className="text-[#888] text-sm">No draw results yet. Check back after the next draw.</p>
            ) : (
              <div className="space-y-3">
                {results.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-elevated rounded-lg px-4 py-3 border border-border"
                  >
                    <div>
                      <span className="text-white font-medium">
                        {r.draws?.month}/{r.draws?.year}
                      </span>
                      <span className="text-[#888] text-sm ml-3">{r.match_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-accent font-bold">
                        ${r.prize_amount?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-[#888] text-xs block capitalize">{r.status}</span>
                    </div>
                    {['pending', 'rejected'].includes(r.status) && (
                      <div className="flex flex-col gap-2 min-w-48">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          onChange={e => setProofFiles(p => ({ ...p, [r.id]: e.target.files?.[0] }))}
                          className="text-[#888] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleProofSubmit(r.id)}
                          className="text-accent text-xs text-left hover:text-[#00b386]"
                        >
                          Upload proof
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
