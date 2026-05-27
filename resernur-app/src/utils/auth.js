export function parseTokenPayload(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch(e) {
    return null;
  }
}

export function isTokenExpired(payload) {
  if (!payload?.exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

export function getRoleFromToken(token) {
  const payload = parseTokenPayload(token);
  return payload?.role || null;
}

export function isAuthenticated() {
  const token = localStorage.getItem('resernur_token');
  if (!token) return false;
  
  const payload = parseTokenPayload(token);
  if (!payload || isTokenExpired(payload)) {
    localStorage.removeItem('resernur_token');
    return false;
  }
  return true;
}
