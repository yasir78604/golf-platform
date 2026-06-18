const supabase = require('../db/supabase')

const addScore = async (req, res) => {
  try {
    const { score, date } = req.body
    const userId = req.user.id

    // Validate score range
    if (score < 1 || score > 45) {
      return res.status(400).json({
        message: "Score must be between 1 and 45"
      })
    }

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
      .insert({ user_id: userId, score, date })
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

    if (score < 1 || score > 45) {
      return res.status(400).json({
        message: "Score must be between 1 and 45"
      })
    }

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
      .update({ score, date })
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