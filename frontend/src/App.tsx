import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { CasePage } from "./pages/CasePage";
import { CasesPage } from "./pages/CasesPage";
import { DevelopmentPage } from "./pages/DevelopmentPage";
import { HomePage } from "./pages/HomePage";
import { InventoryPage } from "./pages/InventoryPage";
import { StorePage } from "./pages/StorePage";
import { AdminPage } from "./pages/AdminPage";
import { UpgradePage } from "./pages/UpgradePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, initializing } = useAuth();

  if (initializing) {
    return <div className="page-loader">Загружаем профиль…</div>;
  }

  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user, initializing } = useAuth();

  if (initializing) {
    return <div className="page-loader">Проверяем права доступа…</div>;
  }

  if (!token) {
    return <Navigate to="/login?returnTo=/admin" replace />;
  }

  return user?.role === "ADMIN" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:caseId" element={<CasePage />} />
        <Route path="/store" element={<StorePage />} />
        <Route
          path="/upgrade"
          element={
            <ProtectedRoute>
              <UpgradePage />
            </ProtectedRoute>
          }
        />
        <Route path="/crash" element={<DevelopmentPage mode="crash" />} />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
