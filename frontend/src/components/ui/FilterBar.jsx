// Row of filters above a table. Stacks vertically on mobile.
export function FilterBar({ children }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}
