import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SpeechImprover() {
  const [title, setTitle] = useState("");
  const [originalDraft, setOriginalDraft] = useState("");
  const [improvedVersion, setImprovedVersion] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedSpeechId, setSavedSpeechId] = useState(null);
  
  const navigate = useNavigate();

  const analyzeSpeech = async () => {
    if (!originalDraft.trim()) {
      setError("Please enter your speech draft first");
      return;
    }

    setLoading(true);
    setError("");
    setAiSuggestions("🤖 AI is analyzing your speech...");

    try {
      // Call Cohere AI to analyze speech
      const COHERE_API_KEY = "vZ6eRMVEtY8tSCzkqepuPoMPznKZlFvHFm4JUsYE"; // Replace with your key
      
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `You are an expert speech coach. Analyze this speech and provide:

1. IMPROVED VERSION (rewrite the speech with better grammar, vocabulary, and structure)
2. STRENGTHS (what's already good - 3 points)
3. AREAS FOR IMPROVEMENT (what needs work - 3 points)
4. SPECIFIC SUGGESTIONS (actionable tips - 3 tips)

Original Speech:
"${originalDraft}"

Format your response with clear sections and make it encouraging.`,
          model: 'command-r7b-12-2024',
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'AI analysis failed');
      }

      setAiSuggestions(data.text);
      setImprovedVersion(data.text);

    } catch (err) {
      console.error("AI Analysis error:", err);
      setError("Failed to analyze speech: " + err.message);
      setAiSuggestions("");
    } finally {
      setLoading(false);
    }
  };

  const saveSpeech = async () => {
    if (!title.trim() || !originalDraft.trim()) {
      setError("Title and original draft are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Please login first");
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          originalDraft,
          improvedVersion,
          aiSuggestions,
          analysis: {
            strengths: [],
            improvements: [],
            grammarIssues: [],
            vocabularyEnhancements: []
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save speech');
      }

      setSuccess(true);
      setSavedSpeechId(data.speech._id);
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save speech: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const practiceNow = () => {
    navigate('/practice', { 
      state: { 
        preloadedSpeech: improvedVersion || originalDraft,
        speechId: savedSpeechId
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700">
          ✍️ SpeakUp
        </h1>
        <nav className="space-x-6">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 transition">Home</Link>
          <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition">Login</Link>
          <Link to="/register" className="text-gray-600 hover:text-indigo-600 transition">Register</Link>
          <Link to="/practice" className="text-gray-600 hover:text-indigo-600 transition">Practice</Link>
          <Link to="/improve" className="text-indigo-600 font-bold transition">Improve Speech</Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
          <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-2">
            ✍️ Speech Improver
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Write your speech draft and get AI-powered suggestions to improve it
          </p>

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Speech Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Speech About Climate Change"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Original Draft */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Your Draft Speech:
            </label>
            <textarea
              value={originalDraft}
              onChange={(e) => setOriginalDraft(e.target.value)}
              placeholder="Paste or type your speech here..."
              rows="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Word count: {originalDraft.trim().split(/\s+/).filter(w => w).length}
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeSpeech}
            disabled={loading || !originalDraft.trim()}
            className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? '⏳ Analyzing...' : '🤖 Analyze & Improve'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">⚠️ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">✅ Speech saved successfully!</p>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                💡 AI Analysis & Suggestions:
              </h3>
              <pre className="p-4 bg-gray-50 rounded-lg text-gray-700 shadow-inner min-h-[200px] whitespace-pre-wrap font-sans text-sm overflow-auto max-h-[500px]">
                {aiSuggestions}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          {aiSuggestions && !loading && (
            <div className="flex gap-4">
              <button
                onClick={saveSpeech}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition text-lg font-semibold"
              >
                💾 Save Speech
              </button>
              <button
                onClick={practiceNow}
                className="flex-1 px-6 py-3 bg-indigo-500 text-white rounded-lg shadow-lg hover:bg-indigo-600 transition text-lg font-semibold"
              >
                🎤 Practice Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}