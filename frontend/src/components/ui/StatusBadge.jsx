import { STATUS } from '../../lib/constants.js';
import { Badge } from './Badge.jsx';

// kind: a key of STATUS in lib/constants.js (e.g. 'user', 'project'); status: the enum value from the API.
export function StatusBadge({ kind, status }) {
  const item = STATUS[kind]?.[status];
  if (!item) return <Badge tone="neutral">{String(status)}</Badge>;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
