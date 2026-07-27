import { ArrowLeft, Eye, EyeOff, FlaskConical, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFriendlyError } from "../lib/api";

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const { token, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const isLogin = mode === "login";
  const search = new URLSearchParams(location.search);
  const returnTo = search.get("returnTo") || "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const credentials = { email: email.trim(), password };
      if (isLogin) {
        await login(credentials);
      } else {
        await register(credentials);
      }
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(getFriendlyError(requestError, isLogin ? "login" : "general"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="back-link auth-page__back" to="/">
        <ArrowLeft size={18} />
        На главную
      </Link>

      <section className="auth-layout">
        <div className="auth-promo">
          <div className="auth-promo__label">
            <FlaskConical size={16} />
            WELCOME TO CATCASE
          </div>
          <h1>
            Твой пропуск
            <br />в <span>CatCase</span>
          </h1>
          <p>
            Сохраняй выпавшие предметы в инвентаре и следи за балансом
            звёзд.
          </p>
          <div className="auth-promo__card">
            <LockKeyhole size={21} />
            <span>
              <strong>Один аккаунт</strong>
              Баланс и коллекция всегда рядом
            </span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card__heading">
            <span>{isLogin ? "С возвращением" : "Новый игрок"}</span>
            <h2>{isLogin ? "Войти в аккаунт" : "Создать аккаунт"}</h2>
            <p>
              {isLogin
                ? "Введи данные, которые использовал при регистрации."
                : "Для регистрации нужны только email и пароль."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input
                autoComplete="email"
                type="email"
                placeholder="player@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              <span>Пароль</span>
              <div className="password-input">
                <input
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  type={showPassword ? "text" : "password"}
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            {error && <div className="form-error">{error}</div>}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Подключаемся…"
                : isLogin
                  ? "Войти"
                  : "Зарегистрироваться"}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Впервые здесь?" : "Уже есть аккаунт?"}{" "}
            <Link to={isLogin ? "/register" : "/login"}>
              {isLogin ? "Создать аккаунт" : "Войти"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
