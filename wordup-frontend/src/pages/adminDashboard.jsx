import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchAllData();
  }, []);

  const checkAdminAccess = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard');
    }
  };

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const usersRes = await axios.get('http://localhost:5000/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(usersRes.data.users || []);

      const speechesRes = await axios.get('http://localhost:5000/admin/speeches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSpeeches(speechesRes.data.speeches || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setUsers(users.filter(u => u._id !== userId));
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const deleteSpeech = async (speechId) => {
    if (!window.confirm('Are you sure you want to delete this speech?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/admin/speeches/${speechId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSpeeches(speeches.filter(s => s._id !== speechId));
      alert('Speech deleted successfully');
    } catch (err) {
      alert('Failed to delete speech: ' + err.message);
    }
  };

  const totalUsers = users.length;
  const totalSpeeches = speeches.length;
  const totalPractices = speeches.reduce((sum, s) => sum + s.practiceCount, 0);
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  // Calculate demographics data
  const userTypeData = users.reduce((acc, user) => {
    const type = user.userType || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const usageContextData = users.reduce((acc, user) => {
    const context = user.usageContext || 'other';
    acc[context] = (acc[context] || 0) + 1;
    return acc;
  }, {});

  // Format data for charts
  const userTypeChartData = Object.entries(userTypeData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const usageContextChartData = Object.entries(usageContextData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Colors for charts
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-orange-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Admin Navbar */}
      <header className="relative z-10 flex justify-between items-center px-10 py-6 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <span className="bg-gradient-to-r from-white to-red-300 bg-clip-text text-transparent">
            Admin Dashboard
          </span>
        </h1>
        <nav className="flex items-center gap-6">
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-full backdrop-blur-sm border border-red-400/30 transition-all duration-300 hover:scale-105 font-medium"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 px-10 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-3">Admin Control Panel</h2>
            <p className="text-red-100 text-lg font-light">
              Manage users, speeches, and system analytics
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Users</p>
                <p className="text-5xl font-black text-gray-900 mt-2">{totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {adminCount} admins, {userCount} users
                </p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-green-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Speeches</p>
                <p className="text-5xl font-black text-gray-900 mt-2">{totalSpeeches}</p>
              </div>
              <div className="bg-green-100 rounded-xl p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Practices</p>
                <p className="text-5xl font-black text-gray-900 mt-2">{totalPractices}</p>
              </div>
              <div className="bg-purple-100 rounded-xl p-3">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Avg per User</p>
                <p className="text-5xl font-black text-gray-900 mt-2">
                  {totalUsers > 0 ? (totalSpeeches / totalUsers).toFixed(1) : 0}
                </p>
              </div>
              <div className="bg-orange-100 rounded-xl p-3">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b-2 border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-8 py-4 font-bold transition-all ${
                activeTab === 'overview'
                  ? 'text-red-600 border-b-4 border-red-600 bg-white'
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-8 py-4 font-bold transition-all ${
                activeTab === 'users'
                  ? 'text-red-600 border-b-4 border-red-600 bg-white'
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
              }`}
            >
              Users ({totalUsers})
            </button>
            <button
              onClick={() => setActiveTab('speeches')}
              className={`px-8 py-4 font-bold transition-all ${
                activeTab === 'speeches'
                  ? 'text-red-600 border-b-4 border-red-600 bg-white'
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
              }`}
            >
              Speeches ({totalSpeeches})
            </button>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                <p className="text-gray-600 mt-4 font-medium">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-5xl mb-4">⚠</div>
                <p className="text-red-500 font-semibold">{error}</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <h3 className="text-3xl font-black text-gray-900 mb-6">
                      System Overview
                    </h3>
                    
                    {/* Demographics Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* User Type Distribution */}
                      <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
                        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          User Type Distribution
                        </h4>
                        {userTypeChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={userTypeChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {userTypeChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            No user type data available
                          </div>
                        )}
                      </div>

                      {/* Usage Context Distribution */}
                      <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
                        <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Usage Context Distribution
                        </h4>
                        {usageContextChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={usageContextChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {usageContextChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            No usage context data available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bar Chart for Demographics */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200 mb-8">
                      <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Demographics Overview
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-lg font-semibold text-gray-700 mb-3 text-center">User Types</h5>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={userTypeChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h5 className="text-lg font-semibold text-gray-700 mb-3 text-center">Usage Contexts</h5>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={usageContextChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#22c55e" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recent Speeches
                      </h4>
                      <div className="space-y-3">
                        {speeches.slice(0, 5).map((speech) => {
                          const user = users.find(u => u._id === speech.userId);
                          return (
                            <div key={speech._id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-green-300 transition-all">
                              <div>
                                <p className="font-bold text-gray-900">{speech.title}</p>
                                <p className="text-sm text-gray-600 font-medium">
                                  by {user?.name || 'Unknown'} • {new Date(speech.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                {speech.practiceCount} practices
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Users */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Most Active Users
                      </h4>
                      <div className="space-y-3">
                        {users
                          .map(user => ({
                            ...user,
                            speechCount: speeches.filter(s => s.userId === user._id).length
                          }))
                          .sort((a, b) => b.speechCount - a.speechCount)
                          .slice(0, 5)
                          .map((user) => (
                            <div key={user._id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all">
                              <div>
                                <p className="font-bold text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-600 font-medium">{user.email}</p>
                              </div>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                {user.speechCount} speeches
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 mb-6">
                      All Users
                    </h3>
                    <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Name</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Role</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">User Type</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Usage Context</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Speeches</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Joined</th>
                            <th className="px-6 py-4 text-left text-sm font-black text-gray-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-200">
                          {users.map((user) => {
                            const userSpeeches = speeches.filter(s => s.userId === user._id).length;
                            return (
                              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{user.email}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                    user.role === 'admin' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {user.role.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                    {(user.userType || 'other').charAt(0).toUpperCase() + (user.userType || 'other').slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    {(user.usageContext || 'other').charAt(0).toUpperCase() + (user.usageContext || 'other').slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">{userSpeeches}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => deleteUser(user._id)}
                                    className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-all hover:scale-105"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Speeches Tab */}
                {activeTab === 'speeches' && (
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 mb-6">
                      All Speeches
                    </h3>
                    <div className="space-y-4">
                      {speeches.map((speech) => {
                        const user = users.find(u => u._id === speech.userId);
                        return (
                          <div key={speech._id} className="p-6 border-2 border-gray-200 rounded-2xl hover:border-red-300 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-black text-gray-900 text-lg mb-2">{speech.title}</h4>
                                <p className="text-sm text-gray-600 font-semibold mb-2">
                                  by {user?.name || 'Unknown'} ({user?.email})
                                </p>
                                <div className="flex gap-4 mb-3">
                                  <span className="text-xs text-gray-500 font-medium">
                                    Created: {new Date(speech.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs font-bold text-green-600">
                                    Practiced: {speech.practiceCount} times
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2 font-medium bg-gray-100 p-3 rounded-lg">
                                  {speech.originalDraft}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteSpeech(speech._id)}
                                className="ml-4 px-5 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-all hover:scale-105"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}