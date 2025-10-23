import express from 'express';
import PracticeSession from '../models/PracticeSession.js';
import Speech from '../models/Speech.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST - Save practice session (MongoDB version)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const {
      speechId,
      transcript,
      score,
      wordCount,
      fillerWordCount,
      sentenceCount,
      feedback,
      duration
    } = req.body;

    if (!transcript || score === undefined || !wordCount) {
      return res.status(400).json({
        success: false,
        error: 'Transcript, score, and word count are required'
      });
    }

    // Create practice session
    const session = new PracticeSession({
      userId,
      speechId: speechId || null,
      transcript,
      score,
      wordCount,
      fillerWordCount,
      sentenceCount,
      feedback,
      duration
    });

    await session.save();

    // If practicing a saved speech, update its practice count
    if (speechId) {
      await Speech.findByIdAndUpdate(speechId, {
        $inc: { practiceCount: 1 },
        lastPracticedAt: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Practice session saved',
      session
    });

  } catch (error) {
    console.error('Error saving practice session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save practice session'
    });
  }
});

// POST - Save practice session (Legacy in-memory version - for backward compatibility)
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const { transcript, feedback, wordCount, sentenceCount, score } = req.body;

    // Create practice session in MongoDB
    const session = new PracticeSession({
      userId,
      transcript,
      feedback,
      wordCount,
      sentenceCount,
      score: score || 0,
      fillerWordCount: 0,
      duration: 0
    });

    await session.save();

    res.json({
      success: true,
      message: "Practice session saved!",
      session: {
        id: session._id,
        userId: session.userId,
        transcript: session.transcript,
        feedback: session.feedback,
        wordCount: session.wordCount,
        sentenceCount: session.sentenceCount,
        date: session.practiceDate
      }
    });
  } catch (error) {
    console.error("❌ Save Error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving practice session",
      error: error.message,
    });
  }
});

// GET - Get all practice sessions for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    
    const sessions = await PracticeSession.find({ userId })
      .sort({ practiceDate: -1 })
      .populate('speechId', 'title');

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch practice sessions'
    });
  }
});

// GET - Get user's practice history (Legacy format - for backward compatibility)
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    
    console.log("🔍 User ID:", userId);
    
    const sessions = await PracticeSession.find({ userId })
      .sort({ practiceDate: -1 });

    console.log("✅ User sessions found:", sessions.length);

    // Transform to legacy format
    const userSessions = sessions.map(session => ({
      id: session._id,
      userId: session.userId,
      transcript: session.transcript,
      feedback: session.feedback,
      wordCount: session.wordCount,
      sentenceCount: session.sentenceCount,
      date: session.practiceDate
    }));

    res.json({
      success: true,
      sessions: userSessions
    });
  } catch (error) {
    console.error("❌ History Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching practice history",
      error: error.message,
    });
  }
});

// GET - Get progress stats for user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    
    const sessions = await PracticeSession.find({ userId })
      .sort({ practiceDate: 1 });

    if (sessions.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalPractices: 0,
          firstScore: 0,
          latestScore: 0,
          bestScore: 0,
          averageScore: 0,
          improvement: 0,
          totalWords: 0,
          avgFillerWords: 0,
          practiceStreak: 0
        }
      });
    }

    // Calculate stats
    const totalPractices = sessions.length;
    const firstScore = sessions[0].score;
    const latestScore = sessions[sessions.length - 1].score;
    const bestScore = Math.max(...sessions.map(s => s.score));
    const averageScore = sessions.reduce((sum, s) => sum + s.score, 0) / totalPractices;
    const improvement = latestScore - firstScore;
    const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
    const avgFillerWords = sessions.reduce((sum, s) => sum + s.fillerWordCount, 0) / totalPractices;

    // Calculate practice streak (consecutive days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    const practiceDates = [...new Set(sessions.map(s => {
      const d = new Date(s.practiceDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    for (let i = 0; i < practiceDates.length; i++) {
      const practiceDate = new Date(practiceDates[i]);
      const diffDays = Math.floor((currentDate - practiceDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      success: true,
      stats: {
        totalPractices,
        firstScore: Math.round(firstScore),
        latestScore: Math.round(latestScore),
        bestScore: Math.round(bestScore),
        averageScore: Math.round(averageScore),
        improvement: Math.round(improvement),
        totalWords,
        avgFillerWords: Math.round(avgFillerWords),
        practiceStreak: streak,
        recentSessions: sessions.slice(-5).reverse()
      }
    });

  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate stats'
    });
  }
});

// DELETE - Delete a practice session
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id || req.user.userId || req.user._id;
    
    const session = await PracticeSession.findOneAndDelete({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting session",
      error: error.message,
    });
  }
});

export default router;