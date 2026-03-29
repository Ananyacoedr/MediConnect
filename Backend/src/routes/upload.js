const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const { requireAuth } = require('../middleware/auth')

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    // multer-storage-cloudinary attaches 'path' as the fully qualified cloudinary delivery URL
    res.status(200).json({ url: req.file.path })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
