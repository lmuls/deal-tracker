import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { getUnreadCount } from '../api/generated';
import { usePolling } from '../hooks/usePolling';

interface UnreadContextType {
  unread: number;
  refreshUnread: () => Promise<void>;
}

const UnreadContext = createContext<UnreadContextType | null>(null);

/** Polls the unread alert count so the nav and the alerts page agree. */
export function UnreadProvider({ children }: { children: ReactNode }) {
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    const { data } = await getUnreadCount();
    setUnread(data?.count ?? 0);
  }, []);

  usePolling(refreshUnread, 30_000);

  return <UnreadContext.Provider value={{ unread, refreshUnread }}>{children}</UnreadContext.Provider>;
}

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread must be used within UnreadProvider');
  return ctx;
}
