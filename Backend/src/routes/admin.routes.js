const express = require('express')
const {
  getUsers,
  createDraw, executeDraw, publishDraw,
  getDrawsAdmin, previewDraw,
  getWinners, verifyWinner,
  manageCharity, getAnalytics
} = require('../controllers/admin.controller')
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()

// Users
router.get('/users', adminMiddleware, getUsers)

// Draws
router.get('/draws', adminMiddleware, getDrawsAdmin)
router.post('/draws', adminMiddleware, createDraw)
router.post('/draws/simulate', adminMiddleware, previewDraw)
router.post('/draws/:id/execute', adminMiddleware, executeDraw)
router.post('/draws/:id/publish', adminMiddleware, publishDraw)

// Winners
router.get('/winners', adminMiddleware, getWinners)
router.patch('/winners/:id', adminMiddleware, verifyWinner)

// Charities
router.post('/charities', adminMiddleware, manageCharity)
router.patch('/charities/:id', adminMiddleware, manageCharity)
router.delete('/charities/:id', adminMiddleware, manageCharity)

// Analytics
router.get('/analytics', adminMiddleware, getAnalytics)

module.exports = router
