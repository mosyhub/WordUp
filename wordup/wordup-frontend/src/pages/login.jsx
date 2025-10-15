import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });
      
      // Save token and user data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
      
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Error logging in"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50">
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

      {/* Login Form */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
            🔐 Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Login
            </button>
          </form>
          {message && <p className="text-center mt-4 text-red-600">{message}</p>}
          <p className="text-center text-gray-600 mt-4 text-sm">
            Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}