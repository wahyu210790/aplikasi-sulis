// Frontend mirror of docs/desain-v2.md B6. The API is the real guarantee; this only hides UI.
// Later tasks ADD actions here. Never remove or rename an existing action.

const ACTIONS = {
  'dashboard.view': ['owner', 'gudang', 'finance'],
  'account.view': ['owner', 'gudang', 'finance'],
  'users.manage': ['owner'],
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
