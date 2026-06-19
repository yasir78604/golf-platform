const supabase = require('../db/supabase')

const validateScoreInput = (score, date) => {
  if (!Number.isInteger(Number(score)) || Number(score) < 1 || Number(score) > 45) {
    return 'Score must be a whole number between 1 and 45'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return 'A valid score date is required'
  }
  if (new Date(`${date}T23:59:59Z`) > new Date()) {
    return 'Score date cannot be in the future'
  }
  return null
}

const addScore = async (req, res) => {
  try {
    const { score, date } = req.body
    const userId = req.user.id

    const validationError = validateScoreInput(score, date)
    if (validationError) return res.status(400).json({ message: validationError })

    // Check duplicate date
    const { data: existing } = await supabase
      .from('scores')
      .select()
      .eq('user_id', userId)
      .eq('date', date)

    if (existing && existing.length > 0) {
      return res.status(409).json({
        message: "Score already exists for this date"
      })
    }

    // Get current scores oldest first
    const { data: scores } = await supabase
      .from('scores')
      .select()
      .eq('user_id', userId)
      .order('date', { ascending: true })

    // Delete oldest if already 5
    if (scores && scores.length >= 5) {
      await supabase
        .from('scores')
        .delete()
        .eq('id', scores[0].id)
    }

    // Insert new score
    const { data: newScore, error } = await supabase
      .from('scores')
      .insert({ user_id: userId, score: Number(score), date })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      message: "Score added successfully",
      score: newScore
    })

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getScores = async (req, res) => {
  try {
    const { data: scores } = await supabase
      .from('scores')
      .select()
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })

    res.status(200).json({ scores })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateScore = async (req, res) => {
  try {
    const { id } = req.params
    const { score, date } = req.body

    const validationError = validateScoreInput(score, date)
    if (validationError) return res.status(400).json({ message: validationError })

    const { data: duplicate } = await supabase
      .from('scores')
      .select()
      .eq('user_id', req.user.id)
      .eq('date', date)
      .neq('id', id)
      .single()

    if (duplicate) {
      return res.status(409).json({
        message: "A score for this date already exists"
      })
    }

    const { data, error } = await supabase
      .from('scores')
      .update({ score: Number(score), date })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({
      message: "Score updated",
      score: data
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const deleteScore = async (req, res) => {
  try {
    const { id } = req.params

    await supabase
      .from('scores')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    res.status(200).json({ message: "Score deleted" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { addScore, getScores, updateScore, deleteScore }
