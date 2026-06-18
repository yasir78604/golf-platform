const supabase = require('../db/supabase')

const generateRandomNumbers = (count, min, max) => {
  const numbers = new Set()
  while(numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }
  return Array.from(numbers)
}

const runDraw = async (drawId, type = 'random') => {
  try {
    let drawnNumbers = []

    if(type === 'random') {
      drawnNumbers = generateRandomNumbers(5, 1, 45)
    } else {
      // Algorithmic — weighted by most frequent scores
      const { data: allScores } = await supabase
        .from('scores')
        .select('score')

      const frequency = {}
      allScores.forEach(({ score }) => {
        frequency[score] = (frequency[score] || 0) + 1
      })

      drawnNumbers = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([num]) => Number(num))

      if(drawnNumbers.length < 5) {
        const extras = generateRandomNumbers(
          5 - drawnNumbers.length, 1, 45
        )
        drawnNumbers = [...new Set([...drawnNumbers, ...extras])]
          .slice(0, 5)
      }
    }

    // Update draw with numbers
    await supabase
      .from('draws')
      .update({ drawn_numbers: drawnNumbers })
      .eq('id', drawId)

    return drawnNumbers

  } catch(err) {
    throw err
  }
}

const findWinners = async (drawId, drawnNumbers) => {
  try {
    // Get all active subscribers with their scores
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('subscription_status', 'active')

    const winners = []

    for(const user of users) {
      const { data: scores } = await supabase
        .from('scores')
        .select('score')
        .eq('user_id', user.id)

      const userScores = scores.map(s => s.score)
      const matches = userScores.filter(s => 
        drawnNumbers.includes(s)
      ).length

      if(matches >= 3) {
        winners.push({
          user_id: user.id,
          draw_id: drawId,
          match_type: matches >= 5 ? '5-match'
                    : matches >= 4 ? '4-match'
                    : '3-match',
          matches
        })
      }
    }

    return winners
  } catch(err) {
    throw err
  }
}

const calculatePrizes = async (drawId, winners) => {
  try {
    // Get prize pool
    const { data: pool } = await supabase
      .from('prize_pools')
      .select()
      .eq('draw_id', drawId)
      .single()

    if(!pool) return winners

    const fiveMatchWinners = winners.filter(w => 
      w.match_type === '5-match'
    )
    const fourMatchWinners = winners.filter(w => 
      w.match_type === '4-match'
    )
    const threeMatchWinners = winners.filter(w => 
      w.match_type === '3-match'
    )

    // Calculate prize per winner
    const fivePrize = fiveMatchWinners.length > 0
      ? (pool.five_match_pool + pool.jackpot_rollover) / fiveMatchWinners.length
      : 0

    const fourPrize = fourMatchWinners.length > 0
      ? pool.four_match_pool / fourMatchWinners.length
      : 0

    const threePrize = threeMatchWinners.length > 0
      ? pool.three_match_pool / threeMatchWinners.length
      : 0

    // Assign prizes
    return winners.map(w => ({
      ...w,
      prize_amount: w.match_type === '5-match' ? fivePrize
                  : w.match_type === '4-match' ? fourPrize
                  : threePrize
    }))

  } catch(err) {
    throw err
  }
}

module.exports = { runDraw, findWinners, calculatePrizes }