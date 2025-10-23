import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";
import speechRoutes from "./routes/speechRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import practiceRoutes from './routes/practiceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
console.log('📋 Registering routes...');
app.use("/auth", authRoutes);
console.log('  ✓ Auth routes: /auth');
app.use("/speech", speechRoutes);
console.log('  ✓ Speech routes: /speech');
app.use("/api/audio", audioRoutes);
console.log('  ✓ Audio routes: /api/audio');
app.use("/admin", adminRoutes);
console.log('  ✓ Admin routes: /admin');
app.use('/api/practice', practiceRoutes);
console.log('  ✓ Practice routes: /api/practice');
console.log('✅ All routes registered!\n');

// Root route
app.get("/", (req, res) => {
  res.send("WordUP API is running...");
});

// Protected route example
app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user
  });
});

// Test route - direct (for debugging)
app.get('/api/practice/test-direct', (req, res) => {
  res.json({ 
    success: true, 
    message: '✅ Direct test route works!',
    note: 'If this works but /api/practice/test does not, check practice.js file'
  });
});

// 404 handler - should be AFTER all routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
    availableRoutes: {
      auth: '/auth',
      speech: '/speech',
      audio: '/api/audio',
      admin: '/admin',
      practice: '/api/practice',
      practiceTest: '/api/practice/test'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ API Root: http://localhost:${PORT}`);
  console.log(`✅ Speeches: http://localhost:${PORT}/speech`);
  console.log(`✅ Practice Test: http://localhost:${PORT}/api/practice/test`);
  console.log(`✅ Direct Test: http://localhost:${PORT}/api/practice/test-direct\n`);
});