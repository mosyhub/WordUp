const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function transcribeAudio(audioBase64, mimeType = "audio/webm", language = "en") {
  try {
    const response = await fetch(`${API_BASE_URL}/api/audio/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audioBase64, mimeType, language }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to transcribe audio");
    }

    return data.transcript;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

export async function synthesizeSpeech(text, options = {}) {
  const { language = "en", slow = false } = options;

  try {
    const response = await fetch(`${API_BASE_URL}/api/audio/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, language, slow }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to synthesize speech");
    }

    return data.audioUrl;
  } catch (error) {
    console.error("Text-to-speech error:", error);
    throw error;
  }
}

export async function lookupPronunciation(word) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/audio/pronounce/${encodeURIComponent(word.trim())}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Pronunciation lookup failed");
    }

    return data;
  } catch (error) {
    console.error("Pronunciation lookup error:", error);
    throw error;
  }
}

