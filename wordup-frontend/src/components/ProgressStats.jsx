import { useState, useEffect } from "react";

export default function ProgressStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/practice/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-center text-gray-500">Loading progress...</p>
      </div>
    );
  }

  if (!stats || stats.totalPractices === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Your Progress</h3>
        <p className="text-gray-600">Start practicing to see your progress!</p>
      </div>
    );
  }

  const improvementColor = stats.improvement >= 0 ? 'text-green-600' : 'text-red-600';
  const improvementIcon = stats.improvement >= 0 ? '📈' : '📉';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Your Progress</h3>

      {/* Improvement Highlight */}
      {stats.improvement !== 0 && (
        <div className={`p-4 rounded-lg mb-6 ${stats.improvement >= 0 ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
          <p className="text-lg font-bold">
            {improvementIcon} {stats.improvement >= 0 ? 'Great Progress!' : 'Keep Practicing!'}
          </p>
          <p className={`text-2xl font-extrabold ${improvementColor}`}>
            {stats.improvement > 0 ? '+' : ''}{stats.improvement} points since first practice
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <p className="text-3xl font-bold text-indigo-600">{stats.totalPractices}</p>
          <p className="text-sm text-gray-600 mt-1">Total Practices</p>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">{stats.latestScore}</p>
          <p className="text-sm text-gray-600 mt-1">Latest Score</p>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-3xl font-bold text-purple-600">{stats.bestScore}</p>
          <p className="text-sm text-gray-600 mt-1">Best Score</p>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-3xl font-bold text-orange-600">{stats.practiceStreak}</p>
          <p className="text-sm text-gray-600 mt-1">Day Streak 🔥</p>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">First Practice</p>
          <p className="text-2xl font-bold text-gray-800">{stats.firstScore}/100</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Latest Practice</p>
          <p className="text-2xl font-bold text-gray-800">{stats.latestScore}/100</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="space-y-2 text-sm text-gray-600">
          <p>📊 Average Score: <span className="font-bold text-gray-800">{stats.averageScore || 0}/100</span></p>
          <p>📝 Total Words Spoken: <span className="font-bold text-gray-800">{(stats.totalWords || 0).toLocaleString()}</span></p>
          <p>⚠️ Avg Filler Words: <span className="font-bold text-gray-800">{stats.avgFillerWords || 0}</span></p>
        </div>
      </div>
    </div>
  );
}