import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";
import speechRoutes from "./routes/speech.js";

// 🔹 Added: import for audio transcription routes
import audioRoutes from "./routes/audioRoutes.js";

// Load .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection (from .env)
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/speech", speechRoutes);

// 🔹 Added: new route for Whisper audio transcription
app.use("/api/audio", audioRoutes);

app.get("/", (req, res) => {
  res.send("SpeakUp API is running...");
});

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Audio API test: http://localhost:${PORT}/api/audio/test`);
});
