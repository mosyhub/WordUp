import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ProgressComparison({ speechId, isOpen, onClose }) {
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen && speechId) {
      fetchPracticeHistory();
    }
  }, [isOpen, speechId]);

  const fetchPracticeHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/practice/speech/${speechId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        const practices = data.practices || [];
        
        
        const chartData = practices.map((practice, index) => ({
          name: `Practice ${index + 1}`,
          date: new Date(practice.createdAt || practice.practiceDate).toLocaleDateString(),
          score: practice.score,
          wordsSpoken: practice.metrics?.wordCount || practice.wordCount || 0,
          fillerWords: practice.metrics?.fillerWordCount || practice.fillerWordCount || 0
        }));

        setPracticeHistory(chartData);

        if (practices.length > 0) {
          const scores = practices.map(p => p.score);
          const firstScore = scores[0];
          const latestScore = scores[scores.length - 1];
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const bestScore = Math.max(...scores);
          const improvement = latestScore - firstScore;

          setStats({
            totalPractices: practices.length,
            firstScore,
            latestScore,
            avgScore: Math.round(avgScore),
            bestScore,
            improvement,
            improvementPercent: firstScore > 0 ? Math.round((improvement / firstScore) * 100) : 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching practice history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6 rounded-t-2xl text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black mb-2">📊 Progress Comparison</h2>
            <p className="text-purple-100">Track your improvement over time</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4 font-medium">Loading progress data...</p>
            </div>
          ) : practiceHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📈</div>
              <p className="text-gray-700 text-lg font-bold mb-2">No Practice History Yet</p>
              <p className="text-gray-600">Practice this speech to see your progress!</p>
            </div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <p className="text-purple-600 text-sm font-bold mb-1">Total Practices</p>
                    <p className="text-3xl font-black text-gray-900">{stats.totalPractices}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <p className="text-blue-600 text-sm font-bold mb-1">First Score</p>
                    <p className="text-3xl font-black text-gray-900">{stats.firstScore}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <p className="text-green-600 text-sm font-bold mb-1">Latest Score</p>
                    <p className="text-3xl font-black text-gray-900">{stats.latestScore}</p>
                  </div>
                  
                  <div className={`bg-gradient-to-br rounded-xl p-4 border ${
                    stats.improvement >= 0 
                      ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
                      : 'from-red-50 to-red-100 border-red-200'
                  }`}>
                    <p className={`text-sm font-bold mb-1 ${
                      stats.improvement >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      Improvement
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-gray-900">
                        {stats.improvement > 0 ? '+' : ''}{stats.improvement}
                      </p>
                      <p className={`text-lg font-bold ${
                        stats.improvement >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {stats.improvementPercent > 0 ? '+' : ''}{stats.improvementPercent}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={practiceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #9333ea',
                        borderRadius: '8px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#9333ea" 
                      strokeWidth={3}
                      dot={{ fill: '#9333ea', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">Practice History</h3>
                <div className="space-y-2">
                  {practiceHistory.map((practice, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-100 rounded-lg p-3">
                          <span className="text-2xl font-black text-purple-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{practice.name}</p>
                          <p className="text-sm text-gray-600">{practice.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Score</p>
                          <p className="text-2xl font-black text-purple-600">{practice.score}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Words</p>
                          <p className="text-lg font-bold text-gray-900">{practice.wordsSpoken}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Fillers</p>
                          <p className="text-lg font-bold text-orange-600">{practice.fillerWords}</p>
                        </div>
                        {index === practiceHistory.length - 1 && (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                            Latest
                          </span>
                        )}
                        {practice.score === stats?.bestScore && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                            🏆 Best
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {stats && stats.totalPractices > 1 && (
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-black text-gray-900 mb-3">💡 Insights</h3>
                  <ul className="space-y-2 text-gray-700">
                    {stats.improvement > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 text-xl">✓</span>
                        <span>Great job! You've improved by <strong>{stats.improvement} points</strong> since your first practice.</span>
                      </li>
                    )}
                    {stats.improvement < 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 text-xl">⚠</span>
                        <span>Your latest score is lower. Keep practicing to get back on track!</span>
                      </li>
                    )}
                    {stats.latestScore >= 80 && (
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 text-xl">⭐</span>
                        <span>Excellent! Your latest score is <strong>{stats.latestScore}</strong> - you're doing amazing!</span>
                      </li>
                    )}
                    {stats.totalPractices >= 5 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 text-xl">🎯</span>
                        <span>You're consistent! <strong>{stats.totalPractices} practices</strong> show great dedication.</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}