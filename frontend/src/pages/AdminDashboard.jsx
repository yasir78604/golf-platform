import { useCallback, useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import {
  getAnalytics,
  getUsers,
  getAdminDraws,
  createDraw,
  simulateDraw,
  executeDraw,
  publishDraw,
  getWinners,
  verifyWinner,
  createCharity,
  updateCharity,
  deleteCharity,
} from '../services/admin'
import { getCharities } from '../services/charities'
import { UNSAFE_WithHydrateFallbackProps } from 'react-router-dom'

const tabs = ['Overview', 'Users', 'Draws', 'Winners', 'Charities']

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [draws, setDraws] = useState([])
  const [simulation, setSimulation] = useState(null)
  const [winners, setWinners] = useState([])
  const [charities, setCharities] = useState([])

  const [drawForm, setDrawForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    draw_type: 'random',
    drawId: '',
    executeType: 'random',
  })

  const [charityForm, setCharityForm] = useState({
    name: '',
    description: '',
    category: '',
    image_url: '',
    website_url: '',
    events_url: '',
    featured: false,
    editingId: null,
  })

  const loadTabData = useCallback(async (tab) => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'Overview') {
        const { data } = await getAnalytics()
        setAnalytics(data)
      } else if (tab === 'Users') {
        const { data } = await getUsers()
        setUsers(data.users || [])
      } else if (tab === 'Draws') {
        const { data } = await getAdminDraws()
        setDraws(data.draws || [])
      } else if (tab === 'Winners') {
        const { data } = await getWinners()
        setWinners(data.winners || [])
      } else if (tab === 'Charities') {
        const { data } = await getCharities()
        setCharities(data.charities || [])
      }
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) loadTabData(activeTab)
    })
    return () => {
      cancelled = true
    }
  }, [activeTab, loadTabData])

  useEffect(() => {
    if (activeTab !== 'Users') return

    const interval = setInterval(() => {
      loadTabData('Users')
    }, 5000)

    return () => clearInterval(interval)
  }, [activeTab, loadTabData])

  const handleCreateDraw = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const { data } = await createDraw(
        Number(drawForm.month),
        Number(drawForm.year),
        drawForm.draw_type
      )
      setDrawForm(prev => ({ ...prev, drawId: data.draw.id }))
      setSuccess(`Draw created. ID: ${data.draw.id}`)
      loadTabData('Draws')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create draw.')
    }
  }

  const handleExecuteDraw = async () => {
    if (!drawForm.drawId) return
    setError('')
    try {
      const { data } = await executeDraw(drawForm.drawId, drawForm.executeType)
      setSuccess(`Draw executed. ${data.winners?.length || 0} winners found.`)
      loadTabData('Draws')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute draw.')
    }
  }

  const handlePublishDraw = async () => {
    if (!drawForm.drawId) return
    setError('')
    try {
      await publishDraw(drawForm.drawId)
      setSuccess('Draw published.')
      loadTabData('Draws')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish draw.')
    }
  }

  const handleSimulateDraw = async () => {
    setError('')
    setSuccess('')
    try {
      const { data } = await simulateDraw(drawForm.executeType)
      setSimulation(data.simulation)
      setSuccess('Simulation ready. No live draw was changed.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to simulate draw.')
    }
  }

  const handleVerifyWinner = async (id, status) => {
    try {
      await verifyWinner(id, status)
      setSuccess(`Winner marked as ${status}.`)
      loadTabData('Winners')
    } catch {
      setError('Failed to update winner.')
    }
  }

  const handleCharitySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: charityForm.name,
        description: charityForm.description,
        category: charityForm.category,
        image_url: charityForm.image_url,
        website_url: charityForm.website_url,
        events_url: charityForm.events_url,
        featured: charityForm.featured,
      }

      if (charityForm.editingId) {
        await updateCharity(charityForm.editingId, payload)
        setSuccess('Charity updated.')
      } else {
        await createCharity(payload)
        setSuccess('Charity created.')
      }

      setCharityForm({
        name: '',
        description: '',
        category: '',
        image_url: '',
        website_url: '',
        events_url: '',
        featured: false,
        editingId: null
      })
      loadTabData('Charities')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save charity.')
    }
  }

  const handleEditCharity = (charity) => {
    setCharityForm({
      name: charity.name || '',
      description: charity.description || '',
      category: charity.category || '',
      image_url: charity.image_url || '',
      website_url: charity.website_url || '',
      events_url: charity.events_url || '',
      featured: charity.featured || false,
      editingId: charity.id,
    })
  }

  const handleDeleteCharity = async (id) => {
    if (!confirm('Delete this charity?')) return
    try {
      await deleteCharity(id)
      setSuccess('Charity deleted.')
      loadTabData('Charities')
    } catch {
      setError('Failed to delete charity.')
    }
  }

  const statCards = analytics
    ? [
      { label: 'Total Users', value: analytics.totalUsers },
      { label: 'Active Subscribers', value: analytics.activeSubscribers },
      { label: 'Total Prize Pool', value: `$${analytics.totalPrizePool?.toFixed(2) || '0'}` },
      { label: 'Total Draws', value: analytics.totalDraws },
    ]
    : []

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-[#888] text-sm mt-1">Manage users, draws, winners, and charities.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab
                ? 'bg-accent text-black'
                : 'bg-elevated text-[#888] border border-border hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Alert message={error} />
        <Alert message={success} type="success" />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <>
            {activeTab === 'Overview' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(stat => (
                  <Card key={stat.label} className="text-center">
                    <p className="text-[#888] text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'Users' && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#888] border-b border-border">
                        <th className="text-left py-3 pr-4">Name</th>
                        <th className="text-left py-3 pr-4">Email</th>
                        <th className="text-left py-3 pr-4">Role</th>
                        <th className="text-left py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-white">{u.name}</td>
                          <td className="py-3 pr-4 text-[#888]">{u.email}</td>
                          <td className="py-3 pr-4 text-[#888] capitalize">{u.role}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${u.subscription_status === 'active'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-elevated text-[#888]'
                              }`}>
                              {u.subscription_status || 'inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <p className="text-[#888] text-sm text-center py-6">No users found.</p>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'Draws' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-white font-semibold mb-4">Create Draw</h2>
                  <form onSubmit={handleCreateDraw} className="flex flex-col gap-4">
                    <FormField
                      label="Month"
                      type="number"
                      value={drawForm.month}
                      onChange={e => setDrawForm(p => ({ ...p, month: e.target.value }))}
                      min={1}
                      max={12}
                    />
                    <FormField
                      label="Year"
                      type="number"
                      value={drawForm.year}
                      onChange={e => setDrawForm(p => ({ ...p, year: e.target.value }))}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#888] text-sm font-medium">Draw Type</label>
                      <select
                        value={drawForm.draw_type}
                        onChange={e => setDrawForm(p => ({ ...p, draw_type: e.target.value }))}
                        className="w-full px-4 py-3 bg-elevated text-white rounded-lg border border-border focus:outline-none focus:border-accent"
                      >
                        <option value="random">Random</option>
                        <option value="frequency-most">Most Frequent Scores</option>
                        <option value="frequency-least">Least Frequent Scores</option>
                      </select>
                    </div>
                    <Button type="submit">Create Draw</Button>
                  </form>
                </Card>

                <Card>
                  <h2 className="text-white font-semibold mb-4">Execute & Publish</h2>
                  <div className="flex flex-col gap-4">
                    <FormField
                      label="Draw ID"
                      value={drawForm.drawId}
                      onChange={e => setDrawForm(p => ({ ...p, drawId: e.target.value }))}
                      placeholder="Enter draw ID"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[#888] text-sm font-medium">Execute Type</label>
                      <select
                        value={drawForm.executeType}
                        onChange={e => setDrawForm(p => ({ ...p, executeType: e.target.value }))}
                        className="w-full px-4 py-3 bg-elevated text-white rounded-lg border border-border focus:outline-none focus:border-accent"
                      >
                        <option value="random">Random</option>
                        <option value="frequency-most">Most Frequent Scores</option>
                        <option value="frequency-least">Least Frequent Scores</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSimulateDraw} variant="secondary" className="flex-1">
                        Simulate
                      </Button>
                      <Button onClick={handleExecuteDraw} variant="secondary" className="flex-1">
                        Execute
                      </Button>
                      <Button onClick={handlePublishDraw} className="flex-1">
                        Publish
                      </Button>
                    </div>
                    {simulation && (
                      <div className="bg-elevated rounded-lg border border-border p-4">
                        <p className="text-white text-sm font-semibold mb-2">
                          Simulated numbers: {simulation.drawnNumbers?.join(', ')}
                        </p>
                        <p className="text-[#888] text-xs">
                          5-match: {simulation.winnerSummary?.fiveMatch || 0} · 4-match: {simulation.winnerSummary?.fourMatch || 0} · 3-match: {simulation.winnerSummary?.threeMatch || 0}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="lg:col-span-2">
                  <h2 className="text-white font-semibold mb-4">Draw History</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[#888] border-b border-border">
                          <th className="text-left py-3 pr-4">Month</th>
                          <th className="text-left py-3 pr-4">Type</th>
                          <th className="text-left py-3 pr-4">Status</th>
                          <th className="text-left py-3 pr-4">Numbers</th>
                          <th className="text-left py-3">Pool</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draws.map(draw => (
                          <tr key={draw.id} className="border-b border-border/50">
                            <td className="py-3 pr-4 text-white">{draw.month}/{draw.year}</td>
                            <td className="py-3 pr-4 text-[#888]">{draw.draw_type}</td>
                            <td className="py-3 pr-4 text-[#888] capitalize">{draw.status}</td>
                            <td className="py-3 pr-4 text-[#888]">{draw.drawn_numbers?.join(', ') || 'Not run'}</td>
                            <td className="py-3 text-accent">${draw.total_pool?.toFixed?.(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {draws.length === 0 && (
                      <p className="text-[#888] text-sm text-center py-6">No draws created yet.</p>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Winners' && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#888] border-b border-border">
                        <th className="text-left py-3 pr-4">User</th>
                        <th className="text-left py-3 pr-4">Draw</th>
                        <th className="text-left py-3 pr-4">Match</th>
                        <th className="text-left py-3 pr-4">Prize</th>
                        <th className="text-left py-3 pr-4">Status</th>
                        <th className="text-left py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map(w => (
                        <tr key={w.id} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-white">{w.users?.name || w.users?.email}</td>
                          <td className="py-3 pr-4 text-[#888]">
                            {w.draws?.month}/{w.draws?.year}
                          </td>
                          <td className="py-3 pr-4 text-[#888]">{w.match_type}</td>
                          <td className="py-3 pr-4 text-accent">${w.prize_amount?.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-[#888] capitalize">{w.status}</td>
                          <td className="py-3">
                            {w.proof_url && (
                              <a
                                href={w.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#888] text-sm hover:text-white mr-3"
                              >
                                Proof
                              </a>
                            )}
                            {w.status !== 'verified' && (
                              <button
                                onClick={() => handleVerifyWinner(w.id, 'verified')}
                                className="text-accent text-sm hover:text-[#00b386] mr-3"
                              >
                                Verify
                              </button>
                            )}
                            
                            {<p className="text-green-300 text-sm hover:text-green-200 mr-3">Paid</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {winners.length === 0 && (
                    <p className="text-[#888] text-sm text-center py-6">No winners yet.</p>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'Charities' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-white font-semibold mb-4">
                    {charityForm.editingId ? 'Edit Charity' : 'Add Charity'}
                  </h2>
                  <form onSubmit={handleCharitySubmit} className="flex flex-col gap-4">
                    <FormField
                      label="Name"
                      value={charityForm.name}
                      onChange={e => setCharityForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Charity name"
                    />
                    <FormField
                      label="Description"
                      value={charityForm.description}
                      onChange={e => setCharityForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Short description"
                    />
                    <FormField
                      label="Category"
                      value={charityForm.category}
                      onChange={e => setCharityForm(p => ({ ...p, category: e.target.value }))}
                      placeholder="Youth golf, health, local community..."
                    />
                    <FormField
                      label="Image URL"
                      value={charityForm.image_url}
                      onChange={e => setCharityForm(p => ({ ...p, image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    <FormField
                      label="Website URL"
                      value={charityForm.website_url}
                      onChange={e => setCharityForm(p => ({ ...p, website_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    <FormField
                      label="Events URL"
                      value={charityForm.events_url}
                      onChange={e => setCharityForm(p => ({ ...p, events_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    <label className="flex items-center gap-2 text-[#888] text-sm">
                      <input
                        type="checkbox"
                        checked={charityForm.featured}
                        onChange={e => setCharityForm(p => ({ ...p, featured: e.target.checked }))}
                        className="accent-accent"
                      />
                      Featured charity
                    </label>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1">
                        {charityForm.editingId ? 'Update' : 'Create'}
                      </Button>
                      {charityForm.editingId && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCharityForm({
                            name: '',
                            description: '',
                            category: '',
                            image_url: '',
                            website_url: '',
                            events_url: '',
                            featured: false,
                            editingId: null
                          })}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>

                <Card>
                  <h2 className="text-white font-semibold mb-4">All Charities</h2>
                  <div className="space-y-3">
                    {charities.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between bg-elevated rounded-lg px-4 py-3 border border-border"
                      >
                        <div>
                          <span className="text-white font-medium">{c.name}</span>
                          {c.category && (
                            <span className="text-[#888] text-xs ml-2">{c.category}</span>
                          )}
                          {c.featured && (
                            <span className="text-accent text-xs ml-2">Featured</span>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditCharity(c)}
                            className="text-accent text-sm hover:text-[#00b386]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCharity(c.id)}
                            className="text-red-400 text-sm hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {charities.length === 0 && (
                      <p className="text-[#888] text-sm">No charities yet.</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default AdminDashboard
