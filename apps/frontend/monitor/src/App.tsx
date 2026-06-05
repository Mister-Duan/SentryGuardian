import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { AuthProvider, useAuth } from './lib/auth.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { EventDetailPage } from './pages/EventDetailPage.js';
import { IssueDetailActivityTab } from './pages/issues/IssueDetailActivityTab.js';
import { IssueDetailDetailsTab } from './pages/issues/IssueDetailDetailsTab.js';
import { IssueDetailEventsTab } from './pages/issues/IssueDetailEventsTab.js';
import { IssueDetailLayout } from './pages/issues/IssueDetailLayout.js';
import { IssueDetailStubTab } from './pages/issues/IssueDetailStubTab.js';
import { IssuesPage } from './pages/IssuesPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { PerformancePage } from './pages/PerformancePage.js';
import { PlaceholderPage } from './pages/PlaceholderPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { ReleasesPage } from './pages/ReleasesPage.js';
import { SetupPage } from './pages/SetupPage.js';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

function PlaceholderRoute() {
  return (
    <PrivateRoute>
      <PlaceholderPage />
    </PrivateRoute>
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
              <IssueDetailLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<IssueDetailDetailsTab />} />
          <Route path="activity" element={<IssueDetailActivityTab />} />
          <Route path="events" element={<IssueDetailEventsTab />} />
          <Route path="feedback" element={<IssueDetailStubTab />} />
          <Route path="attachments" element={<IssueDetailStubTab />} />
          <Route path="tags" element={<IssueDetailStubTab />} />
          <Route path="replays" element={<IssueDetailStubTab />} />
          <Route path="merged" element={<IssueDetailStubTab />} />
          <Route path="similar" element={<IssueDetailStubTab />} />
        </Route>

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

        {/* Explore stubs */}
        <Route path="/explore/traces" element={<PlaceholderRoute />} />
        <Route path="/explore/logs" element={<PlaceholderRoute />} />
        <Route path="/explore/metrics" element={<PlaceholderRoute />} />
        <Route path="/explore/errors" element={<PlaceholderRoute />} />
        <Route path="/explore/discover" element={<PlaceholderRoute />} />
        <Route path="/explore/profiles" element={<PlaceholderRoute />} />
        <Route path="/explore/replays" element={<PlaceholderRoute />} />
        <Route path="/explore/saved-queries" element={<PlaceholderRoute />} />

        {/* Issues stubs */}
        <Route path="/issues/warnings" element={<PlaceholderRoute />} />
        <Route path="/issues/feedback" element={<PlaceholderRoute />} />
        <Route path="/issues/autofix" element={<PlaceholderRoute />} />
        <Route path="/issues/views" element={<PlaceholderRoute />} />

        {/* Other primary stubs */}
        <Route path="/dashboards" element={<PlaceholderRoute />} />
        <Route path="/dashboards/new" element={<PlaceholderRoute />} />
        <Route path="/insights/frontend" element={<PlaceholderRoute />} />
        <Route path="/insights/backend" element={<PlaceholderRoute />} />
        <Route path="/monitors/cron" element={<PlaceholderRoute />} />
        <Route path="/settings" element={<PlaceholderRoute />} />
        <Route path="/settings/members" element={<PlaceholderRoute />} />
        <Route path="/settings/auth" element={<PlaceholderRoute />} />
        <Route path="/settings/project" element={<PlaceholderRoute />} />

        <Route path="*" element={<Navigate to="/issues" replace />} />
      </Routes>
    </AuthProvider>
  );
}
