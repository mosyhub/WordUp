import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from '../components/Header';

export default function SpeechDetail() {
  const [speech, setSpeech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpeech();
  }, [id]);

  const fetchSpeech = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/speech/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSpeech(data.speech);
      } else {
        setError('Speech not found');
      }

    } catch (err) {
      console.error('Error fetching speech:', err);
      setError('Failed to load speech');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Extract ONLY the enhanced script (no feedback, no strengths)
  const extractEnhancedScript = (aiResponse) => {
    if (!aiResponse) return null;
    
    const versionPatterns = [
      /(?:IMPROVED|ENHANCED|CORRECTED|ACADEMIC|CONVERSATIONAL|PERSUASIVE|CONCISE|FORMAL)\s+VERSION:\s*\n([\s\S]*?)(?:\n\n(?:STRENGTHS?|KEY IMPROVEMENTS|SUGGESTIONS|FEEDBACK|ANALYSIS|EXPLANATION|NOTES?):|$)/i,
      /(?:IMPROVED|ENHANCED|CORRECTED|ACADEMIC|CONVERSATIONAL|PERSUASIVE|CONCISE|FORMAL)\s+VERSION:\s*([\s\S]*?)(?:\n\n(?:STRENGTHS?|KEY IMPROVEMENTS|SUGGESTIONS|FEEDBACK|ANALYSIS|EXPLANATION|NOTES?):|$)/i
    ];

    for (const pattern of versionPatterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const firstSectionMatch = aiResponse.match(/^([\s\S]*?)(?:\n\n[A-Z\s]+:|$)/);
    if (firstSectionMatch && firstSectionMatch[1]) {
      const content = firstSectionMatch[1].trim();
      if (content.length > 50) {
        return content;
      }
    }

    return aiResponse;
  };

  // ✅ Extract strengths section separately
  const extractStrengths = (aiResponse) => {
    if (!aiResponse) return null;
    
    const strengthsPatterns = [
      /(?:STRENGTHS?|WHAT WORKS WELL|POSITIVE ASPECTS?):\s*([\s\S]*?)(?:\n\n(?:KEY IMPROVEMENTS|SUGGESTIONS|AREAS? FOR IMPROVEMENT|FEEDBACK|RECOMMENDATIONS?):|$)/i,
    ];

    for (const pattern of strengthsPatterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  };

  // ✅ Extract feedback/suggestions separately (after strengths)
  const extractFeedback = (aiResponse) => {
    if (!aiResponse) return null;
    
    const feedbackPatterns = [
      /(?:KEY IMPROVEMENTS|SUGGESTIONS|AREAS? FOR IMPROVEMENT|RECOMMENDATIONS?|FEEDBACK|ANALYSIS|EXPLANATION):\s*([\s\S]*)/i,
    ];

    for (const pattern of feedbackPatterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  };

  const practiceNow = () => {
    const enhancedScript = extractEnhancedScript(speech.improvedVersion) || speech.originalDraft;
    
    navigate('/practice', {
      state: {
        preloadedSpeech: enhancedScript,
        speechId: speech._id,
        title: speech.title
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="text-white mt-6 text-lg font-semibold">Loading speech...</p>
        </div>
      </div>
    );
  }

  if (error || !speech) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-2xl max-w-md">
          <span className="text-7xl mb-6 block">⚠️</span>
          <p className="text-red-600 mb-6 text-lg font-bold">{error || 'Speech not found'}</p>
          <Link 
            to="/speeches" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 transition font-bold shadow-lg"
          >
            ← Back to Speeches
          </Link>
        </div>
      </div>
    );
  }

  const enhancedScript = extractEnhancedScript(speech.improvedVersion);
  const strengths = extractStrengths(speech.improvedVersion);
  const feedback = extractFeedback(speech.improvedVersion);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header - Updated to match practice.jsx style */}
      <Header currentPage="Details" />
      

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/speeches"
            className="inline-flex items-center text-purple-300 hover:text-white mb-6 font-semibold transition"
          >
            ← Back to Speeches
          </Link>

          {/* Title Section - Centered like practice.jsx */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                {speech.title}
              </span>
            </h2>
            <p className="text-gray-300 text-lg">Your saved speech and AI analysis</p>
          </div>

          {/* Meta Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="text-sm font-semibold text-gray-500 mb-1">Created</div>
              <div className="text-lg font-black text-purple-600">
                {new Date(speech.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="text-sm font-semibold text-gray-500 mb-1">Practices</div>
              <div className="text-lg font-black text-indigo-600">
                {speech.practiceCount}
              </div>
            </div>
            {speech.lastPracticedAt && (
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-sm font-semibold text-gray-500 mb-1">Last Practice</div>
                <div className="text-lg font-black text-green-600">
                  {new Date(speech.lastPracticedAt).toLocaleDateString()}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <div className="text-sm font-semibold text-gray-500 mb-1">Words</div>
              <div className="text-lg font-black text-gray-700">
                {speech.originalDraft.trim().split(/\s+/).length}
              </div>
            </div>
          </div>

          {/* Original Draft */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Original Draft
            </h3>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {speech.originalDraft}
              </p>
            </div>
          </div>

          {/* Improved Version (Script Only) */}
          {enhancedScript && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl p-8 mb-6 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-2xl font-black text-gray-900">✨ Improved Version</h3>
                <span className="ml-auto px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold">
                  Enhanced
                </span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-inner border border-green-200">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {enhancedScript}
                </p>
              </div>
            </div>
          )}

          {/* AI Analysis Section - Matching practice.jsx style */}
          {(strengths || feedback) && (
            <div className="space-y-6 mb-6">
              {/* Strengths Section */}
              {strengths && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-black text-gray-900">What Works Well</h3>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-inner border border-green-100">
                    <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                      {strengths}
                    </pre>
                  </div>
                </div>
              )}

              {/* Feedback/Improvements Section */}
              {feedback && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-xl font-black text-gray-900">Areas for Improvement</h3>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-inner border border-red-100">
                    <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                      {feedback}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional AI Suggestions (if separate field exists and no extracted feedback) */}
          {speech.aiSuggestions && !feedback && !strengths && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-xl font-black text-gray-900">AI Suggestions</h3>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-inner border border-blue-100">
                <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                  {speech.aiSuggestions}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1">Ready to practice?</h3>
                <p className="text-purple-100 text-sm">
                  You've practiced this speech {speech.practiceCount} time{speech.practiceCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={practiceNow}
                  className="px-8 py-4 bg-white text-purple-600 rounded-full hover:bg-purple-50 transition-all text-lg font-bold shadow-xl hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Practice This Speech
                </button>
                <Link
                  to="/improve"
                  state={{ editSpeech: speech }}
                  className="px-8 py-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all text-lg font-bold shadow-xl hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Speech
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}