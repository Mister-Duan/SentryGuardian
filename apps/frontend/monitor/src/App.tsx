import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.js';
import { IssueDetailPage } from './pages/IssueDetailPage.js';
import { IssuesPage } from './pages/IssuesPage.js';
import { LoginPage } from './pages/LoginPage.js';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/issues"
          element={
            <PrivateRoute>
              <IssuesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/issues/:id"
          element={
            <PrivateRoute>
              <IssueDetailPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/issues" replace />} />
      </Routes>
    </AuthProvider>
  );
}
