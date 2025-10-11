import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getAIFeedback } from "../services/aiFeedback";

export default function Practice() {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // Add ref to store transcript

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setFeedback("⚠️ Speech recognition not supported. Use Chrome, Edge, or Safari.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      transcriptRef.current = fullTranscript; // Store in ref
      setTranscript(fullTranscript); // Update display
    };

    recognitionRef.current.onerror = (event) => {
      setFeedback("⚠️ Error: " + event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Analyze using the ref value
      const finalTranscript = transcriptRef.current;
      if (finalTranscript && finalTranscript.trim().length > 0) {
        analyzeSpeech(finalTranscript);
      } else {
        setFeedback("⚠️ No speech detected. Please try again.");
      }
    };

    recognitionRef.current.start();
    setIsListening(true);
    transcriptRef.current = ""; // Reset ref
    setTranscript("");
    setFeedback("");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend handler will automatically trigger and analyze
    }
  };

  const analyzeSpeech = async (text) => {
  if (!text || text.trim().length === 0) {
    setFeedback("⚠️ No speech detected.");
    return;
  }

  // Show loading state
  setFeedback("🤖 AI is analyzing your speech... Please wait...");

  try {
    // Get basic stats
    const wordCount = text.trim().split(/\s+/).length;
    const charCount = text.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;

    // Get AI-powered feedback
    const result = await getAIFeedback(text);

    if (result.success) {
      // Combine basic stats with AI feedback
      let feedbackText = `📈 QUICK STATS:\n`;
      feedbackText += `Words: ${wordCount} | Characters: ${charCount} | Sentences: ${sentenceCount}\n\n`;
      feedbackText += `─────────────────────────────────────\n\n`;
      feedbackText += result.feedback;
      
      setFeedback(feedbackText);
    } else {
      // Fallback to basic analysis if AI fails
      setFeedback(`⚠️ AI analysis unavailable: ${result.error}\n\nShowing basic analysis:\n\n📊 Word count: ${wordCount}\n📝 Sentences: ${sentenceCount}`);
    }

  } catch (error) {
    console.error("Analysis error:", error);
    setFeedback("❌ Error analyzing speech: " + error.message);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700 flex items-center gap-2">
          🎤 SpeakUp
        </h1>
        <nav className="space-x-6">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 transition">Home</Link>
          <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition">Login</Link>
          <Link to="/register" className="text-gray-600 hover:text-indigo-600 transition">Register</Link>
          <Link to="/practice" className="text-gray-600 hover:text-indigo-600 transition">Practice</Link>
        </nav>
      </header>

      {/* Practice Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
          {/* Header */}
          <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-2">
            🎤 SpeakUp Coach
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Practice your speech and get instant AI-powered feedback.
          </p>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              <strong>🎙️ Real-time Speech Recognition:</strong> Uses your browser's built-in speech recognition. 
              Works instantly, no downloads needed! (Chrome, Edge, Safari)
            </p>
          </div>

          {/* Recorder */}
          <div className="flex flex-col items-center gap-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              🎙️ {isListening ? "🔴 Listening..." : "Ready to record"}
            </span>

            <div className="flex gap-6">
              <button
                onClick={startRecording}
                disabled={isListening}
                className="px-8 py-4 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
              >
                ▶️ Start Speaking
              </button>

              <button
                onClick={stopRecording}
                disabled={!isListening}
                className="px-8 py-4 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
              >
                ⏹️ Stop & Analyze
              </button>
            </div>

            {isListening && (
              <div className="mt-4 text-center">
                <p className="text-indigo-600 font-medium animate-pulse">
                  🎤 Speak now... I'm listening!
                </p>
              </div>
            )}
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Results */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">📝 Transcript</h3>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-700 shadow-inner min-h-[100px] whitespace-pre-wrap">
                {transcript || "Your speech will appear here in real-time..."}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">💡 Feedback & Analysis</h3>
              <pre className="p-4 bg-gray-50 rounded-lg text-gray-700 shadow-inner min-h-[200px] whitespace-pre-wrap font-mono text-sm">
                {feedback || "Feedback will appear here after you stop speaking."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}