import mongoose from 'mongoose';

const speechSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalDraft: {
    type: String,
    required: true
  },
  improvedVersion: {
    type: String,
    default: ''
  },
  aiSuggestions: {
    type: String,
    default: ''
  },
  analysis: {
    strengths: [String],
    improvements: [String],
    grammarIssues: [String],
    vocabularyEnhancements: [String]
  },
  practiceCount: {
    type: Number,
    default: 0
  },
  lastPracticedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

speechSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Speech', speechSchema);