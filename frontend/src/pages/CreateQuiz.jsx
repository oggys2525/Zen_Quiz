import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Sparkles, CheckCircle2, Clock, Volume2, HelpCircle, Edit3, ChevronDown, ChevronUp, Layers, X, Upload, Image as ImageIcon, Link2, XCircle } from 'lucide-react';
import { apiRequest } from '../utils/api';

const handleDeviceFileUpload = (file, onComplete) => {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    onComplete(e.target.result);
  };
  reader.readAsDataURL(file);
};

const PRESET_IMAGES = [
  { emoji: '🐱', label: 'Cat', chinese: '猫', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
  { emoji: '🍎', label: 'Apple', chinese: '苹果', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80' },
  { emoji: '🚗', label: 'Car', chinese: '汽车', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80' },
  { emoji: '🍜', label: 'Noodles', chinese: '面条', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
  { emoji: '🇨🇳', label: 'China Flag', chinese: '中国', url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=600&q=80' },
  { emoji: '🐕', label: 'Dog', chinese: '狗', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80' },
  { emoji: '📖', label: 'Book', chinese: '书', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' },
  { emoji: '🍵', label: 'Tea', chinese: '茶', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
];

export default function CreateQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(quizId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameMode, setGameMode] = useState('hanzi_to_pinyin');
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(15);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  // Track collapsed questions: { [index]: boolean }
  const [collapsed, setCollapsed] = useState({});
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);

  const [questions, setQuestions] = useState([
    {
      question_type: 'multiple_choice',
      prompt: '你好',
      pinyin: 'nǐ hǎo',
      correct_answer: 'Hello',
      options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
      image_url: '',
    },
    {
      question_type: 'fill_in_blank',
      prompt: '我是 ___ 人',
      pinyin: 'wǒ shì ___ rén',
      correct_answer: '中国',
      options: ['中国', '美国', '英国', '法国'],
      image_url: '',
    },
    {
      question_type: 'image_choice',
      prompt: 'What is this animal in Chinese?',
      pinyin: 'māo',
      correct_answer: '猫 (Cat)',
      options: ['猫 (Cat)', '狗 (Dog)', '鸟 (Bird)', '鱼 (Fish)'],
      image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    },
  ]);

  useEffect(() => {
    if (isEditing) {
      const fetchQuiz = async () => {
        setInitialLoading(true);
        try {
          const quiz = await apiRequest(`/quizzes/${quizId}`);
          setTitle(quiz.title || '');
          setDescription(quiz.description || '');
          setGameMode(quiz.game_mode || 'hanzi_to_pinyin');
          setDefaultTimeLimit(quiz.default_time_limit ?? 15);
          if (quiz.questions && quiz.questions.length > 0) {
            setQuestions(
              quiz.questions.map((q) => ({
                question_type: q.meta_info?.question_type || 'multiple_choice',
                image_url: q.meta_info?.image_url || '',
                prompt: q.prompt || '',
                pinyin: q.pinyin || '',
                correct_answer: q.correct_answer || '',
                options: q.options || ['', '', '', ''],
                time_limit: q.time_limit ?? (q.meta_info?.time_limit ?? null),
              }))
            );
          }
        } catch (err) {
          setError(err.message || 'Failed to load quiz details');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchQuiz();
    }
  }, [quizId, isEditing]);

  const toggleCollapse = (index) => {
    setCollapsed((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleExpandAll = () => {
    setCollapsed({});
  };

  const handleCollapseAll = () => {
    const allCollapsed = {};
    questions.forEach((_, idx) => {
      allCollapsed[idx] = true;
    });
    setCollapsed(allCollapsed);
  };

  const handleAddQuestionWithType = (type) => {
    const newIndex = questions.length;
    const newQ = {
      question_type: type,
      prompt: '',
      pinyin: '',
      correct_answer: '',
      options: ['', '', '', ''],
      option_images: ['', '', '', ''],
      image_url: '',
    };

    setQuestions([...questions, newQ]);
    setCollapsed((prev) => ({
      ...prev,
      [newIndex]: false,
    }));
    setShowAddTypeModal(false);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      alert('Quiz must contain at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleQuestionTypeChange = (index, type) => {
    const updated = [...questions];
    updated[index].question_type = type;
    if (type === 'fill_in_blank' && !updated[index].correct_answer) {
      updated[index].correct_answer = updated[index].prompt || '';
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    if (updated[qIndex].correct_answer === updated[qIndex].options[optIndex]) {
      updated[qIndex].correct_answer = value;
    }
    setQuestions(updated);
  };

  const handleSelectCorrect = (qIndex, selectedOption) => {
    const updated = [...questions];
    updated[qIndex].correct_answer = selectedOption;
    setQuestions(updated);
  };

  const handleApplyDefaultTimerToAll = () => {
    const limit = parseInt(defaultTimeLimit, 10);
    const updated = questions.map((q) => ({
      ...q,
      time_limit: limit,
    }));
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a Quiz Title.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(`Question #${i + 1} is missing a prompt.`);
        setCollapsed((prev) => ({ ...prev, [i]: false }));
        return;
      }
      if (!q.correct_answer.trim()) {
        setError(`Question #${i + 1} needs a correct answer.`);
        setCollapsed((prev) => ({ ...prev, [i]: false }));
        return;
      }
      if (
        q.question_type !== 'fill_in_blank' &&
        q.options.some((opt, idx) => !opt.trim() && !q.option_images?.[idx])
      ) {
        setError(`Question #${i + 1} has empty choices.`);
        setCollapsed((prev) => ({ ...prev, [i]: false }));
        return;
      }
    }

    setLoading(true);
    try {
      const formattedQuestions = questions.map((q) => {
        const qType = q.question_type || 'multiple_choice';
        const finalOptions =
          qType === 'fill_in_blank'
            ? [q.correct_answer, '', '', '']
            : q.options.map((opt, idx) => (opt.trim() ? opt : q.option_images?.[idx] || 'Option'));

        return {
          prompt: q.prompt,
          pinyin: q.pinyin || null,
          correct_answer: q.correct_answer,
          options: finalOptions,
          time_limit: q.time_limit,
          meta_info: {
            question_type: qType,
            image_url: q.image_url || null,
            option_images: q.option_images || [],
            time_limit: q.time_limit,
          },
        };
      });

      const payload = {
        title,
        description,
        game_mode: gameMode,
        default_time_limit: parseInt(defaultTimeLimit, 10),
        questions: formattedQuestions,
      };

      if (isEditing) {
        await apiRequest(`/quizzes/${quizId}`, 'PUT', payload);
      } else {
        await apiRequest('/quizzes', 'POST', payload);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-slate-400">Loading quiz details for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {isEditing ? <Edit3 className="w-5 h-5" /> : '✍️'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isEditing ? 'Edit Chinese Quiz' : 'Create Chinese Quiz'}
            </h1>
            <p className="text-xs text-slate-400">
              {isEditing ? 'Update vocabulary words, pinyin, and correct answers' : 'Build custom word sets with pinyin, audio support, and choices'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HSK 2 Shopping & Dining"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of vocabulary covered..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Mode & Timer Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Game Mode
              </label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value="hanzi_to_pinyin">Hanzi to Pinyin / English</option>
                <option value="listening">Listening Mode (Audio Prompt)</option>
                <option value="sentence_builder">Sentence Builder / Grammar</option>
                <option value="radical_match">Radical Match Challenge</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Default Time Limit for All
                </label>
                <button
                  type="button"
                  onClick={handleApplyDefaultTimerToAll}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                  title="Set all questions to this time limit"
                >
                  Apply to All Qs
                </button>
              </div>
              <select
                value={defaultTimeLimit}
                onChange={(e) => setDefaultTimeLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              >
                <option value={10}>10 Seconds (Fast)</option>
                <option value={15}>15 Seconds (Standard)</option>
                <option value={30}>30 Seconds (Relaxed)</option>
                <option value={0}>Untimed (No Countdown)</option>
              </select>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Questions ({questions.length})</span>
              </h2>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Collapse all questions to short list view"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </button>

                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Expand all questions for editing"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            {questions.map((q, qIndex) => {
              const isCollapsed = Boolean(collapsed[qIndex]);
              const qType = q.question_type || 'multiple_choice';
              const timerLabel =
                q.time_limit === undefined || q.time_limit === null
                  ? `Default (${defaultTimeLimit > 0 ? `${defaultTimeLimit}s` : 'Untimed'})`
                  : q.time_limit === 0
                  ? 'Untimed'
                  : `${q.time_limit}s`;

              let typeBadgeLabel = '🔘 Choice';
              if (qType === 'fill_in_blank') typeBadgeLabel = '✍️ Fill';
              if (qType === 'image_choice') typeBadgeLabel = '🖼️ Picture';
              if (qType === 'sentence_order') typeBadgeLabel = '🧩 Sentence';

              return (
                <div
                  key={qIndex}
                  className={`rounded-2xl border transition-all shadow-lg overflow-hidden ${
                    isCollapsed
                      ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-900/90 border-slate-700/80 p-5 space-y-4'
                  }`}
                >
                  {/* Summary Bar / Header */}
                  <div
                    onClick={() => toggleCollapse(qIndex)}
                    className={`flex items-center justify-between cursor-pointer select-none transition-colors ${
                      isCollapsed ? 'p-4 hover:bg-slate-800/40' : 'border-b border-slate-800 pb-3 mb-2'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                        #{qIndex + 1}
                      </span>

                      {isCollapsed ? (
                        <div className="flex items-center gap-3 truncate text-sm">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 shrink-0">
                            {typeBadgeLabel}
                          </span>
                          <span className="font-extrabold text-white text-base truncate">
                            {q.prompt || <span className="italic text-slate-500 text-xs font-normal">(Empty Prompt)</span>}
                          </span>
                          {q.pinyin && (
                            <span className="text-xs font-bold text-amber-400 truncate hidden sm:inline">
                              [{q.pinyin}]
                            </span>
                          )}
                          {q.correct_answer && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold truncate hidden md:inline">
                              ✓ {q.correct_answer}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                            Question #{qIndex + 1} Setup
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400">
                        ⏱️ {timerLabel}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveQuestion(qIndex);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Remove Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title={isCollapsed ? 'Expand to Edit' : 'Collapse'}
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Form fields (Only visible when expanded) */}
                  {!isCollapsed && (
                    <>

                      {/* Image Preset & URL Box for Picture Quiz */}
                      {qType === 'image_choice' && (
                        <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                              Question Picture (Upload from device, paste link, or pick preset)
                            </label>
                            {q.image_url && (
                              <button
                                type="button"
                                onClick={() => handleQuestionChange(qIndex, 'image_url', '')}
                                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Clear Image</span>
                              </button>
                            )}
                          </div>

                          {/* Device Upload + URL input */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Device File Upload Button */}
                            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-500/50 hover:border-purple-400 bg-purple-900/10 hover:bg-purple-900/30 text-purple-300 text-xs font-bold cursor-pointer transition-all">
                              <Upload className="w-4 h-4 text-purple-400" />
                              <span>Upload File from Device</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    handleDeviceFileUpload(file, (dataUrl) => {
                                      handleQuestionChange(qIndex, 'image_url', dataUrl);
                                    });
                                  }
                                }}
                              />
                            </label>

                            {/* Paste URL Input */}
                            <div className="relative flex items-center">
                              <Link2 className="w-4 h-4 text-slate-500 absolute left-3" />
                              <input
                                type="url"
                                value={q.image_url && !q.image_url.startsWith('data:image') ? q.image_url : ''}
                                onChange={(e) => handleQuestionChange(qIndex, 'image_url', e.target.value)}
                                placeholder="Or paste image URL (https://...)"
                                className="w-full bg-slate-950 border border-purple-800/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-400"
                              />
                            </div>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Quick Emoji Presets:</span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {PRESET_IMAGES.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    handleQuestionChange(qIndex, 'image_url', preset.url);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500 text-xs font-bold text-slate-200 shrink-0 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>{preset.emoji}</span>
                                  <span>{preset.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Image Thumbnail Preview */}
                          {q.image_url && (
                            <div className="flex items-center gap-4 pt-2 border-t border-purple-900/40">
                              <img
                                src={q.image_url}
                                alt="Question Preview"
                                className="w-24 h-24 object-cover rounded-xl border-2 border-purple-500/50 shadow-lg"
                                onError={(e) => (e.target.style.display = 'none')}
                              />
                              <div>
                                <span className="text-xs font-extrabold text-purple-300 block">✓ Image Ready</span>
                                <span className="text-[11px] text-slate-400">Will be shown on student and host screens during quiz</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            {qType === 'fill_in_blank'
                              ? 'Prompt with Blank (e.g. 我是 ___ 人) *'
                              : qType === 'image_choice'
                              ? 'Picture Question Prompt *'
                              : 'Chinese Prompt (Hanzi) *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={q.prompt}
                            onChange={(e) => handleQuestionChange(qIndex, 'prompt', e.target.value)}
                            placeholder="e.g. 猫"
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Pinyin Annotation
                          </label>
                          <input
                            type="text"
                            value={q.pinyin || ''}
                            onChange={(e) => handleQuestionChange(qIndex, 'pinyin', e.target.value)}
                            placeholder="e.g. māo"
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-amber-400 placeholder-slate-600 focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Question Timer Limit
                          </label>
                          <select
                            value={q.time_limit ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              handleQuestionChange(qIndex, 'time_limit', val);
                            }}
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-amber-300 focus:border-rose-500 font-semibold"
                          >
                            <option value="">Default ({defaultTimeLimit > 0 ? `${defaultTimeLimit}s` : 'Untimed'})</option>
                            <option value={10}>10 Seconds (Fast)</option>
                            <option value={15}>15 Seconds (Standard)</option>
                            <option value={20}>20 Seconds</option>
                            <option value={30}>30 Seconds (Relaxed)</option>
                            <option value={60}>60 Seconds (1 Min)</option>
                            <option value={0}>Untimed (No Countdown)</option>
                          </select>
                        </div>
                      </div>

                      {/* Options or Fill In Answer Input */}
                      {qType === 'fill_in_blank' ? (
                        <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl">
                          <label className="block text-xs font-bold text-emerald-400 mb-1">
                            Exact Type-In Answer Expected *
                          </label>
                          <input
                            type="text"
                            required
                            value={q.correct_answer}
                            onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                            placeholder="e.g. 中国"
                            className="w-full bg-slate-950 border border-emerald-700/80 rounded-xl px-3 py-2 text-sm text-emerald-300 font-bold placeholder-slate-600 focus:border-emerald-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Students will type their answer directly during gameplay. Answer evaluation is case-insensitive.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">
                            Multiple Choice Options (Select radio next to correct answer) *
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((option, optIndex) => {
                              const isCorrect = q.correct_answer === option && option.trim() !== '';
                              const optImg = q.option_images?.[optIndex];

                              return (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-xl border transition-all space-y-2 ${
                                    isCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct_${qIndex}`}
                                      checked={isCorrect}
                                      onChange={() => handleSelectCorrect(qIndex, option)}
                                      className="accent-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                                    />
                                    <input
                                      type="text"
                                      required
                                      value={option}
                                      onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                      placeholder={`Choice ${optIndex + 1} Text (e.g. 猫)`}
                                      className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-600 font-semibold text-white"
                                    />
                                    {/* Upload Choice Image Icon Button */}
                                    <label className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors shrink-0" title="Upload Image for Choice">
                                      <ImageIcon className="w-4 h-4" />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            handleDeviceFileUpload(file, (dataUrl) => {
                                              const updated = [...questions];
                                              if (!updated[qIndex].option_images) {
                                                updated[qIndex].option_images = ['', '', '', ''];
                                              }
                                              updated[qIndex].option_images[optIndex] = dataUrl;
                                              setQuestions(updated);
                                            });
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>

                                  {/* Choice Image Thumbnail Preview */}
                                  {optImg && (
                                    <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <img src={optImg} alt={`Choice ${optIndex + 1}`} className="w-10 h-10 object-cover rounded-md border border-slate-700 shrink-0" />
                                        <span className="text-[11px] text-amber-400 font-bold truncate">Choice Image Attached</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...questions];
                                          if (updated[qIndex].option_images) {
                                            updated[qIndex].option_images[optIndex] = '';
                                            setQuestions(updated);
                                          }
                                        }}
                                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold shrink-0 cursor-pointer"
                                      >
                                        Remove Image
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-800">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 hover:opacity-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Save Quiz Set'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Select Question Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>✨ Select Question Type</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Choose the format for your new Chinese question</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTypeModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Multiple Choice Card */}
              <div
                onClick={() => handleAddQuestionWithType('multiple_choice')}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-rose-500/80 hover:bg-rose-950/20 cursor-pointer transition-all group shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
                  🔘
                </div>
                <h4 className="text-sm font-extrabold text-white group-hover:text-rose-400 transition-colors">Multiple Choice</h4>
                <p className="text-xs text-slate-400 mt-1">4 answer choices for students to pick from.</p>
              </div>

              {/* Fill in Blank Card */}
              <div
                onClick={() => handleAddQuestionWithType('fill_in_blank')}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-500/80 hover:bg-emerald-950/20 cursor-pointer transition-all group shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
                  ✍️
                </div>
                <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">Fill in the Blank</h4>
                <p className="text-xs text-slate-400 mt-1">Students type text directly into an answer box.</p>
              </div>

              {/* Picture Quiz Card */}
              <div
                onClick={() => handleAddQuestionWithType('image_choice')}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-purple-500/80 hover:bg-purple-950/20 cursor-pointer transition-all group shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
                  🖼️
                </div>
                <h4 className="text-sm font-extrabold text-white group-hover:text-purple-400 transition-colors">Picture / Image Quiz</h4>
                <p className="text-xs text-slate-400 mt-1">Image prompt with presets (Cat, Apple, Car, Flag, etc.).</p>
              </div>

              {/* Sentence Order Card */}
              <div
                onClick={() => handleAddQuestionWithType('sentence_order')}
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-sky-500/80 hover:bg-sky-950/20 cursor-pointer transition-all group shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
                  🧩
                </div>
                <h4 className="text-sm font-extrabold text-white group-hover:text-sky-400 transition-colors">Sentence Order</h4>
                <p className="text-xs text-slate-400 mt-1">Grammar & word ordering challenge for students.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
