import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type PageHeaderState = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

type PageHeaderContextValue = {
  header: PageHeaderState | null;
  setHeader: (header: PageHeaderState | null) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderState | null>(null);
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader(state: PageHeaderState): void {
  const ctx = useContext(PageHeaderContext);
  const { setHeader } = ctx ?? { setHeader: () => {} };

  useEffect(() => {
    setHeader(state);
    return () => setHeader(null);
  }, [setHeader, state.title, state.description, state.actions]);
}

export function usePageHeaderContext(): PageHeaderContextValue {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error('usePageHeaderContext must be used within PageHeaderProvider');
  }
  return ctx;
}
