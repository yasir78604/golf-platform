const supabase = require('../db/supabase')
const { runDraw, findWinners, calculatePrizes } = require('../services/draw.service')

const getUsers = async (req, res) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, role, subscription_status, subscription_plan, subscription_end_date, created_at')
      .order('created_at', { ascending: false })

    res.status(200).json({ users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const approveMembership = async (req, res) => {
  try {
    const { id } = req.params

    const { data: user } = await supabase
      .from('users')
      .select('id, subscription_status')
      .eq('id', id)
      .single()

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Find latest pending subscription for this user
    const { data: pendingSub, error: pendingSubError } = await supabase
      .from('subscriptions')
      .select('id, plan, end_date')
      .eq('user_id', id)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pendingSubError) {
      return res.status(500).json({ message: pendingSubError.message })
    }

    if (!pendingSub) {
      return res.status(400).json({ message: 'No subscription found to approve' })
    }

    // Activate membership
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_plan: pendingSub.plan,
        subscription_end_date: pendingSub.end_date || null
      })
      .eq('id', id)

    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', pendingSub.id)

    res.status(200).json({ message: 'Membership approved' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    res.status(200).json({ user: data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const createDraw = async (req, res) => {
  try {
    const { month, year, draw_type } = req.body

    // Calculate prize pool from active subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('amount')
      .eq('status', 'active')

    const totalPool = subs.reduce((sum, s) => sum + s.amount, 0)
    const basePool = totalPool * 0.9 // 10% to charity

    // Carry over rollover from last prize pool if present
    const { data: lastPool, error: lastPoolError } = await supabase
      .from('prize_pools')
      .select()
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastPoolError) {
      console.error('Failed to load last prize pool:', lastPoolError)
      return res.status(500).json({ message: 'Failed to calculate prize rollover' })
    }

    const rollover = lastPool?.jackpot_rollover || 0
    const prizePool = basePool + rollover

    const { data: draw, error } = await supabase
      .from('draws')
      .insert({ month, year, draw_type, total_pool: prizePool, status: 'draft' })
      .select()
      .single()

    if (error) throw error

    // Create prize pool record
    await supabase
      .from('prize_pools')
      .insert({
        draw_id: draw.id,
        total_amount: prizePool,
        five_match_pool: prizePool * 0.40,
        four_match_pool: prizePool * 0.35,
        three_match_pool: prizePool * 0.25,
        jackpot_rollover: rollover
      })

    res.status(201).json({ draw })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const executeDraw = async (req, res) => {
  try {
    const { id } = req.params
    const { draw_type } = req.body

    // Run draw
    const drawnNumbers = await runDraw(id, draw_type)

    // Find winners
    const winners = await findWinners(id, drawnNumbers)

    // Calculate prizes
    const winnersWithPrizes = await calculatePrizes(id, winners)

    // Save results
    if (winnersWithPrizes.length > 0) {
      await supabase
        .from('draw_results')
        .insert(winnersWithPrizes)
    }

    // Check jackpot rollover
    const fiveMatchWinners = winnersWithPrizes.filter(w =>
      w.match_type === '5-match'
    )

    const { data: pool, error: poolError } = await supabase
      .from('prize_pools')
      .select()
      .eq('draw_id', id)
      .single()

    if (poolError) {
      throw poolError
    }

    if (fiveMatchWinners.length === 0) {
      await supabase
        .from('prize_pools')
        .update({
          jackpot_rollover: pool.jackpot_rollover + pool.five_match_pool,
          five_match_pool: 0
        })
        .eq('draw_id', id)
    }

    await supabase
      .from('draws')
      .update({ status: 'completed' })
      .eq('id', id)

    res.status(200).json({
      message: "Draw executed",
      drawnNumbers,
      winners: winnersWithPrizes
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const publishDraw = async (req, res) => {
  try {
    const { id } = req.params

    await supabase
      .from('draws')
      .update({
        status: 'published',
        published_at: new Date()
      })
      .eq('id', id)

    res.status(200).json({ message: "Draw published" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getWinners = async (req, res) => {
  try {
    const { data: winners } = await supabase
      .from('draw_results')
      .select('*, users(email, name), draws(month, year)')
      .order('created_at', { ascending: false })

    res.status(200).json({ winners })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const verifyWinner = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    await supabase
      .from('draw_results')
      .update({
        status,
        verified_at: new Date()
      })
      .eq('id', id)

    res.status(200).json({ message: "Winner updated" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const manageCharity = async (req, res) => {
  try {
    const { action } = req.query

    if (action === 'create') {
      const { data } = await supabase
        .from('charities')
        .insert(req.body)
        .select()
        .single()
      return res.status(201).json({ charity: data })
    }

    if (action === 'update') {
      const { id } = req.params
      const { data } = await supabase
        .from('charities')
        .update(req.body)
        .eq('id', id)
        .select()
        .single()
      return res.status(200).json({ charity: data })
    }

    if (action === 'delete') {
      const { id } = req.params
      await supabase
        .from('charities')
        .delete()
        .eq('id', id)
      return res.status(200).json({ message: "Deleted" })
    }

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getAnalytics = async (req, res) => {
  try {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeSubscribers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    const { data: pools } = await supabase
      .from('prize_pools')
      .select('total_amount')

    const totalPrizePool = pools.reduce(
      (sum, p) => sum + p.total_amount, 0
    )

    const { count: totalDraws } = await supabase
      .from('draws')
      .select('*', { count: 'exact', head: true })

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('amount')
      .eq('status', 'active')

    const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0)
    const charityContribution = totalRevenue * 0.10

    res.status(200).json({
      totalUsers,
      activeSubscribers,
      totalPrizePool,
      totalDraws,
      totalRevenue,
      charityContribution
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = {
  getUsers,
  updateUser,
  createDraw,
  executeDraw,
  publishDraw,
  getWinners,
  verifyWinner,
  manageCharity,
  getAnalytics,
  approveMembership
}

