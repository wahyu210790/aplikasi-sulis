import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

export function RefreshIndicator() {
  const isFetching = useIsFetching();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFetching > 0) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [isFetching]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Memuat data terbaru..."
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary/20"
    >
      <div className="h-full w-full animate-pulse bg-primary" />
    </div>
  );
}
