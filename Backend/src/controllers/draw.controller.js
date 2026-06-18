const supabase = require('../db/supabase')
const { runDraw, findWinners, calculatePrizes } = require('../services/draw.service')

const getDraws = async (req, res) => {
  try {
    const { data: draws } = await supabase
      .from('draws')
      .select()
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    res.status(200).json({ draws })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

const getDrawById = async (req, res) => {
  try {
    const { id } = req.params

    const { data: draw } = await supabase
      .from('draws')
      .select()
      .eq('id', id)
      .single()

    const { data: results } = await supabase
      .from('draw_results')
      .select('*, users(email, name)')
      .eq('draw_id', id)

    res.status(200).json({ draw, results })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

const getMyResults = async (req, res) => {
  try {
    const { data: results } = await supabase
      .from('draw_results')
      .select('*, draws(month, year, drawn_numbers)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    res.status(200).json({ results })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getDraws, getDrawById, getMyResults }