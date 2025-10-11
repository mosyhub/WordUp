const COHERE_API_KEY = "vZ6eRMVEtY8tSCzkqepuPoMPznKZlFvHFm4JUsYE"; // Your actual key

export async function getAIFeedback(transcript) {
  try {
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `You are an expert speech coach and English language teacher. Analyze this speech transcript and provide detailed, constructive feedback.

Speech Transcript:
"${transcript}"

Please provide your analysis in this format:

📊 OVERALL ASSESSMENT:
[2-3 sentences about the overall quality]

✨ STRENGTHS:
- [Strength 1]
- [Strength 2]
- [Strength 3]

📝 AREAS FOR IMPROVEMENT:
- [Area 1]
- [Area 2]
- [Area 3]

💡 SPECIFIC SUGGESTIONS:
- [Actionable tip 1]
- [Actionable tip 2]
- [Actionable tip 3]

🎯 SCORE: [X]/100

Keep feedback encouraging and constructive.`,
        model: 'command-r7b-12-2024', // Updated model name
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API error');
    }

    return {
      success: true,
      feedback: data.text
    };

  } catch (error) {
    console.error("AI Feedback Error:", error);
    return {
      success: false,
      error: error.message || "Failed to get AI feedback"
    };
  }
}