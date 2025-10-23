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
    default: null // Can be null for free practice
  },
  transcript: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  wordCount: {
    type: Number,
    required: true
  },
  fillerWordCount: {
    type: Number,
    default: 0
  },
  sentenceCount: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  practiceDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('PracticeSession', practiceSessionSchema);