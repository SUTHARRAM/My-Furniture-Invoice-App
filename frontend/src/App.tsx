import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoiceListPage } from './pages/InvoiceListPage';
import { InvoiceCreatePage } from './pages/InvoiceCreatePage';
import { InvoiceEditPage } from './pages/InvoiceEditPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import axios from 'axios';
import { authApi } from './api/authApi';
import { useAuthStore } from './store/authStore';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Attempts to restore the session from the refresh-token cookie on every page load.
// Shows a blank screen while checking so ProtectedRoute never sees a false "not authenticated".
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        // Use plain axios — bypasses the api interceptor so a missing cookie
        // just throws here instead of triggering the interceptor's redirect loop.
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const token = refreshRes.data.data.access_token;
        (window as any).__accessToken = token;
        const meRes = await authApi.me();
        setAuth(meRes.data.data, token);
      } catch {
        // No valid session — ProtectedRoute will redirect to /login
      } finally {
        setReady(true);
      }
    };
    restore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null; // blank while checking; avoids flash-redirect to /login
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="invoices" element={<InvoiceListPage />} />
              <Route path="invoices/create" element={<InvoiceCreatePage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="invoices/:id/edit" element={<InvoiceEditPage />} />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
