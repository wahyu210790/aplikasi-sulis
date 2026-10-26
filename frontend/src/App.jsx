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
const ProjectDetailPage = lazy(() => import('./features/projects/pages/ProjectDetailPage.jsx'));
const ProjectsPage = lazy(() => import('./features/projects/pages/ProjectsPage.jsx'));
const PurchaseDetailPage = lazy(() => import('./features/purchases/pages/PurchaseDetailPage.jsx'));
const PurchaseFormPage = lazy(() => import('./features/purchases/pages/PurchaseFormPage.jsx'));
const PurchasesPage = lazy(() => import('./features/purchases/pages/PurchasesPage.jsx'));
const ReturnFormPage = lazy(() => import('./features/stock/pages/ReturnFormPage.jsx'));
const StockOutFormPage = lazy(() => import('./features/stock/pages/StockOutFormPage.jsx'));
const StockTransactionDetailPage = lazy(() => import('./features/stock/pages/StockTransactionDetailPage.jsx'));
const StockTransactionsPage = lazy(() => import('./features/stock/pages/StockTransactionsPage.jsx'));
const SuppliersPage = lazy(() => import('./features/master/pages/SuppliersPage.jsx'));
const UnitsPage = lazy(() => import('./features/master/pages/UnitsPage.jsx'));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage.jsx'));

function page(Page, props = {}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12 text-muted">
          <Spinner className="h-6 w-6" />
        </div>
      }
    >
      <Page {...props} />
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
          <Route element={<RequireRole action="projects.view" />}>
            <Route path="proyek" element={page(ProjectsPage)} />
            <Route path="proyek/:id" element={page(ProjectDetailPage)} />
          </Route>
          <Route element={<RequireRole action="stock.view" />}>
            <Route path="barang-keluar" element={page(StockTransactionsPage, { type: 'project_out' })} />
            <Route path="barang-keluar/:id" element={page(StockTransactionDetailPage, { type: 'project_out' })} />
            <Route path="pengembalian" element={page(StockTransactionsPage, { type: 'project_return' })} />
            <Route path="pengembalian/:id" element={page(StockTransactionDetailPage, { type: 'project_return' })} />
          </Route>
          <Route element={<RequireRole action="stock.out" />}>
            <Route path="barang-keluar/baru" element={page(StockOutFormPage)} />
          </Route>
          <Route element={<RequireRole action="stock.return" />}>
            <Route path="pengembalian/baru" element={page(ReturnFormPage)} />
          </Route>
          <Route element={<RequireRole action="purchases.view" />}>
            <Route path="pembelian" element={page(PurchasesPage)} />
            <Route path="pembelian/:id" element={page(PurchaseDetailPage)} />
          </Route>
          <Route element={<RequireRole action="purchases.manage" />}>
            <Route path="pembelian/baru" element={page(PurchaseFormPage)} />
            <Route path="pembelian/:id/ubah" element={page(PurchaseFormPage)} />
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
