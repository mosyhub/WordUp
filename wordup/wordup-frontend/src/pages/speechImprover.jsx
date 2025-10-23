import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from '../components/Header';

export default function SpeechImprover() {
  const [title, setTitle] = useState("");
  const [originalDraft, setOriginalDraft] = useState("");
  const [improvedVersion, setImprovedVersion] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedSpeechId, setSavedSpeechId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const analyzeSpeech = async () => {
    if (!originalDraft.trim()) {
      setError("Please enter your speech draft first");
      return;
    }

    setLoading(true);
    setError("");
    setAiSuggestions("🤖 AI is analyzing your speech...");

    try {
      const COHERE_API_KEY = "vZ6eRMVEtY8tSCzkqepuPoMPznKZlFvHFm4JUsYE";
      
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header Component */}
      <Header currentPage="Improve" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-black text-gray-900 mb-3">
              <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Speech Improver
              </span>
            </h2>
            <p className="text-gray-600 text-lg">
              Write your speech draft and get AI-powered suggestions to improve it
            </p>
          </div>

          {/* Title Input */}
          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Speech Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., My Speech About Climate Change"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Original Draft */}
          <div className="mb-6">
            <label className="block text-gray-800 font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Your Draft Speech:
            </label>
            <textarea
              value={originalDraft}
              onChange={(e) => setOriginalDraft(e.target.value)}
              placeholder="Paste or type your speech here..."
              rows="10"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-600 font-medium">
                Word count: <span className="text-purple-600 font-bold">{originalDraft.trim().split(/\s+/).filter(w => w).length}</span>
              </p>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeSpeech}
            disabled={loading || !originalDraft.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl shadow-xl hover:from-purple-700 hover:to-violet-700 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mb-6 hover:scale-[1.02] transform disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyze & Improve
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-600 font-semibold">Speech saved successfully!</p>
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xl font-black text-gray-900">
                  AI Analysis & Suggestions
                </h3>
              </div>
              <pre className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl text-gray-700 shadow-inner min-h-[200px] whitespace-pre-wrap font-sans text-sm overflow-auto max-h-[500px] border-2 border-purple-200 leading-relaxed">
                {aiSuggestions}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          {aiSuggestions && !loading && (
            <div className="flex gap-4">
              <button
                onClick={saveSpeech}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-xl hover:from-green-600 hover:to-emerald-600 transition-all text-lg font-bold hover:scale-[1.02] transform flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Speech
              </button>
              <button
                onClick={practiceNow}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl shadow-xl hover:from-purple-700 hover:to-violet-700 transition-all text-lg font-bold hover:scale-[1.02] transform flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                Practice Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}