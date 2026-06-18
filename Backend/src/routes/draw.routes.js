const express = require('express')
const { getDraws, getDrawById, getMyResults } = require('../controllers/draw.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', authMiddleware, getDraws)
router.get('/my-results', authMiddleware, getMyResults)
router.get('/:id', authMiddleware, getDrawById)

module.exports = router