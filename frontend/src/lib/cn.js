// Joins class names, skipping false/null/undefined. Use fixed class strings only (Tailwind cannot see dynamic names).
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
