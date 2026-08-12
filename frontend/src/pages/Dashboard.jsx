import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Play, Trash2, Search, BookOpen, Clock, Sparkles, RefreshCw, Volume2, Layers, Edit3 } from 'lucide-react';
import { apiRequest, getUser } from '../utils/api';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [accountScopeFilter, setAccountScopeFilter] = useState('all');
  const [error, setError] = useState('');
  const user = getUser();
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/quizzes');
      setQuizzes(data);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleHostQuiz = (quizId) => {
    navigate(`/host/${quizId}`);
  };

  const handleDeleteQuiz = async (quizId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await apiRequest(`/quizzes/${quizId}`, 'DELETE');
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (err) {
      alert(err.message || 'Could not delete quiz');
    }
  };

  const handleSeedQuizzes = async () => {
    try {
      await apiRequest('/quizzes/seed/default', 'POST');
      fetchQuizzes();
    } catch (err) {
      alert(err.message || 'Seeding failed');
    }
  };

  const myQuizzesCount = user ? quizzes.filter((q) => q.creator_id === user.id).length : 0;
  const sampleQuizzesCount = quizzes.filter((q) => q.creator_id === null).length;

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(search.toLowerCase()));
    const matchesMode = modeFilter === 'all' || q.game_mode === modeFilter;

    let matchesScope = true;
    if (accountScopeFilter === 'my') {
      matchesScope = user && q.creator_id === user.id;
    } else if (accountScopeFilter === 'sample') {
      matchesScope = q.creator_id === null;
    } else {
      // 'all' scope: show user's own quizzes + sample quizzes
      matchesScope = !user || q.creator_id === user.id || q.creator_id === null;
    }

    return matchesSearch && matchesMode && matchesScope;
  });

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'listening':
        return { label: 'Listening', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'radical_match':
        return { label: 'Radicals', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'sentence_builder':
        return { label: 'Sentences', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      default:
        return { label: 'Hanzi -> Pinyin', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
      {/* Dashboard Header Banner */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-10 border border-slate-800 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
                Creator Dashboard
              </span>
              {user && (
                <span className="text-xs font-semibold text-slate-400">
                  Logged in as <strong className="text-white">{user.username}</strong>
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Zen<span className="text-rose-500">_Quiz</span> Library
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Host interactive live game rooms for your students, or create custom Chinese vocabulary sets with automated TTS audio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedQuizzes}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              title="Load default sample HSK quizzes"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Restore Default Quizzes</span>
            </button>

            <Link
              to="/create-quiz"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Quiz</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quiz title or words..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {user && (
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAccountScopeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  accountScopeFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 All ({quizzes.length})
              </button>
              <button
                type="button"
                onClick={() => setAccountScopeFilter('my')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  accountScopeFilter === 'my'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👤 My Quizzes ({myQuizzesCount})
              </button>
              <button
                type="button"
                onClick={() => setAccountScopeFilter('sample')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  accountScopeFilter === 'sample'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📚 Samples ({sampleQuizzesCount})
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'hanzi_to_pinyin', 'listening', 'sentence_builder', 'radical_match'].map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                modeFilter === mode
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'all'
                ? 'All Modes'
                : mode === 'hanzi_to_pinyin'
                ? 'Hanzi'
                : mode === 'listening'
                ? 'Listening'
                : mode === 'sentence_builder'
                ? 'Sentences'
                : 'Radicals'}
            </button>
          ))}
        </div>
      </div>

      {/* Quizzes List Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-slate-400">Loading Zen_Quiz library...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="py-16 text-center glass-panel rounded-3xl border border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">
            {accountScopeFilter === 'my' ? 'No Personal Quizzes Yet' : 'No Quizzes Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            {accountScopeFilter === 'my'
              ? 'You have not created any quizzes with this account yet. Click "Create New Quiz" to add your first set!'
              : 'No quiz matched your search query. Try restoring default sample quizzes or create a new set!'}
          </p>
          {accountScopeFilter === 'my' ? (
            <Link
              to="/create-quiz"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Quiz</span>
            </Link>
          ) : (
            <button
              onClick={handleSeedQuizzes}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors"
            >
              Load Sample HSK Quizzes
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const badge = getModeBadge(quiz.game_mode);
            const isOwner = user && quiz.creator_id === user.id;
            const isSample = quiz.creator_id === null;

            return (
              <div
                key={quiz.id}
                className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {isOwner ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          👤 Mine
                        </span>
                      ) : isSample ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 text-amber-400/80 border border-slate-800">
                          Sample
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          User #{quiz.creator_id}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {quiz.default_time_limit > 0 ? `${quiz.default_time_limit}s` : 'Untimed'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors mb-2 line-clamp-1">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description || 'Interactive Chinese quiz set.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {quiz.questions ? quiz.questions.length : 0} Questions
                  </span>

                  <div className="flex items-center gap-2">
                    {(isOwner || isSample || !user) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-quiz/${quiz.id}`);
                        }}
                        title={isSample ? "Customize Sample Quiz" : "Edit Quiz"}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="hidden sm:inline">{isSample ? "Customize" : "Edit"}</span>
                      </button>
                    )}

                    {isOwner && (
                      <button
                        onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                        title="Delete Quiz"
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleHostQuiz(quiz.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Host Live Game</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
