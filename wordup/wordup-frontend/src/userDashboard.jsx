import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchSpeeches();
  }, []);

  const fetchUserData = () => {
    // Get user from localStorage (set during login)
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const practiceCount = speeches.reduce((sum, speech) => sum + speech.practiceCount, 0);
  const totalSpeeches = speeches.length;
  const recentSpeeches = speeches.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700">
          📊 SpeakUp Dashboard
        </h1>
        <nav className="space-x-6 flex items-center">
          <Link to="/dashboard" className="text-indigo-600 font-bold">Dashboard</Link>
          <Link to="/practice" className="text-gray-600 hover:text-indigo-600 transition">Practice</Link>
          <Link to="/improve" className="text-gray-600 hover:text-indigo-600 transition">Improve Speech</Link>
          <Link to="/speeches" className="text-gray-600 hover:text-indigo-600 transition">My Speeches</Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="px-10 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name || 'User'}! 👋
          </h2>
          <p className="text-gray-600">
            Here's your speech practice overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Speeches */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Speeches</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalSpeeches}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-4">
                <span className="text-3xl">📝</span>
              </div>
            </div>
          </div>

          {/* Practice Sessions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Practice Sessions</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{practiceCount}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <span className="text-3xl">🎤</span>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">This Week</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {speeches.filter(s => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(s.createdAt) > weekAgo;
                  }).length}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <span className="text-3xl">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/improve"
              className="flex items-center gap-4 p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
            >
              <span className="text-4xl">✍️</span>
              <div>
                <p className="font-bold text-gray-800">Improve Speech</p>
                <p className="text-sm text-gray-600">Get AI feedback</p>
              </div>
            </Link>

            <Link
              to="/practice"
              className="flex items-center gap-4 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition"
            >
              <span className="text-4xl">🎤</span>
              <div>
                <p className="font-bold text-gray-800">Practice Now</p>
                <p className="text-sm text-gray-600">Start speaking</p>
              </div>
            </Link>

            <Link
              to="/speeches"
              className="flex items-center gap-4 p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition"
            >
              <span className="text-4xl">📚</span>
              <div>
                <p className="font-bold text-gray-800">My Speeches</p>
                <p className="text-sm text-gray-600">View all</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Speeches */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Recent Speeches</h3>
            <Link to="/speeches" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : recentSpeeches.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📝</span>
              <p className="text-gray-600 mb-4">No speeches yet</p>
              <Link
                to="/improve"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create Your First Speech
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSpeeches.map((speech) => (
                <div
                  key={speech._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{speech.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(speech.createdAt).toLocaleDateString()} • 
                      Practiced {speech.practiceCount} time{speech.practiceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/speeches/${speech._id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      View
                    </Link>
                    <Link
                      to="/practice"
                      state={{ preloadedSpeech: speech.improvedVersion || speech.originalDraft, speechId: speech._id }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Practice
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