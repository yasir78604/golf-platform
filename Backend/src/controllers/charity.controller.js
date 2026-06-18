const supabase = require('../db/supabase')

const getCharities = async (req, res) => {
  try {
    const { data: charities } = await supabase
      .from('charities')
      .select()
      .order('featured', { ascending: false })

    res.status(200).json({ charities })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

const selectCharity = async (req, res) => {
  try {
    const { charity_id, charity_percentage } = req.body

    if(charity_percentage < 10) {
      return res.status(400).json({ 
        message: "Minimum charity contribution is 10%" 
      })
    }

    await supabase
      .from('users')
      .update({ charity_id, charity_percentage })
      .eq('id', req.user.id)

    res.status(200).json({ 
      message: "Charity updated successfully" 
    })
  } catch(err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getCharities, selectCharity }