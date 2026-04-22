const STORAGE_KEY = 'resernur_local_notifications_v1';
const CHANGE_EVENT = 'resernur-notifications-changed';

function parseTokenPayload(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getCurrentUserKey() {
  const token = localStorage.getItem('resernur_token');
  const payload = parseTokenPayload(token);

  if (payload?.sub) return String(payload.sub).toLowerCase();
  if (payload?.email) return String(payload.email).toLowerCase();
  return 'anonymous';
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function getLocalNotifications(isAdmin = false) {
  const store = readStore();
  const userKey = getCurrentUserKey();
  let list = Array.isArray(store[userKey]) ? store[userKey] : [];

  if (isAdmin) {
    const adminList = Array.isArray(store['GLOBAL_ADMIN']) ? store['GLOBAL_ADMIN'] : [];
    list = [...list, ...adminList];
  }

  // Deduplicate in case a user is both (somehow)
  const uniqueUrls = Array.from(new Set(list.map(n => n.id)))
    .map(id => list.find(n => n.id === id));

  return uniqueUrls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadLocalNotificationsCount(isAdmin = false) {
  return getLocalNotifications(isAdmin).filter((item) => !item.isRead).length;
}

export function addLocalNotification({ type, message }) {
  if (!message || !String(message).trim()) return;

  const notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type: type || 'GENERAL',
    message: String(message).trim(),
    isRead: false,
    createdAt: new Date().toISOString()
  };

  const store = readStore();
  const userKey = getCurrentUserKey();
  const currentList = Array.isArray(store[userKey]) ? store[userKey] : [];

  store[userKey] = [notification, ...currentList].slice(0, 50);
  writeStore(store);
  emitChange();
}

export function addAdminNotification({ type, message }) {
  if (!message || !String(message).trim()) return;

  const notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type: type || 'ADMIN',
    message: String(message).trim(),
    isRead: false,
    createdAt: new Date().toISOString()
  };

  const store = readStore();
  const adminList = Array.isArray(store['GLOBAL_ADMIN']) ? store['GLOBAL_ADMIN'] : [];

  store['GLOBAL_ADMIN'] = [notification, ...adminList].slice(0, 50);
  writeStore(store);
  emitChange();
}

export function markAllLocalNotificationsAsRead(isAdmin = false) {
  const store = readStore();
  const userKey = getCurrentUserKey();
  const currentList = Array.isArray(store[userKey]) ? store[userKey] : [];
  store[userKey] = currentList.map((item) => ({ ...item, isRead: true }));

  if (isAdmin) {
    const adminList = Array.isArray(store['GLOBAL_ADMIN']) ? store['GLOBAL_ADMIN'] : [];
    store['GLOBAL_ADMIN'] = adminList.map((item) => ({ ...item, isRead: true }));
  }

  writeStore(store);
  emitChange();
}

export function subscribeToLocalNotificationChanges(listener) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}