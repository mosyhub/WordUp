import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import speechRoutes from "./routes/speechRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Register routes
app.use('/api/progress', progressRoutes);
app.use('/api/practice', practiceRoutes);






mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));


console.log("\n📋 Registering API routes...");
app.use("/auth", authRoutes);
console.log("  ✓ /auth (Authentication)");
app.use("/speech", speechRoutes);
console.log("  ✓ /speech (User speeches)");
app.use("/api/audio", audioRoutes);
console.log("  ✓ /api/audio (Audio handling)");
app.use("/admin", adminRoutes);
console.log("  ✓ /admin (Admin controls)");
app.use("/api/practice", practiceRoutes);
console.log("  ✓ /api/practice (Practice sessions)");
app.use("/api/progress", progressRoutes);
console.log("  ✓ /api/progress (User progress)");
console.log("✅ All routes registered!\n");



app.get("/", (req, res) => {
  res.send("WordUP API is running...");
});

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user,
  });
});

app.get("/api/practice/test-direct", (req, res) => {
  res.json({
    success: true,
    message: "✅ Direct test route works!",
    note: "If this works but /api/practice/test does not, check practice.js file",
  });
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
    availableRoutes: {
      auth: "/auth",
      speech: "/speech",
      audio: "/api/audio",
      admin: "/admin",
      practice: "/api/practice",
      progress: "/api/progress",
    },
  });
});


app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});