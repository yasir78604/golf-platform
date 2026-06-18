const jwt = require('jsonwebtoken')

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token

  if(!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch(err) {
    return res.status(401).json({ message: "Unauthorized" })
  }
}

const adminMiddleware = async (req, res, next) => {
  const token = req.cookies.token

  if(!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if(decoded.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" })
    }
    req.user = decoded
    next()
  } catch(err) {
    return res.status(401).json({ message: "Unauthorized" })
  }
}

const subscriptionMiddleware = async (req, res, next) => {
  const supabase = require('../db/supabase')

  try {
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status, subscription_end_date')
      .eq('id', req.user.id)
      .single()

    if(!user || user.subscription_status !== 'active') {
      return res.status(403).json({ 
        message: "Active subscription required" 
      })
    }

    next()
  } catch(err) {
    res.status(500).json({ message: "Server error" })
  }
}

module.exports = { 
  authMiddleware, 
  adminMiddleware, 
  subscriptionMiddleware 
}