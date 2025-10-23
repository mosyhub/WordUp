import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

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

  const practiceNow = () => {
    navigate('/practice', {
      state: {
        preloadedSpeech: speech.improvedVersion || speech.originalDraft,
        speechId: speech._id
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading speech...</p>
        </div>
      </div>
    );
  }

  if (error || !speech) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <p className="text-red-600 mb-4">{error || 'Speech not found'}</p>
          <Link to="/speeches" className="text-indigo-600 hover:underline">
            ← Back to Speeches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700">
          📄 Speech Details
        </h1>
        <nav className="space-x-6">
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition">Dashboard</Link>
          <Link to="/speeches" className="text-gray-600 hover:text-indigo-600 transition">My Speeches</Link>
        </nav>
      </header>

      {/* Main Content */}
      <div className="px-10 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            to="/speeches"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
          >
            ← Back to Speeches
          </Link>

          {/* Speech Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {speech.title}
            </h2>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
              <span>📅 Created: {new Date(speech.createdAt).toLocaleDateString()}</span>
              <span>🎤 Practiced: {speech.practiceCount} times</span>
              {speech.lastPracticedAt && (
                <span>🕐 Last practiced: {new Date(speech.lastPracticedAt).toLocaleDateString()}</span>
              )}
              <span>📝 {speech.originalDraft.trim().split(/\s+/).length} words</span>
            </div>

            {/* Original Draft */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-700 mb-3">
                📝 Original Draft:
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {speech.originalDraft}
                </p>
              </div>
            </div>

            {/* Improved Version */}
            {speech.improvedVersion && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-700 mb-3">
                  ✨ Improved Version:
                </h3>
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {speech.improvedVersion}
                  </pre>
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {speech.aiSuggestions && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-700 mb-3">
                  💡 AI Suggestions:
                </h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                    {speech.aiSuggestions}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={practiceNow}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                🎤 Practice This Speech
              </button>
              <Link
                to="/improve"
                state={{ editSpeech: speech }}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold text-center"
              >
                ✏️ Edit Speech
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}