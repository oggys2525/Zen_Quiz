// Default backend service URL when deployed on production hosting without custom VITE_API_URL
const DEFAULT_PROD_BACKEND = 'https://zen-quiz-backend.onrender.com';

export function getCustomBackendUrl() {
  return localStorage.getItem('zen_custom_backend_url') || '';
}

export function setCustomBackendUrl(url) {
  if (url && url.trim()) {
    localStorage.setItem('zen_custom_backend_url', url.trim().replace(/\/$/, ''));
  } else {
    localStorage.removeItem('zen_custom_backend_url');
  }
}

export function getApiBaseUrl() {
  // 1. Custom user override from settings/localStorage
  const customUrl = getCustomBackendUrl();
  if (customUrl) {
    return customUrl.endsWith('/api') ? customUrl : `${customUrl}/api`;
  }

  // 2. Build-time environment variable VITE_API_URL
  if (import.meta.env.VITE_API_URL) {
    const envUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // 3. Localhost / Dev environment
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/api';
  }

  // 4. Default hosted production backend fallback
  return `${DEFAULT_PROD_BACKEND}/api`;
}

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

  const apiBase = getApiBaseUrl();

  let res;
  try {
    res = await fetch(`${apiBase}${endpoint}`, options);
  } catch (netErr) {
    throw new Error(`Network Error: Failed to reach backend at ${apiBase}. Please verify backend server is online.`);
  }

  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    // Response was not JSON (e.g. 404 HTML page from static server)
  }

  if (!res.ok) {
    const errorMsg = json.detail || json.message || `Backend Server Error (${res.status}${res.statusText ? ': ' + res.statusText : ''}) at ${apiBase}${endpoint}`;
    throw new Error(errorMsg);
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
  const apiBase = getApiBaseUrl();

  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    try {
      const url = new URL(apiBase);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${url.host}${path}`;
    } catch (e) {
      console.error('Invalid API URL for WebSocket:', e);
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || '127.0.0.1';
  const port = window.location.port;

  // In dev environment with separate frontend port (e.g. 5173/5174), target backend port 8000
  if (port && port !== '8000' && port !== '80' && port !== '443') {
    return `${protocol}//${hostname}:8000${path}`;
  }
  return `${protocol}//${window.location.host}${path}`;
}
