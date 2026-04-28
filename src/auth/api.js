async function jsonFetch(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch {
    return {
      ok: false,
      error:
        "Сервер API недоступен. Запустите стек (docker compose up) или API на порту из VITE_PROXY_TARGET.",
    };
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = data?.error || "Ошибка запроса.";
    return { ok: false, error: errorMessage };
  }
  return { ok: true, data };
}

export async function apiRegister({ email, password }) {
  const result = await jsonFetch("/api/auth/register", { method: "POST", body: { email, password } });
  if (!result.ok) return result;
  return { ok: true, user: result.data.user };
}

export async function apiLogin({ email, password }) {
  const result = await jsonFetch("/api/auth/login", { method: "POST", body: { email, password } });
  if (!result.ok) return result;
  return { ok: true, user: result.data.user };
}

export async function apiLogout() {
  const result = await jsonFetch("/api/auth/logout", { method: "POST" });
  if (!result.ok) return result;
  return { ok: true };
}

export async function apiMe() {
  const result = await jsonFetch("/api/auth/me");
  if (!result.ok) return result;
  return { ok: true, user: result.data.user };
}

export async function apiCatalog() {
  const result = await jsonFetch("/api/catalog");
  if (!result.ok) return result;
  return { ok: true, catalog: result.data };
}

export async function apiRunAnalysis({ skinTypeId, symptomIds, productIds }) {
  const result = await jsonFetch("/api/analysis/run", {
    method: "POST",
    body: { skinTypeId, symptomIds, productIds },
  });
  if (!result.ok) return result;
  return { ok: true, result: result.data.result };
}

export async function apiHistory() {
  const result = await jsonFetch("/api/history");
  if (!result.ok) return result;
  return { ok: true, items: result.data.items };
}

/** @param {{ role: 'user' | 'assistant', content: string }[]} messages */
export async function apiChatConsult(messages) {
  const result = await jsonFetch("/api/chat", {
    method: "POST",
    body: { messages },
  });
  if (!result.ok) return result;
  return { ok: true, message: result.data.message };
}
