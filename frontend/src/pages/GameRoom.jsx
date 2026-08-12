import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, CheckCircle, XCircle, Clock, Volume2, Flame, Award, ArrowLeft, Zap } from 'lucide-react';
import TimerBar from '../components/TimerBar';
import ChineseCard from '../components/ChineseCard';
import { getWebSocketUrl } from '../utils/api';

export default function GameRoom() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const displayName = searchParams.get('name') || 'Student';
  const navigate = useNavigate();

  const [ws, setWs] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState('CONNECTING'); // "CONNECTING", "LOBBY", "QUESTION", "SUBMITTED", "SHOW_ANSWER", "GAME_OVER"

  const [quizTitle, setQuizTitle] = useState('');
  const [progressionMode, setProgressionMode] = useState('manual');
  const [autoNextSeconds, setAutoNextSeconds] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [totalTime, setTotalTime] = useState(15);

  const [selectedOption, setSelectedOption] = useState(null);
  const [fillAnswer, setFillAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState(null); // { is_correct, points_gained, total_score, streak, correct_answer }
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [correctAnswer, setCorrectAnswer] = useState('');
  const [podium, setPodium] = useState([]);
  const [myRank, setMyRank] = useState(null);

  const questionStartTimeRef = useRef(Date.now());
  const wsRef = useRef(null);

  useEffect(() => {
    const socketUrl = getWebSocketUrl(`/ws/game/${roomCode}`);
    const socket = new WebSocket(socketUrl);
    wsRef.current = socket;
    setWs(socket);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          event: 'JOIN_ROOM',
          room_code: roomCode,
          display_name: displayName,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.event) {
          case 'JOIN_SUCCESS':
            setPlayerId(data.player_id);
            setQuizTitle(data.quiz_title || 'Chinese Quiz');
            setProgressionMode(data.progression_mode || 'manual');
            setGameState('LOBBY');
            break;

          case 'QUESTION_START':
            setGameState('QUESTION');
            setQuestionIndex(data.question_index);
            setTotalQuestions(data.total_questions);
            setProgressionMode(data.progression_mode || 'manual');
            setCurrentQuestion({
              prompt: data.prompt,
              pinyin: data.pinyin,
              options: data.options,
              game_mode: data.game_mode,
            });
            setTimeRemaining(data.time_limit);
            setTotalTime(data.time_limit);
            setSelectedOption(null);
            setFillAnswer('');
            setAnswerFeedback(null);
            setAutoNextSeconds(null);
            questionStartTimeRef.current = Date.now();
            break;

          case 'TIMER_TICK':
            setTimeRemaining(data.time_remaining);
            setTotalTime(data.total_time);
            break;

          case 'ANSWER_FEEDBACK':
            setAnswerFeedback(data);
            setTotalScore(data.total_score);
            setStreak(data.streak);
            setGameState('SUBMITTED');
            break;

          case 'SHOW_ANSWER':
            setGameState('SHOW_ANSWER');
            setCorrectAnswer(data.correct_answer);
            if (data.progression_mode) {
              setProgressionMode(data.progression_mode);
            }
            break;

          case 'AUTO_NEXT_TICK':
            setAutoNextSeconds(data.seconds_left);
            break;

          case 'GAME_OVER':
            setGameState('GAME_OVER');
            setPodium(data.podium || []);
            // Find my rank
            if (data.leaderboard && data.leaderboard.length > 0) {
              const myIdx = data.leaderboard.findIndex((item) => item.name === displayName);
              if (myIdx !== -1) {
                setMyRank(myIdx + 1);
              }
            }
            break;

          case 'ROOM_CLOSED':
            alert('Host has closed the game room.');
            navigate('/join');
            break;

          case 'ERROR':
            alert(data.message || 'Game room error');
            navigate('/join');
            break;

          default:
            break;
        }
      } catch (e) {
        console.error('Student WS JSON Parse error:', e);
      }
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [roomCode, displayName, navigate]);

  const handleChoiceSubmit = (option) => {
    if (gameState !== 'QUESTION' || selectedOption !== null) return;

    setSelectedOption(option);
    const timeSpentMs = Date.now() - questionStartTimeRef.current;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: 'SUBMIT_ANSWER',
          selected_answer: option,
          selected_option: option,
          time_spent_ms: timeSpentMs,
        })
      );
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-4 flex flex-col justify-between">
      {/* CONNECTING SCREEN */}
      {gameState === 'CONNECTING' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4"></div>
          <h2 className="text-lg font-bold text-white">Connecting to {roomCode}...</h2>
          <p className="text-xs text-slate-400 mt-1">Preparing your mobile game room</p>
        </div>
      )}

      {/* STUDENT LOBBY SCREEN */}
      {gameState === 'LOBBY' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-full glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-400 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4 animate-pulse-glow">
              禅
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
              Connected as {displayName}
            </span>

            <h2 className="text-2xl font-black text-white mt-2 mb-1">{quizTitle}</h2>
            <p className="text-xs text-slate-400 mb-6">Room Code: <strong className="text-amber-400">{roomCode}</strong></p>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse">
              <p className="text-sm font-bold text-slate-200">Waiting for host to start game...</p>
              <p className="text-[11px] text-slate-500 mt-1">Get ready to choose Chinese options quickly!</p>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION & CHOICE SCREEN */}
      {(gameState === 'QUESTION' || gameState === 'SUBMITTED' || gameState === 'SHOW_ANSWER') && currentQuestion && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                Q {questionIndex + 1}/{totalQuestions}
              </span>
              {streak > 1 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  <Flame className="w-3 h-3 fill-current text-amber-400" />
                  {streak} Streak!
                </span>
              )}
            </div>

            <div className="text-sm font-black text-amber-400 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{totalScore} pts</span>
            </div>
          </div>

          <TimerBar timeRemaining={timeRemaining} totalTime={totalTime} />

          {/* Chinese Prompt Card */}
          <ChineseCard
            prompt={currentQuestion.prompt}
            pinyin={currentQuestion.pinyin}
            gameMode={currentQuestion.game_mode}
            imageUrl={currentQuestion.image_url || currentQuestion.meta_info?.image_url}
            questionType={currentQuestion.question_type || currentQuestion.meta_info?.question_type}
          />

          {/* Answer Feedback Flash Alert */}
          {answerFeedback && (
            <div
              className={`p-4 rounded-2xl border text-center animate-pop-in ${
                answerFeedback.is_correct ? 'flash-correct border-emerald-500 text-emerald-300' : 'flash-incorrect border-rose-500 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-base font-extrabold mb-0.5">
                {answerFeedback.is_correct ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Correct! +{answerFeedback.points_gained} pts</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Incorrect</span>
                  </>
                )}
              </div>
              {!answerFeedback.is_correct && (
                <p className="text-xs text-slate-300">Answer: <strong className="text-emerald-400">{answerFeedback.correct_answer}</strong></p>
              )}
            </div>
          )}

          {/* Auto Next Indicator Banner for Student */}
          {progressionMode === 'auto' && (gameState === 'SUBMITTED' || gameState === 'SHOW_ANSWER') && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
              <span>
                {autoNextSeconds !== null
                  ? `Auto-advancing in ${autoNextSeconds}s...`
                  : 'Auto-advancing to next question...'}
              </span>
            </div>
          )}

          {/* Fill in the Blank Input or Multiple Choice options */}
          {(currentQuestion.question_type === 'fill_in_blank' || currentQuestion.meta_info?.question_type === 'fill_in_blank') ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (fillAnswer.trim() && selectedOption === null && gameState === 'QUESTION') {
                  handleChoiceSubmit(fillAnswer.trim());
                }
              }}
              className="space-y-3 pt-2"
            >
              <input
                type="text"
                disabled={selectedOption !== null || gameState !== 'QUESTION'}
                value={fillAnswer}
                onChange={(e) => setFillAnswer(e.target.value)}
                placeholder="Type your answer in Chinese or English..."
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 text-center text-lg text-white font-extrabold placeholder-slate-500 focus:border-rose-500 focus:outline-none shadow-xl"
              />
              <button
                type="submit"
                disabled={!fillAnswer.trim() || selectedOption !== null || gameState !== 'QUESTION'}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 text-white font-extrabold text-base shadow-xl disabled:opacity-40 cursor-pointer transition-all active:scale-95"
              >
                Submit Answer
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const optImg = currentQuestion.meta_info?.option_images?.[idx] || (option && (option.startsWith('http://') || option.startsWith('https://') || option.startsWith('data:image') ? option : null));

                let btnClass = "bg-slate-900/90 border-slate-800 text-slate-100 hover:border-rose-500/50";

                if (isSelected) {
                  if (answerFeedback) {
                    btnClass = answerFeedback.is_correct
                      ? "bg-emerald-600 text-white border-emerald-400 font-black shadow-lg"
                      : "bg-rose-600 text-white border-rose-400 font-black shadow-lg";
                  } else {
                    btnClass = "bg-amber-500 text-slate-950 font-black border-amber-300 shadow-lg";
                  }
                } else if (gameState === 'SHOW_ANSWER' && option === correctAnswer) {
                  btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoiceSubmit(option)}
                    disabled={selectedOption !== null || gameState !== 'QUESTION'}
                    className={`p-3 rounded-2xl border transition-all text-center min-h-[70px] flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:cursor-not-allowed ${btnClass}`}
                  >
                    {optImg && (
                      <img
                        src={optImg}
                        alt={`Option ${idx + 1}`}
                        className="w-full h-20 object-cover rounded-xl mb-1.5"
                      />
                    )}
                    <span className="text-sm sm:text-base font-bold">{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'GAME_OVER' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-full glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h1 className="text-2xl font-black text-white">Game Finished!</h1>
            <p className="text-xs text-slate-400 mb-4">{displayName}, here is your final score:</p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
              <div className="text-3xl font-black text-amber-400">{totalScore} Points</div>
              {myRank && <p className="text-xs font-bold text-slate-300 mt-1">Final Rank: #{myRank}</p>}
            </div>

            <button
              onClick={() => navigate('/join')}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Play Another Game</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
