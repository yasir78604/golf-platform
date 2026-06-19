const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const supabase = require('../db/supabase')

const getFrontendUrl = () => process.env.FRONTEND_URL?.trim().replace(/\/+$/, '')

// const activateSubscriptionFromSession = async (session) => {
//   const { user_id, plan } = session.metadata || {}
//   if (!user_id || !plan) throw new Error('Checkout session is missing user metadata')

//   if (!['monthly', 'yearly'].includes(plan)) {
//     throw new Error('Checkout session has an invalid plan')
//   }

//   if (session.payment_status !== 'paid') {
//     throw new Error('Checkout session is not paid yet')
//   }

//   if (!session.subscription) {
//     throw new Error('Checkout session is missing subscription details')
//   }

//   const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription)
//   const endDate = new Date(stripeSubscription.current_period_end * 1000)
//   const startDate = new Date(stripeSubscription.current_period_start * 1000)

//   const { data: user, error: userError } = await supabase
//     .from('users')
//     .update({
//       subscription_status: 'active',
//       subscription_plan: plan,
//       subscription_end_date: endDate
//     })
//     .eq('id', user_id)
//     .select('id, email, name, country, role, subscription_status, subscription_plan, subscription_end_date, charity_id, charity_percentage')
//     .single()

//   if (userError) throw userError

//   const { error: subError } = await supabase
//     .from('subscriptions')
//     .upsert({
//       user_id,
//       plan,
//       amount: plan === 'monthly' ? 9.99 : 99.99,
//       stripe_session_id: session.id,
//       stripe_customer_id: session.customer,
//       stripe_subscription_id: session.subscription,
//       status: 'active',
//       start_date: startDate,
//       end_date: endDate,
//       cancel_at_period_end: stripeSubscription.cancel_at_period_end
//     }, { onConflict: 'stripe_session_id' })

//   if (subError) throw subError

//   return user
// }


const activateSubscriptionFromSession = async (session) => {
  console.log("========== START ==========")

  console.log("FULL SESSION:", session)

  const { user_id, plan } = session.metadata || {}

  console.log("USER ID:", user_id)
  console.log("PLAN:", plan)

  console.log("PAYMENT STATUS:", session.payment_status)

  console.log("SUBSCRIPTION ID:", session.subscription)

  const stripeSubscription =
    await stripe.subscriptions.retrieve(session.subscription)

  console.log("STRIPE SUB:", stripeSubscription)

  const endDate =
    new Date(stripeSubscription.current_period_end * 1000)

  console.log("UPDATING USER TABLE...")

  const { data: user, error: userError } =
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_end_date: endDate
      })
      .eq('id', user_id)
      .select()

  console.log("UPDATED USER:", user)

  if (userError) {
    console.log("USER ERROR:", userError)
    throw userError
  }

  console.log("========== DONE ==========")

  return user
}

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

    const frontendUrl = getFrontendUrl()
    if (!frontendUrl) {
      console.error('FRONTEND_URL is not configured')
      return res.status(500).json({ message: 'Frontend URL is not configured.' })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/payment-success?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing`,
      client_reference_id: req.user.id,
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

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      await activateSubscriptionFromSession(session)
    }

    if (event.type === 'invoice.paid' && event.data.object.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(event.data.object.subscription)
      const endDate = new Date(stripeSubscription.current_period_end * 1000)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .update({ status: 'active', end_date: endDate, cancel_at_period_end: stripeSubscription.cancel_at_period_end })
        .eq('stripe_subscription_id', stripeSubscription.id)
        .select('user_id')
        .maybeSingle()

      if (subscription?.user_id) {
        await supabase.from('users').update({ subscription_status: 'active', subscription_end_date: endDate }).eq('id', subscription.user_id)
      }
    }

    if (['customer.subscription.deleted', 'customer.subscription.paused'].includes(event.type)) {
      const stripeSubscription = event.data.object
      const { data: subscription } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', cancel_at_period_end: false })
        .eq('stripe_subscription_id', stripeSubscription.id)
        .select('user_id')
        .maybeSingle()

      if (subscription?.user_id) {
        await supabase.from('users').update({ subscription_status: 'inactive' }).eq('id', subscription.user_id)
      }
    }
  } catch (err) {
    console.error('Stripe webhook processing failed:', err)
    return res.status(500).json({ message: 'Webhook processing failed' })
  }

  res.status(200).json({ received: true })
}

const confirmCheckout = async (req, res) => {
  try {
    const { sessionId } = req.body

    console.log("SESSION ID:", sessionId)

    const session =
      await stripe.checkout.sessions.retrieve(sessionId)

    console.log("FULL SESSION:", session)

    console.log("METADATA:", session.metadata)

    const user =
      await activateSubscriptionFromSession(session)

    console.log("ACTIVATED USER:", user)

    res.status(200).json({
      message: 'Subscription activated',
      user
    })
  } catch (err) {
    console.log("CONFIRM CHECKOUT ERROR:", err)

    res.status(500).json({
      message: err.message
    })
  }
}

const getSubscription = async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select()
      .eq('user_id', req.user.id)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    res.status(200).json({ subscription: sub })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const cancelSubscription = async (req, res) => {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, end_date')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!subscription?.stripe_subscription_id) {
      return res.status(404).json({ message: 'No active Stripe subscription found' })
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, { cancel_at_period_end: true })
    await supabase.from('subscriptions').update({ cancel_at_period_end: true }).eq('id', subscription.id)

    res.status(200).json({
      message: 'Subscription will cancel at the end of the current billing period',
      end_date: subscription.end_date
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createCheckout, stripeWebhook, confirmCheckout, getSubscription, cancelSubscription }
