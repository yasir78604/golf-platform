const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const supabase = require('../db/supabase')

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    // Check existing user
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Supabase existing user check failed:', existingError)
      return res.status(500).json({ message: 'Database error when checking user' })
    }

    if (existing) {
      return res.status(409).json({
        message: 'Email already registered'
      })
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({ email, password: hash, name })
      .select()
      .single()

    if (error) {
      console.error('Supabase user insert failed:', error)
      return res.status(500).json({ message: 'Database error when creating user' })
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(201).json({
      message: 'Registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status
      }
    })

  } catch (err) {
    console.error('Registration failed:', err)
    res.status(500).json({
      message: err.message || 'Server error during registration'
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single()

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      })
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({
        message: "Invalid credentials"
      })
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status
      }
    })

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const logout = async (req, res) => {
  res.clearCookie('token')
  res.status(200).json({ message: "Logged out successfully" })
}

const getMe = async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, subscription_status, subscription_plan, subscription_end_date, charity_id, charity_percentage')
      .eq('id', req.user.id)
      .single()

    if (user?.charity_id) {
      const { data: charity } = await supabase
        .from('charities')
        .select('name')
        .eq('id', user.charity_id)
        .single()

      user.charity_name = charity?.name || null
    }

    res.status(200).json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { register, login, logout, getMe }