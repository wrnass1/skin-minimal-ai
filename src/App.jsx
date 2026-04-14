import { useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  historyItems,
  initialProducts,
  recoveryDays,
  skinTypes,
  symptomsCatalog,
} from "./data/mockData";

const toneClassMap = {
  blue: "tone-blue",
  rose: "tone-rose",
  amber: "tone-amber",
  emerald: "tone-emerald",
  neutral: "tone-neutral",
  future: "tone-future",
};

const iconMap = {
  leaf: "◌",
  magic: "✦",
  menu: "≡",
  document: "▣",
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
  shield: "◍",
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

function Header() {
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
          <button type="button" className="primary-button desktop-only">
            Войти
          </button>
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

function HomePage() {
  return (
    <div className="page page-active">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="eyebrow eyebrow-lg">
            <Icon name="magic" />
            <span>AI Дерматологический ассистент</span>
          </div>
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
              <Icon name="leaf" />
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
  const [skinType, setSkinType] = useState("Сухая");
  const [selectedSymptoms, setSelectedSymptoms] = useState(["redness", "dryness"]);
  const [products, setProducts] = useState(initialProducts);
  const [analysisCount, setAnalysisCount] = useState(0);

  const analysisResult = useMemo(() => {
    const sensitivityBoost = skinType === "Чувствительная" ? 15 : 0;
    const drynessBoost = selectedSymptoms.includes("dryness") ? 10 : 0;
    const rednessBoost = selectedSymptoms.includes("redness") ? 10 : 0;
    const activeOverload = products.some((product) => product.name.includes("BHA")) ? 20 : 0;
    const riskScore = Math.min(95, 35 + sensitivityBoost + drynessBoost + rednessBoost + activeOverload);

    const riskLabel = riskScore >= 70 ? "Повышенный" : riskScore >= 50 ? "Средний" : "Низкий";
    const recommendation =
      riskScore >= 70
        ? "Уберите активные компоненты на 14 дней. Оставьте мягкое очищение, базовый крем и SPF."
        : "Снизьте частоту активов и наблюдайте за реакцией кожи в течение недели.";

    const summary =
      selectedSymptoms.includes("redness") || selectedSymptoms.includes("dryness")
        ? "Кожный барьер может быть ослаблен: есть признаки раздражения и чувствительности."
        : "Текущий уход выглядит относительно стабильным, но стоит избегать лишних активов.";

    const keep = products.filter((product) => !product.name.includes("BHA"));
    const pause = products.filter((product) => product.name.includes("BHA"));

    return { riskScore, riskLabel, recommendation, summary, keep, pause };
  }, [products, selectedSymptoms, skinType]);

  const toggleSymptom = (id) => {
    setSelectedSymptoms((current) =>
      current.includes(id)
        ? current.filter((symptomId) => symptomId !== id)
        : [...current, id],
    );
  };

  const addProduct = () => {
    const variants = [
      "Успокаивающий тонер",
      "SPF 50 без отдушек",
      "Ниацинамид 5%",
      "Восстанавливающий бальзам",
    ];

    const nextName = variants[products.length % variants.length];
    setProducts((current) => [
      ...current,
      {
        id: Date.now(),
        name: nextName,
        schedule: "По необходимости, 1 раз в день",
        icon: "spark",
        color: "blue",
      },
    ]);
  };

  return (
    <div className="page page-active">
      <div className="page-intro">
        <h2>Анализ ухода</h2>
        <p>Проанализируйте свою кожу и получите персональную рекомендацию.</p>
      </div>

      <div className="analysis-grid">
        <section className="card input-card">
          <div className="section-heading">
            <div className="section-icon">
              <Icon name="document" />
            </div>
            <h2>Ввод данных</h2>
          </div>

          <div className="field-block">
            <label className="field-label">Тип кожи</label>
            <div className="option-grid">
              {skinTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`choice-button ${skinType === type ? "choice-button-active" : ""}`}
                  onClick={() => setSkinType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <div className="field-row">
              <label className="field-label">Текущий уход</label>
              <span className="field-caption">{products.length} продукта</span>
            </div>
            <div className="product-list">
              {products.map((product) => (
                <article key={product.id} className="product-item">
                  <div className={`product-icon ${toneClassMap[product.color]}`}>
                    <Icon name={product.icon} />
                  </div>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.schedule}</p>
                  </div>
                </article>
              ))}
              <button type="button" className="ghost-button" onClick={addProduct}>
                <Icon name="add" />
                Добавить продукт
              </button>
            </div>
          </div>

          <div className="field-block">
            <label className="field-label">Симптомы</label>
            <div className="tag-list">
              {symptomsCatalog.map((symptom) => {
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

          <button type="button" className="primary-button full-width" onClick={() => setAnalysisCount((value) => value + 1)}>
            Проанализировать уход
          </button>

          <p className="helper-text">
            Анализ обновлён {analysisCount} {analysisCount === 1 ? "раз" : analysisCount > 1 && analysisCount < 5 ? "раза" : "раз"}.
          </p>
        </section>

        <div className="results-column">
          <div className="result-cards">
            <section className="card">
              <h3 className="card-title">Результат анализа</h3>
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
                  <div className="info-title">Рекомендация AI</div>
                  <div className="info-copy">{analysisResult.recommendation}</div>
                </div>
              </div>
            </section>

            <section className="card">
              <h3 className="card-title">Ваш минимальный уход</h3>
              <RoutineList title="Оставить" tone="emerald" icon="check" items={analysisResult.keep} />
              <RoutineList title="Убрать на 2 недели" tone="rose" icon="close" items={analysisResult.pause} muted />
            </section>
          </div>

          <section className="card">
            <div className="card-header">
              <h3 className="card-title">Трекинг восстановления</h3>
              <span className="chip">День 4 из 14</span>
            </div>

            <div className="progress-chart">
              {recoveryDays.map((entry) => (
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

        <div className="history-list">
          {historyItems.map((item) => (
            <article key={item.id} className="history-item">
              <div>
                <strong>{item.date}</strong>
                <p>{item.note}</p>
              </div>
              <span className="chip">{item.risk}</span>
            </article>
          ))}
        </div>

        <NavLink to="/analysis" className="primary-button inline-button">
          Перейти к анализу
          <Icon name="arrow" />
        </NavLink>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="container main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}
