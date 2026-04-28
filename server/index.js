import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { query } from "./db.js";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  signToken,
  verifyPassword,
  verifyToken,
} from "./auth.js";
import { runAnalysis } from "./analysis.js";
import { bootstrapDb } from "./bootstrap.js";
import { consultChatCompletion, enhanceAnalysisWithPolza } from "./polza.js";

dotenv.config({
  path: new URL("./.env", import.meta.url),
});

const app = express();

const PORT = Number(process.env.PORT || 8787);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const COOKIE_NAME = "sma_token";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

function getAuthToken(req) {
  return req.cookies?.[COOKIE_NAME] ?? null;
}

function getAuthPayload(req) {
  const token = getAuthToken(req);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = getAuthPayload(req);
  if (!payload?.sub) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  req.user = { id: payload.sub, email: payload.email };
  return next();
}

async function getUserByEmail(email) {
  const result = await query("select id, email, password_hash from users where email = $1 limit 1", [
    email,
  ]);
  return result.rows[0] ?? null;
}

async function getUserById(id) {
  const result = await query("select id, email, created_at from users where id = $1 limit 1", [id]);
  return result.rows[0] ?? null;
}

const MAX_CHAT_MESSAGES = 20;
const MAX_CHAT_CHARS = 8000;

function normalizeChatMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const slice = raw.slice(-MAX_CHAT_MESSAGES);
  const out = [];
  for (const m of slice) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    const content = typeof m.content === "string" ? m.content.trim() : "";
    if (!content) continue;
    out.push({ role: m.role, content });
  }
  if (out.length === 0) return null;
  if (out[out.length - 1].role !== "user") return null;
  let total = out.reduce((sum, m) => sum + m.content.length, 0);
  const trimmed = [...out];
  while (total > MAX_CHAT_CHARS && trimmed.length > 1) {
    const removed = trimmed.shift();
    total -= removed.content.length;
  }
  if (trimmed.length === 1 && trimmed[0].content.length > MAX_CHAT_CHARS) {
    trimmed[0] = {
      role: trimmed[0].role,
      content: trimmed[0].content.slice(-MAX_CHAT_CHARS),
    };
  }
  return trimmed.length ? trimmed : null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/catalog", async (_req, res) => {
  try {
    const [skinTypes, symptoms, products, recoveryDays] = await Promise.all([
      query("select id, label from skin_types order by id"),
      query("select id, label, tone from symptoms order by id"),
      query(
        "select id, name, schedule, icon, tone, category, actives, barrier_support from products_catalog order by id",
      ),
      query("select day, level, state, is_current from recovery_days order by day"),
    ]);

    return res.json({
      ok: true,
      skinTypes: skinTypes.rows,
      symptoms: symptoms.rows,
      products: products.rows,
      recoveryDays: recoveryDays.rows.map((row) => ({
        day: row.day,
        level: row.level,
        state: row.state,
        current: row.is_current,
      })),
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Ошибка сервера." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Введите корректный email." });
    if (password.length < 6) return res.status(400).json({ ok: false, error: "Пароль должен быть не короче 6 символов." });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ ok: false, error: "Пользователь с таким email уже существует." });

    const passwordHash = await hashPassword(password);
    const inserted = await query(
      "insert into users (email, password_hash) values ($1, $2) returning id, email, created_at",
      [email, passwordHash],
    );

    const user = inserted.rows[0];
    const token = signToken({ sub: user.id, email: user.email });
    setAuthCookie(res, token);
    return res.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Ошибка сервера." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    if (!isValidEmail(email)) return res.status(400).json({ ok: false, error: "Введите корректный email." });
    if (!password) return res.status(400).json({ ok: false, error: "Введите пароль." });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ ok: false, error: "Пользователь не найден. Зарегистрируйтесь." });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "Неверный пароль." });

    const token = signToken({ sub: user.id, email: user.email });
    setAuthCookie(res, token);
    return res.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch {
    return res.status(500).json({ ok: false, error: "Ошибка сервера." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = getAuthToken(req);
    if (!token) return res.json({ ok: true, user: null });

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      clearAuthCookie(res);
      return res.json({ ok: true, user: null });
    }

    const user = await getUserById(payload.sub);
    if (!user) {
      clearAuthCookie(res);
      return res.json({ ok: true, user: null });
    }

    return res.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch {
    return res.status(500).json({ ok: false, error: "Ошибка сервера." });
  }
});

app.post("/api/chat", requireAuth, async (req, res) => {
  try {
    if (!process.env.POLZA_AI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error: "Ассистент недоступен: не задан ключ API (POLZA_AI_API_KEY).",
      });
    }

    const messages = normalizeChatMessages(req.body?.messages);
    if (!messages) {
      return res.status(400).json({
        ok: false,
        error: "Нужен непустой массив messages; последнее сообщение должно быть от пользователя.",
      });
    }

    const reply = await consultChatCompletion(messages);
    return res.json({ ok: true, message: reply });
  } catch (err) {
    if (err?.code === "POLZA_NO_KEY") {
      return res.status(503).json({
        ok: false,
        error: "Ассистент недоступен: не задан ключ API (POLZA_AI_API_KEY).",
      });
    }
    // eslint-disable-next-line no-console
    console.error("Chat error:", err?.message || err);
    return res.status(500).json({ ok: false, error: "Не удалось получить ответ. Попробуйте позже." });
  }
});

app.post("/api/analysis/run", requireAuth, async (req, res) => {
  try {
    const skinTypeId = String(req.body?.skinTypeId ?? "");
    const symptomIds = Array.isArray(req.body?.symptomIds) ? req.body.symptomIds.map(String) : [];
    const productIds = Array.isArray(req.body?.productIds) ? req.body.productIds.map(String) : [];

    const validSkin = await query("select id from skin_types where id = $1", [skinTypeId]);
    if (!validSkin.rows.length) return res.status(400).json({ ok: false, error: "Некорректный тип кожи." });

    const productsResult = await query(
      "select id, name, schedule, icon, tone, category, actives from products_catalog where id = any($1::text[])",
      [productIds],
    );

    const products = productsResult.rows;
    const ruleOutput = runAnalysis({ skinTypeId, symptomIds, products });

    let result = ruleOutput;
    try {
      result = await enhanceAnalysisWithPolza(ruleOutput, {
        skinTypeId,
        symptomIds,
        products,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Polza enhance failed:", err?.message || err);
      result = { ...ruleOutput, ai: { enabled: false, reason: "request_failed" } };
    }

    await query(
      "insert into analysis_runs (user_id, risk_score, risk_label, summary, recommendation, inputs, keep, pause) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb)",
      [
        req.user.id,
        result.riskScore,
        result.riskLabel,
        result.summary,
        result.recommendation,
        JSON.stringify({ skinTypeId, symptomIds, productIds }),
        JSON.stringify(result.keep),
        JSON.stringify(result.pause),
      ],
    );

    return res.json({ ok: true, result });
  } catch {
    return res.status(500).json({ ok: false, error: "Ошибка сервера." });
  }
});

app.get("/api/history", requireAuth, async (req, res) => {
  try {
    const result = await query(
      "select id, created_at, risk_score, risk_label, summary from analysis_runs where user_id = $1 order by created_at desc limit 20",
      [req.user.id],
    );
    return res.json({
      ok: true,
      items: result.rows.map((row) => ({
        id: row.id,
        date: row.created_at,
        risk: row.risk_label,
        score: row.risk_score,
        note: row.summary,
      })),
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Ошибка сервера." });
  }
});

async function start() {
  await bootstrapDb();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch(() => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API");
  process.exit(1);
});
