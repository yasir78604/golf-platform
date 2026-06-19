const express = require('express')
const { getCharities, selectCharity, createDonationCheckout } = require('../controllers/charity.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', getCharities)
router.post('/select', authMiddleware, selectCharity)
router.post('/:id/donate', createDonationCheckout)

module.exports = router
