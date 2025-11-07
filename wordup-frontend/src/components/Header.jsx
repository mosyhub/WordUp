import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Header({ currentPage = "" }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef(null);

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

  // 🟣 Added Progress here inside dropdownLinks
  const dropdownLinks = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/history", label: "History" },
    { path: "/progress", label: "Progress" },
     { path: "/speeches", label: "Speeches" }, // ✅ New Progress link
  ];

  const sideLinks = [
    { path: "/practice", label: "Practice" },
    { path: "/improve", label: "Improve" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
    }, 150);
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      setIsMenuOpen(true);
    }
  };

  return (
    <header className="relative z-50 bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 shadow-lg">
      <div className="flex justify-between items-center px-10 py-6">
        {/* Logo */}
        <h1
          className="text-3xl font-black text-white flex items-center gap-3 hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
          <span className="bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            WordUp
          </span>
        </h1>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <nav className="flex items-center gap-4">
              {/* Side links (Practice, Improve) */}
              {sideLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                    currentPage === link.label
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Dropdown menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleMenu}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105 font-medium"
                >
                  {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  <span>Menu</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 transform transition-all duration-200 ${
                      isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    }`}
                  >
                    <div className="py-2">
                      {dropdownLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={closeMenu}
                          className={`block px-4 py-3 transition-all duration-200 ${
                            currentPage === link.label
                              ? "bg-purple-500/30 text-white font-semibold border-l-4 border-purple-400"
                              : "text-gray-300 hover:bg-white/10 hover:text-white border-l-4 border-transparent"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}

                      {/* Logout inside dropdown */}
                      <button
                        onClick={() => {
                          closeMenu();
                          handleLogout();
                        }}
                        className="w-full text-left block px-4 py-3 text-red-400 hover:bg-red-500/20 border-l-4 border-transparent hover:border-red-400 transition-all duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/login"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-300 hover:scale-105 font-medium"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}