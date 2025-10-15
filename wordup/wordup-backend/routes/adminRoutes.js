import express from 'express';
import User from '../models/users.js';
import Speech from '../models/Speech.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin only.' 
    });
  }
  next();
};

// GET all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// GET all speeches (from all users)
router.get('/speeches', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const speeches = await Speech.find()
      .sort({ createdAt: -1 });

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

// DELETE user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Also delete all speeches by this user
    await Speech.deleteMany({ userId: req.params.id });

    res.json({
      success: true,
      message: 'User and their speeches deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// DELETE speech
router.delete('/speeches/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const speech = await Speech.findByIdAndDelete(req.params.id);

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

export default router;