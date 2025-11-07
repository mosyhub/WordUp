import express from 'express';
import PracticeSession from '../models/PracticeSession.js';
import Speech from '../models/Speech.js';
import { authenticateToken } from '../middleware/auth.js';
import { getAIFeedback } from '../utils/aiFeedback.js';

const router = express.Router();

// SAVE PRACTICE SESSION WITH DETAILED SCORES
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { speechId, transcript, duration } = req.body;
    const userId = req.user.userId;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transcript is required' 
      });
    }

    // Get AI feedback with detailed criteria scores
    const aiResult = await getAIFeedback(transcript);

    if (!aiResult.success || !aiResult.structured) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get AI feedback' 
      });
    }

    const feedbackData = aiResult.data;

    // Create practice session with detailed scores
    const practiceSession = new PracticeSession({
      userId,
      speechId: speechId || null,
      transcript,
      score: feedbackData.overallScore,
      
      // SAVE DETAILED CRITERIA SCORES
      detailedScores: {
        clarity: {
          score: feedbackData.metrics.clarity?.score || 0,
          feedback: feedbackData.metrics.clarity?.feedback || ''
        },
        pace: {
          score: feedbackData.metrics.pace?.score || 0,
          feedback: feedbackData.metrics.pace?.feedback || ''
        },
        fillerWords: {
          score: feedbackData.metrics.fillerWords?.score || 0,
          feedback: feedbackData.metrics.fillerWords?.feedback || ''
        },
        vocabulary: {
          score: feedbackData.metrics.vocabulary?.score || 0,
          feedback: feedbackData.metrics.vocabulary?.feedback || ''
        },
        structure: {
          score: feedbackData.metrics.structure?.score || 0,
          feedback: feedbackData.metrics.structure?.feedback || ''
        }
      },

      // SAVE SPEECH METRICS
      metrics: {
        wordCount: feedbackData.stats?.wordCount || 0,
        sentenceCount: feedbackData.stats?.sentenceCount || 0,
        fillerWordCount: feedbackData.stats?.fillerWordCount || 0,
        wordsPerMinute: feedbackData.stats?.wordsPerMinute || 0,
        duration: duration || feedbackData.stats?.duration || 0
      },

      // SAVE FEEDBACK
      feedback: {
        strengths: feedbackData.strengths || [],
        improvements: feedbackData.improvements || [],
        overallFeedback: JSON.stringify(feedbackData)
      },

      practiceDate: new Date()
    });

    await practiceSession.save();

    // Update speech practice count if speechId is provided
    if (speechId) {
      await Speech.findByIdAndUpdate(speechId, {
        $inc: { practiceCount: 1 },
        lastPracticedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Practice session saved successfully',
      data: {
        sessionId: practiceSession._id,
        score: practiceSession.score,
        detailedScores: practiceSession.detailedScores,
        feedback: {
          strengths: feedbackData.strengths,
          improvements: feedbackData.improvements
        }
      }
    });

  } catch (error) {
    console.error('Error saving practice:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET PRACTICE HISTORY FOR A SPEECH
router.get('/speech/:speechId', authenticateToken, async (req, res) => {
  try {
    const { speechId } = req.params;
    const userId = req.user.userId;

    const practices = await PracticeSession.find({ 
      userId, 
      speechId 
    })
      .sort({ practiceDate: 1 })
      .select('score detailedScores metrics practiceDate createdAt');

    res.json({
      success: true,
      practices
    });

  } catch (error) {
    console.error('Error fetching practice history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET ALL PRACTICE SESSIONS FOR USER
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;

    const practices = await PracticeSession.find({ userId })
      .sort({ practiceDate: -1 })
      .limit(limit)
      .populate('speechId', 'title')
      .select('score detailedScores metrics practiceDate speechId');

    res.json({
      success: true,
      practices
    });

  } catch (error) {
    console.error('Error fetching practice history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET SINGLE PRACTICE SESSION DETAILS
router.get('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const practice = await PracticeSession.findOne({ 
      _id: sessionId, 
      userId 
    })
      .populate('speechId', 'title originalDraft');

    if (!practice) {
      return res.status(404).json({ 
        success: false, 
        error: 'Practice session not found' 
      });
    }

    res.json({
      success: true,
      practice
    });

  } catch (error) {
    console.error('Error fetching practice:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE PRACTICE SESSION
router.delete('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const practice = await PracticeSession.findOneAndDelete({ 
      _id: sessionId, 
      userId 
    });

    if (!practice) {
      return res.status(404).json({ 
        success: false, 
        error: 'Practice session not found' 
      });
    }

    // Decrement speech practice count if applicable
    if (practice.speechId) {
      await Speech.findByIdAndUpdate(practice.speechId, {
        $inc: { practiceCount: -1 }
      });
    }

    res.json({
      success: true,
      message: 'Practice session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting practice:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;