import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 bg-white shadow">
        <h1 className="text-2xl font-extrabold text-indigo-700 flex items-center gap-2">
          🎤 SpeakUp
        </h1>
        <nav className="space-x-6">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 transition">Home</Link>
          <Link to="/login" className="text-gray-600 hover:text-indigo-600 transition">Login</Link>
          <Link to="/register" className="text-gray-600 hover:text-indigo-600 transition">Register</Link>
          <Link to="/practice" className="text-gray-600 hover:text-indigo-600 transition">Practice</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <h2 className="text-5xl font-extrabold text-indigo-700 mb-4">
          Master Public Speaking with AI Coaching
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          Practice your speeches, get instant feedback, and build confidence in your English communication skills.
        </p>

        <Link
          to="/practice"
          className="px-8 py-3 bg-indigo-600 text-white text-lg rounded-lg shadow-lg hover:bg-indigo-700 transition"
        >
          🚀 Start Practicing
        </Link>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} SpeakUp. All rights reserved.
      </footer>
    </div>
  );
}
