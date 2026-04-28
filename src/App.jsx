import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ConsultChatPanel from "./components/ConsultChatPanel";
import { apiCatalog, apiHistory, apiLogout, apiMe, apiRunAnalysis } from "./auth/api";

const toneClassMap = {
  blue: "tone-blue",
  rose: "tone-rose",
  amber: "tone-amber",
  emerald: "tone-emerald",
  neutral: "tone-neutral",
  future: "tone-future",
};

const iconMap = {
  leaf: "⁕",
  magic: "✦",
  menu: "≡",
  document: "🗏",
  drop: "◔",
  tube: "◫",
  spark: "✧",
  add: "+",
  warning: "!",
  info: "i",
  check: "✓",
  close: "×",
  arrow: "→",
  history: "⟲",
  shield: "✧",
  smile: "☺",
  meh: "•",
  sad: "☹",
};

function Icon({ name, className = "" }) {
  return (
    <span aria-hidden="true" className={`icon ${className}`.trim()}>
      {iconMap[name] ?? "•"}
    </span>
  );
}

function Header({ session, onSignOut }) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <NavLink to="/" className="brand">
          <Icon name="leaf" className="brand-icon" />
          <span>Skin Minimal AI</span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Основная навигация">
          <AppNavLink to="/">Главная</AppNavLink>
          <AppNavLink to="/analysis">Анализ</AppNavLink>
          <AppNavLink to="/history">История</AppNavLink>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="icon-button mobile-only" aria-label="Меню">
            <Icon name="menu" />
          </button>
          {session ? (
            <div className="auth-top desktop-only">
              <span className="auth-top-email" title={session.email}>
                {session.email}
              </span>
              <button type="button" className="secondary-button sign-out-button" onClick={onSignOut}>
                Выйти
              </button>
            </div>
          ) : (
            <NavLink to="/auth" className="primary-button desktop-only">
              Войти
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

function AppNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `nav-link ${isActive ? "nav-link-active" : ""}`.trim()
      }
    >
      {children}
    </NavLink>
  );
}

function HomePage({ session, onOpenAssistant }) {
  return (
    <div className="page page-active">
      <section className="home-hero">
        <div className="home-hero-inner">
          {session ? (
            <button
              type="button"
              className="eyebrow eyebrow-lg home-assistant-cta"
              onClick={onOpenAssistant}
              aria-label="Открыть дерматологического ассистента"
            >
              <Icon name="magic" />
              <span>AI Дерматологический ассистент</span>
            </button>
          ) : (
            <NavLink
              to="/auth"
              className="eyebrow eyebrow-lg home-assistant-cta"
              aria-label="Войти, чтобы открыть дерматологического ассистента"
            >
              <Icon name="magic" />
              <span>AI Дерматологический ассистент</span>
            </NavLink>
          )}
          <h1 className="home-title">
            Меньше ухода — <br /> лучше кожа.
          </h1>
          <p className="home-lead">
            Интеллектуальная система анализирует вашу рутину, выявляет риск перегрузки и помогает
            подобрать минимальный, но эффективный уход для чувствительной кожи.
          </p>
        </div>
      </section>

      <section className="home-about">
        <div className="home-about-head">
          <h2 className="home-h2">Философия Skin Minimal AI</h2>
          <p>
            Skin Minimal AI помогает сократить уход за кожей до минимально необходимого и избежать
            перегрузки активными компонентами. Мы верим, что здоровая кожа не нуждается в десятках
            баночек.
          </p>
        </div>

        <div className="home-grid">
          <div className="card home-feature">
            <div className="home-feature-icon tone-emerald" aria-hidden="true">
              <Icon name="shield" />
            </div>
            <h3>Защита барьера</h3>
            <p>
              Подсказки ориентированы на снижение раздражения и восстановление кожи без резких шагов.
            </p>
          </div>

          <div className="card home-feature">
            <div className="home-feature-icon tone-emerald" aria-hidden="true">
              <Icon name="magic" />
            </div>
            <h3>Минимализм</h3>
            <p>
              Только базовые комбинации ухода, чтобы убрать лишнее и снизить риск реакции кожи.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalysisPage() {
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const [skinTypeId, setSkinTypeId] = useState("dry");
  const [selectedSymptoms, setSelectedSymptoms] = useState(["redness", "dryness"]);
  const [productIds, setProductIds] = useState(["cleanser_gentle", "exfoliant_bha2", "moisturizer_ceramides"]);
  const [productToAdd, setProductToAdd] = useState("");

  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisCount, setAnalysisCount] = useState(0);
  const [analysisResult, setAnalysisResult] = useState({
    riskScore: 70,
    riskLabel: "Повышенный",
    summary: "Заполните данные и запустите анализ, чтобы получить результат.",
    recommendation: "Нажмите «Проанализировать уход».",
    keep: [],
    pause: [],
  });

  useEffect(() => {
    let alive = true;
    setLoadingCatalog(true);
    apiCatalog()
      .then((res) => {
        if (!alive) return;
        if (!res.ok) {
          setCatalogError(res.error ?? "Не удалось загрузить данные.");
          return;
        }
        setCatalog(res.catalog);
      })
      .catch(() => {
        if (!alive) return;
        setCatalogError("Не удалось загрузить данные.");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingCatalog(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggleSymptom = (id) => {
    setSelectedSymptoms((current) =>
      current.includes(id)
        ? current.filter((symptomId) => symptomId !== id)
        : [...current, id],
    );
  };

  const addProduct = () => {
    if (!catalog?.products?.length) return;
    const next = catalog.products.find((p) => !productIds.includes(p.id));
    if (!next) return;
    setProductIds((current) => [...current, next.id]);
  };

  const addSelectedProduct = () => {
    if (!productToAdd) return;
    if (productIds.includes(productToAdd)) return;
    setProductIds((current) => [...current, productToAdd]);
    setProductToAdd("");
  };

  const removeProduct = (id) => {
    setProductIds((current) => current.filter((productId) => productId !== id));
  };

  const clearForm = () => {
    setSkinTypeId("dry");
    setSelectedSymptoms([]);
    setProductIds([]);
    setProductToAdd("");
    setAnalysisError("");
    setAnalysisResult({
      riskScore: 70,
      riskLabel: "Повышенный",
      summary: "Заполните данные и запустите анализ, чтобы получить результат.",
      recommendation: "Нажмите «Проанализировать уход».",
      keep: [],
      pause: [],
    });
  };

  const selectedProducts = useMemo(() => {
    if (!catalog?.products) return [];
    const map = new Map(catalog.products.map((p) => [p.id, p]));
    return productIds.map((id) => map.get(id)).filter(Boolean);
  }, [catalog, productIds]);

  const availableProducts = useMemo(() => {
    if (!catalog?.products) return [];
    return catalog.products.filter((p) => !productIds.includes(p.id));
  }, [catalog, productIds]);

  const run = async () => {
    setAnalysisError("");
    setAnalysisBusy(true);
    try {
      const res = await apiRunAnalysis({
        skinTypeId,
        symptomIds: selectedSymptoms,
        productIds,
      });
      if (!res.ok) {
        setAnalysisError(res.error ?? "Не удалось выполнить анализ.");
        return;
      }
      setAnalysisResult(res.result);
      setAnalysisCount((value) => value + 1);
    } catch {
      setAnalysisError("Не удалось выполнить анализ.");
    } finally {
      setAnalysisBusy(false);
    }
  };

  return (
    <div className="page page-active">
      <div className="page-intro">
        <h2>Анализ ухода</h2>
        <p>Проанализируйте свою кожу и получите персональную рекомендацию.</p>
      </div>

      <div className="analysis-steps" aria-label="Этапы анализа">
        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              1
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="document" />
                <span>Ввод данных</span>
              </div>
              <h2>Заполните данные</h2>
            </div>
          </div>

          <div className="field-block">
            <label className="field-label">Тип кожи</label>
            <div className="option-grid">
              {(catalog?.skinTypes ?? []).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`choice-button ${skinTypeId === type.id ? "choice-button-active" : ""}`}
                  onClick={() => setSkinTypeId(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <div className="field-row">
              <label className="field-label">Текущий уход</label>
              <div className="field-actions">
                <span className="field-caption">{selectedProducts.length} продукта</span>
                <button type="button" className="link-button" onClick={clearForm}>
                  Очистить
                </button>
              </div>
            </div>
            <div className="product-list">
              {selectedProducts.map((product) => (
                <article key={product.id} className="product-item">
                  <div className={`product-icon ${toneClassMap[product.tone]}`}>
                    <Icon name={product.icon} />
                  </div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.schedule}</p>
                  </div>
                  <button
                    type="button"
                    className="mini-icon-button"
                    aria-label={`Удалить продукт: ${product.name}`}
                    onClick={() => removeProduct(product.id)}
                  >
                    <Icon name="close" />
                  </button>
                </article>
              ))}
              <div className="product-add">
                <select
                  className="select-input"
                  value={productToAdd}
                  onChange={(event) => setProductToAdd(event.target.value)}
                  aria-label="Выберите продукт"
                  disabled={loadingCatalog || !availableProducts.length}
                >
                  <option value="">{availableProducts.length ? "Выберите продукт…" : "Больше нет продуктов"}</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addSelectedProduct}
                  disabled={!productToAdd}
                >
                  Добавить
                </button>
                <button type="button" className="ghost-button" onClick={addProduct} disabled={!availableProducts.length}>
                  <Icon name="add" />
                  Быстро добавить
                </button>
              </div>
            </div>
          </div>

          <div className="field-block">
            <label className="field-label">Симптомы</label>
            <div className="tag-list">
              {(catalog?.symptoms ?? []).map((symptom) => {
                const active = selectedSymptoms.includes(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    type="button"
                    className={`tag ${active ? `${toneClassMap[symptom.tone]} tag-active` : "tag-idle"}`}
                    onClick={() => toggleSymptom(symptom.id)}
                  >
                    {symptom.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingCatalog ? <p className="helper-text">Загрузка данных...</p> : null}
          {catalogError ? <div className="form-error">{catalogError}</div> : null}
          {analysisError ? <div className="form-error">{analysisError}</div> : null}

          <button
            type="button"
            className="primary-button full-width"
            style={{ marginTop: 10 }}
            onClick={run}
            disabled={analysisBusy || loadingCatalog || !!catalogError}
          >
            {analysisBusy ? "Подождите..." : "Проанализировать уход"}
          </button>

          <p className="helper-text">
            Анализ обновлён {analysisCount} {analysisCount === 1 ? "раз" : analysisCount > 1 && analysisCount < 5 ? "раза" : "раз"}.
          </p>
        </section>

        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              2
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="warning" />
                <span>Результат анализа</span>
                {analysisResult.ai?.enabled ? (
                  <span className="chip chip-ai" title="Текст дополнен моделью через Polza.ai">
                    Polza AI
                  </span>
                ) : null}
              </div>
              <h2>Риск и рекомендация</h2>
            </div>
          </div>

          <div className="risk-row">
            <div className="risk-gauge">
              <svg viewBox="0 0 36 36" className="risk-svg">
                <path
                  className="risk-track"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="risk-value"
                  strokeDasharray={`${analysisResult.riskScore}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Icon name="warning" className="risk-icon" />
            </div>
            <div>
              <div className="muted">Риск перегрузки</div>
              <div className="risk-label">{analysisResult.riskLabel}</div>
            </div>
          </div>

          <p className="card-copy">{analysisResult.summary}</p>

          <div className="info-box">
            <Icon name="info" className="info-icon" />
            <div>
              <div className="info-title">
                {analysisResult.ai?.enabled ? "Рекомендация AI" : "Рекомендация"}
              </div>
              <div className="info-copy">{analysisResult.recommendation}</div>
            </div>
          </div>
        </section>

        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              3
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="check" />
                <span>Ваш минимальный уход</span>
              </div>
              <h2>Что оставить и что убрать</h2>
            </div>
          </div>

          <RoutineList title="Оставить" tone="emerald" icon="check" items={analysisResult.keep} />
          <RoutineList title="Убрать на 2 недели" tone="rose" icon="close" items={analysisResult.pause} muted />
        </section>

        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              4
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="history" />
                <span>Трекинг восстановления</span>
              </div>
              <h2>Отмечайте динамику</h2>
            </div>
          </div>

          <div className="card-header">
            <div className="muted">День 4 из 14</div>
            <span className="chip">Сегодня</span>
          </div>

          <div className="progress-chart">
            {(catalog?.recoveryDays ?? []).map((entry) => (
              <div key={entry.day} className={`progress-day ${entry.current ? "progress-current" : ""}`}>
                {entry.current ? <span className="today-badge">Сегодня</span> : null}
                <div className={`progress-bar ${toneClassMap[entry.state]}`} style={{ height: `${entry.level}%` }} />
                <span>{entry.day}</span>
              </div>
            ))}
          </div>

          <div className="tracker-footer">
            <p>Как чувствует себя кожа сегодня?</p>
            <div className="tracker-grid">
              <MoodButton icon="sad" label="Хуже" />
              <MoodButton icon="meh" label="Без изменений" />
              <MoodButton icon="smile" label="Лучше" active />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function RoutineList({ title, tone, icon, items, muted = false }) {
  return (
    <div className="routine-block">
      <div className="routine-heading">
        <span className={`routine-dot ${toneClassMap[tone]}`} />
        <span>{title}</span>
      </div>
      <div className="routine-list">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className={`routine-item ${toneClassMap[tone]} ${muted ? "routine-muted" : ""}`}>
              <Icon name={icon} />
              <span>{item.name}</span>
            </div>
          ))
        ) : (
          <div className="routine-empty">Сейчас ничего не нужно убирать.</div>
        )}
      </div>
    </div>
  );
}

function MoodButton({ icon, label, active = false }) {
  return (
    <button type="button" className={`mood-button ${active ? "mood-button-active" : ""}`}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiHistory()
      .then((res) => {
        if (!alive) return;
        if (!res.ok) {
          setError(res.error ?? "Не удалось загрузить историю.");
          return;
        }
        setItems(res.items ?? []);
      })
      .catch(() => {
        if (!alive) return;
        setError("Не удалось загрузить историю.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="narrow-page">
      <h2>История анализов</h2>
      <div className="card history-card">
        <div className="history-header">
          <div className="empty-icon">
            <Icon name="history" />
          </div>
          <div>
            <h3>Последние результаты</h3>
            <p>Предыдущие анализы помогают отслеживать, как кожа реагирует на упрощение ухода.</p>
          </div>
        </div>

        {error ? <div className="form-error" style={{ marginTop: 16 }}>{error}</div> : null}
        {loading ? <p className="helper-text" style={{ marginTop: 16 }}>Загрузка...</p> : null}
        {!loading && !error ? (
          items.length ? (
            <div className="history-list">
              {items.map((item) => (
                <article key={item.id} className="history-item">
                  <div>
                    <strong>{new Date(item.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}</strong>
                    <p>{item.note}</p>
                  </div>
                  <span className="chip">{item.risk}</span>
                </article>
              ))}
            </div>
          ) : (
            <p className="helper-text" style={{ marginTop: 16 }}>
              Пока нет сохранённых результатов. Запустите анализ, чтобы история начала заполняться.
            </p>
          )
        ) : null}

        <NavLink to="/analysis" className="primary-button inline-button">
          Перейти к анализу
          <Icon name="arrow" />
        </NavLink>
      </div>
    </section>
  );
}

function ProtectedRoute({ session, loading, children }) {
  const location = useLocation();
  if (loading) return <div className="helper-text">Загрузка...</div>;
  if (!session) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return children;
}

function AnalysisLockedPage() {
  return (
    <div className="page page-active">
      <div className="page-intro">
        <h2>Анализ ухода</h2>
        <p>Можете воспользоваться анализом после входа в аккаунт.</p>
          <NavLink to="/auth" className="primary-button full-width" style={{ marginTop: 12 }}>
            Зарегистрироваться / Войти
          </NavLink>
      </div>

      <div className="analysis-steps" aria-label="Этапы анализа">
        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              1
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="document" />
                <span>Ввод данных</span>
              </div>
              <h2>Заполните данные</h2>
            </div>
          </div>
          <p className="card-copy">
            Тип кожи, симптомы и текущий уход — эти данные нужны, чтобы алгоритм сформировал
            персональную рекомендацию.
          </p>
        </section>

        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              2
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="warning" />
                <span>Результат анализа</span>
              </div>
              <h2>Риск и рекомендация</h2>
            </div>
          </div>
          <p className="card-copy">
            После входа вы получите оценку риска перегрузки и план, что оставить и что временно
            убрать.
          </p>
        </section>

        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              3
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="check" />
                <span>Минимальный уход</span>
              </div>
              <h2>Список шагов</h2>
            </div>
          </div>
          <p className="card-copy">
            Для сухой кожи — больше увлажнения и питания. Для жирной/комбинированной — лёгкие
            текстуры и аккуратная частота активов.
          </p>
        </section>

        <section className="card stage-card">
          <div className="stage-heading">
            <div className="stage-badge" aria-hidden="true">
              4
            </div>
            <div className="stage-title">
              <div className="stage-kicker">
                <Icon name="history" />
                <span>История</span>
              </div>
              <h2>Динамика</h2>
            </div>
          </div>
          <p className="card-copy">
            Результаты будут сохраняться в историю, чтобы вы видели прогресс и могли сравнивать
            рекомендации.
          </p>
        </section>
      </div>
    </div>
  );
}

function AnalysisRoute({ session, loading }) {
  if (loading) return <div className="helper-text">Загрузка...</div>;
  if (!session) return <AnalysisLockedPage />;
  return <AnalysisPage />;
}

function HistoryLockedPage() {
  return (
    <section className="narrow-page">
      <div className="page-intro">
        <h2>История анализов</h2>
        <p>История будет доступна после входа.</p>
      </div>

      <div className="card history-card">
        <div className="history-header">
          <div className="empty-icon">
            <Icon name="history" />
          </div>
          <div>
            <h3>Сохранённые результаты</h3>
            <p>После входа здесь появятся ваши прошлые анализы и динамика.</p>
          </div>
        </div>

        <NavLink to="/auth" className="primary-button inline-button">
          Зарегистрироваться / Войти
          <Icon name="arrow" />
        </NavLink>
      </div>
    </section>
  );
}

function HistoryRoute({ session, loading }) {
  if (loading) return <div className="helper-text">Загрузка...</div>;
  if (!session) return <HistoryLockedPage />;
  return <HistoryPage />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setSessionLoading(true);
    const request = apiMe();
    request
      .then((result) => {
        if (!alive) return;
        if (result.ok) setSession(result.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        setSessionLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!session) setChatOpen(false);
  }, [session]);

  const handleSignOut = () => {
    apiLogout().catch(() => {});
    setSession(null);
  };

  return (
    <div className="app-shell">
      <Header session={session} onSignOut={handleSignOut} />
      {session ? <ConsultChatPanel open={chatOpen} onClose={() => setChatOpen(false)} /> : null}
      <main className="container main-content">
        <Routes>
          <Route
            path="/"
            element={<HomePage session={session} onOpenAssistant={() => setChatOpen(true)} />}
          />
          <Route
            path="/analysis"
            element={
              <AnalysisRoute session={session} loading={sessionLoading} />
            }
          />
          <Route path="/history" element={<HistoryRoute session={session} loading={sessionLoading} />} />
          <Route path="/auth" element={<AuthPage onSessionChange={setSession} />} />
        </Routes>
      </main>
    </div>
  );
}
