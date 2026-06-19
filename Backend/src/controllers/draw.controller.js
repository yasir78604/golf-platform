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

const submitWinnerProof = async (req, res) => {
  try {
    const { id } = req.params

    const { data: result, error: resultError } = await supabase
      .from('draw_results')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (resultError) throw resultError
    if (!result) return res.status(404).json({ message: 'Winning result not found' })
    if (!req.file) return res.status(400).json({ message: 'Proof file is required' })

    const safeName = req.file.originalname.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()
    const proofPath = `${req.user.id}/${id}-${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(proofPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(proofPath)

    const { error: updateError } = await supabase
      .from('draw_results')
      .update({
        proof_url: publicData.publicUrl,
        proof_uploaded_at: new Date().toISOString(),
        status: 'proof_submitted',
        payout_status: 'pending'
      })
      .eq('id', result.id)

    if (updateError) throw updateError

    res.status(200).json({ message: 'Proof submitted', proof_url: publicData.publicUrl })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getDraws, getDrawById, getMyResults, submitWinnerProof }
