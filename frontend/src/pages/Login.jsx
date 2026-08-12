import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Mail, Lock, LogIn, UserPlus, AlertCircle, Settings, Server, Check } from 'lucide-react';
import { apiRequest, setAuthToken, setUser, getApiBaseUrl, getCustomBackendUrl, setCustomBackendUrl } from '../utils/api';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getCustomBackendUrl());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setCustomBackendUrl(customUrlInput);
    setSavedSuccess(true);
    setError('');
    setTimeout(() => {
      setSavedSuccess(false);
      setShowConfig(false);
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await apiRequest('/auth/register', 'POST', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        setAuthToken(res.access_token);
        setUser(res.user);
        navigate('/dashboard');
      } else {
        const res = await apiRequest('/auth/login', 'POST', {
          username_or_email: formData.username,
          password: formData.password,
        });
        setAuthToken(res.access_token);
        setUser(res.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Server Config Toggle Button */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            title="Backend Server Settings"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5 text-xs"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 mx-auto flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-rose-900/40 mb-3">
            禅
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRegister ? 'Create Creator Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister ? 'Sign up to build and host custom Chinese quizzes' : 'Log in to manage your Zen_Quiz classroom sessions'}
          </p>
        </div>

        {/* Server Config Drawer */}
        {showConfig && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <Server className="w-4 h-4" />
                <span>Backend Server Configuration</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Active API Base: <code className="text-rose-300 font-mono">{getApiBaseUrl()}</code>
            </p>
            <form onSubmit={handleSaveConfig} className="space-y-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://zen-quiz-backend.onrender.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center gap-2 justify-end">
                {customUrlInput && (
                  <button
                    type="button"
                    onClick={() => setCustomUrlInput('')}
                    className="text-xs text-slate-400 hover:text-rose-400"
                  >
                    Reset Default
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
                  <span>{savedSuccess ? 'Saved!' : 'Save URL'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isRegister ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              isRegister ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            {(error.includes('404') || error.includes('Network Error') || error.includes('Failed to reach')) && (
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-400">Target URL: <code className="text-rose-300">{getApiBaseUrl()}</code></span>
                <button
                  type="button"
                  onClick={() => setShowConfig(true)}
                  className="text-rose-400 font-semibold underline hover:text-rose-300"
                >
                  Configure Server URL
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Username {isRegister ? '' : '/ Email'}
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder={isRegister ? 'e.g. TeacherChen' : 'Enter username or email'}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@school.edu"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Creator Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Just want to play a quiz?{' '}
            <Link to="/join" className="text-rose-400 font-semibold hover:underline">
              Join with Room Code &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
