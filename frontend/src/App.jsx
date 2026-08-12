import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import HostRoom from './pages/HostRoom';
import JoinRoom from './pages/JoinRoom';
import GameRoom from './pages/GameRoom';

export default function App() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/join" replace />} />
          <Route path="/join" element={<JoinRoom />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/edit-quiz/:quizId" element={<CreateQuiz />} />
          <Route path="/host/:quizId" element={<HostRoom />} />
          <Route path="/game/:roomCode" element={<GameRoom />} />
          <Route path="*" element={<Navigate to="/join" replace />} />
        </Routes>
      </main>
    </div>
  );
}
