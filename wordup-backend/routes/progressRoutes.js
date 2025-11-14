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
          achievements: [],
          consistencyScore: 0,
          practicesPerWeek: 0,
          practicesPerMonth: 0,
          currentStreak: 0,
          bestStreak: 0,
          improvementRate: { per10Sessions: null, perWeek: null, trend: [] },
          skillLevel: { level: 'Beginner', badge: '🌱', color: 'green', description: 'Start practicing to level up!' },
          totalTimeSpent: { totalSeconds: 0, hours: 0, minutes: 0, seconds: 0, formatted: '0s' }
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
        value: s.metrics?.wordsPerMinute || 0
      })),
      fillerWordCount: sessions.map((s, idx) => ({
        practice: idx + 1,
        value: s.metrics?.fillerWordCount || 0
      }))
    };

    // Achievements
    const achievements = calculateAchievements(sessions);

    // Calculate additional metrics
    const consistencyMetrics = calculateConsistencyMetrics(sessions);
    const streakMetrics = calculateStreakMetrics(sessions);
    const improvementRate = calculateImprovementRate(sessions);
    const skillLevel = calculateSkillLevel(averageScore, latestScore);
    const totalTimeSpent = calculateTotalTimeSpent(sessions);

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
        achievements,
        consistencyScore: consistencyMetrics.consistencyScore,
        practicesPerWeek: consistencyMetrics.practicesPerWeek,
        practicesPerMonth: consistencyMetrics.practicesPerMonth,
        currentStreak: streakMetrics.currentStreak,
        bestStreak: streakMetrics.bestStreak,
        improvementRate,
        skillLevel,
        totalTimeSpent
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
      .map(s => s.detailedScores?.[criterion]?.score)
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
          score: Math.round(s.detailedScores?.[criterion]?.score || 0)
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

// Calculate consistency metrics
function calculateConsistencyMetrics(sessions) {
  if (sessions.length === 0) {
    return {
      consistencyScore: 0,
      practicesPerWeek: 0,
      practicesPerMonth: 0
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const practicesThisWeek = sessions.filter(s => 
    new Date(s.practiceDate) >= oneWeekAgo
  ).length;

  const practicesThisMonth = sessions.filter(s => 
    new Date(s.practiceDate) >= oneMonthAgo
  ).length;

  // Consistency score: 0-100 based on practices per week (ideal: 3-5 per week)
  const idealPerWeek = 4;
  const consistencyScore = Math.min(100, Math.round((practicesThisWeek / idealPerWeek) * 100));

  return {
    consistencyScore,
    practicesPerWeek: practicesThisWeek,
    practicesPerMonth: practicesThisMonth
  };
}

// Calculate streak metrics
function calculateStreakMetrics(sessions) {
  if (sessions.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0
    };
  }

  // Get unique practice dates
  const dates = sessions.map(s => {
    const d = new Date(s.practiceDate);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  });

  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a); // Most recent first

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  let checkDate = todayTime;
  for (const date of uniqueDates) {
    const dayDiff = (checkDate - date) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 1 && dayDiff >= 0) {
      currentStreak++;
      checkDate = date - (24 * 60 * 60 * 1000); // Move to previous day
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const dayDiff = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24);
    if (dayDiff === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    currentStreak,
    bestStreak
  };
}

// Calculate improvement rate (per 10 sessions or per week)
function calculateImprovementRate(sessions) {
  if (sessions.length < 2) {
    return {
      per10Sessions: null,
      perWeek: null,
      trend: []
    };
  }

  // Per 10 sessions
  const per10Sessions = [];
  for (let i = 0; i < sessions.length; i += 10) {
    const chunk = sessions.slice(i, i + 10);
    if (chunk.length >= 2) {
      const firstScore = chunk[0].score;
      const lastScore = chunk[chunk.length - 1].score;
      const improvement = lastScore - firstScore;
      per10Sessions.push({
        period: Math.floor(i / 10) + 1,
        improvement: Math.round(improvement),
        sessions: chunk.length
      });
    }
  }

  // Per week
  const weeklyData = {};
  sessions.forEach(session => {
    const date = new Date(session.practiceDate);
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = [];
    }
    weeklyData[weekKey].push(session);
  });

  const perWeek = [];
  Object.keys(weeklyData).sort().forEach(weekKey => {
    const weekSessions = weeklyData[weekKey];
    if (weekSessions.length >= 2) {
      const firstScore = weekSessions[0].score;
      const lastScore = weekSessions[weekSessions.length - 1].score;
      const improvement = lastScore - firstScore;
      perWeek.push({
        week: weekKey,
        improvement: Math.round(improvement),
        sessions: weekSessions.length
      });
    }
  });

  return {
    per10Sessions: per10Sessions.length > 0 ? per10Sessions : null,
    perWeek: perWeek.length > 0 ? perWeek : null,
    trend: per10Sessions
  };
}

// Helper to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Calculate skill level
function calculateSkillLevel(averageScore, latestScore) {
  const score = Math.max(averageScore, latestScore);
  
  if (score >= 85) {
    return {
      level: 'Expert',
      badge: '👑',
      color: 'purple',
      description: 'Master level performance!'
    };
  } else if (score >= 70) {
    return {
      level: 'Intermediate',
      badge: '⭐',
      color: 'blue',
      description: 'Great progress! Keep it up!'
    };
  } else {
    return {
      level: 'Beginner',
      badge: '🌱',
      color: 'green',
      description: 'Starting your journey!'
    };
  }
}

// Calculate total time spent practicing
function calculateTotalTimeSpent(sessions) {
  const totalSeconds = sessions.reduce((sum, session) => {
    return sum + (session.metrics?.duration || 0);
  }, 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    formatted: hours > 0 
      ? `${hours}h ${minutes}m`
      : minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`
  };
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