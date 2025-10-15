import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, speeches
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchAllData();
  }, []);

  const checkAdminAccess = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard'); // Redirect non-admins
    }
  };

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch all users
      const usersRes = await axios.get('http://localhost:5000/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(usersRes.data.users || []);

      // Fetch all speeches
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

  // Calculate stats
  const totalUsers = users.length;
  const totalSpeeches = speeches.length;
  const totalPractices = speeches.reduce((sum, s) => sum + s.practiceCount, 0);
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Admin Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-red-600">
          👑 Admin Dashboard
        </h1>
        <nav className="space-x-6 flex items-center">
          <Link to="/admin" className="text-red-600 font-bold">Admin</Link>
          <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">User View</Link>
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
        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-red-500">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            👑 Admin Control Panel
          </h2>
          <p className="text-gray-600">
            Manage users, speeches, and system analytics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalUsers}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {adminCount} admins, {userCount} users
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-4">
                <span className="text-3xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Speeches</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalSpeeches}</p>
              </div>
              <div className="bg-green-100 rounded-full p-4">
                <span className="text-3xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Practices</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalPractices}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-4">
                <span className="text-3xl">🎤</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg per User</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {totalUsers > 0 ? (totalSpeeches / totalUsers).toFixed(1) : 0}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-4">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-2xl shadow-xl">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'overview'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'users'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              👥 Users ({totalUsers})
            </button>
            <button
              onClick={() => setActiveTab('speeches')}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'speeches'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              📝 Speeches ({totalSpeeches})
            </button>
          </div>

          <div className="p-8">
            {loading ? (
              <p className="text-center text-gray-500 py-12">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500 py-12">{error}</p>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      System Overview
                    </h3>
                    
                    {/* Recent Activity */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-3">
                        Recent Speeches
                      </h4>
                      <div className="space-y-2">
                        {speeches.slice(0, 5).map((speech) => {
                          const user = users.find(u => u._id === speech.userId);
                          return (
                            <div key={speech._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-semibold">{speech.title}</p>
                                <p className="text-sm text-gray-600">
                                  by {user?.name || 'Unknown'} • {new Date(speech.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">
                                {speech.practiceCount} practices
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Users */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-3">
                        Most Active Users
                      </h4>
                      <div className="space-y-2">
                        {users
                          .map(user => ({
                            ...user,
                            speechCount: speeches.filter(s => s.userId === user._id).length
                          }))
                          .sort((a, b) => b.speechCount - a.speechCount)
                          .slice(0, 5)
                          .map((user) => (
                            <div key={user._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                              <span className="text-sm font-medium text-indigo-600">
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
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      All Users
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Speeches</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {users.map((user) => {
                            const userSpeeches = speeches.filter(s => s.userId === user._id).length;
                            return (
                              <tr key={user._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{user.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    user.role === 'admin' 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3">{userSpeeches}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => deleteUser(user._id)}
                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
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
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      All Speeches
                    </h3>
                    <div className="space-y-3">
                      {speeches.map((speech) => {
                        const user = users.find(u => u._id === speech.userId);
                        return (
                          <div key={speech._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{speech.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  by {user?.name || 'Unknown'} ({user?.email})
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Created: {new Date(speech.createdAt).toLocaleDateString()} • 
                                  Practiced: {speech.practiceCount} times
                                </p>
                                <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                  {speech.originalDraft}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteSpeech(speech._id)}
                                className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
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