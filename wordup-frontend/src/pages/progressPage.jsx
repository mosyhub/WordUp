import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Area, AreaChart } from 'recharts';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function AdvancedProgressDashboard() {
  const [progress, setProgress] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProgressData();
    fetchCalendarData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/progress/overall', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/progress/calendar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCalendar(data.calendar);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
          <p className="text-white mt-4 text-lg font-bold">Loading Progress...</p>
        </div>
      </div>
    );
  }

  if (!progress || progress.totalPractices === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Header Component */}
        <Header currentPage="Progress" />

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
            <div className="text-8xl mb-6">🎤</div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Start Your Journey!</h2>
            <p className="text-xl text-gray-600 mb-8">Complete your first practice to unlock detailed progress tracking</p>
            <Link
              to="/practice"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 transition font-bold text-lg shadow-lg"
            >
              Start Practicing
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-6 text-white/60 text-sm border-t border-white/10 bg-black/20 backdrop-blur-sm">
          © {new Date().getFullYear()} Wordup. All rights reserved.
        </footer>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = progress.criteriaProgress ? [
    {
      criteria: 'Clarity',
      current: progress.criteriaProgress.clarity?.current || 0,
      best: progress.criteriaProgress.clarity?.best || 0,
      fullMark: 100
    },
    {
      criteria: 'Pace',
      current: progress.criteriaProgress.pace?.current || 0,
      best: progress.criteriaProgress.pace?.best || 0,
      fullMark: 100
    },
    {
      criteria: 'Vocabulary',
      current: progress.criteriaProgress.vocabulary?.current || 0,
      best: progress.criteriaProgress.vocabulary?.best || 0,
      fullMark: 100
    },
    {
      criteria: 'Structure',
      current: progress.criteriaProgress.structure?.current || 0,
      best: progress.criteriaProgress.structure?.best || 0,
      fullMark: 100
    },
    {
      criteria: 'Filler Words',
      current: progress.criteriaProgress.fillerWords?.current || 0,
      best: progress.criteriaProgress.fillerWords?.best || 0,
      fullMark: 100
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header Component */}
      <Header currentPage="Progress" />

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-10 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white mb-4">
              Progress <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-xl text-white/80">Track your journey and celebrate your achievements</p>
          </div>

          {/* Improvement Highlight Banner */}
          {progress.improvement !== 0 && (
            <div className={`mb-8 rounded-2xl p-6 shadow-2xl ${
              progress.improvement >= 0 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-lg font-medium mb-1">
                    {progress.improvement >= 0 ? '🎉 Outstanding Progress!' : '💪 Keep Pushing Forward!'}
                  </p>
                  <p className="text-white text-3xl font-black">
                    {progress.improvement > 0 ? '+' : ''}{progress.improvement} points 
                    <span className="text-lg font-medium ml-2">
                      ({progress.improvementPercent > 0 ? '+' : ''}{progress.improvementPercent}%)
                    </span>
                  </p>
                  <p className="text-white/90 text-sm mt-1">
                    From {progress.firstScore} → {progress.latestScore} since your first practice
                  </p>
                </div>
                <div className="text-6xl">
                  {progress.improvement >= 20 ? '🚀' : progress.improvement >= 10 ? '📈' : progress.improvement >= 0 ? '✨' : '🎯'}
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 rounded-xl p-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Practices</p>
                  <p className="text-3xl font-black text-gray-900">{progress.totalPractices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 rounded-xl p-3">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Latest Score</p>
                  <p className="text-3xl font-black text-blue-600">{progress.latestScore}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-yellow-100 rounded-xl p-3">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Best Score</p>
                  <p className="text-3xl font-black text-yellow-600">{progress.bestScore}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className={`rounded-xl p-3 ${progress.improvement >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="text-2xl">{progress.improvement >= 0 ? '🚀' : '💪'}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Improvement</p>
                  <p className={`text-3xl font-black ${progress.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {progress.improvement > 0 ? '+' : ''}{progress.improvement}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 rounded-xl p-3">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Average</p>
                  <p className="text-3xl font-black text-purple-600">{progress.averageScore}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {['overview', 'trends', 'achievements'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-bold transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white text-purple-600 shadow-xl'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overall Progress Line Chart with Area */}
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-black text-gray-900 mb-6">📈 Your Journey</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={progress.improvementTrend}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="practice" label={{ value: 'Practice Session', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #9333ea', 
                        borderRadius: '8px', 
                        fontWeight: 'bold' 
                      }}
                      formatter={(value) => [`${value}`, 'Score']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#9333ea" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#9333ea" 
                      strokeWidth={3} 
                      dot={{ fill: '#9333ea', r: 5 }} 
                      activeDot={{ r: 7 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Progress Insights */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">First Practice</p>
                    <p className="text-2xl font-black text-gray-900">{progress.firstScore}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Current Level</p>
                    <p className="text-2xl font-black text-gray-900">{progress.latestScore}</p>
                  </div>
                  <div className={`rounded-lg p-4 border ${
                    progress.improvement >= 0 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <p className="text-sm text-gray-600 mb-1">Total Growth</p>
                    <p className={`text-2xl font-black ${
                      progress.improvement >= 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {progress.improvement > 0 ? '+' : ''}{progress.improvement} pts
                    </p>
                  </div>
                </div>
              </div>

              {/* Radar Chart - Skills Overview */}
              {progress.criteriaProgress && (
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-black text-gray-900 mb-6">🎯 Skills Profile</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="criteria" tick={{ fill: '#374151', fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Current" dataKey="current" stroke="#9333ea" fill="#9333ea" fillOpacity={0.6} />
                      <Radar name="Best" dataKey="best" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #9333ea', borderRadius: '8px', fontWeight: 'bold' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Practice Calendar Heatmap */}
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-black text-gray-900 mb-6">📅 Practice Calendar</h2>
                <div className="grid grid-cols-7 gap-2">
                  {calendar.map((day, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg transition-transform hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: day.count === 0 ? '#f3f4f6' : 
                          day.avgScore >= 80 ? '#10b981' :
                          day.avgScore >= 60 ? '#fbbf24' : '#ef4444',
                        opacity: day.count === 0 ? 0.3 : 0.6 + (day.count * 0.1)
                      }}
                      title={`${day.date}: ${day.count} practice(s), Avg: ${day.avgScore}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-6 mt-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span>No practice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>&lt;60</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>60-79</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>80+</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRENDS TAB */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Words Per Minute Trend */}
              {progress.metricsTrends?.wordsPerMinute && (
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-black text-gray-900 mb-6">🗣️ Words Per Minute</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progress.metricsTrends.wordsPerMinute}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="practice" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #3b82f6', borderRadius: '8px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Filler Words Trend */}
              {progress.metricsTrends?.fillerWordCount && (
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-black text-gray-900 mb-6">⚠️ Filler Words Trend</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progress.metricsTrends.fillerWordCount}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="practice" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #f59e0b', borderRadius: '8px', fontWeight: 'bold' }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && progress.achievements && (
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-gray-900 mb-6">🏆 Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {progress.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-6 rounded-xl border-2 transition ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="text-5xl mb-3 text-center">{achievement.icon}</div>
                    <h3 className="text-xl font-black text-gray-900 text-center mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 text-center">{achievement.description}</p>
                    {achievement.unlocked && (
                      <div className="mt-4 text-center">
                        <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                          Unlocked!
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-white/60 text-sm border-t border-white/10 bg-black/20 backdrop-blur-sm">
        © {new Date().getFullYear()} Wordup. All rights reserved.
      </footer>
    </div>
  );
}