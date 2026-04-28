import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiLogin, apiLogout, apiRegister, apiMe } from "../auth/api";
import { isValidEmail, normalizeEmail } from "../auth/session";

export default function AuthPage({ onSessionChange }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signIn"); // signIn | signUp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => {
    let alive = true;
    apiMe()
      .then((result) => {
        if (!alive) return;
        if (result.ok) setSession(result.user);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (!isValidEmail(email)) return false;
    if (mode === "signUp" && password.length < 6) return false;
    if (mode === "signIn" && password.length < 1) return false;
    return true;
  }, [busy, email, mode, password]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = { email: normalizeEmail(email), password };
      const result = mode === "signUp" ? await apiRegister(payload) : await apiLogin(payload);

      if (!result.ok) {
        setError(result.error ?? "Не удалось выполнить действие.");
        return;
      }

      setSession(result.user);
      onSessionChange?.(result.user);
      navigate("/analysis");
    } catch {
      setError("Не удалось выполнить действие. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await apiLogout();
    setSession(null);
    onSessionChange?.(null);
    navigate("/");
  };

  return (
    <section className="narrow-page">
      <div className="page-intro">
        <h2>Авторизация</h2>
        <p>Войдите в аккаунт или зарегистрируйтесь по email.</p>
      </div>

      <div className="card auth-card">
        {session ? (
          <div className="auth-signed">
            <div className="auth-signed-line">
              <div>
                <div className="auth-signed-label">Вы вошли как</div>
                <div className="auth-signed-email">{session.email}</div>
              </div>
              <button type="button" className="secondary-button sign-out-button" onClick={handleSignOut}>
                Выйти
              </button>
            </div>
            <div className="auth-signed-actions">
              <button type="button" className="primary-button" onClick={() => navigate("/analysis")}>
                Перейти к анализу
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-tabs" role="tablist" aria-label="Авторизация">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signIn"}
                className={`auth-tab ${mode === "signIn" ? "auth-tab-active" : ""}`}
                onClick={() => setMode("signIn")}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signUp"}
                className={`auth-tab ${mode === "signUp" ? "auth-tab-active" : ""}`}
                onClick={() => setMode("signUp")}
              >
                Регистрация
              </button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <div className="auth-field">
                <label className="field-label" htmlFor="auth-email">
                  Email
                </label>
                <input
                  id="auth-email"
                  className="text-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="field-label" htmlFor="auth-password">
                  Пароль
                </label>
                <input
                  id="auth-password"
                  className="text-input"
                  type="password"
                  autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                  placeholder={mode === "signUp" ? "Минимум 6 символов" : "Введите пароль"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error ? <div className="form-error">{error}</div> : null}

              <button type="submit" className="primary-button full-width" disabled={!canSubmit}>
                {busy ? "Подождите..." : mode === "signUp" ? "Создать аккаунт" : "Войти"}
              </button>

              <div className="auth-hint">
                {mode === "signUp" ? (
                  <span>
                    Уже есть аккаунт?{" "}
                    <button type="button" className="link-button" onClick={() => setMode("signIn")}>
                      Войти
                    </button>
                  </span>
                ) : (
                  <span>
                    Нет аккаунта?{" "}
                    <button type="button" className="link-button" onClick={() => setMode("signUp")}>
                      Зарегистрироваться
                    </button>
                  </span>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
