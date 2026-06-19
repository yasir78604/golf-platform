const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const supabase = require('../db/supabase')

const createCheckout = async (req, res) => {
  try {
    const { plan } = req.body

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected' })
    }

    const priceId = plan === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID

    if (!priceId || !priceId.startsWith('price_')) {
      console.error('Invalid Stripe price ID configured for plan:', plan, priceId)
      return res.status(500).json({
        message: 'Stripe price ID is not configured correctly. Use a valid price_... ID in the backend .env file.'
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        user_id: req.user.id,
        plan
      }
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('createCheckout error:', err)
    res.status(500).json({ message: err.message })
  }
}

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { user_id, plan } = session.metadata

    const endDate = plan === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    // Payment received, but membership is only activated after admin approval.
    await supabase
      .from('users')
      .update({
        subscription_status: 'pending',
        subscription_plan: plan,
        subscription_end_date: endDate
      })
      .eq('id', user_id)

    await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan,
        amount: plan === 'monthly' ? 9.99 : 99.99,
        stripe_session_id: session.id,
        status: 'pending',
        end_date: endDate
      })
  }

  res.status(200).json({ received: true })
}

const getSubscription = async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select()
      .eq('user_id', req.user.id)
      .in('status', ['active', 'pending'])
      .single()

    res.status(200).json({ subscription: sub })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createCheckout, stripeWebhook, getSubscription }