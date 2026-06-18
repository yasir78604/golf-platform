const express = require('express')
const { getCharities, selectCharity } = require('../controllers/charity.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', getCharities)
router.post('/select', authMiddleware, selectCharity)

module.exports = router