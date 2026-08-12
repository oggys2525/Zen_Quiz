const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('zen_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('zen_token', token);
  } else {
    localStorage.removeItem('zen_token');
  }
}

export function getUser() {
  const u = localStorage.getItem('zen_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user) {
  if (user) {
    localStorage.setItem('zen_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('zen_user');
  }
}

export async function apiRequest(endpoint, method = 'GET', data = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.detail || 'API Request failed');
  }

  return json;
}

// Web Speech API helper for native Chinese pronunciation
export function speakChinese(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // Stop any active audio
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.85; // Slightly slower for language learners
  window.speechSynthesis.speak(utterance);
}

// WebSocket URL helper
export function getWebSocketUrl(path = '/ws/game') {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || '127.0.0.1';
  const port = window.location.port;

  // In dev environment with separate frontend port (e.g. 5173/5174), target backend port 8000
  if (port && port !== '8000' && port !== '80' && port !== '443') {
    return `${protocol}//${hostname}:8000${path}`;
  }
  return `${protocol}//${window.location.host}${path}`;
}
