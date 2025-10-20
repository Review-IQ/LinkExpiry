import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './stores/authStore';

// Pages (to be imported as we create them)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateLink from './pages/CreateLink';
import EditLink from './pages/EditLink';
import LinkAnalytics from './pages/LinkAnalytics';
import Settings from './pages/Settings';
import ShortLinkRedirect from './pages/ShortLinkRedirect';
import ExpiryPages from './pages/ExpiryPages';
import CreateExpiryPage from './pages/CreateExpiryPage';
import EditExpiryPage from './pages/EditExpiryPage';
import ViewCapturedEmails from './pages/ViewCapturedEmails';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Only Route (redirect to dashboard if already logged in)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links/create"
          element={
            <ProtectedRoute>
              <CreateLink />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links/:id/edit"
          element={
            <ProtectedRoute>
              <EditLink />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links/:id/analytics"
          element={
            <ProtectedRoute>
              <LinkAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expiry-pages"
          element={
            <ProtectedRoute>
              <ExpiryPages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expiry-pages/create"
          element={
            <ProtectedRoute>
              <CreateExpiryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expiry-pages/:id/edit"
          element={
            <ProtectedRoute>
              <EditExpiryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expiry-pages/:id/emails"
          element={
            <ProtectedRoute>
              <ViewCapturedEmails />
            </ProtectedRoute>
          }
        />

        {/* Short Link Redirect - Must be last and only match valid short codes */}
        <Route path="/:shortCode" element={<ShortLinkRedirect />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
