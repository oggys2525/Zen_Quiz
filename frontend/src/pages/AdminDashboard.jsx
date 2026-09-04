import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  BookOpen,
  HelpCircle,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  Lock,
  Mail,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Clock,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { apiRequest, getUser } from '../utils/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'overview' | 'users' | 'quizzes'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filtering & Search
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quizSearch, setQuizSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showDeleteQuizModal, setShowDeleteQuizModal] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'teacher',
    status: 'active',
    is_active: true,
  });

  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    role: 'teacher',
    status: 'active',
    is_active: true,
  });

  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const currentUser = getUser();
  const navigate = useNavigate();

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiRequest('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Could not load users list');
    }
  };

  const fetchQuizzes = async () => {
    try {
      const data = await apiRequest('/admin/quizzes');
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchStats(), fetchUsers(), fetchQuizzes()]);
    } catch (err) {
      setError(err.message || 'Failed to load administrator data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Role protection check
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'admin') {
      // Not admin
      return;
    }
    loadAllAdminData();
  }, []);

  // Handlers for Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const newUser = await apiRequest('/admin/users', 'POST', createFormData);
      setUsers([newUser, ...users]);
      setShowCreateModal(false);
      setCreateFormData({
        username: '',
        email: '',
        password: '',
        role: 'teacher',
        status: 'active',
        is_active: true,
      });
      fetchStats();
      showNotification(`Account created successfully for '${newUser.username}'!`);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Edit User
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role || 'teacher',
      status: user.status || 'active',
      is_active: user.is_active !== undefined ? Boolean(user.is_active) : true,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiRequest(`/admin/users/${selectedUser.id}`, 'PUT', editFormData);
      setUsers(users.map((u) => (u.id === selectedUser.id ? updated : u)));
      setShowEditModal(false);
      fetchStats();
      showNotification(`User '${updated.username}' updated successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Toggle Status
  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot suspend or deactivate your own admin account.');
      return;
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const newIsActive = newStatus === 'active';
    try {
      const updated = await apiRequest(`/admin/users/${user.id}`, 'PUT', {
        status: newStatus,
        is_active: newIsActive,
      });
      setUsers(users.map((u) => (u.id === user.id ? updated : u)));
      fetchStats();
      showNotification(
        `Account '${user.username}' is now ${newStatus === 'active' ? 'ACTIVE ✅' : 'SUSPENDED 🚫'}`
      );
    } catch (err) {
      alert(err.message || 'Could not toggle user status');
    }
  };

  // Handlers for Reset Password
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setResetPasswordInput('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordInput) return;
    setActionLoading(true);
    setError('');
    try {
      await apiRequest(`/admin/users/${selectedUser.id}/password`, 'PUT', {
        new_password: resetPasswordInput,
      });
      setShowPasswordModal(false);
      showNotification(`Password for '${selectedUser.username}' has been successfully reset!`);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordInput(pass);
    if (showCreateModal) {
      setCreateFormData((prev) => ({ ...prev, password: pass }));
    }
  };

  // Handlers for Delete User
  const openDeleteModal = (user) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setError('');
    try {
      await apiRequest(`/admin/users/${selectedUser.id}`, 'DELETE');
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      fetchStats();
      fetchQuizzes();
      showNotification(`User account '${selectedUser.username}' deleted permanently.`);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Delete Quiz
  const openDeleteQuizModal = (quiz) => {
    setSelectedQuiz(quiz);
    setShowDeleteQuizModal(true);
  };

  const handleDeleteQuiz = async () => {
    if (!selectedQuiz) return;
    setActionLoading(true);
    try {
      await apiRequest(`/admin/quizzes/${selectedQuiz.id}`, 'DELETE');
      setQuizzes(quizzes.filter((q) => q.id !== selectedQuiz.id));
      setShowDeleteQuizModal(false);
      fetchStats();
      showNotification(`Quiz '${selectedQuiz.title}' deleted permanently.`);
    } catch (err) {
      alert(err.message || 'Failed to delete quiz');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const query = userSearch.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      String(u.id).includes(query);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtered Quizzes List
  const filteredQuizzes = quizzes.filter((q) => {
    const query = quizSearch.toLowerCase();
    return (
      q.title.toLowerCase().includes(query) ||
      (q.description && q.description.toLowerCase().includes(query)) ||
      String(q.creator_id).includes(query)
    );
  });

  // Unauthorized view
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-rose-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Administrator Access Required</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            This dashboard is restricted to users with administrative privileges. You are currently logged in as{' '}
            <strong className="text-slate-200">{currentUser ? currentUser.username : 'Guest'}</strong> (Role:{' '}
            <span className="text-amber-400 font-semibold">{currentUser?.role || 'Guest'}</span>).
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md shadow-rose-900/30"
            >
              <Lock className="w-4 h-4" />
              <span>Log in with Admin Account</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Back to Creator Library</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
      {/* Toast Notification Banner */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-medium flex items-center justify-between shadow-lg shadow-emerald-950/20 animate-pop-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-medium flex items-center justify-between shadow-lg shadow-rose-950/20 animate-pop-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-rose-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-purple-500/10 to-amber-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Management Console
              </span>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Admin: <strong className="text-white">{currentUser.username}</strong>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              User Accounts & System Admin
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Register, manage, edit, approve, and secure all user accounts. Control permissions and manage educational quiz content across the platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={loadAllAdminData}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              title="Refresh all metrics and data"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 shrink-0 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={() => {
                setCreateFormData({
                  username: '',
                  email: '',
                  password: '',
                  role: 'teacher',
                  status: 'active',
                  is_active: true,
                });
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/40 cursor-pointer w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Register New Account</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Manage Accounts ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Analytics & Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'quizzes'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Official Quizzes ({quizzes.length})</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner (Always visible or in overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {stats ? stats.total_users : users.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered platform accounts</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
            {stats ? stats.active_users : users.filter((u) => u.status === 'active').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Authorized and verified accounts</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Quizzes</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {stats ? stats.total_quizzes : quizzes.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Official system & admin quiz sets</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
            {stats ? stats.total_questions : '25+'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Interactive vocabulary items</p>
        </div>
      </div>

      {/* TAB CONTENT: MANAGE ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by username, email or ID..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                {['all', 'admin', 'teacher', 'student'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      roleFilter === r
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'All Roles' : r}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                {['all', 'active', 'suspended'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === s
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 'all' ? 'All Status' : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium self-end md:self-auto">
              Showing <strong className="text-white">{filteredUsers.length}</strong> of{' '}
              <strong className="text-white">{users.length}</strong> accounts
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-medium text-slate-400">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Accounts Matched Filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Try adjusting your search criteria or register a new user account directly into the database.
              </p>
              <button
                onClick={() => {
                  setUserSearch('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">User / Account</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Quizzes</th>
                      <th className="py-3.5 px-4 hidden md:table-cell">Registered</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id;
                      const isActive = user.status === 'active' && Boolean(user.is_active);

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isSelf ? 'bg-rose-500/5' : ''
                          }`}
                        >
                          {/* User Column */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-md shrink-0 ${
                                  user.role === 'admin'
                                    ? 'bg-gradient-to-tr from-rose-600 to-purple-600 text-white shadow-rose-900/40'
                                    : user.role === 'teacher'
                                    ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black'
                                    : 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white'
                                }`}
                              >
                                {user.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white truncate">{user.username}</span>
                                  {isSelf && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="py-4 px-4">
                            {user.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Admin
                              </span>
                            ) : user.role === 'teacher' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <BookOpen className="w-3.5 h-3.5" />
                                Teacher
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Student
                              </span>
                            )}
                          </td>

                          {/* Status Column */}
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot modify own status' : 'Click to toggle status'}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                              } ${isSelf ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                                }`}
                              ></span>
                              <span className="capitalize">{user.status || (isActive ? 'active' : 'suspended')}</span>
                            </button>
                          </td>

                          {/* Quizzes Count */}
                          <td className="py-4 px-4 text-xs font-semibold text-slate-300">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                              {user.quizzes_count !== undefined ? user.quizzes_count : 0} sets
                            </span>
                          </td>

                          {/* Joined Date */}
                          <td className="py-4 px-4 text-xs text-slate-400 hidden md:table-cell">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Unknown'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(user)}
                                title="Edit Account Details"
                                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => openPasswordModal(user)}
                                title="Reset User Password"
                                className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {!isSelf && (
                                <button
                                  onClick={() => openDeleteModal(user)}
                                  title="Delete User Account"
                                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ANALYTICS & OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Breakdown Card */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" />
                <span>Account Role & Status Distribution</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Administrators</span>
                    <span className="text-rose-400 font-bold">
                      {users.filter((u) => u.role === 'admin').length} accounts
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          10,
                          (users.filter((u) => u.role === 'admin').length / (users.length || 1)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Teachers / Creators</span>
                    <span className="text-amber-400 font-bold">
                      {users.filter((u) => u.role === 'teacher').length} accounts
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          10,
                          (users.filter((u) => u.role === 'teacher').length / (users.length || 1)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Students / Learners</span>
                    <span className="text-sky-400 font-bold">
                      {users.filter((u) => u.role === 'student').length} accounts
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          10,
                          (users.filter((u) => u.role === 'student').length / (users.length || 1)) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Quick Tips Card */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Admin Capabilities & Storage</span>
              </h3>
              <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Registered Account Persistence:</strong> All user accounts are saved directly to the database with secure bcrypt password hashes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Account Suspension:</strong> Clicking a user's status badge prevents unauthorized logins immediately across all devices.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Direct Password Resets:</strong> Reset forgotten teacher or student credentials on demand with one click.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Official Quizzes:</strong> Manage platform default and administrator quizzes. Teacher-created quizzes are kept private to each teacher and are not displayed here.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OFFICIAL ADMIN QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quizSearch}
                onChange={(e) => setQuizSearch(e.target.value)}
                placeholder="Search official quiz title, mode, or prompt..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                🔒 Teacher Quizzes Kept Private
              </span>
              <div className="text-xs text-slate-400 font-medium">
                Total <strong className="text-white">{filteredQuizzes.length}</strong> official quizzes
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-rose-400 border border-slate-800">
                      {quiz.game_mode}
                    </span>
                    <span className="text-xs text-slate-400">
                      {quiz.creator_id ? `Creator #${quiz.creator_id}` : 'System Sample'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    {quiz.questions ? quiz.questions.length : 0} Questions
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/host/${quiz.id}`}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Host Live Game"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Host</span>
                    </Link>

                    <button
                      onClick={() => openDeleteQuizModal(quiz)}
                      title="Delete Quiz from System"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <UserPlusIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Register New Account</h2>
                  <p className="text-xs text-slate-400">Create & save a new user directly in the system</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                    placeholder="e.g. TeacherWang"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="teacher@school.edu"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="Set secure password (min 6 chars)"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="teacher">Teacher / Creator</option>
                    <option value="student">Student / Learner</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={createFormData.status}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        status: e.target.value,
                        is_active: e.target.value === 'active',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="active">Active (Enabled)</option>
                    <option value="suspended">Suspended (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Save & Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Account: {selectedUser.username}</h2>
                <p className="text-xs text-slate-400">Update permissions and account status</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="teacher">Teacher / Creator</option>
                    <option value="student">Student / Learner</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                        is_active: e.target.value === 'active',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/40 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. RESET PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Reset Password</h2>
                  <p className="text-xs text-slate-400">For account: <strong className="text-white">{selectedUser.username}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !resetPasswordInput}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DELETE USER CONFIRMATION MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/40 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete User Account?</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to permanently delete account{' '}
              <strong className="text-white">"{selectedUser.username}"</strong> (ID: {selectedUser.id}, Email:{' '}
              {selectedUser.email})? All quizzes and assets created by this user will also be removed. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE QUIZ CONFIRMATION MODAL */}
      {showDeleteQuizModal && selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/40 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Quiz from Platform?</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete quiz <strong className="text-white">"{selectedQuiz.title}"</strong> (ID:{' '}
              {selectedQuiz.id})? All associated questions will be removed immediately.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteQuizModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Plus helper icon
function UserPlusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
