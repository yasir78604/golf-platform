const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth.routes')
const scoreRoutes = require('./routes/score.routes')
const drawRoutes = require('./routes/draw.routes')
const charityRoutes = require('./routes/charity.routes')
const subscriptionRoutes = require('./routes/subscription.routes')
const adminRoutes = require('./routes/admin.routes')
const { stripeWebhook } = require('./controllers/subscription.controller')

const app = express()

// Stripe signature verification requires the untouched request body. This route
// must be registered before express.json() parses all other JSON requests.
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// CORS configuration for local dev and production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean) // Remove undefined values

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}))

app.use('/api/auth', authRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/draws', drawRoutes)
app.use('/api/charities', charityRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/admin', adminRoutes)


module.exports = app
