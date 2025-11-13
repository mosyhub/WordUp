import express from "express";
import { getGeminiModel } from "../utils/gemini.js";

const router = express.Router();

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "literally",
  "sort of",
  "kind of",
];

function countFillerWords(transcript) {
  return FILLER_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    return count + (transcript.match(regex) || []).length;
  }, 0);
}

function buildFeedbackPrompt(transcript, stats) {
  return `You are a STRICT professional speech coach who gives HONEST, CRITICAL feedback. Be harsh but constructive. Most speeches should score between 50-70 unless truly exceptional.

Speech Transcript (${stats.wordCount} words, ${stats.sentenceCount} sentences, ${stats.fillerWordCount} filler words detected):
"${transcript}"

CRITICAL ANALYSIS REQUIRED:
Respond ONLY with valid JSON (no markdown, no extra text). Use this EXACT structure:

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
    "wordCount": ${stats.wordCount},
    "sentenceCount": ${stats.sentenceCount},
    "fillerWordCount": ${stats.fillerWordCount},
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

Return ONLY valid JSON.`;
}

function buildSpeechImproverPrompt(type, draft) {
  const prompts = {
    full: `You are an expert speech coach. Analyze this speech with a professional, clean format.

IMPORTANT: Write in plain text only. No markdown, no asterisks, no special formatting. Use simple dashes for bullet points.

Provide your analysis in this exact format:

IMPROVED VERSION:
[Write the improved speech here in plain text]

STRENGTHS:
- [First strength]
- [Second strength]  
- [Third strength]

AREAS FOR IMPROVEMENT:
- [First area]
- [Second area]
- [Third area]

SPECIFIC SUGGESTIONS:
- [First tip]
- [Second tip]
- [Third tip]

Original Speech: "${draft}"

Remember: Keep it professional, encouraging, and formatted cleanly with NO markdown symbols.`,
    grammar: `You are a grammar expert. Fix ONLY grammar errors in this speech.

IMPORTANT: Write in plain text only. No markdown, no asterisks, no special formatting.

Provide your analysis in this exact format:

CORRECTED VERSION:
[Write the corrected speech here]

GRAMMAR ISSUES FOUND:
- Issue 1: [Describe the error and why it's wrong]
- Issue 2: [Describe the error and why it's wrong]
- Issue 3: [Describe the error and why it's wrong]

GRAMMAR TIPS:
- Tip 1: [Practical advice]
- Tip 2: [Practical advice]
- Tip 3: [Practical advice]

Original Speech: "${draft}"

Be detailed but keep formatting clean and professional.`,
    vocabulary: `You are a vocabulary enhancement specialist. Improve word choices in this speech.

IMPORTANT: Write in plain text. No markdown or special characters.

Format your response like this:

ENHANCED VERSION:
[Rewrite with better vocabulary]

VOCABULARY UPGRADES:
- Changed [old word] to [new word] because [reason]
- Changed [old word] to [new word] because [reason]
- Changed [old word] to [new word] because [reason]

CONTEXT TIPS:
- [Tip about word choice]
- [Tip about word choice]
- [Tip about word choice]

Original Speech: "${draft}"

Keep tone natural while elevating vocabulary.`,
    academic: `You are an academic writing expert. Transform this into academic tone.

IMPORTANT: Plain text only. No markdown formatting.

Format:

ACADEMIC VERSION:
[Rewritten in formal academic language]

TONE ADJUSTMENTS:
- Changed: [What you changed and why]
- Changed: [What you changed and why]
- Changed: [What you changed and why]

ACADEMIC WRITING TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${draft}"

Use formal language, avoid contractions, add transitional phrases.`,
    conversational: `You are a conversational speech coach. Make this natural and engaging.

IMPORTANT: Plain text format only.

Format:

CONVERSATIONAL VERSION:
[Rewritten in natural, friendly tone]

ENGAGEMENT TECHNIQUES:
- [Technique 1 used]
- [Technique 2 used]
- [Technique 3 used]

DELIVERY TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${draft}"

Use contractions, casual language, rhetorical questions where appropriate.`,
    persuasive: `You are a persuasive communication expert. Make this speech highly persuasive.

IMPORTANT: Clean plain text format.

Format:

PERSUASIVE VERSION:
[Rewritten with persuasive techniques]

PERSUASIVE ELEMENTS ADDED:
- Ethos: [How you established credibility]
- Pathos: [How you appealed to emotion]
- Logos: [How you used logic]

IMPACT TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${draft}"

Add powerful calls to action and emotional appeals.`,
    concise: `You are a conciseness expert. Make this speech shorter and punchier.

IMPORTANT: Plain text only, no formatting symbols.

Format:

CONCISE VERSION:
[Shortened version keeping core message]

WHAT WAS REMOVED:
- [Removed redundancy 1]
- [Removed redundancy 2]
- [Removed redundancy 3]

BREVITY TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${draft}"

Aim to reduce word count by 30-40% while keeping key points.`,
    formal: `You are a business communication expert. Make this professionally formal.

IMPORTANT: Plain text format, professional tone.

Format:

FORMAL VERSION:
[Rewritten in professional business tone]

FORMALITY ADJUSTMENTS:
- Changed: [What was informalized and how]
- Changed: [What was informalized and how]
- Changed: [What was informalized and how]

PROFESSIONAL TIPS:
- [Tip 1]
- [Tip 2]
- [Tip 3]

Original Speech: "${draft}"

Use professional vocabulary, formal structure, business-appropriate language.`,
  };

  return prompts[type] || prompts.full;
}

function parseSpeechImproverResponse(text) {
  if (!text) {
    return {
      improvedVersion: "",
      sections: {},
    };
  }

  const lines = text.split(/\r?\n/);
  const sections = {};
  let currentHeading = "GENERAL";

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const headingMatch = trimmed.match(/^([A-Z\s]+):$/);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      if (!sections[currentHeading]) {
        sections[currentHeading] = [];
      }
      return;
    }

    if (!sections[currentHeading]) {
      sections[currentHeading] = [];
    }
    sections[currentHeading].push(trimmed);
  });

  const scope = new Map(
    [
      "IMPROVED VERSION",
      "CORRECTED VERSION",
      "ENHANCED VERSION",
      "ACADEMIC VERSION",
      "CONVERSATIONAL VERSION",
      "PERSUASIVE VERSION",
      "CONCISE VERSION",
      "FORMAL VERSION",
    ].map((heading) => [heading, heading])
  );

  const improvedHeading = [...scope.keys()].find((key) => sections[key]);
  const improvedVersion = improvedHeading
    ? sections[improvedHeading].join("\n")
    : "";

  return {
    improvedVersion,
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, value]) => [key, value.join("\n")])
    ),
  };
}

function safeJsonParse(text) {
  if (!text) return null;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return null;
  }
}

router.post("/feedback", async (req, res) => {
  const { transcript } = req.body;

  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    return res.status(400).json({
      success: false,
      error: "Transcript is required.",
    });
  }

  const cleanedTranscript = transcript.trim();
  const words = cleanedTranscript.split(/\s+/).filter(Boolean);
  const sentences = cleanedTranscript
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0);
  const fillerWordCount = countFillerWords(cleanedTranscript);

  const stats = {
    wordCount: words.length,
    sentenceCount: sentences.length || 1,
    fillerWordCount,
  };

  try {
    const model = getGeminiModel();
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: buildFeedbackPrompt(cleanedTranscript, stats) }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.95,
      },
    });

    const text = response?.response?.text?.() || "";
    const structured = safeJsonParse(text);

    if (structured) {
      return res.json({
        success: true,
        structured: true,
        data: structured,
      });
    }

    return res.json({
      success: true,
      structured: false,
      feedback: text,
    });
  } catch (error) {
    console.error("Gemini feedback error:", error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Failed to generate AI feedback. Check server logs for details.",
    });
  }
});

router.post("/improve", async (req, res) => {
  const { draft, analysisType = "full" } = req.body;

  if (!draft || typeof draft !== "string" || !draft.trim()) {
    return res.status(400).json({
      success: false,
      error: "Draft speech is required.",
    });
  }

  try {
    const model = getGeminiModel();
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: buildSpeechImproverPrompt(analysisType, draft.trim()) }],
        },
      ],
      generationConfig: {
        temperature: 0.75,
        topK: 40,
        topP: 0.95,
      },
    });

    const text = response?.response?.text?.() || "";

    if (!text) {
      return res.status(502).json({
        success: false,
        error: "Gemini did not return any content.",
      });
    }

    const parsed = parseSpeechImproverResponse(text);

    return res.json({
      success: true,
      text,
      improvedVersion: parsed.improvedVersion,
      sections: parsed.sections,
    });
  } catch (error) {
    console.error("Gemini speech improver error:", error);
    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Failed to generate improved speech. Check server logs for details.",
    });
  }
});

export default router;

