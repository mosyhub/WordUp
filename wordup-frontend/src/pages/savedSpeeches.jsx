import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from '../components/Header';
import ProgressComparison from '../components/ProgressComparison';

export default function SavedSpeeches() {
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSpeechId, setSelectedSpeechId] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  
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
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Authorization': `Bearer ${token}` }
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

  const extractEnhancedScript = (aiResponse) => {
    if (!aiResponse) return null;
    const versionPatterns = [
      /(?:IMPROVED|ENHANCED|CORRECTED|ACADEMIC|CONVERSATIONAL|PERSUASIVE|CONCISE|FORMAL)\s+VERSION:\s*\n([\s\S]*?)(?:\n\n[A-Z\s]+:|$)/i,
      /(?:IMPROVED|ENHANCED|CORRECTED|ACADEMIC|CONVERSATIONAL|PERSUASIVE|CONCISE|FORMAL)\s+VERSION:\s*([\s\S]*?)(?:\n\n[A-Z\s]+:|$)/i
    ];
    for (const pattern of versionPatterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    const firstSectionMatch = aiResponse.match(/^([\s\S]*?)(?:\n\n[A-Z\s]+:|$)/);
    if (firstSectionMatch && firstSectionMatch[1]) {
      const content = firstSectionMatch[1].trim();
      if (content.length > 50) return content;
    }
    return aiResponse;
  };

  const openProgress = (speechId) => {
    setSelectedSpeechId(speechId);
    setShowProgress(true);
  };

  const closeProgress = () => {
    setShowProgress(false);
    setSelectedSpeechId(null);
  };

  const practiceSpeech = (speech) => {
    const enhancedScript =
      extractEnhancedScript(speech.improvedVersion) ||
      speech.improvedVersion ||
      speech.originalDraft;

    navigate('/practice', {
      state: {
        speechId: speech._id,
        preloadedSpeech: enhancedScript,
        title: speech.title
      }
    });
  };

  const getFilteredSpeeches = () => {
    switch (filter) {
      case 'recent':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return speeches.filter(s => new Date(s.createdAt) > weekAgo);
      case 'practiced':
        return speeches
          .filter(s => s.practiceCount > 0)
          .sort((a, b) => b.practiceCount - a.practiceCount);
      default:
        return speeches;
    }
  };

  const filteredSpeeches = getFilteredSpeeches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Header currentPage="Saved Speeches" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-3">📚 Saved Speeches</h2>
            <p className="text-purple-100 text-lg font-light">
              {speeches.length} speech{speeches.length !== 1 ? 'es' : ''} saved. Manage and review your speeches here.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-gray-900">Your Speeches</h3>
            <div className="flex gap-2">
              {['all', 'recent', 'practiced'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filter === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all'
                    ? `All (${speeches.length})`
                    : type === 'recent'
                    ? 'Recent'
                    : 'Most Practiced'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4 font-medium">Loading your speeches...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
          ) : filteredSpeeches.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <p className="text-gray-700 text-lg mb-2 font-bold">No Speeches Found</p>
              <Link
                to="/improve"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-full hover:from-purple-700 hover:to-violet-700 transition font-bold shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Speech
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSpeeches.map((speech) => {
                const enhancedScript = extractEnhancedScript(speech.improvedVersion);
                const scriptPreview = enhancedScript || speech.improvedVersion || speech.originalDraft;

                return (
                <div
                  key={speech._id}
                  className="group flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-purple-600 transition">{speech.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {speech.practiceCount} practice{speech.practiceCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-gray-700 line-clamp-2">
                      {enhancedScript ? (
                        <span className="font-semibold text-purple-600 mr-1">Improved:</span>
                      ) : null}
                      {scriptPreview}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => practiceSpeech(speech)}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition font-semibold shadow-md flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8" />
                      </svg>
                      Practice
                    </button>
                    {speech.practiceCount > 0 && (
                      <button
                        onClick={() => openProgress(speech._id)}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 transition font-semibold shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Progress
                      </button>
                    )}
                    <Link
                      to={`/speeches/${speech._id}`}
                      className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                      View
                    </Link>
                    <Link
                      to="/improve"
                      state={{ editSpeech: speech }}
                      className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteSpeech(speech._id)}
                      className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ProgressComparison 
        speechId={selectedSpeechId}
        isOpen={showProgress}
        onClose={closeProgress}
      />
    </div>
  );
}