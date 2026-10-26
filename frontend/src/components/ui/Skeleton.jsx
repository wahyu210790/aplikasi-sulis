import { cn } from '../../lib/cn.js';

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-control bg-slate-200', className)} />;
}
