const express = require('express')
const { addScore, getScores, updateScore, deleteScore } = require('../controllers/score.controller')
const { authMiddleware, subscriptionMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', authMiddleware, subscriptionMiddleware, getScores)
router.post('/', authMiddleware, subscriptionMiddleware, addScore)
router.patch('/:id', authMiddleware, subscriptionMiddleware, updateScore)
router.delete('/:id', authMiddleware, subscriptionMiddleware, deleteScore)

module.exports = router  // ← make sure this line exists exactly like this