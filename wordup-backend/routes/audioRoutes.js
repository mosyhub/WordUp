import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import googleTTS from "google-tts-api";
import { getGeminiModel } from "../utils/gemini.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads/audio");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|ogg|webm|flac|mp4/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"));
    }
  },
});

router.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    console.log("📁 Audio file uploaded:", req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded",
      });
    }

    res.json({
      success: true,
      message: "Audio file uploaded successfully",
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/transcribe", async (req, res) => {
  const { audioBase64, mimeType = "audio/webm", language = "en" } = req.body;

  if (!audioBase64) {
    return res.status(400).json({
      success: false,
      error: "audioBase64 is required.",
    });
  }

  try {
    const model = getGeminiModel();
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Transcribe this audio accurately into ${language} text. Return plain text only, no timestamps.`,
            },
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    });

    const transcript = response?.response?.text?.()?.trim() || "";

    if (!transcript) {
      return res.status(502).json({
        success: false,
        error: "Gemini did not return a transcript.",
      });
    }

    return res.json({
      success: true,
      transcript,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Failed to transcribe audio. Ensure the Gemini key is configured.",
    });
  }
});

router.post("/text-to-speech", async (req, res) => {
  const {
    text,
    language = process.env.TTS_LANGUAGE || "en",
    slow = false,
  } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      success: false,
      error: "text is required.",
    });
  }

  try {
    const base64 = await googleTTS.getAudioBase64(text, {
      lang: language,
      slow,
    });
    const audioUrl = `data:audio/mp3;base64,${base64}`;

    return res.json({
      success: true,
      audioBase64: base64,
      audioUrl,
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to synthesize speech.",
    });
  }
});

router.get("/pronounce/:word", async (req, res) => {
  const { word } = req.params;

  if (!word) {
    return res.status(400).json({
      success: false,
      error: "word parameter is required.",
    });
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`
    );

    if (!response.ok) {
      return res.status(404).json({
        success: false,
        error: "No pronunciation data found for that word.",
      });
    }

    const data = await response.json();
    const entry = Array.isArray(data) ? data[0] : null;
    const phonetics = entry?.phonetics || [];
    const firstPhoneticWithAudio = phonetics.find(
      (item) => item.audio || item.text
    );

    const phoneticText =
      firstPhoneticWithAudio?.text ||
      entry?.phonetic ||
      "Pronunciation not available";

    const audioUrl =
      firstPhoneticWithAudio?.audio ||
      (await googleTTS.getAudioUrl(word, {
        lang: "en",
        slow: false,
      }));

    return res.json({
      success: true,
      word,
      phonetic: phoneticText,
      audioUrl,
      source: "dictionaryapi.dev",
    });
  } catch (error) {
    console.error("Pronunciation lookup error:", error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Failed to retrieve pronunciation. Please try again later.",
    });
  }
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Audio API is running.",
  });
});

export default router;
