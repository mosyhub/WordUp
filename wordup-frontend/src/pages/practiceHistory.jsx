import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { generatePracticeSessionPDF } from '../services/pdfGenerator';
import Header from '../components/Header';

export default function PracticeHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔍 Token from localStorage:", token ? "Token exists" : "No token found");
    
    if (!token) {
      console.log("❌ No token, redirecting to login");
      navigate("/login");
      return;
    }
    fetchHistory();
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📡 Fetching history with token...");
      
      const response = await axios.get("http://localhost:5000/api/practice/history", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Response:", response.data);

      if (response.data.success) {
        setSessions(response.data.sessions);
      }
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      if (err.response?.status === 401) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setError("Failed to load practice history: " + (err.response?.data?.message || err.message));
      }
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/practice/delete/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete session");
    }
  };

  const downloadPDF = (session) => {
    generatePracticeSessionPDF(session);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  // Calculate stats
  const totalSessions = sessions.length;
  const totalWords = sessions.reduce((sum, s) => sum + (s.wordCount || 0), 0);
  const avgWords = totalSessions > 0 ? Math.round(totalWords / totalSessions) : 0;
  const recentSessions = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

       {/* Header Component */}
            <Header currentPage="History" />

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-10 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            Practice <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">History</span>
          </h1>
          <p className="text-xl text-white/80">Track your progress and review past sessions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalWords}</p>
                <p className="text-sm text-gray-600">Total Words</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{avgWords}</p>
                <p className="text-sm text-gray-600">Avg Words/Session</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-xl">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{recentSessions}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Sessions</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xl text-gray-500 mb-4">No practice sessions yet</p>
                <Link
                  to="/practice"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Start Practicing
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                {new Date(session.date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(session.date).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">
                                {session.wordCount} words
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">
                                {session.sentenceCount} sentences
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleExpand(session.id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm"
                          >
                            {expandedSession === session.id ? "Hide" : "View"}
                          </button>
                          <button
                            onClick={() => downloadPDF(session)}
                            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedSession === session.id && (
                      <div className="p-6 bg-white border-t border-gray-200">
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Transcript
                          </h4>
                          <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                            {session.transcript}
                          </p>
                        </div>
                        {session.feedback && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              AI Feedback
                            </h4>
                            <div className="text-gray-700 leading-relaxed bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg whitespace-pre-wrap">
                              {session.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-white/60 text-sm border-t border-white/10 bg-black/20 backdrop-blur-sm">
        © {new Date().getFullYear()} Wordup. All rights reserved.
      </footer>
    </div>
  );
}