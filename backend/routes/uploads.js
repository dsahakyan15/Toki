const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const audioDir = path.join(uploadsRoot, 'audio');
const imageDir = path.join(uploadsRoot, 'images');

fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(imageDir, { recursive: true });

const createStorage = (destination) =>
  multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    },
  });

const audioUpload = multer({ storage: createStorage(audioDir) });
const imageUpload = multer({ storage: createStorage(imageDir) });

/**
 * POST /api/uploads/track
 * Upload audio file
 */
router.post('/track', authenticateToken, audioUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  const fileUrl = `/uploads/audio/${req.file.filename}`;
  res.status(201).json({ fileUrl });
});

/**
 * POST /api/uploads/image
 * Upload cover image
 */
router.post('/image', authenticateToken, imageUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  const fileUrl = `/uploads/images/${req.file.filename}`;
  res.status(201).json({ fileUrl });
});

module.exports = router;
