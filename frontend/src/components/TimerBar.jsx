import React from 'react';
import { Clock } from 'lucide-react';

export default function TimerBar({ timeRemaining, totalTime }) {
  if (!totalTime || totalTime <= 0) return null;

  const percentage = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));

  // Determine bar color dynamically based on percentage remaining
  let colorClass = "from-emerald-500 to-teal-400";
  if (percentage <= 25) {
    colorClass = "from-rose-600 to-red-500 animate-pulse";
  } else if (percentage <= 50) {
    colorClass = "from-amber-500 to-yellow-400";
  }

  return (
    <div className="w-full my-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5 px-1">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Clock className={`w-3.5 h-3.5 ${percentage <= 25 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
          Time Remaining
        </span>
        <span className={`text-sm font-extrabold ${percentage <= 25 ? 'text-rose-400' : 'text-slate-200'}`}>
          {timeRemaining}s
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-3 bg-slate-900/80 rounded-full border border-slate-800 p-0.5 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-linear shadow-lg`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
