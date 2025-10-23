const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/audio');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|ogg|webm|flac|mp4/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  }
});

// Upload audio file (no transcription on backend)
router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    console.log('📁 Audio file uploaded:', req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No audio file uploaded' 
      });
    }

    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Audio API is working! (Transcription happens client-side)' 
  });
});

module.exports = router;