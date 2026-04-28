import { useEffect, useRef, useState } from "react";
import { apiChatConsult } from "../auth/api";

function Icon({ name, className = "" }) {
  const iconMap = {
    leaf: "⁕",
    close: "×",
    send: "→",
  };
  return (
    <span aria-hidden="true" className={`icon ${className}`.trim()}>
      {iconMap[name] ?? "•"}
    </span>
  );
}

export default function ConsultChatPanel({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(t);
  }, [open, messages, busy]);

  useEffect(() => {
    if (!open) {
      setError("");
      setBusy(false);
    }
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg = { role: "user", content: text };
    const nextThread = [...messages, userMsg];
    setMessages(nextThread);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const result = await apiChatConsult(nextThread);
      if (!result.ok) {
        setError(result.error ?? "Не удалось отправить сообщение.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: result.message }]);
    } catch {
      setError("Не удалось отправить сообщение.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="consult-overlay" role="presentation">
      <button type="button" className="consult-backdrop" aria-label="Закрыть панель ассистента" onClick={onClose} />
      <aside className="consult-panel" role="dialog" aria-labelledby="consult-panel-title" aria-modal="true">
        <div className="consult-panel-head">
          <div className="consult-panel-brand">
            <Icon name="leaf" className="brand-icon" />
            <div>
              <div id="consult-panel-title" className="consult-panel-title">
                Дерматологический ассистент
              </div>
              <div className="consult-panel-sub">Минималистичный уход — без диагнозов</div>
            </div>
          </div>
          <button type="button" className="icon-button consult-close" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" />
          </button>
        </div>

        <div ref={listRef} className="consult-messages">
          {messages.length === 0 ? (
            <p className="consult-empty">
              Спросите про порядок средств, раздражение, SPF или упрощение рутины — ответит модель с учётом
              осторожности для кожи.
            </p>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={`consult-bubble consult-bubble-${m.role === "user" ? "user" : "assistant"}`}
              >
                {m.content}
              </div>
            ))
          )}
          {busy ? <div className="consult-bubble consult-bubble-assistant consult-typing">…</div> : null}
        </div>

        {error ? <div className="consult-error">{error}</div> : null}

        <form
          className="consult-form"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            className="consult-input"
            rows={2}
            placeholder="Ваш вопрос…"
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" className="primary-button consult-send" disabled={busy || !input.trim()}>
            Отправить
            <Icon name="send" />
          </button>
        </form>
      </aside>
    </div>
  );
}
