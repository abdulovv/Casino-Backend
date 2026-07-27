import {
  Backpack,
  ChevronDown,
  CircleUserRound,
  Gamepad2,
  ShieldCheck,
  ShoppingBag,
  LogIn,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCoins } from "../lib/api";
import { LiveDropFeed } from "./LiveDropFeed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { token, user, wallet, logout } = useAuth();
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isCasePlayPage = /^\/cases\/[^/]+$/.test(location.pathname);
  const contentClassName = [
    "app-content",
    isAuthPage ? "app-content--auth" : "",
    isCasePlayPage ? "app-content--case-play" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  return (
    <div className={isCasePlayPage ? "app app--case-play" : "app"}>
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="CatCase — на главную">
          <span className="brand__wordmark">
            Cat<span>Case</span>
          </span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Основная навигация">
          <NavLink to="/" end>
            <Gamepad2 size={19} />
            Игры
          </NavLink>
          <NavLink to="/inventory">
            <Backpack size={19} />
            Инвентарь
          </NavLink>
          <NavLink to="/store">
            <ShoppingBag size={19} />
            Магазин
          </NavLink>
          {user?.role === "ADMIN" && (
            <NavLink to="/admin">
              <ShieldCheck size={19} />
              Админ
            </NavLink>
          )}
        </nav>

        <div className="account-actions">
          {token ? (
            <>
              <div className="balance-pill" title="Баланс звёзд">
                <strong className="currency-amount">
                  {formatCoins(wallet?.balance ?? 0)}
                  <span className="currency-star" aria-hidden="true">
                    ⭐
                  </span>
                </strong>
              </div>
              <div
                className={`profile-menu${profileMenuOpen ? " profile-menu--open" : ""}`}
                ref={profileMenuRef}
              >
                <button
                  className="profile-menu__trigger"
                  type="button"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
                >
                  <CircleUserRound size={20} />
                  <span>{user?.email ?? "Профиль"}</span>
                  <ChevronDown className="profile-menu__chevron" size={15} />
                </button>
                <button
                  className="profile-menu__logout"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <NavLink className="login-button" to="/login">
              <LogIn size={18} />
              Войти
            </NavLink>
          )}
        </div>
      </header>

      <LiveDropFeed />

      <div className={contentClassName}>{children}</div>

      {!isAuthPage && !isCasePlayPage && (
        <nav className="mobile-nav" aria-label="Мобильная навигация">
          <NavLink to="/" end>
            <Gamepad2 size={22} />
            <span>Игры</span>
          </NavLink>
          <NavLink to="/inventory">
            <Backpack size={22} />
            <span>Инвентарь</span>
          </NavLink>
          <NavLink to="/store">
            <ShoppingBag size={22} />
            <span>Магазин</span>
          </NavLink>
          <NavLink
            to={
              user?.role === "ADMIN"
                ? "/admin"
                : token
                  ? "/inventory"
                  : "/login"
            }
          >
            {user?.role === "ADMIN" ? (
              <ShieldCheck size={21} />
            ) : token ? (
              <span
                className="mobile-balance currency-amount"
                aria-hidden="true"
              >
                {formatCoins(wallet?.balance ?? 0)}
                <span className="currency-star">⭐</span>
              </span>
            ) : (
              <CircleUserRound size={21} />
            )}
            <span>
              {user?.role === "ADMIN" ? "Админ" : token ? "Баланс" : "Войти"}
            </span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
