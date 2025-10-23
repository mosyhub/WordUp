const COHERE_API_KEY = "vZ6eRMVEtY8tSCzkqepuPoMPznKZlFvHFm4JUsYE";

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
    
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `You are a STRICT professional speech coach who gives HONEST, CRITICAL feedback. Be harsh but constructive. Most speeches should score between 50-70 unless truly exceptional.

Speech Transcript (${wordCount} words, ${sentenceCount} sentences, ${fillerCount} filler words detected):
"${transcript}"

CRITICAL ANALYSIS REQUIRED:
You must respond ONLY with valid JSON (no markdown, no extra text). Use this EXACT structure:

{
  "overallScore": <number 0-100>,
  "metrics": {
    "clarity": {
      "score": <number 0-100>,
      "feedback": "<specific issue or praise, be critical>"
    },
    "pace": {
      "score": <number 0-100>,
      "feedback": "<analyze speed, pauses, rhythm - be strict>"
    },
    "fillerWords": {
      "score": <number 0-100>,
      "feedback": "<mention filler word count and impact>"
    },
    "vocabulary": {
      "score": <number 0-100>,
      "feedback": "<assess word variety, sophistication, repetition>"
    },
    "structure": {
      "score": <number 0-100>,
      "feedback": "<evaluate logical flow, organization, transitions>"
    }
  },
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "improvements": [
    "<specific actionable improvement 1>",
    "<specific actionable improvement 2>",
    "<specific actionable improvement 3>",
    "<specific actionable improvement 4>"
  ],
  "stats": {
    "wordCount": ${wordCount},
    "sentenceCount": ${sentenceCount},
    "fillerWordCount": ${fillerCount},
    "wordsPerMinute": <estimate based on content>,
    "duration": "<estimate in seconds>"
  }
}

STRICT SCORING RULES (BE HARSH):
- 90-100: TEDx quality, professional speaker level (VERY RARE)
- 80-89: Excellent, polished, minimal flaws
- 70-79: Good but needs refinement
- 60-69: Average, multiple issues to fix (MOST SPEECHES)
- 50-59: Below average, significant problems
- 40-49: Poor, major overhaul needed
- Below 40: Severely lacking

FILLER WORD SCORING:
- 0 fillers: 100
- 1-3 fillers: 90-95
- 4-7 fillers: 75-85
- 8-12 fillers: 60-70
- 13-20 fillers: 40-55
- 20+ fillers: Below 40

Be brutally honest. Most people need improvement. Don't inflate scores. Focus on WHAT NEEDS TO CHANGE.`,
        model: 'command-r7b-12-2024',
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API error');
    }

    // Parse the JSON response
    let feedbackData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, return raw text as fallback
        return {
          success: true,
          feedback: data.text,
          structured: false
        };
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return {
        success: true,
        feedback: data.text,
        structured: false
      };
    }

    return {
      success: true,
      structured: true,
      data: feedbackData
    };

  } catch (error) {
    console.error("AI Feedback Error:", error);
    return {
      success: false,
      error: error.message || "Failed to get AI feedback"
    };
  }
}