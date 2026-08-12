import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, SkipForward, Trophy, Sparkles, Volume2, Clock, CheckCircle, Award, AlertCircle, Zap, Sliders, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import TimerBar from '../components/TimerBar';
import ChineseCard from '../components/ChineseCard';
import { getWebSocketUrl } from '../utils/api';

export default function HostRoom() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const wsRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('LOBBY'); // "LOBBY", "QUESTION", "SHOW_ANSWER", "GAME_OVER"

  // Session Control Options
  const [progressionMode, setProgressionMode] = useState('manual'); // 'manual' (teacher next) | 'auto' (auto next)
  const [timerMode, setTimerMode] = useState('per_question'); // 'per_question' | 'override_all'
  const [questionLimit, setQuestionLimit] = useState(0); // 0 = All, 5 = 5 Questions, 10 = 10 Questions
  const [timeLimit, setTimeLimit] = useState(15);
  const [autoNextSeconds, setAutoNextSeconds] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [totalTime, setTotalTime] = useState(15);

  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [podium, setPodium] = useState([]);

  const [wsError, setWsError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setWsError('');
    const socketUrl = getWebSocketUrl('/ws/game');
    const socket = new WebSocket(socketUrl);
    wsRef.current = socket;
    setWs(socket);

    const sendCreateRoom = () => {
      setWsError('');
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            event: 'CREATE_ROOM',
            quiz_id: parseInt(quizId, 10),
          })
        );
      }
    };

    if (socket.readyState === WebSocket.OPEN) {
      sendCreateRoom();
    } else {
      socket.onopen = sendCreateRoom;
    }

    socket.onerror = (err) => {
      console.error('Host WebSocket error:', err);
      setWsError('Could not connect to game server. Retrying...');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.event) {
          case 'ROOM_CREATED':
            setRoomCode(data.room_code);
            setQuizData(data.quiz);
            setPlayers(data.players || []);
            setTimeLimit(data.quiz?.default_time_limit || 15);
            setGameState('LOBBY');
            setWsError('');
            break;

          case 'PLAYER_JOINED':
          case 'PLAYER_LEFT':
            setPlayers(data.players || []);
            break;

          case 'QUESTION_START':
            setGameState('QUESTION');
            setQuestionIndex(data.question_index);
            setTotalQuestions(data.total_questions);
            setCurrentQuestion({
              prompt: data.prompt,
              pinyin: data.pinyin,
              options: data.options,
              game_mode: data.game_mode,
            });
            setTimeRemaining(data.time_limit);
            setTotalTime(data.time_limit);
            setAnsweredCount(0);
            setAutoNextSeconds(null);
            break;

          case 'TIMER_TICK':
            setTimeRemaining(data.time_remaining);
            setTotalTime(data.total_time);
            break;

          case 'HOST_PLAYER_ANSWERED':
            setAnsweredCount(data.answered_count);
            setPlayers(data.players || []);
            break;

          case 'SHOW_ANSWER':
            setGameState('SHOW_ANSWER');
            setCorrectAnswer(data.correct_answer);
            setLeaderboard(data.leaderboard || []);
            break;

          case 'AUTO_NEXT_TICK':
            setAutoNextSeconds(data.seconds_left);
            break;

          case 'GAME_OVER':
            setGameState('GAME_OVER');
            setLeaderboard(data.leaderboard || []);
            setPodium(data.podium || []);

            try {
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
              });
            } catch (e) {}
            break;

          case 'ERROR':
            setWsError(data.message || 'Error occurred');
            break;

          default:
            break;
        }
      } catch (e) {
        console.error('Host WS JSON Parse error:', e);
      }
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [quizId, retryCount]);

  const handleStartGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: 'START_GAME',
          progression_mode: progressionMode,
          timer_mode: timerMode,
          question_limit: questionLimit,
          time_limit: timeLimit,
          auto_advance_delay: 3,
        })
      );
    }
  };

  const handleNextQuestion = () => {
    setAutoNextSeconds(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'NEXT_QUESTION' }));
    }
  };

  const handleEndGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'END_GAME' }));
    }
  };

  if (wsError && !roomCode) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-rose-500/30 space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white">Cannot Host Live Game</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{wsError}</p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              🏠 Return to Dashboard
            </button>
            <button
              onClick={() => navigate(`/edit-quiz/${quizId}`)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              ✏️ Edit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* LOBBY VIEW */}
      {gameState === 'LOBBY' && (
        <div className="space-y-8">
          {/* Room Header Banner */}
          <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -z-10"></div>

            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Join at Zen_Quiz Web App</p>
            <div className="inline-block px-8 py-4 rounded-3xl bg-slate-900/90 border-2 border-rose-500/50 shadow-2xl glow-red mb-4">
              {roomCode ? (
                <span className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-500 tracking-wider">
                  {roomCode}
                </span>
              ) : wsError ? (
                <div className="text-rose-400 text-xs font-bold flex flex-col items-center gap-1.5 p-1">
                  <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />
                  <span>{wsError}</span>
                  <button
                    type="button"
                    onClick={() => setRetryCount((prev) => prev + 1)}
                    className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer mt-1"
                  >
                    🔄 Re-connect Room
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-1">
                  <span className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></span>
                  <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide">
                    Creating Room Code...
                  </span>
                </div>
              )}
            </div>

            <p className="text-base text-slate-300 font-semibold mb-6">
              Quiz: <span className="text-amber-400">{quizData?.title}</span>
            </p>

            {/* Quiz Game Control Settings */}
            <div className="max-w-2xl mx-auto mb-8 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-left space-y-4 shadow-inner">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sliders className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Session Controls & Rules</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Progression Mode Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Question Advancement Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProgressionMode('manual')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        progressionMode === 'manual'
                          ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Teacher Next</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProgressionMode('auto')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        progressionMode === 'auto'
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Auto Next</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {progressionMode === 'manual'
                      ? 'Teacher manually clicks "Next Question" after students finish.'
                      : 'Automatically advances to next question 3s after student(s) answer!'}
                  </p>
                </div>

                {/* Question Limit Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Question Count Limit
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[5, 10, 0].map((limit) => {
                      const isSelected = questionLimit === limit;
                      const label = limit === 0 ? 'All' : `${limit} Qs`;
                      return (
                        <button
                          key={limit}
                          type="button"
                          onClick={() => setQuestionLimit(limit)}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {questionLimit === 0
                      ? `Play all ${quizData?.questions?.length || 0} questions in set.`
                      : `Limit quiz session to ${questionLimit} questions.`}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:opacity-95 text-white font-extrabold text-lg flex items-center justify-center gap-3 mx-auto shadow-xl shadow-emerald-950/60 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>
                Start Game ({players.length} Joined • {questionLimit === 0 ? 'All' : questionLimit} Qs • {progressionMode === 'auto' ? 'Auto Next' : 'Teacher Next'})
              </span>
            </button>
          </div>

          {/* Joined Players Grid */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-500" />
                <span>Joined Players ({players.length})</span>
              </h3>
              <div className="flex items-center gap-3">
                {players.length === 0 && (
                  <span className="text-xs text-amber-400 font-semibold animate-pulse hidden sm:inline">Waiting for students to join...</span>
                )}
                <a
                  href={`/join?code=${roomCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>📱 Open Student Join Tab</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {players.map((p) => (
                <div
                  key={p.player_id}
                  className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-center animate-pop-in"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 mx-auto flex items-center justify-center font-bold text-white text-sm mb-1.5 shadow-md">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-slate-200 truncate">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUESTION ACTIVE VIEW */}
      {gameState === 'QUESTION' && currentQuestion && (
        <div className="space-y-6">
          {/* Header Progress */}
          <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question <strong className="text-white text-base">{questionIndex + 1}</strong> of {totalQuestions}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                progressionMode === 'auto' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {progressionMode === 'auto' ? '⚡ Auto Next' : '🎓 Teacher Next'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-slate-200">
                  {answeredCount} / {players.length} Answered
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Skip timer and advance question"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip / Next</span>
              </button>
            </div>
          </div>

          <TimerBar timeRemaining={timeRemaining} totalTime={totalTime} />

          {/* Chinese Card Projection */}
          <ChineseCard
            prompt={currentQuestion.prompt}
            pinyin={currentQuestion.pinyin}
            gameMode={currentQuestion.game_mode}
          />

          {/* Choices Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {currentQuestion.options.map((option, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-2xl border border-slate-700 text-center font-bold text-lg text-slate-200"
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVEAL ANSWER VIEW */}
      {gameState === 'SHOW_ANSWER' && (
        <div className="space-y-8">
          <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Question Answer</h2>
            <div className="text-3xl sm:text-5xl font-black text-emerald-400 mb-4 flex items-center justify-center gap-3">
              <CheckCircle className="w-10 h-10" />
              <span>{correctAnswer}</span>
            </div>

            {/* Auto Advance Banner if in Auto Mode */}
            {progressionMode === 'auto' && autoNextSeconds !== null && (
              <div className="max-w-md mx-auto mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex flex-col items-center gap-2 animate-pulse">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Auto-advancing to Next Question in {autoNextSeconds}s...</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${(autoNextSeconds / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-extrabold text-base flex items-center justify-center gap-2 mx-auto shadow-xl shadow-rose-950/50 hover:opacity-95 transition-all cursor-pointer"
            >
              <span>{progressionMode === 'auto' ? 'Next Question Now' : 'Next Question'}</span>
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Question Leaderboard */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Current Standings</span>
            </h3>

            <div className="space-y-2">
              {leaderboard.map((item, index) => (
                <div
                  key={item.player_id}
                  className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center ${
                      index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-300 text-slate-950' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-sm text-white">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.last_points_gained > 0 && (
                      <span className="text-xs font-bold text-emerald-400">+{item.last_points_gained}</span>
                    )}
                    <span className="text-sm font-extrabold text-amber-400">{item.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER PODIUM VIEW */}
      {gameState === 'GAME_OVER' && (
        <div className="space-y-8 text-center">
          <div className="glass-panel rounded-3xl p-8 border border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">Zen_Quiz Podium!</h1>
            <p className="text-sm text-slate-400 mb-8">Congratulations to top Chinese language masters!</p>

            {/* Podium Visual Standings */}
            <div className="flex items-end justify-center gap-4 max-w-xl mx-auto pt-8 pb-4">
              {/* 2nd Place */}
              {podium[1] && (
                <div className="flex-1 bg-slate-900/90 border border-slate-700 p-4 rounded-2xl text-center glow-gold">
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-950 font-black text-sm mx-auto flex items-center justify-center mb-2 shadow-md">
                    2
                  </div>
                  <p className="font-bold text-sm text-white truncate">{podium[1].name}</p>
                  <p className="text-xs font-extrabold text-amber-400 mt-1">{podium[1].score} pts</p>
                </div>
              )}

              {/* 1st Place Champion */}
              {podium[0] && (
                <div className="flex-1 bg-gradient-to-b from-rose-900/80 to-slate-900 border-2 border-amber-400 p-6 rounded-2xl text-center glow-red -translate-y-4">
                  <Award className="w-8 h-8 text-amber-400 mx-auto mb-1 animate-bounce" />
                  <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black text-base mx-auto flex items-center justify-center mb-2 shadow-xl">
                    1
                  </div>
                  <p className="font-extrabold text-base text-white truncate">{podium[0].name}</p>
                  <p className="text-sm font-black text-amber-300 mt-1">{podium[0].score} pts</p>
                </div>
              )}

              {/* 3rd Place */}
              {podium[2] && (
                <div className="flex-1 bg-slate-900/90 border border-slate-700 p-4 rounded-2xl text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black text-sm mx-auto flex items-center justify-center mb-2 shadow-md">
                    3
                  </div>
                  <p className="font-bold text-sm text-white truncate">{podium[2].name}</p>
                  <p className="text-xs font-extrabold text-amber-400 mt-1">{podium[2].score} pts</p>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="mt-8 px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
