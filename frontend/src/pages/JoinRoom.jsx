import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Sparkles, User, Hash, AlertCircle } from 'lucide-react';

export default function JoinRoom() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [roomCode, setRoomCode] = useState(codeFromUrl);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    const formattedCode = roomCode.trim().toUpperCase();
    const formattedName = displayName.trim();

    if (!formattedCode) {
      setError('Please enter a 6-digit Room Code.');
      return;
    }
    if (!formattedName) {
      setError('Please enter your Display Name.');
      return;
    }

    // Navigate to student mobile game view
    navigate(`/game/${formattedCode}?name=${encodeURIComponent(formattedName)}`);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-rose-950/50 mb-4 animate-pulse-glow">
          禅
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight">
          Join <span className="text-rose-500">Zen_Quiz</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Enter the room code shared by your host or teacher to play!
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4 text-left">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              6-Digit Room Code *
            </label>
            <div className="relative">
              <Hash className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={8}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ZQ-8812"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-lg font-black tracking-widest text-amber-400 uppercase placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>

          {/* Student Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Your Nickname / Name *
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={20}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ming"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3.5 text-base font-bold text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>

          {/* Join Button */}
          <button
            type="submit"
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-base shadow-xl shadow-rose-950/60 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Join Zen_Quiz</span>
          </button>
        </form>
      </div>
    </div>
  );
}
