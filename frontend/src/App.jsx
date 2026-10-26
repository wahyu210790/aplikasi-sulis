import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { RequireRole } from './auth/RequireRole.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { NotFoundPage } from './components/layout/NotFoundPage.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import UiShowcasePage from './dev/UiShowcasePage.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import DashboardPage from './features/dashboard/pages/DashboardPage.jsx';

// Feature pages are loaded on first visit (smaller first download on mobile).
const AccountPage = lazy(() => import('./features/account/pages/AccountPage.jsx'));
const CategoriesPage = lazy(() => import('./features/master/pages/CategoriesPage.jsx'));
const ImportProductsPage = lazy(() => import('./features/imports/pages/ImportProductsPage.jsx'));
const ProductDetailPage = lazy(() => import('./features/products/pages/ProductDetailPage.jsx'));
const ProductsPage = lazy(() => import('./features/products/pages/ProductsPage.jsx'));
const SuppliersPage = lazy(() => import('./features/master/pages/SuppliersPage.jsx'));
const UnitsPage = lazy(() => import('./features/master/pages/UnitsPage.jsx'));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage.jsx'));

function page(Page) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      }
    >
      <Page />
    </Suspense>
  );
}

// Routes — docs/desain-v2.md B12.4. Later tasks ADD routes inside the AppShell route.
export default function App() {
  return (
    <Routes>
      <Route path="/masuk" element={<LoginPage />} />
      {import.meta.env.DEV ? <Route path="/_ui" element={<UiShowcasePage />} /> : null}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="akun" element={page(AccountPage)} />
          <Route element={<RequireRole action="users.manage" />}>
            <Route path="pengguna" element={page(UsersPage)} />
          </Route>
          <Route element={<RequireRole action="products.view" />}>
            <Route path="barang" element={page(ProductsPage)} />
            <Route path="barang/:id" element={page(ProductDetailPage)} />
          </Route>
          <Route element={<RequireRole action="products.import" />}>
            <Route path="barang/impor" element={page(ImportProductsPage)} />
          </Route>
          <Route element={<RequireRole action="master.view" />}>
            <Route path="pengaturan/kategori" element={page(CategoriesPage)} />
            <Route path="pengaturan/satuan" element={page(UnitsPage)} />
          </Route>
          <Route element={<RequireRole action="suppliers.manage" />}>
            <Route path="pemasok" element={page(SuppliersPage)} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
