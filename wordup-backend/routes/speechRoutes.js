import express from 'express';
import Speech from '../models/Speech.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET all speeches for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const speeches = await Speech.find({ userId })
      .sort({ updatedAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      speeches
    });

  } catch (error) {
    console.error('Error fetching speeches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch speeches'
    });
  }
});

// GET single speech by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const speech = await Speech.findOne({ 
      _id: req.params.id, 
      userId 
    });

    if (!speech) {
      return res.status(404).json({
        success: false,
        error: 'Speech not found'
      });
    }

    res.json({
      success: true,
      speech
    });

  } catch (error) {
    console.error('Error fetching speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch speech'
    });
  }
});

// POST create new speech
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { 
      title, 
      originalDraft, 
      improvedVersion, 
      aiSuggestions,
      analysis 
    } = req.body;

    if (!title || !originalDraft) {
      return res.status(400).json({
        success: false,
        error: 'Title and original draft are required'
      });
    }

    const speech = new Speech({
      userId,
      title,
      originalDraft,
      improvedVersion,
      aiSuggestions,
      analysis
    });

    await speech.save();

    res.status(201).json({
      success: true,
      message: 'Speech saved successfully',
      speech
    });

  } catch (error) {
    console.error('Error creating speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save speech'
    });
  }
});

// PUT update existing speech
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { 
      title, 
      originalDraft, 
      improvedVersion, 
      aiSuggestions,
      analysis 
    } = req.body;

    const speech = await Speech.findOne({ 
      _id: req.params.id, 
      userId 
    });

    if (!speech) {
      return res.status(404).json({
        success: false,
        error: 'Speech not found'
      });
    }

    if (title) speech.title = title;
    if (originalDraft) speech.originalDraft = originalDraft;
    if (improvedVersion) speech.improvedVersion = improvedVersion;
    if (aiSuggestions) speech.aiSuggestions = aiSuggestions;
    if (analysis) speech.analysis = analysis;

    await speech.save();

    res.json({
      success: true,
      message: 'Speech updated successfully',
      speech
    });

  } catch (error) {
    console.error('Error updating speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update speech'
    });
  }
});

// DELETE speech
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const speech = await Speech.findOneAndDelete({ 
      _id: req.params.id, 
      userId 
    });

    if (!speech) {
      return res.status(404).json({
        success: false,
        error: 'Speech not found'
      });
    }

    res.json({
      success: true,
      message: 'Speech deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete speech'
    });
  }
});

// POST increment practice count
router.post('/:id/practice', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const speech = await Speech.findOne({ 
      _id: req.params.id, 
      userId 
    });

    if (!speech) {
      return res.status(404).json({
        success: false,
        error: 'Speech not found'
      });
    }

    speech.practiceCount += 1;
    speech.lastPracticedAt = new Date();
    await speech.save();

    res.json({
      success: true,
      message: 'Practice recorded',
      practiceCount: speech.practiceCount
    });

  } catch (error) {
    console.error('Error recording practice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record practice'
    });
  }
});

export default router;