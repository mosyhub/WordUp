import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from '../components/Header';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <Header currentPage="Home" />
     
      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-7xl font-black text-white mb-6 leading-tight">
            Master Public Speaking
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              with AI Coaching
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            Practice your speeches, get instant feedback, and build confidence in your English communication skills.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
            <Link
              to="/practice"
              className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-lg font-bold rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110"
            >
              Start Practicing
            </Link>
            
            {!isLoggedIn && (
              <Link
                to="/register"
                className="px-10 py-5 bg-white/5 backdrop-blur-sm text-white text-lg font-bold rounded-full border-2 border-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-110 shadow-xl"
              >
                Create Free Account
              </Link>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 group">
              <svg className="w-16 h-16 mb-4 text-purple-600 group-hover:scale-110 transition-transform duration-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Feedback</h3>
              <p className="text-gray-600">Get instant, personalized feedback on your speaking performance</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105 group">
              <svg className="w-16 h-16 mb-4 text-violet-600 group-hover:scale-110 transition-transform duration-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Track Progress</h3>
              <p className="text-gray-600">Monitor your improvement with detailed analytics and insights</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 group">
              <svg className="w-16 h-16 mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Build Confidence</h3>
              <p className="text-gray-600">Practice in a safe environment and boost your public speaking skills</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-gray-500 text-sm border-t border-white/10 bg-black/30 backdrop-blur-sm">
        © {new Date().getFullYear()} SpeakUp. All rights reserved.
      </footer>
    </div>
  );
}