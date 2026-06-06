import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Issue, ProjectResponse } from '@sentry-guardian/types';
import { IssueBulkBar } from '../components/issues/IssueBulkBar.js';
import { IssueListToolbar, type IssueSort } from '../components/issues/IssueListToolbar.js';
import { ProjectErrorOverview } from '../components/issues/ProjectErrorOverview.js';
import { Button, Card, Table, TableHead, TableRow } from '../components/ui.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import { ISSUE_STATUS_LABELS } from '../lib/format-event.js';
import { labelLevel, labelMechanism } from '../lib/error-labels.js';
import {
  type IssueFilterField,
  type IssueFilterState,
  clearAllIssueFilters,
  mergeFilterOptions,
  setIssueFilter,
} from '../lib/issue-filters.js';
import { toIssueScopeQuery, toIssueStatsQuery } from '../lib/issue-scope-query.js';
import {
  createRelativeTimeRange,
  defaultIssueTimeRange,
  type IssueTimeRange,
} from '../lib/issue-time-range.js';
import { useAuth } from '../lib/auth.js';

const REFRESH_MS = 10_000;

const QUICK_FILTER_CLASS =
  'block max-w-full truncate rounded px-0.5 text-left text-[10px] text-[var(--sg-accent)] hover:underline';

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} 小时`;
  return `${Math.floor(h / 24)} 天`;
}

function FilterableCell({
  value,
  label,
  onFilter,
}: {
  value: string | undefined;
  label: string;
  onFilter: (value: string) => void;
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
      {value}
    </button>
  );
}

export function IssuesPage() {
  const { api } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [filters, setFilters] = useState<IssueFilterState>({
    project_id: '',
    status: 'unresolved',
    environment: '',
    exception_type: '',
    mechanism: '',
    level: '',
  });
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState<IssueTimeRange>(() => defaultIssueTimeRange());
  const [breakdownTypeKeys, setBreakdownTypeKeys] = useState<string[]>([]);
  const [breakdownMechanismKeys, setBreakdownMechanismKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sort, setSort] = useState<IssueSort>('last_seen');
  const [realtime, setRealtime] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedProject = projects.find((p) => p.id === filters.project_id);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filterOptions = useMemo(
    () => ({
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
      exceptionTypeOptions: mergeFilterOptions(breakdownTypeKeys, filters.exception_type),
      mechanismOptions: mergeFilterOptions(breakdownMechanismKeys, filters.mechanism),
    }),
    [projects, breakdownTypeKeys, breakdownMechanismKeys, filters.exception_type, filters.mechanism],
  );

  const statsQuery = useMemo(
    () => toIssueStatsQuery(filters, timeRange),
    [filters, timeRange],
  );

  const scopeQuery = useMemo(
    () => toIssueScopeQuery(filters, timeRange),
    [filters, timeRange],
  );

  useEffect(() => {
    if (searchParams.get('taxonomy') === 'errors') {
      setFilters((prev) => ({ ...prev, status: 'unresolved' }));
    }
  }, [searchParams]);

  const loadIssues = useCallback(() => {
    if (!filters.project_id) return;
    void api
      .listIssues({
        project_id: filters.project_id,
        ...scopeQuery,
        ...(search ? { search } : {}),
        page,
        page_size: pageSize,
      })
      .then((res) => {
        setIssues(res.items);
        setTotal(res.total);
        setError(null);
        setSelected(new Set());
      })
      .catch(() => setError('加载问题列表失败'));
  }, [api, filters.project_id, scopeQuery, search, page]);

  const sortedIssues = useMemo(() => {
    const copy = [...issues];
    if (sort === 'events') {
      copy.sort((a, b) => b.event_count - a.event_count);
    } else if (sort === 'first_seen') {
      copy.sort((a, b) => new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime());
    } else {
      copy.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
    }
    return copy;
  }, [issues, sort]);

  const headerActions = useMemo(
    () => (
      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="sm" disabled title="尚未实现">
          ★ 保存视图
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={loadIssues}>
          刷新
        </Button>
      </div>
    ),
    [loadIssues],
  );

  usePageHeader({
    title: searchParams.get('taxonomy') === 'errors' ? '错误与故障' : '动态流',
    description: `共 ${total} 条问题`,
    actions: headerActions,
  });

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      setFilters((prev) => (prev.project_id ? prev : { ...prev, project_id: list[0]?.id ?? '' }));
    });
  }, [api]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    if (!filters.project_id) {
      setBreakdownTypeKeys([]);
      setBreakdownMechanismKeys([]);
      return;
    }
    void api.errorBreakdown(filters.project_id, statsQuery).then((res) => {
      setBreakdownTypeKeys(res.by_type.map((item) => item.key));
      setBreakdownMechanismKeys(res.by_mechanism.map((item) => item.key));
    });
  }, [api, filters.project_id, statsQuery]);

  useEffect(() => {
    if (timeRange.preset === 'custom') return;
    const timer = setInterval(() => {
      setTimeRange(createRelativeTimeRange(timeRange.preset));
    }, 60_000);
    return () => clearInterval(timer);
  }, [timeRange.preset]);

  useEffect(() => {
    if (!realtime) return;
    const timer = setInterval(loadIssues, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadIssues, realtime]);

  function applyQuickFilter(field: IssueFilterField, value: string) {
    setFilters((prev) => setIssueFilter(prev, field, value));
    setPage(1);
  }

  function updateTimeRange(next: IssueTimeRange) {
    setTimeRange(next);
    setPage(1);
  }

  function updateFilters(next: IssueFilterState) {
    const projectChanged = next.project_id !== filters.project_id;
    const scoped = projectChanged
      ? {
          ...clearAllIssueFilters(next),
          project_id: next.project_id,
        }
      : next;
    setFilters(scoped);
    setPage(1);
    if (projectChanged) {
      setBreakdownTypeKeys([]);
      setBreakdownMechanismKeys([]);
    }
  }

  async function copyDsn() {
    if (!selectedProject?.dsn) return;
    await navigator.clipboard.writeText(selectedProject.dsn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sortedIssues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedIssues.map((i) => i.id)));
    }
  }

  return (
    <div className="space-y-2">
      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-[var(--sg-border)] px-3 pt-3 pb-2.5">
          <IssueListToolbar
            filters={filters}
            onFiltersChange={updateFilters}
            filterOptions={filterOptions}
            timeRange={timeRange}
            onTimeRangeChange={updateTimeRange}
            search={search}
            onSearch={(s) => {
              setSearch(s);
              setPage(1);
            }}
            sort={sort}
            onSort={setSort}
            realtime={realtime}
            onRealtimeToggle={() => setRealtime((v) => !v)}
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
          <ProjectErrorOverview
            projectId={filters.project_id}
            statsQuery={statsQuery}
            timeRange={timeRange}
          />
        )}

        <IssueBulkBar
          selectedCount={selected.size}
          totalOnPage={sortedIssues.length}
          allSelected={selected.size === sortedIssues.length && sortedIssues.length > 0}
          onSelectAll={toggleSelectAll}
        />

        {error && <p className="px-3 pb-1 text-xs text-[var(--sg-danger)]">{error}</p>}

        <Table className="mb-1 px-3">
          <TableHead>
            <tr>
              <th className="w-8 pb-2" />
              <th className="pb-2 pr-2">问题</th>
              <th className="w-20 pb-2 pr-2">异常类型</th>
              <th className="w-20 pb-2 pr-2">捕获类型</th>
              <th className="w-14 pb-2 pr-2">严重级别</th>
              <th className="w-14 pb-2 pr-2">最近出现</th>
              <th className="w-10 pb-2 pr-2">时长</th>
              <th className="w-12 pb-2 pr-2 text-right">趋势</th>
              <th className="w-12 pb-2 pr-2 text-right">事件</th>
              <th className="w-12 pb-2 pr-2 text-right">用户</th>
              <th className="w-16 pb-2">状态</th>
            </tr>
          </TableHead>
          <tbody>
            {sortedIssues.map((issue) => (
              <TableRow key={issue.id}>
                <td className="py-1.5">
                  <input
                    type="checkbox"
                    checked={selected.has(issue.id)}
                    onChange={() => toggleSelect(issue.id)}
                    className="rounded border-[var(--sg-border)]"
                  />
                </td>
                <td className="max-w-[200px] py-1.5 pr-2">
                  <Link
                    className="block truncate font-medium hover:underline"
                    style={{ color: 'var(--sg-accent)' }}
                    to={`/issues/${issue.id}`}
                    title={issue.title}
                  >
                    {issue.title}
                  </Link>
                  {issue.culprit && (
                    <span className="block truncate text-[10px] text-[var(--sg-text-muted)]">
                      {issue.culprit}
                    </span>
                  )}
                </td>
                <td className="max-w-[80px] py-1.5 pr-2">
                  <FilterableCell
                    value={issue.exception_type}
                    label="异常类型"
                    onFilter={(v) => applyQuickFilter('exception_type', v)}
                  />
                </td>
                <td className="max-w-[80px] py-1.5 pr-2">
                  {issue.mechanism ? (
                    <button
                      type="button"
                      className={QUICK_FILTER_CLASS}
                      title={`按捕获类型筛选：${labelMechanism(issue.mechanism)}`}
                      onClick={() => applyQuickFilter('mechanism', issue.mechanism!)}
                    >
                      {labelMechanism(issue.mechanism)}
                    </button>
                  ) : (
                    <span className="text-[10px] text-[var(--sg-text-muted)]">—</span>
                  )}
                </td>
                <td className="py-1.5 pr-2">
                  <button
                    type="button"
                    className={QUICK_FILTER_CLASS}
                    title={`按严重级别筛选：${labelLevel(issue.level)}`}
                    onClick={() => applyQuickFilter('level', issue.level)}
                  >
                    {labelLevel(issue.level)}
                  </button>
                </td>
                <td className="py-1.5 pr-2 text-[10px] tabular-nums text-[var(--sg-text-muted)]">
                  {formatAge(issue.last_seen)}
                </td>
                <td className="py-1.5 pr-2 text-[10px] tabular-nums text-[var(--sg-text-muted)]">
                  {formatAge(issue.first_seen)}
                </td>
                <td className="py-1.5 pr-2 text-right text-[10px] text-[var(--sg-text-muted)]">
                  —
                </td>
                <td className="py-1.5 pr-2 text-right text-xs tabular-nums">{issue.event_count}</td>
                <td className="py-1.5 text-right text-[10px] text-[var(--sg-text-muted)]">—</td>
                <td className="py-1.5 text-xs">
                  <button
                    type="button"
                    className={QUICK_FILTER_CLASS}
                    onClick={() => applyQuickFilter('status', issue.status)}
                  >
                    {ISSUE_STATUS_LABELS[issue.status]}
                  </button>
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>

        {sortedIssues.length === 0 && (
          <p className="py-6 text-center text-xs text-[var(--sg-text-muted)]">暂无问题</p>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--sg-border)] px-3 py-2 text-xs">
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
            {page}/{totalPages}
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
