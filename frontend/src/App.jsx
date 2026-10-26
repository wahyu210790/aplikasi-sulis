import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { RequireRole } from './auth/RequireRole.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { NotFoundPage } from './components/layout/NotFoundPage.jsx';
import UiShowcasePage from './dev/UiShowcasePage.jsx';
import AccountPage from './features/account/pages/AccountPage.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import DashboardPage from './features/dashboard/pages/DashboardPage.jsx';
import CategoriesPage from './features/master/pages/CategoriesPage.jsx';
import SuppliersPage from './features/master/pages/SuppliersPage.jsx';
import UnitsPage from './features/master/pages/UnitsPage.jsx';
import UsersPage from './features/users/pages/UsersPage.jsx';

// Routes — docs/desain-v2.md B12.4. Later tasks ADD routes inside the AppShell route.
export default function App() {
  return (
    <Routes>
      <Route path="/masuk" element={<LoginPage />} />
      {import.meta.env.DEV ? <Route path="/_ui" element={<UiShowcasePage />} /> : null}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="akun" element={<AccountPage />} />
          <Route element={<RequireRole action="users.manage" />}>
            <Route path="pengguna" element={<UsersPage />} />
          </Route>
          <Route element={<RequireRole action="master.view" />}>
            <Route path="pengaturan/kategori" element={<CategoriesPage />} />
            <Route path="pengaturan/satuan" element={<UnitsPage />} />
          </Route>
          <Route element={<RequireRole action="suppliers.manage" />}>
            <Route path="pemasok" element={<SuppliersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
