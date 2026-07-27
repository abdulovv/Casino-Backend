import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiRequestError, apiRequest } from "../lib/api";
import type {
  LoginResponse,
  RegisterResponse,
  UserResponse,
  WalletResponse,
} from "../types/api";

const TOKEN_KEY = "catcase_access_token";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

interface Credentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  wallet: WalletResponse | null;
  initializing: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setWallet(null);
  }, []);

  const loadAccount = useCallback(async (accessToken: string) => {
    const [nextUser, nextWallet] = await Promise.all([
      apiRequest<UserResponse>("/api/users/me", {}, accessToken),
      apiRequest<WalletResponse>("/api/wallet", {}, accessToken),
    ]);

    setUser(nextUser);
    setWallet(nextWallet);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        await loadAccount(token);
      } catch {
        if (active) {
          logout();
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [loadAccount, logout, token]);

  const login = useCallback(
    async (credentials: Credentials) => {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);

      try {
        await loadAccount(response.token);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setWallet(null);
        throw new ApiRequestError(
          "Не удалось подтвердить вход. Попробуй ещё раз.",
          0,
        );
      }
    },
    [loadAccount],
  );

  const register = useCallback(
    async (credentials: Credentials) => {
      await apiRequest<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      await login(credentials);
    },
    [login],
  );

  const refreshWallet = useCallback(async () => {
    if (!token) {
      return;
    }

    const nextWallet = await apiRequest<WalletResponse>(
      "/api/wallet",
      {},
      token,
    );
    setWallet(nextWallet);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      wallet,
      initializing,
      login,
      register,
      logout,
      refreshWallet,
    }),
    [
      token,
      user,
      wallet,
      initializing,
      login,
      register,
      logout,
      refreshWallet,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
