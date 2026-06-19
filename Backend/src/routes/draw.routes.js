const express = require('express')
const multer = require('multer')
const { getDraws, getDrawById, getMyResults, submitWinnerProof } = require('../controllers/draw.controller')
const { authMiddleware } = require('../middleware/auth.middleware')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, or PDF proof files are allowed'))
    }
    cb(null, true)
  }
})

router.get('/', authMiddleware, getDraws)
router.get('/my-results', authMiddleware, getMyResults)
router.post('/results/:id/proof', authMiddleware, upload.single('proof'), submitWinnerProof)
router.get('/:id', authMiddleware, getDrawById)

module.exports = router
