import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, PlusCircle, LogOut, User, LayoutDashboard, PlayCircle, BookOpen } from 'lucide-react';
import { getUser, setAuthToken, setUser } from '../utils/api';

export default function Navbar() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    navigate('/login');
  };

  // Hide Navbar on student gameplay view for full immersion
  if (location.pathname.startsWith('/game/')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform">
            禅
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xl tracking-tight text-white">
              Zen<span className="text-rose-500">_Quiz</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Interactive Chinese Platform</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/join"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Join Game</span>
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/create-quiz"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-rose-600 to-amber-500 text-white hover:opacity-95 transition-opacity shadow-md shadow-rose-900/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Quiz</span>
              </Link>

              <div className="h-5 w-[1px] bg-slate-800 hidden sm:block"></div>

              <div className="flex items-center gap-2 pl-1 sm:pl-0">
                <span className="text-xs font-semibold text-slate-300 hidden md:inline-block bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                  <User className="w-3 h-3 inline mr-1 text-amber-400" />
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Creator Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
