require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT || 3000

// Only listen if not running as serverless (Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app