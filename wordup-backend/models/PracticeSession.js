import mongoose from 'mongoose';

const practiceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  speechId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Speech',
    default: null
  },
  transcript: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  
  detailedScores: {
    clarity: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' }
    },
    pace: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' }
    },
    fillerWords: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' }
    },
    vocabulary: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' }
    },
    structure: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' }
    }
  },
  
  metrics: {
    wordCount: { type: Number, default: 0 },
    sentenceCount: { type: Number, default: 0 },
    fillerWordCount: { type: Number, default: 0 },
    wordsPerMinute: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }
  },
  
  feedback: {
    strengths: [String],
    improvements: [String],
    overallFeedback: String
  },
  
  sentenceResults: [{
    sentenceText: String,
    sentenceIndex: Number,
    attempts: { type: Number, default: 1 },
    scores: [Number],
    bestScore: Number,
    lastScore: Number,
    flaggedAsDifficult: { type: Boolean, default: false },
    notes: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  grammarIssues: [{
    issue: String,
    suggestion: String,
    sentence: String,
    resolved: { type: Boolean, default: false }
  }],
  
  vocabularyLearned: [{
    word: String,
    definition: String,
    usage: String,
    dateAdded: { type: Date, default: Date.now }
  }],
  
  practiceDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

practiceSessionSchema.index({ userId: 1, practiceDate: -1 });
practiceSessionSchema.index({ speechId: 1, userId: 1 });

export default mongoose.model('PracticeSession', practiceSessionSchema);