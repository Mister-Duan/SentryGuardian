import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar.js';
import { AuthProvider, useAuth } from './lib/auth.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { EventDetailPage } from './pages/EventDetailPage.js';
import { IssueDetailPage } from './pages/IssueDetailPage.js';
import { IssuesPage } from './pages/IssuesPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { PerformancePage } from './pages/PerformancePage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { ReleasesPage } from './pages/ReleasesPage.js';
import { SetupPage } from './pages/SetupPage.js';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="mx-auto max-w-5xl p-6">
      <NavBar />
      {children}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
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
        <Route
          path="/events/:id"
          element={
            <PrivateRoute>
              <EventDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <ProjectsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/releases"
          element={
            <PrivateRoute>
              <ReleasesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <PrivateRoute>
              <PerformancePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <PrivateRoute>
              <AlertsPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/issues" replace />} />
      </Routes>
    </AuthProvider>
  );
}
