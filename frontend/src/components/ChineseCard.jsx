import React, { useState } from 'react';
import { Volume2, Eye, EyeOff, Sparkles, Headphones } from 'lucide-react';
import { speakChinese } from '../utils/api';

export default function ChineseCard({ prompt, pinyin, gameMode, imageUrl, questionType, showPinyinToggle = true }) {
  const [showPinyin, setShowPinyin] = useState(true);

  const handleSpeech = (e) => {
    e.stopPropagation();
    if (prompt) {
      // Strip radical annotations if any
      const textToSpeak = prompt.split(' ')[0];
      speakChinese(textToSpeak);
    }
  };

  const getModeBadge = () => {
    if (questionType === 'image_choice' || imageUrl) {
      return { label: 'Picture Match Quiz', icon: Sparkles, bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
    if (questionType === 'fill_in_blank') {
      return { label: 'Fill in the Blank', icon: Sparkles, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (questionType === 'sentence_order') {
      return { label: 'Sentence Order', icon: Sparkles, bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    }
    switch (gameMode) {
      case 'listening':
        return { label: 'Listening Mode', icon: Headphones, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'radical_match':
        return { label: 'Radical Match', icon: Sparkles, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'sentence_builder':
        return { label: 'Sentence Builder', icon: Sparkles, bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      default:
        return { label: 'Multiple Choice', icon: Sparkles, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
  };

  const badge = getModeBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 text-center border border-slate-700/60 shadow-2xl overflow-hidden group">
      {/* Decorative subtle background Asian paper watermark glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -z-10 group-hover:bg-rose-500/20 transition-all duration-500"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>

      {/* Mode Badge & Controls Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          {badge.label}
        </span>

        <div className="flex items-center gap-2">
          {/* Pronunciation Audio Speaker Button */}
          <button
            onClick={handleSpeech}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-semibold transition-all shadow-sm"
            title="Listen to Chinese pronunciation"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Audio</span>
          </button>

          {/* Pinyin Toggle */}
          {showPinyinToggle && pinyin && (
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
              title={showPinyin ? 'Hide Pinyin' : 'Show Pinyin'}
            >
              {showPinyin ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-amber-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Prompt Text & Optional Image */}
      <div className="py-2 space-y-3">
        {imageUrl && (
          <div className="max-w-xs mx-auto overflow-hidden rounded-2xl border-2 border-amber-500/40 shadow-2xl bg-slate-950">
            <img
              src={imageUrl}
              alt={prompt || 'Question image'}
              className="w-full h-44 object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {gameMode === 'listening' ? (
          <div className="flex flex-col items-center justify-center my-4">
            <button
              onClick={handleSpeech}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-amber-950/50 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Volume2 className="w-12 h-12 animate-pulse" />
            </button>
            <p className="mt-4 text-sm text-slate-400 font-medium">Click to play sound</p>
          </div>
        ) : (
          <h2 className="text-3xl sm:text-5xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 font-sans my-1 leading-relaxed">
            {prompt}
          </h2>
        )}

        {/* Pinyin Annotation display */}
        {pinyin && showPinyin && gameMode !== 'listening' && (
          <p className="text-lg sm:text-xl font-bold text-amber-400 tracking-wider font-sans animate-pop-in">
            {pinyin}
          </p>
        )}
      </div>
    </div>
  );
}
