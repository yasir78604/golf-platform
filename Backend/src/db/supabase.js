const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Your master admin key

// 1. Standard client for read-only or client-safe actions
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Admin client that completely bypasses RLS rules for background webhooks
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Export both clients so your app can use them conditionally
module.exports = { supabase, supabaseAdmin }