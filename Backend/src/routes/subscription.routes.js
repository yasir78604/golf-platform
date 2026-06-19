const express = require('express')
const { createCheckout, confirmCheckout, getSubscription, cancelSubscription } = require('../controllers/subscription.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/checkout', authMiddleware, createCheckout)
router.post('/confirm-checkout', authMiddleware, confirmCheckout)
router.get('/', authMiddleware, getSubscription)
router.post('/cancel', authMiddleware, cancelSubscription)

module.exports = router
