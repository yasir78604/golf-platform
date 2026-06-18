const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth.routes')
const scoreRoutes = require('./routes/score.routes')
const drawRoutes = require('./routes/draw.routes')
const charityRoutes = require('./routes/charity.routes')
const subscriptionRoutes = require('./routes/subscription.routes')
const adminRoutes = require('./routes/admin.routes')



const app = express()

app.use(express.json())
app.use(cookieParser())

// CORS configuration for local dev and production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use('/api/auth', authRoutes)
app.use('/api/scores', scoreRoutes)
app.use('/api/draws', drawRoutes)
app.use('/api/charities', charityRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/admin', adminRoutes)


module.exports = app