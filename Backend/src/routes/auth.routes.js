const express = require('express')
const { register, login, logout, getMe, updateProfile } = require('../controllers/auth.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authMiddleware, getMe)
router.patch('/me', authMiddleware, updateProfile)

module.exports = router
