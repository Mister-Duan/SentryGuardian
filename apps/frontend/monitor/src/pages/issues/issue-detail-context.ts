import { createContext, useContext } from 'react';
import type { IssueDetailResponse } from '@sentry-guardian/types';

export type IssueDetailOutletContext = {
  detail: IssueDetailResponse;
  setDetail: (d: IssueDetailResponse) => void;
};

export const IssueDetailContext = createContext<IssueDetailOutletContext | null>(null);

export function useIssueDetailContext(): IssueDetailOutletContext {
  const ctx = useContext(IssueDetailContext);
  if (!ctx) {
    throw new Error('useIssueDetailContext requires IssueDetailLayout');
  }
  return ctx;
}
