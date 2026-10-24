/**
 * Pose client — talks to the Python FastAPI pose server over Wi-Fi.
 *
 * The phone captures JPEG frames with expo-camera and POSTs them here; the
 * server runs OpenCV + MediaPipe and returns rep counts + form cues.
 */
import Constants from 'expo-constants';
import storage from '../services/storageService';

const SESSION_ID = `phone-${Math.random().toString(36).slice(2, 8)}`;

// The pose server runs on the SAME laptop as the Expo dev server, just on a
// different port. So we can derive its URL from Expo's host automatically —
// no manual IP entry needed when you launch with `expo start`.
const SERVER_PORT = 8000;

export function deriveServerUrl() {
  try {
    // hostUri looks like "192.168.1.23:8081" (newer SDKs) …
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.expoGoConfig?.debuggerHost ||   // … or "192.168.1.23:19000" (Expo Go)
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost ||
      '';
    const host = String(hostUri).split(':')[0];
    if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}:${SERVER_PORT}`;
    }
  } catch {
    // fall through
  }
  return '';
}

// Server base URL. Priority: a value the user explicitly saved > auto-derived
// from the Expo host. The user can still override it in the UI.
let _baseUrl = null;

export function getSessionId() {
  return SESSION_ID;
}

export async function loadServerUrl() {
  if (_baseUrl) return _baseUrl;
  const saved = await storage.getServerUrl?.();
  if (saved) {
    _baseUrl = saved;
  } else {
    // Auto-fill from the Expo dev host (same laptop, port 8000).
    _baseUrl = deriveServerUrl();
  }
  return _baseUrl;
}

export async function setServerUrl(url) {
  _baseUrl = normalize(url);
  await storage.saveServerUrl?.(_baseUrl);
  return _baseUrl;
}

function normalize(url) {
  if (!url) return '';
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, '');
}

export async function checkHealth(url) {
  const base = normalize(url || _baseUrl);
  if (!base) throw new Error('No server URL set');
  const res = await fetch(`${base}/health`, { method: 'GET' });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
}

/**
 * Send one frame for analysis.
 * @param {string} base64 - JPEG base64 (no data: prefix)
 * @param {string} exercise
 * @param {boolean} reset
 */
export async function analyzeFrame(base64, exercise, reset = false) {
  if (!_baseUrl) throw new Error('No server URL set');
  const res = await fetch(`${_baseUrl}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      exercise,
      sessionId: SESSION_ID,
      reset,
    }),
  });
  if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
  return res.json();
}

export async function resetSession(exercise) {
  if (!_baseUrl) return;
  try {
    await fetch(`${_baseUrl}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: '', exercise, sessionId: SESSION_ID }),
    });
  } catch {
    // non-fatal
  }
}
