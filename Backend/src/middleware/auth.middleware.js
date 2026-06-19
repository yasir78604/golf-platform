const jwt = require('jsonwebtoken')
const supabase = require('../db/supabase')

const extractToken = (req) => {
  const cookieToken = req.cookies?.token
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null

  return cookieToken || bearerToken
}

const authMiddleware = async (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token'
    })
  }
}

const adminMiddleware = async (req, res, next) => {
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        message: 'Forbidden'
      })
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token'
    })
  }
}

const subscriptionMiddleware = async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status, subscription_end_date')
      .eq('id', req.user.id)
      .single()

    if (!user) {
      return res.status(403).json({
        message: 'Active subscription required'
      })
    }

    if (user.subscription_status !== 'active') {
      return res.status(403).json({
        message: 'Active subscription required'
      })
    }

    next()
  } catch (err) {
    return res.status(500).json({
      message: 'Server error'
    })
  }
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  subscriptionMiddleware
}