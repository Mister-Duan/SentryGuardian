import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ProjectResponse, TransactionSummary } from '@sentry-guardian/types';
import { PerformanceListToolbar } from '../components/performance/PerformanceListToolbar.js';
import { PerformanceOverview } from '../components/performance/PerformanceOverview.js';
import { ReorderableTable, type TableColumnDef } from '../components/ReorderableTable.js';
import { Button, Card } from '../components/ui.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import {
  formatPerformanceMeasure,
  formatTransactionMetricLabel,
  labelMetricKey,
  labelMetricRating,
  performanceRowFilterKey,
} from '../lib/performance-labels.js';
import {
  type PerformanceFilterState,
  mergeMetricFilterOptions,
  setPerformanceFilter,
} from '../lib/performance-filters.js';
import { toTransactionQuery } from '../lib/performance-query.js';
import {
  defaultIssueTimeRange,
  type IssueTimeRange,
} from '../lib/issue-time-range.js';
import { useAuth } from '../lib/auth.js';

const PAGE_SIZE = 20;

const QUICK_FILTER_CLASS =
  'block max-w-full truncate rounded px-0.5 text-left text-[10px] text-[var(--sg-accent)] hover:underline';

function FilterableCell({
  value,
  label,
  onFilter,
  display,
}: {
  value: string | undefined;
  label: string;
  onFilter: (value: string) => void;
  display?: ReactNode;
}) {
  if (!value) {
    return <span className="text-[10px] text-[var(--sg-text-muted)]">—</span>;
  }
  return (
    <button
      type="button"
      className={QUICK_FILTER_CLASS}
      title={`按${label}筛选：${value}`}
      onClick={() => onFilter(value)}
    >
      {display ?? (label === '类型' ? labelMetricKey(value) : value)}
    </button>
  );
}

export function PerformancePage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [filters, setFilters] = useState<PerformanceFilterState>({
    project_id: '',
    metric: '',
  });
  const [timeRange, setTimeRange] = useState<IssueTimeRange>(() => defaultIssueTimeRange());
  const [metricOptionKeys, setMetricOptionKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<TransactionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedProject = projects.find((p) => p.id === filters.project_id);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterOptions = useMemo(
    () => ({
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
      metricOptions: mergeMetricFilterOptions(metricOptionKeys, filters.metric),
    }),
    [projects, metricOptionKeys, filters.metric],
  );

  const listQuery = useMemo(
    () => toTransactionQuery(timeRange, filters.metric, page, PAGE_SIZE),
    [timeRange, filters.metric, page],
  );

  const summaryQuery = useMemo(
    () => toTransactionQuery(timeRange, filters.metric, 1, PAGE_SIZE),
    [timeRange, filters.metric],
  );

  usePageHeader({ title: '性能', description: 'Web Vitals 与慢请求' });

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      if (list[0]) {
        setFilters((prev) => ({ ...prev, project_id: prev.project_id || list[0]!.id }));
      }
    });
  }, [api]);

  useEffect(() => {
    if (!filters.project_id) return;
    void api.performanceSummary(filters.project_id, summaryQuery).then((res) => {
      setMetricOptionKeys(res.by_metric.map((i) => i.key));
    });
  }, [api, filters.project_id, summaryQuery]);

  const loadTransactions = useCallback(() => {
    if (!filters.project_id) return;
    void api.listTransactions(filters.project_id, listQuery).then((res) => {
      setItems(res.items);
      setTotal(res.total);
    });
  }, [api, filters.project_id, listQuery]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function updateTimeRange(next: IssueTimeRange) {
    setTimeRange(next);
    setPage(1);
  }

  function updateFilters(next: PerformanceFilterState) {
    const projectChanged = next.project_id !== filters.project_id;
    setFilters(
      projectChanged
        ? { project_id: next.project_id, metric: '' }
        : next,
    );
    setPage(1);
    if (projectChanged) {
      setMetricOptionKeys([]);
    }
  }

  const applyQuickFilter = useCallback((value: string) => {
    setFilters((prev) => setPerformanceFilter(prev, 'metric', value));
    setPage(1);
  }, []);

  async function copyDsn() {
    if (!selectedProject?.dsn) return;
    await navigator.clipboard.writeText(selectedProject.dsn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const columns = useMemo<TableColumnDef<TransactionSummary>[]>(
    () => [
      {
        id: 'type',
        header: '类型',
        render: (tx) => (
          <FilterableCell
            value={performanceRowFilterKey(tx.metric, tx.transaction)}
            label="类型"
            display={formatTransactionMetricLabel(tx.metric, tx.transaction)}
            onFilter={applyQuickFilter}
          />
        ),
      },
      {
        id: 'measure',
        header: '数值',
        cellClassName: 'text-[10px] tabular-nums',
        render: (tx) =>
          formatPerformanceMeasure(tx.metric, tx.metric_value, tx.duration_ms),
      },
      {
        id: 'rating',
        header: '评级',
        cellClassName: 'text-[10px] text-[var(--sg-text-muted)]',
        render: (tx) => labelMetricRating(tx.metric_rating),
      },
      {
        id: 'url',
        header: '地址',
        cellClassName: 'break-all text-[10px] text-[var(--sg-text-muted)]',
        render: (tx) => tx.url ?? '—',
      },
      {
        id: 'timestamp',
        header: '时间',
        cellClassName: 'text-[10px] tabular-nums text-[var(--sg-text-muted)]',
        render: (tx) =>
          new Date(tx.timestamp).toLocaleString(undefined, {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
    ],
    [applyQuickFilter],
  );

  return (
    <div className="space-y-2">
      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-[var(--sg-border)] px-3 pt-3 pb-2.5">
          <PerformanceListToolbar
            filters={filters}
            onFiltersChange={updateFilters}
            filterOptions={filterOptions}
            timeRange={timeRange}
            onTimeRangeChange={updateTimeRange}
          />
        </div>

        {selectedProject?.dsn && (
          <div className="flex items-center gap-2 border-b border-[var(--sg-border)] bg-[var(--sg-content-bg)] px-3 py-1.5">
            <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-[var(--sg-text-muted)]">
              {selectedProject.dsn}
            </p>
            <Button type="button" variant="default" size="sm" onClick={() => void copyDsn()}>
              {copied ? '已复制' : 'DSN'}
            </Button>
          </div>
        )}

        {filters.project_id && (
          <PerformanceOverview
            projectId={filters.project_id}
            query={summaryQuery}
            timeRange={timeRange}
          />
        )}

        <ReorderableTable
          tableId="performance-list"
          columns={columns}
          rows={items}
          getRowKey={(tx) => tx.id}
          className="mb-1 px-3"
        />

        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--sg-text-muted)]">暂无性能数据</p>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--sg-border)] px-3 py-1.5 text-xs">
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-[var(--sg-text-muted)]">
            {page}/{totalPages} · 共 {total} 条
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      </Card>
    </div>
  );
}
