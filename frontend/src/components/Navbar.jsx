import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  PlusCircle,
  LogOut,
  User,
  LayoutDashboard,
  PlayCircle,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogIn,
  Layers,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { getUser, setAuthToken, setUser } from '../utils/api';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Hide Navbar on student gameplay view for full immersion
  if (location.pathname.startsWith('/game/')) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 glass-panel border-b border-slate-800/90 backdrop-blur-xl px-3 sm:px-6 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
              禅
            </div>
            <div>
              <div className="flex items-center gap-1 font-extrabold text-lg sm:text-xl tracking-tight text-white leading-tight">
                Zen<span className="text-rose-500">_Quiz</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse hidden sm:inline" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wider uppercase hidden xs:block">
                Chinese Learning Hub
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              to="/join"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/join')
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500 hover:text-white'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Join Game</span>
            </Link>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      isActive('/admin')
                        ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md shadow-rose-950/40'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white'
                    }`}
                    title="Administrator Management Console"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive('/dashboard')
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/create-quiz"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white shadow-md shadow-rose-950/30 transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Quiz</span>
                </Link>

                <div className="h-5 w-[1px] bg-slate-800 mx-1"></div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">{user.username}</span>
                    {user.role === 'admin' ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        ADMIN
                      </span>
                    ) : null}
                  </span>

                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Header Bar Controls */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/join"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Join</span>
            </Link>

            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"
                title="Admin Panel"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Mobile Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MOBILE OVERLAY RIGHT SIDEBAR ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Right Sidebar Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-[82%] max-w-[320px] bg-[#0b0f19] border-l border-slate-800/90 shadow-2xl flex flex-col justify-between p-5 z-50 animate-slide-in-right">
            {/* Sidebar Top / Header */}
            <div>
              {/* Top Branding & Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 flex items-center justify-center font-black text-white text-base shadow-md shadow-rose-950/40">
                    禅
                  </div>
                  <span className="font-extrabold text-white text-lg tracking-tight">
                    Zen<span className="text-rose-500">_Quiz</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-rose-400" />
                </button>
              </div>

              {/* User Profile Card */}
              {user ? (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-5 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-md shrink-0 ${
                        user.role === 'admin'
                          ? 'bg-gradient-to-tr from-rose-600 to-purple-600 text-white shadow-rose-950/40'
                          : user.role === 'teacher'
                          ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black'
                          : 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white'
                      }`}
                    >
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span>{user.username}</span>
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Guest User</p>
                    <p className="text-[10px] text-slate-400">Log in to create and host quizzes</p>
                  </div>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-sm"
                  >
                    Login
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 mb-1">
                  Menu Navigation
                </p>

                <Link
                  to="/join"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isActive('/join')
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlayCircle className="w-4 h-4 text-rose-400" />
                    <span>Join Game Room</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isActive('/dashboard')
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>Quiz Library & Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/create-quiz"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isActive('/create-quiz')
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Create New Quiz Set</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      isActive('/admin')
                        ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md shadow-rose-950/40'
                        : 'text-rose-400 hover:text-white hover:bg-rose-500/15 border border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4" />
                      <span>Admin Control Panel</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                )}

                {!user && (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      isActive('/login')
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LogIn className="w-4 h-4 text-slate-400" />
                      <span>Creator & Admin Login</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                )}
              </div>
            </div>

            {/* Sidebar Bottom / Footer Actions */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-950/30"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In / Sign Up</span>
                </Link>
              )}

              <p className="text-[10px] text-center text-slate-500 font-medium">
                Zen_Quiz Platform • Chinese Interactive Learning
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
