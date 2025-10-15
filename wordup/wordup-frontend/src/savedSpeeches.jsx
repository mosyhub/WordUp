import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SavedSpeeches() {
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, recent, practiced
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpeeches();
  }, []);

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

  const deleteSpeech = async (speechId) => {
    if (!window.confirm('Are you sure you want to delete this speech?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/speech/${speechId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSpeeches(speeches.filter(s => s._id !== speechId));
        alert('Speech deleted successfully');
      } else {
        alert('Failed to delete speech');
      }

    } catch (err) {
      console.error('Error deleting speech:', err);
      alert('Failed to delete speech');
    }
  };

  const practiceNow = (speech) => {
    navigate('/practice', {
      state: {
        preloadedSpeech: speech.improvedVersion || speech.originalDraft,
        speechId: speech._id
      }
    });
  };

  // Filter speeches
  const getFilteredSpeeches = () => {
    switch(filter) {
      case 'recent':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return speeches.filter(s => new Date(s.createdAt) > weekAgo);
      case 'practiced':
        return speeches.filter(s => s.practiceCount > 0).sort((a, b) => b.practiceCount - a.practiceCount);
      default:
        return speeches;
    }
  };

  const filteredSpeeches = getFilteredSpeeches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700">
          📚 My Speeches
        </h1>
        <nav className="space-x-6">
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">Dashboard</Link>
          <Link to="/practice" className="text-gray-600 hover:text-indigo-600 transition">Practice</Link>
          <Link to="/improve" className="text-gray-600 hover:text-indigo-600 transition">Improve Speech</Link>
          <Link to="/speeches" className="text-indigo-600 font-bold">My Speeches</Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="px-10 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                📚 Saved Speeches
              </h2>
              <p className="text-gray-600">
                {speeches.length} speech{speeches.length !== 1 ? 'es' : ''} saved
              </p>
            </div>
            <Link
              to="/improve"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition font-semibold"
            >
              ➕ Create New Speech
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-t-2xl shadow-xl">
          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-4 font-semibold ${
                filter === 'all'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              All Speeches ({speeches.length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-6 py-4 font-semibold ${
                filter === 'recent'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Recent (Last 7 Days)
            </button>
            <button
              onClick={() => setFilter('practiced')}
              className={`px-6 py-4 font-semibold ${
                filter === 'practiced'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Most Practiced
            </button>
          </div>

          {/* Speeches List */}
          <div className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading speeches...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">⚠️</span>
                <p className="text-red-600">{error}</p>
              </div>
            ) : filteredSpeeches.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📝</span>
                <p className="text-gray-600 mb-4">
                  {filter === 'all' 
                    ? "No speeches saved yet" 
                    : filter === 'recent'
                    ? "No speeches created in the last 7 days"
                    : "No practiced speeches yet"}
                </p>
                <Link
                  to="/improve"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Your First Speech
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSpeeches.map((speech) => (
                  <div
                    key={speech._id}
                    className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition"
                  >
                    {/* Speech Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {speech.title}
                        </h3>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>📅 {new Date(speech.createdAt).toLocaleDateString()}</span>
                          <span>🎤 Practiced {speech.practiceCount} time{speech.practiceCount !== 1 ? 's' : ''}</span>
                          {speech.lastPracticedAt && (
                            <span>🕐 Last: {new Date(speech.lastPracticedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Speech Preview */}
                    <div className="mb-4">
                      <p className="text-gray-700 line-clamp-3">
                        {speech.originalDraft}
                      </p>
                    </div>

                    {/* Word Count */}
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">
                        📝 {speech.originalDraft.trim().split(/\s+/).length} words
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => practiceNow(speech)}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                      >
                        🎤 Practice
                      </button>
                      <Link
                        to={`/speeches/${speech._id}`}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-center"
                      >
                        👁️ View Details
                      </Link>
                      <Link
                        to="/improve"
                        state={{ editSpeech: speech }}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold text-center"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => deleteSpeech(speech._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}