import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import PracticeSession from '../models/PracticeSession.js';

const router = express.Router();

// GET overall progress with detailed improvements
router.get('/overall', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const sessions = await PracticeSession.find({ userId })
      .sort({ practiceDate: 1 }) // Ascending for proper trend calculation
      .populate('speechId', 'title');

    if (sessions.length === 0) {
      return res.json({
        success: true,
        progress: {
          totalPractices: 0,
          latestScore: 0,
          bestScore: 0,
          averageScore: 0,
          improvement: 0,
          improvementTrend: [],
          criteriaProgress: null,
          metricsTrends: null,
          achievements: []
        }
      });
    }

    // Basic stats
    const scores = sessions.map(s => s.score);
    const firstScore = scores[0];
    const latestScore = scores[scores.length - 1];
    const bestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const improvement = latestScore - firstScore;

    // Improvement trend
    const improvementTrend = sessions.map((session, idx) => ({
      practice: idx + 1,
      score: Math.round(session.score),
      date: session.practiceDate
    }));

    // Criteria-based progress (assuming these exist in your PracticeSession model)
    const criteriaProgress = calculateCriteriaProgress(sessions);

    // Metrics trends
    const metricsTrends = {
      wordsPerMinute: sessions.map((s, idx) => ({
        practice: idx + 1,
        value: s.wordsPerMinute || 0
      })),
      fillerWordCount: sessions.map((s, idx) => ({
        practice: idx + 1,
        value: s.fillerWordCount || 0
      }))
    };

    // Achievements
    const achievements = calculateAchievements(sessions);

    res.json({
      success: true,
      progress: {
        totalPractices: sessions.length,
        firstScore: Math.round(firstScore),
        latestScore: Math.round(latestScore),
        bestScore: Math.round(bestScore),
        averageScore,
        improvement: Math.round(improvement),
        improvementPercent: firstScore > 0 ? Math.round((improvement / firstScore) * 100) : 0,
        improvementTrend,
        criteriaProgress,
        metricsTrends,
        achievements
      }
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate progress per criteria
function calculateCriteriaProgress(sessions) {
  const criteria = ['clarity', 'pace', 'vocabulary', 'structure', 'fillerWords'];
  const progress = {};

  criteria.forEach(criterion => {
    const scores = sessions
      .map(s => s.criteriaScores?.[criterion])
      .filter(score => score !== undefined && score !== null);

    if (scores.length > 0) {
      const firstScore = scores[0];
      const currentScore = scores[scores.length - 1];
      const bestScore = Math.max(...scores);
      const improvement = currentScore - firstScore;

      progress[criterion] = {
        current: Math.round(currentScore),
        best: Math.round(bestScore),
        improvement: Math.round(improvement),
        trend: sessions.map((s, idx) => ({
          practice: idx + 1,
          score: Math.round(s.criteriaScores?.[criterion] || 0)
        })).filter(t => t.score > 0)
      };
    }
  });

  return Object.keys(progress).length > 0 ? progress : null;
}

// Calculate achievements
function calculateAchievements(sessions) {
  const achievements = [];
  const totalPractices = sessions.length;
  const scores = sessions.map(s => s.score);
  const latestScore = scores[scores.length - 1];
  const bestScore = Math.max(...scores);
  const improvement = latestScore - scores[0];

  // First Practice
  achievements.push({
    id: 'first_practice',
    title: 'First Steps',
    description: 'Completed your first practice session',
    icon: '🎯',
    unlocked: totalPractices >= 1
  });

  // 5 Practices
  achievements.push({
    id: 'practice_5',
    title: 'Getting Started',
    description: 'Completed 5 practice sessions',
    icon: '🌟',
    unlocked: totalPractices >= 5
  });

  // 10 Practices
  achievements.push({
    id: 'practice_10',
    title: 'Committed Speaker',
    description: 'Completed 10 practice sessions',
    icon: '🔥',
    unlocked: totalPractices >= 10
  });

  // 25 Practices
  achievements.push({
    id: 'practice_25',
    title: 'Speech Master',
    description: 'Completed 25 practice sessions',
    icon: '👑',
    unlocked: totalPractices >= 25
  });

  // High Score
  achievements.push({
    id: 'high_score',
    title: 'Excellence',
    description: 'Achieved a score of 80 or higher',
    icon: '⭐',
    unlocked: bestScore >= 80
  });

  // Perfect Score
  achievements.push({
    id: 'perfect_score',
    title: 'Perfection',
    description: 'Achieved a perfect score of 95+',
    icon: '💯',
    unlocked: bestScore >= 95
  });

  // Improvement
  achievements.push({
    id: 'improved_20',
    title: 'Great Progress',
    description: 'Improved by 20 points from first practice',
    icon: '📈',
    unlocked: improvement >= 20
  });

  // Consistent Practice (3+ consecutive days)
  const hasStreak = checkPracticeStreak(sessions, 3);
  achievements.push({
    id: 'streak_3',
    title: 'Consistent',
    description: 'Practiced for 3 consecutive days',
    icon: '🔥',
    unlocked: hasStreak
  });

  return achievements;
}

// Check for practice streak
function checkPracticeStreak(sessions, targetStreak) {
  if (sessions.length < targetStreak) return false;

  const dates = sessions.map(s => {
    const d = new Date(s.practiceDate);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  });

  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
  
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const dayDiff = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24);
    if (dayDiff === 1) {
      streak++;
      if (streak >= targetStreak) return true;
    } else {
      streak = 1;
    }
  }
  
  return streak >= targetStreak;
}

// GET calendar data for heatmap
router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const sessions = await PracticeSession.find({ userId });

    // Get last 7 weeks (49 days)
    const calendar = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 48; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.practiceDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      const count = daySessions.length;
      const avgScore = count > 0 
        ? Math.round(daySessions.reduce((sum, s) => sum + s.score, 0) / count)
        : 0;

      calendar.push({
        date: date.toISOString().split('T')[0],
        count,
        avgScore
      });
    }

    res.json({
      success: true,
      calendar
    });

  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET difficult sentences
router.get('/difficult-sentences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const sessions = await PracticeSession.find({ userId })
      .populate('speechId', 'title');

    const difficultSentences = [];
    
    sessions.forEach(session => {
      session.sentenceResults?.forEach(sentence => {
        if (sentence.flaggedAsDifficult) {
          difficultSentences.push({
            _id: sentence._id,
            text: sentence.sentenceText,
            sentenceIndex: sentence.sentenceIndex,
            attempts: sentence.attempts,
            scores: sentence.scores,
            bestScore: sentence.bestScore,
            lastScore: sentence.lastScore,
            notes: sentence.notes,
            speechTitle: session.speechId?.title || 'Unknown Speech',
            speechId: session.speechId?._id,
            sessionId: session._id,
            lastPracticed: sentence.timestamp
          });
        }
      });
    });

    difficultSentences.sort((a, b) => b.lastPracticed - a.lastPracticed);

    res.json({
      success: true,
      difficultSentences
    });

  } catch (error) {
    console.error('Error fetching difficult sentences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST sentence practice
router.post('/sentence-practice', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { 
      speechId, 
      sentenceText, 
      sentenceIndex, 
      score, 
      flagAsDifficult,
      notes 
    } = req.body;

    if (!sentenceText || score === undefined || sentenceIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Sentence text, index, and score are required'
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let session = await PracticeSession.findOne({
      userId,
      speechId: speechId || null,
      practiceDate: { $gte: todayStart }
    });

    if (!session) {
      session = new PracticeSession({
        userId,
        speechId: speechId || null,
        transcript: sentenceText,
        score: score,
        wordCount: sentenceText.split(' ').length,
        sentenceCount: 1,
        sentenceResults: []
      });
    }

    let sentenceResult = session.sentenceResults.find(
      s => s.sentenceIndex === sentenceIndex
    );

    if (sentenceResult) {
      sentenceResult.attempts += 1;
      sentenceResult.scores.push(score);
      sentenceResult.lastScore = score;
      sentenceResult.bestScore = Math.max(sentenceResult.bestScore, score);
      sentenceResult.timestamp = new Date();
      if (flagAsDifficult !== undefined) {
        sentenceResult.flaggedAsDifficult = flagAsDifficult;
      }
      if (notes) {
        sentenceResult.notes = notes;
      }
    } else {
      session.sentenceResults.push({
        sentenceText,
        sentenceIndex,
        attempts: 1,
        scores: [score],
        bestScore: score,
        lastScore: score,
        flaggedAsDifficult: flagAsDifficult || false,
        notes: notes || '',
        timestamp: new Date()
      });
    }

    await session.save();

    res.json({
      success: true,
      message: 'Sentence practice saved',
      sentenceResult: session.sentenceResults[session.sentenceResults.length - 1]
    });

  } catch (error) {
    console.error('Error saving sentence practice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update sentence
router.put('/sentence/:sessionId/:sentenceId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { sessionId, sentenceId } = req.params;
    const { flagAsDifficult, notes } = req.body;

    const session = await PracticeSession.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const sentence = session.sentenceResults.id(sentenceId);
    if (!sentence) {
      return res.status(404).json({
        success: false,
        error: 'Sentence not found'
      });
    }

    if (flagAsDifficult !== undefined) {
      sentence.flaggedAsDifficult = flagAsDifficult;
    }
    if (notes !== undefined) {
      sentence.notes = notes;
    }

    await session.save();

    res.json({
      success: true,
      message: 'Sentence updated',
      sentence
    });

  } catch (error) {
    console.error('Error updating sentence:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;