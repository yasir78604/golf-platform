const supabase = require('../db/supabase')

const SCORE_MIN = 1
const SCORE_MAX = 45
const DRAW_SIZE = 5

const normaliseDrawType = (type = 'random') => {
  if (['frequency', 'frequency-most', 'weighted'].includes(type)) return 'frequency-most'
  if (['frequency-least', 'least'].includes(type)) return 'frequency-least'
  return 'random'
}

const generateRandomNumbers = (count = DRAW_SIZE, min = SCORE_MIN, max = SCORE_MAX, exclude = []) => {
  const numbers = new Set(exclude)
  while (numbers.size < count + exclude.length && numbers.size < max - min + 1) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return Array.from(numbers).filter(number => !exclude.includes(number)).slice(0, count)
}

const getScoreFrequency = async () => {
  const { data, error } = await supabase
    .from('scores')
    .select('score')

  if (error) throw error

  return (data || []).reduce((frequency, row) => {
    const score = Number(row.score)
    if (score >= SCORE_MIN && score <= SCORE_MAX) {
      frequency[score] = (frequency[score] || 0) + 1
    }
    return frequency
  }, {})
}

const generateDrawNumbers = async (type = 'random') => {
  const drawType = normaliseDrawType(type)

  if (drawType === 'random') {
    return generateRandomNumbers(DRAW_SIZE)
  }

  const frequency = await getScoreFrequency()
  const ranked = Array.from({ length: SCORE_MAX }, (_, index) => index + 1)
    .map(score => ({ score, count: frequency[score] || 0 }))
    .sort((a, b) => {
      if (drawType === 'frequency-least') return a.count - b.count || a.score - b.score
      return b.count - a.count || a.score - b.score
    })
    .map(item => item.score)

  const selected = ranked.slice(0, DRAW_SIZE)
  if (selected.length < DRAW_SIZE) {
    return [...selected, ...generateRandomNumbers(DRAW_SIZE - selected.length, SCORE_MIN, SCORE_MAX, selected)]
  }

  return selected
}

const runDraw = async (drawId, type = 'random') => {
  const drawnNumbers = await generateDrawNumbers(type)

  const { error } = await supabase
    .from('draws')
    .update({
      drawn_numbers: drawnNumbers,
      draw_type: normaliseDrawType(type),
      executed_at: new Date().toISOString()
    })
    .eq('id', drawId)

  if (error) throw error
  return drawnNumbers
}

const findWinners = async (drawId, drawnNumbers) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .eq('subscription_status', 'active')

  if (error) throw error

  const winners = []

  for (const user of users || []) {
    const { data: scores, error: scoreError } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(DRAW_SIZE)

    if (scoreError) throw scoreError

    const userScores = (scores || []).map(s => Number(s.score))
    const matches = userScores.filter(s => drawnNumbers.includes(s)).length

    if (matches >= 3) {
      winners.push({
        user_id: user.id,
        draw_id: drawId,
        match_type: matches >= 5 ? '5-match' : matches >= 4 ? '4-match' : '3-match',
        matches,
        status: 'pending',
        payout_status: 'pending'
      })
    }
  }

  return winners
}

const calculatePrizes = async (drawId, winners = []) => {
  const { data: pool, error } = await supabase
    .from('prize_pools')
    .select()
    .eq('draw_id', drawId)
    .single()

  if (error) throw error
  if (!pool) return winners

  const fiveMatchWinners = winners.filter(w => w.match_type === '5-match')
  const fourMatchWinners = winners.filter(w => w.match_type === '4-match')
  const threeMatchWinners = winners.filter(w => w.match_type === '3-match')

  const fivePrize = fiveMatchWinners.length > 0
    ? Number(pool.five_match_pool || 0) / fiveMatchWinners.length
    : 0
  const fourPrize = fourMatchWinners.length > 0
    ? Number(pool.four_match_pool || 0) / fourMatchWinners.length
    : 0
  const threePrize = threeMatchWinners.length > 0
    ? Number(pool.three_match_pool || 0) / threeMatchWinners.length
    : 0

  return winners.map(w => ({
    ...w,
    prize_amount: w.match_type === '5-match' ? fivePrize
      : w.match_type === '4-match' ? fourPrize
      : threePrize
  }))
}

const simulateDraw = async (type = 'random') => {
  const drawnNumbers = await generateDrawNumbers(type)
  const winners = await findWinners(null, drawnNumbers)
  return {
    draw_type: normaliseDrawType(type),
    drawnNumbers,
    winnerSummary: {
      fiveMatch: winners.filter(w => w.match_type === '5-match').length,
      fourMatch: winners.filter(w => w.match_type === '4-match').length,
      threeMatch: winners.filter(w => w.match_type === '3-match').length
    }
  }
}

module.exports = {
  generateDrawNumbers,
  generateRandomNumbers,
  runDraw,
  findWinners,
  calculatePrizes,
  simulateDraw,
  normaliseDrawType
}
