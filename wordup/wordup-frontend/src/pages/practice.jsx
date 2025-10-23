import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAIFeedback } from "../services/aiFeedback";
import Header from "../components/Header";

export default function Practice() {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginPrompt(true);
    } else {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const savePracticeSession = async (transcriptText, feedbackData, scoreValue) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;

      setIsSaving(true);
      setSaveMessage("");

      const score = feedbackData?.overallScore || scoreValue || 65;

      const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "literally"];
      const fillerCount = fillerWords.reduce((count, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        return count + (transcriptText.match(regex) || []).length;
      }, 0);

      const wordCount = transcriptText.trim().split(/\s+/).length;
      const sentences = transcriptText.split(/[.!?]+/).filter(s => s.trim().length > 0);

      const response = await fetch('http://localhost:5000/api/practice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          speechId: null,
          transcript: transcriptText,
          score,
          wordCount,
          fillerWordCount: fillerCount,
          sentenceCount: sentences.length,
          feedback: JSON.stringify(feedbackData),
          duration: 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage("✅ Session saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("❌ Failed to save session");
      }

    } catch (error) {
      console.error('Failed to save practice session:', error);
      setSaveMessage("❌ Error saving session");
    } finally {
      setIsSaving(false);
    }
  };

  const startRecording = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("⚠️ Speech recognition not supported. Use Chrome, Edge, or Safari.");
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
      transcriptRef.current = fullTranscript;
      setTranscript(fullTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      alert("⚠️ Error: " + event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      const finalTranscript = transcriptRef.current;
      if (finalTranscript && finalTranscript.trim().length > 0) {
        analyzeSpeech(finalTranscript);
      } else {
        alert("⚠️ No speech detected. Please try again.");
      }
    };

    recognitionRef.current.start();
    setIsListening(true);
    transcriptRef.current = "";
    setTranscript("");
    setFeedback(null);
    setSaveMessage("");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const analyzeSpeech = async (text) => {
    if (!text || text.trim().length === 0) {
      alert("⚠️ No speech detected.");
      return;
    }

    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const result = await getAIFeedback(text);

      if (result.success && result.structured) {
        setFeedback(result.data);
        await savePracticeSession(text, result.data, null);
      } else if (result.success) {
        // Fallback for non-structured response
        setFeedback({ rawFeedback: result.feedback });
        await savePracticeSession(text, { rawFeedback: result.feedback }, null);
      } else {
        alert(`⚠️ AI analysis unavailable: ${result.error}`);
      }

    } catch (error) {
      console.error("Analysis error:", error);
      alert("❌ Error analyzing speech: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Needs Work";
    if (score >= 50) return "Below Average";
    return "Poor";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <Header currentPage="Practice" />

      {/* Login Prompt Modal */}
      {showLoginPrompt && !isLoggedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Login Required</h3>
              <p className="text-gray-600">You need to log in first to access the Practice feature.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/login")} className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-full hover:from-purple-700 hover:to-violet-700 transition font-bold">
                Login
              </button>
              <button onClick={() => navigate("/")} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-full hover:bg-gray-200 transition font-bold">
                Go Home
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")} className="text-purple-600 hover:text-purple-700 font-semibold">
                Register here
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-white mb-3">
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                WordUP Coach
              </span>
            </h1>
            <p className="text-gray-300 text-lg">Practice your speech and get strict AI-powered feedback</p>
          </div>

          {/* Recording Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="flex flex-col items-center gap-6">
              
              {/* Status Indicator */}
              <div className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse shadow-lg"
                  : "bg-gray-100 text-gray-600"
              }`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  {isListening ? "Listening..." : "Ready to record"}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={startRecording}
                  disabled={isListening || !isLoggedIn}
                  className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-xl hover:from-green-600 hover:to-emerald-600 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Speaking
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!isListening}
                  className="px-10 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-xl hover:from-red-600 hover:to-pink-600 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop & Analyze
                </button>
              </div>

              {/* Status Messages */}
              {isListening && (
                <p className="text-purple-600 font-bold animate-pulse flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Speak now... I'm listening!
                </p>
              )}

              {isAnalyzing && (
                <p className="text-blue-600 font-bold flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI is analyzing your speech...
                </p>
              )}

              {saveMessage && (
                <p className={`text-sm font-semibold ${saveMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}

              {isSaving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Saving session...</span>
                </div>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="mt-8">
                <h3 className="text-xl font-black text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Your Transcript
                </h3>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl text-gray-700 shadow-inner border border-gray-200">
                  {transcript}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          {feedback && !feedback.rawFeedback && (
            <div className="space-y-6">
              
              {/* Overall Score Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Overall Performance</h2>
                    <p className="text-gray-600">Based on 5 key speaking metrics</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-6xl font-black ${getScoreColor(feedback.overallScore)}`}>
                      {feedback.overallScore}
                    </div>
                    <div className="text-sm font-bold text-gray-500 uppercase mt-1">
                      {getScoreLabel(feedback.overallScore)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              {feedback.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Words</div>
                    <div className="text-3xl font-black text-purple-600">{feedback.stats.wordCount}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Sentences</div>
                    <div className="text-3xl font-black text-purple-600">{feedback.stats.sentenceCount}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Pace (WPM)</div>
                    <div className="text-3xl font-black text-purple-600">{feedback.stats.wordsPerMinute}</div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-lg">
                    <div className="text-sm font-semibold text-gray-500 mb-1">Filler Words</div>
                    <div className="text-3xl font-black text-red-600">{feedback.stats.fillerWordCount}</div>
                  </div>
                </div>
              )}

              {/* Detailed Metrics */}
              {feedback.metrics && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Detailed Analysis</h3>
                  <div className="space-y-5">
                    {Object.entries(feedback.metrics).map(([key, data]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreBgColor(data.score)} ${getScoreColor(data.score)}`}>
                              {data.score}
                            </span>
                            <span className="font-bold text-gray-900 capitalize">{key}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreBarColor(data.score)}`}
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 ml-1">{data.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-black text-gray-900">What You Did Well</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-xl font-black text-gray-900">Action Items to Improve</h3>
                  </div>
                  <ul className="space-y-3">
                    {feedback.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-red-600 font-bold mt-0.5 text-lg">•</span>
                        <span className="text-gray-700 font-medium">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* Fallback for raw feedback */}
          {feedback && feedback.rawFeedback && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-black text-gray-900 mb-4">AI Feedback</h3>
              <pre className="whitespace-pre-wrap text-gray-700 font-mono text-sm leading-relaxed">
                {feedback.rawFeedback}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}