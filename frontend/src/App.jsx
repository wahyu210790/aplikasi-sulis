import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { NotFoundPage } from './components/layout/NotFoundPage.jsx';
import UiShowcasePage from './dev/UiShowcasePage.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import DashboardPage from './features/dashboard/pages/DashboardPage.jsx';

// Routes — docs/desain-v2.md B12.4. Later tasks ADD routes inside the AppShell route.
export default function App() {
  return (
    <Routes>
      <Route path="/masuk" element={<LoginPage />} />
      {import.meta.env.DEV ? <Route path="/_ui" element={<UiShowcasePage />} /> : null}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
