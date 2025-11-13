const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function getAIFeedback(transcript) {
  try {
    // Count filler words
    const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of"];
    let fillerCount = 0;
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      fillerCount += (transcript.match(regex) || []).length;
    });

    const wordCount = transcript.trim().split(/\s+/).length;
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;
    const response = await fetch(`${API_BASE_URL}/api/ai/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'AI feedback request failed');
    }

    if (data.structured) {
      return {
        success: true,
        structured: true,
        data: data.data
      };
    }

    return {
      success: true,
      structured: false,
      feedback: data.feedback
    };
  } catch (error) {
    console.error("AI Feedback Error:", error);
    return {
      success: false,
      error: error.message || "Failed to get AI feedback"
    };
  }
}