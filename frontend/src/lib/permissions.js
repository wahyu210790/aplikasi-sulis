// Frontend mirror of docs/desain-v2.md B6. The API is the real guarantee; this only hides UI.
// Later tasks ADD actions here. Never remove or rename an existing action.

const ACTIONS = {
  'dashboard.view': ['owner', 'gudang', 'finance'],
  'account.view': ['owner', 'gudang', 'finance'],
  'users.manage': ['owner'],
  'master.view': ['owner', 'gudang', 'finance'],
  'master.manage': ['owner', 'gudang'],
  'suppliers.manage': ['owner', 'finance'],
  'products.view': ['owner', 'gudang', 'finance'],
  'products.manage': ['owner', 'gudang'],
  'products.import': ['owner', 'gudang'],
  'projects.view': ['owner', 'gudang', 'finance'],
  'projects.manage': ['owner', 'finance'],
  // Fase 3 — stock in and out (B6)
  'stock.view': ['owner', 'gudang', 'finance'],
  'stock.out': ['owner', 'gudang'],
  'stock.return': ['owner', 'gudang'],
  'stock.reverse': ['owner'],
  'stock.opening': ['owner', 'finance'],
  'imports.view': ['owner', 'gudang', 'finance'],
  'purchases.view': ['owner', 'gudang', 'finance'],
  'purchases.manage': ['owner', 'finance'],
  'purchases.receive': ['owner', 'gudang'],
  'purchases.cancelReceived': ['owner'],
  // Fase 4 — profit per project (B6)
  'projectCosts.manage': ['owner', 'finance'],
  'reports.view': ['owner', 'gudang', 'finance'],
  'reports.money': ['owner', 'finance'],
  // Fase 5 — stock opname (B5.5, H7)
  'opname.view': ['owner', 'gudang', 'finance'],
  'opname.manage': ['owner', 'gudang'],
  'opname.approve': ['owner'],
};

export function can(user, action) {
  if (!user) return false;
  const roles = ACTIONS[action];
  if (!roles) return false;
  return roles.includes(user.role);
}

export function canSeeMoney(user) {
  return Boolean(user) && user.role !== 'gudang';
}
