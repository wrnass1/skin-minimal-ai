const USERS_KEY = "skin-minimal-ai.users.v1";
const SESSION_KEY = "skin-minimal-ai.session.v1";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

function isStorageUsable(storage) {
  try {
    const testKey = "__skin_minimal_ai_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getBestStorage() {
  if (typeof window === "undefined") return createMemoryStorage();

  if (isStorageUsable(window.localStorage)) return window.localStorage;
  if (isStorageUsable(window.sessionStorage)) return window.sessionStorage;
  return createMemoryStorage();
}

const storage = getBestStorage();

function storageGet(key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function storageRemove(key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email) {
  const value = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getUsers() {
  const raw = storageGet(USERS_KEY);
  return safeJsonParse(raw, []);
}

export function setUsers(users) {
  return storageSet(USERS_KEY, JSON.stringify(users));
}

export function getSession() {
  const raw = storageGet(SESSION_KEY);
  const session = safeJsonParse(raw, null);
  if (!session || typeof session.email !== "string") return null;
  return { email: session.email };
}

export function setSession(session) {
  return storageSet(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  return storageRemove(SESSION_KEY);
}

export function signUp({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password ?? "");

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: "Введите корректный email." };
  }
  if (normalizedPassword.length < 6) {
    return { ok: false, error: "Пароль должен быть не короче 6 символов." };
  }

  const users = getUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { ok: false, error: "Пользователь с таким email уже существует." };
  }

  const nextUsers = [...users, { email: normalizedEmail, password: normalizedPassword }];
  const usersOk = setUsers(nextUsers);
  const sessionOk = setSession({ email: normalizedEmail });
  if (!usersOk || !sessionOk) {
    return { ok: false, error: "Не удалось сохранить данные в браузере." };
  }
  return { ok: true, session: { email: normalizedEmail } };
}

export function signIn({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password ?? "");

  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: "Введите корректный email." };
  }

  const users = getUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);
  if (!user) {
    return { ok: false, error: "Пользователь не найден. Зарегистрируйтесь." };
  }
  if (user.password !== normalizedPassword) {
    return { ok: false, error: "Неверный пароль." };
  }

  const sessionOk = setSession({ email: normalizedEmail });
  if (!sessionOk) {
    return { ok: false, error: "Не удалось сохранить сессию в браузере." };
  }
  return { ok: true, session: { email: normalizedEmail } };
}

export function signOut() {
  clearSession();
  return { ok: true };
}
