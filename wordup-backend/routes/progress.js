import { useState, useEffect } from 'react';

export default function EnhancedProgressCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressStats();
  }, []);

  const fetchProgressStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/progress/overall', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.progress);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalPractices === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h3 className="text-2xl font-black text-gray-900 mb-4">📊 Progress Tracker</h3>
        <p className="text-gray-600 mb-6">Start practicing to track your progress across multiple criteria!</p>
        <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition font-bold shadow-lg">
          View Full Progress Dashboard
        </button>
      </div>
    );
  }

  const improvementColor = stats.improvement >= 0 ? 'text-green-600' : 'text-red-600';
  const improvementBg = stats.improvement >= 0 ? 'bg-green-50' : 'bg-red-50';
  const improvementBorder = stats.improvement >= 0 ? 'border-green-500' : 'border-red-500';

  const criteriaArray = stats.criteriaProgress ? Object.entries(stats.criteriaProgress).map(([name, data]) => ({
    name,
    current: data.current,
    improvement: data.improvement
  })) : [];
  
  const topCriteria = criteriaArray.sort((a, b) => b.current - a.current).slice(0, 3);
  const weakestCriteria = criteriaArray.sort((a, b) => a.current - b.current).slice(0, 2);

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-gray-900">📊 Progress Tracker</h3>
        <button className="text-purple-600 hover:text-purple-700 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
          View Full Dashboard
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Total Practices</p>
          <p className="text-3xl font-black text-purple-600">{stats.totalPractices}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-gray-600 mb-1">Latest Score</p>
          <p className="text-3xl font-black text-blue-600">{stats.latestScore}</p>
        </div>
        <div className={`${improvementBg} rounded-xl p-4 border ${improvementBorder}`}>
          <p className="text-sm text-gray-600 mb-1">Improvement</p>
          <p className={`text-3xl font-black ${improvementColor}`}>
            {stats.improvement > 0 ? '+' : ''}{stats.improvement}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">Best Score</p>
          <p className="text-3xl font-black text-yellow-600">{stats.bestScore}</p>
        </div>
      </div>

      {stats.improvement !== undefined && (
        <div className={`rounded-lg p-4 mb-6 ${improvementBg} border ${improvementBorder}`}>
          <p className={`font-bold ${improvementColor} text-sm`}>
            {stats.improvement >= 0 
              ? `🎉 You've improved by ${stats.improvement} points since your first practice!`
              : `💪 Keep practicing! You'll improve soon.`
            }
          </p>
        </div>
      )}

      {stats.criteriaProgress && (
        <div className="space-y-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm font-bold text-gray-700 mb-2">💪 Your Strengths</p>
            <div className="space-y-2">
              {topCriteria.map((criteria) => (
                <div key={criteria.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{criteria.name}</span>
                  <span className="text-sm font-black text-green-600">{criteria.current}/100</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
            <p className="text-sm font-bold text-gray-700 mb-2">🎯 Focus Areas</p>
            <div className="space-y-2">
              {weakestCriteria.map((criteria) => (
                <div key={criteria.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{criteria.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-orange-600">{criteria.current}/100</span>
                    {criteria.improvement > 0 && (
                      <span className="text-xs font-bold text-green-600">+{criteria.improvement}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats.improvementTrend && stats.improvementTrend.length > 1 && (
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm font-bold text-gray-700 mb-3">Recent Progress:</p>
          <div className="flex items-end gap-2 h-24">
            {stats.improvementTrend.slice(-8).map((practice, idx) => {
              const height = (practice.score / 100) * 100;
              const isLatest = idx === stats.improvementTrend.slice(-8).length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full rounded-t transition-all ${
                      isLatest ? 'bg-purple-600' : practice.score >= 80 ? 'bg-green-500' : practice.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`Session ${practice.practice}: ${practice.score}`}
                  />
                  <span className="text-xs text-gray-500">{practice.practice}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats.achievements && stats.achievements.filter(a => a.unlocked).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-bold text-gray-700 mb-3">🏆 Recent Achievements</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stats.achievements.filter(a => a.unlocked).slice(-4).map((achievement) => (
              <div 
                key={achievement.id}
                className="flex-shrink-0 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200"
                title={achievement.description}
              >
                <div className="text-2xl text-center">{achievement.icon}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}