const express = require('express')
const { createCheckout, stripeWebhook, getSubscription } = require('../controllers/subscription.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/checkout', authMiddleware, createCheckout)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)
router.get('/', authMiddleware, getSubscription)

module.exports = router