const supabase = require('../db/supabase')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const getFrontendUrl = () => process.env.FRONTEND_URL?.trim().replace(/\/+$/, '')

const getCharities = async (req, res) => {
  try {
    const { search = '', category = '', featured = '' } = req.query
    let query = supabase
      .from('charities')
      .select()
      .order('featured', { ascending: false })
      .order('name', { ascending: true })

    if (search) query = query.ilike('name', `%${search}%`)
    if (category) query = query.eq('category', category)
    if (featured === 'true') query = query.eq('featured', true)

    const { data: charities, error } = await query
    if (error) throw error

    res.status(200).json({ charities })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

const selectCharity = async (req, res) => {
  try {
    const { charity_id, charity_percentage } = req.body
    const percentage = Number(charity_percentage)

    if(!Number.isFinite(percentage) || percentage < 10 || percentage > 100) {
      return res.status(400).json({ 
        message: "Charity contribution must be between 10% and 100%" 
      })
    }

    if (charity_id) {
      const { data: charity, error: charityError } = await supabase
        .from('charities')
        .select('id')
        .eq('id', charity_id)
        .single()

      if (charityError) throw charityError
      if (!charity) return res.status(404).json({ message: 'Charity not found' })
    }

    await supabase
      .from('users')
      .update({ charity_id, charity_percentage: percentage })
      .eq('id', req.user.id)

    res.status(200).json({ 
      message: "Charity updated successfully" 
    })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

const createDonationCheckout = async (req, res) => {
  try {
    const { id } = req.params
    const { amount } = req.body
    const donationAmount = Math.round(Number(amount) * 100)

    if (!Number.isInteger(donationAmount) || donationAmount < 100) {
      return res.status(400).json({ message: 'Donation amount must be at least $1.00' })
    }

    const { data: charity, error } = await supabase
      .from('charities')
      .select('id, name')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!charity) return res.status(404).json({ message: 'Charity not found' })

    const frontendUrl = getFrontendUrl()
    if (!frontendUrl) return res.status(500).json({ message: 'Frontend URL is not configured.' })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user?.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Donation to ${charity.name}` },
          unit_amount: donationAmount
        },
        quantity: 1
      }],
      success_url: `${frontendUrl}/charities?donation=success`,
      cancel_url: `${frontendUrl}/charities`,
      metadata: {
        user_id: req.user?.id || '',
        charity_id: charity.id,
        amount: String(Number(amount))
      }
    })

    await supabase.from('donations').insert({
      user_id: req.user?.id || null,
      charity_id: charity.id,
      amount: Number(amount),
      stripe_session_id: session.id,
      status: 'pending'
    })

    res.status(200).json({ url: session.url })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getCharities, selectCharity, createDonationCheckout }
