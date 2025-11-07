import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateSpeechPDF } from '../services/pdfGenerator';
import ProgressStats from '../components/ProgressStats';
import Header from '../components/Header';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [speeches, setSpeeches] = useState([]);
  const [recentPracticedSpeeches, setRecentPracticedSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchUserData();
    fetchSpeeches();
  }, [navigate]);

  const fetchUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchSpeeches = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/speech', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSpeeches(data.speeches);
        
        // ✅ FIXED: Only show speeches that have been practiced (have lastPracticedAt)
        const practicedSpeeches = data.speeches
          .filter(speech => speech.lastPracticedAt) // Only practiced speeches
          .sort((a, b) => new Date(b.lastPracticedAt) - new Date(a.lastPracticedAt))
          .slice(0, 5); // Get top 5 most recently practiced
        
        setRecentPracticedSpeeches(practicedSpeeches);
      } else {
        setError('Failed to load speeches');
      }

    } catch (err) {
      console.error('Error fetching speeches:', err);
      setError('Failed to load speeches');
    } finally {
      setLoading(false);
    }
  };

  const [sessions, setSessions] = useState([]);

useEffect(() => {
  fetchSessions();
}, []);

const fetchSessions = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5000/api/practice/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) setSessions(data.sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
  }
};

  const practiceCount = speeches.reduce((sum, speech) => sum + speech.practiceCount, 0);
  const totalSpeeches = speeches.length;

  const downloadPDF = (speech) => {
    generateSpeechPDF(speech, user?.name);
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
      <Header currentPage="Dashboard" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Hero */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-3">
              Welcome back, {user?.name || 'User'}!
            </h2>
            <p className="text-purple-100 text-lg font-light">
              Ready to level up your English fluency today?
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Speeches */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-100 rounded-xl p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Speeches</span>
            </div>
            <p className="text-5xl font-black text-gray-900 mb-1">{totalSpeeches}</p>
            <p className="text-sm text-gray-600 font-medium">Total speeches created</p>
          </div>

          {/* Practice Sessions */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-violet-100 rounded-xl p-3">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">Sessions</span>
            </div>
            <p className="text-5xl font-black text-gray-900 mb-1">{practiceCount}</p>
            <p className="text-sm text-gray-600 font-medium">Practice sessions completed</p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-indigo-100 rounded-xl p-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">This Week</span>
            </div>
            <p className="text-5xl font-black text-gray-900 mb-1">
              {speeches.filter(s => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(s.createdAt) > weekAgo;
              }).length}
            </p>
            <p className="text-sm text-gray-600 font-medium">Speeches this week</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h3 className="text-2xl font-black text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              to="/improve"
              className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 border border-purple-200"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-purple-600 text-white rounded-lg p-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Improve</p>
                  <p className="text-sm text-gray-600">Get AI feedback</p>
                </div>
              </div>
            </Link>

            <Link
              to="/practice"
              className="group relative bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 hover:shadow-xl hover:shadow-violet-500/20 transition-all duration-300 hover:scale-105 border border-violet-200"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-violet-600 text-white rounded-lg p-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Practice</p>
                  <p className="text-sm text-gray-600">Start speaking</p>
                </div>
              </div>
            </Link>

            <Link
              to="/history"
              className="group relative bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105 border border-indigo-200"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-indigo-600 text-white rounded-lg p-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">History</p>
                  <p className="text-sm text-gray-600">View sessions</p>
                </div>
              </div>
            </Link>

            <Link
              to="/speeches"
              className="group relative bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-300 hover:scale-105 border border-pink-200"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-pink-600 text-white rounded-lg p-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">My Speeches</p>
                  <p className="text-sm text-gray-600">View library</p>
                </div>
              </div>
            </Link>

            <Link
              to="/progress"
              className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105 border border-emerald-200"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-emerald-600 text-white rounded-lg p-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Progress</p>
                  <p className="text-sm text-gray-600">Track improvement</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Progress Stats Component */}
        <ProgressStats />

        {/* Recent Sessions */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-gray-900">Recent Sessions</h3>
            <Link
              to="/history"
              className="text-purple-600 hover:text-purple-700 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4 font-medium">Loading your sessions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-5xl mb-4">⚠</div>
              <p className="text-red-500 font-semibold">{error}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">🎤</div>
              <p className="text-gray-700 text-lg mb-2 font-bold">No Practice Sessions Yet</p>
              <p className="text-gray-600 mb-6">Start practicing to see your sessions appear here!</p>
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-full hover:from-purple-700 hover:to-violet-700 transition font-bold shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start Practicing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      {new Date(session.date).toLocaleDateString()} — {new Date(session.date).toLocaleTimeString()}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4" />
                        </svg>
                        {session.wordCount} words
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" />
                        </svg>
                        {session.sentenceCount} sentences
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      to="/history"
                      state={{ sessionId: session.id }}
                      className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
                    >
                      View
                    </Link>
                  
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}