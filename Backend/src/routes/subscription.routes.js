const express = require('express')
const { createCheckout, getSubscription } = require('../controllers/subscription.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/checkout', authMiddleware, createCheckout)
router.get('/', authMiddleware, getSubscription)

module.exports = router
