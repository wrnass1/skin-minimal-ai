import OpenAI from "openai";

/**
 * Polza.ai — OpenAI-compatible API.
 * @see https://polza.ai/docs/glavnoe/quickstart
 */

export function getPolzaBaseURL() {
  return process.env.POLZA_BASE_URL || "https://polza.ai/api/v1";
}

export function getPolzaModel() {
  return process.env.POLZA_MODEL || "openai/gpt-4o-mini";
}

/** @returns {OpenAI | null} */
export function createPolzaClient() {
  const apiKey = process.env.POLZA_AI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    baseURL: getPolzaBaseURL(),
    apiKey,
  });
}

const CONSULT_SYSTEM_PROMPT = [
  "Ты консультант по минималистичному домашнему уходу за кожей в приложении Skin Minimal AI.",
  "Отвечай по-русски, кратко и по делу (обычно 2–6 предложений), без избыточного маркетинга.",
  "Не ставь диагнозы, не назначай лечение и не заменяй очный приём дерматолога.",
  "При симптомах тревоги (сильное воспаление, быстрое ухудшение, подозрение на аллергию) мягко советуй обратиться к врачу.",
].join(" ");

/**
 * Мультитурный чат консультаций (сообщения уже без system — он добавляется здесь).
 * @param {{ role: string, content: string }[]} messages
 */
export async function consultChatCompletion(messages) {
  const client = createPolzaClient();
  if (!client) {
    const err = new Error("POLZA_NO_KEY");
    err.code = "POLZA_NO_KEY";
    throw err;
  }

  const model = getPolzaModel();
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.45,
    max_tokens: 1024,
    messages: [{ role: "system", content: CONSULT_SYSTEM_PROMPT }, ...messages],
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    const err = new Error("EMPTY_RESPONSE");
    err.code = "EMPTY_RESPONSE";
    throw err;
  }
  return raw.trim();
}

/**
 * Улучшает текстовые поля анализа через Polza.ai (OpenAI-compatible API).
 */
export async function enhanceAnalysisWithPolza(ruleResult, context) {
  const client = createPolzaClient();
  if (!client) {
    return {
      ...ruleResult,
      ai: { enabled: false, reason: "no_key" },
    };
  }

  const model = getPolzaModel();

  const userPayload = {
    skinTypeId: context.skinTypeId,
    symptomIds: context.symptomIds,
    products: context.products?.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      actives: p.actives ?? [],
    })),
    ruleBased: {
      riskScore: ruleResult.riskScore,
      riskLabel: ruleResult.riskLabel,
      summary: ruleResult.summary,
      recommendation: ruleResult.recommendation,
      keep: ruleResult.keep,
      pause: ruleResult.pause,
    },
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.35,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content: [
          "Ты помощник по минималистичному домашнему уходу за кожей.",
          "Не ставь диагнозы и не заменяй визит к врачу.",
          "Ответ ТОЛЬКО валидный JSON без markdown, формат:",
          '{"summary":"строка","recommendation":"строка"}',
          "Текст на русском, 2–4 предложения в summary и 2–5 в recommendation.",
          "Учитывай уже посчитанный riskScore/riskLabel и списки keep/pause как опору.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify(userPayload, null, 0),
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    return { ...ruleResult, ai: { enabled: false, reason: "empty_response" } };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return { ...ruleResult, ai: { enabled: false, reason: "parse_error" } };
    }
    parsed = JSON.parse(match[0]);
  }

  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : null;
  const recommendation = typeof parsed.recommendation === "string" ? parsed.recommendation.trim() : null;

  if (!summary || !recommendation) {
    return { ...ruleResult, ai: { enabled: false, reason: "invalid_json" } };
  }

  return {
    ...ruleResult,
    summary,
    recommendation,
    ai: {
      enabled: true,
      model,
      provider: "polza.ai",
    },
  };
}
