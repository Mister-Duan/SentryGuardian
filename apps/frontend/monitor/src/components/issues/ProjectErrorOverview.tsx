import { useEffect, useState } from 'react';
import type { ErrorBreakdownResponse, ErrorTypeTrendResponse } from '@sentry-guardian/types';
import { BarBreakdownChart } from '../charts/BarBreakdownChart.js';
import { StackedErrorTypeTrendChart } from '../charts/StackedErrorTypeTrendChart.js';
import { Button, Card } from '../ui.js';
import { labelLevel, labelMechanism } from '../../lib/error-labels.js';
import { useAuth } from '../../lib/auth.js';

type Dimension = 'type' | 'mechanism';
type OverviewTab = 'trend' | 'breakdown';

const overviewTabs: { id: OverviewTab; label: string }[] = [
  { id: 'trend', label: '时间趋势' },
  { id: 'breakdown', label: '错误分布' },
];

/**
 * Combined project error overview with tabbed trend / breakdown views.
 * 项目错误概览：Tab 切换时间趋势与错误分布。
 */
export function ProjectErrorOverview({ projectId }: { projectId: string }) {
  const { api } = useAuth();
  const [tab, setTab] = useState<OverviewTab>('trend');
  const [dimension, setDimension] = useState<Dimension>('type');
  const [trends, setTrends] = useState<ErrorTypeTrendResponse | null>(null);
  const [breakdown, setBreakdown] = useState<ErrorBreakdownResponse | null>(null);

  useEffect(() => {
    if (!projectId) return;
    void api.errorTypeTrends(projectId, 24, dimension).then(setTrends);
  }, [api, projectId, dimension]);

  useEffect(() => {
    if (!projectId) return;
    void api.errorBreakdown(projectId, 24).then(setBreakdown);
  }, [api, projectId]);

  const hasTrend =
    trends != null && trends.series.some((s) => s.points.some((p) => p.count > 0));
  const hasBreakdown =
    breakdown != null &&
    (breakdown.by_type.length > 0 ||
      breakdown.by_mechanism.length > 0 ||
      breakdown.by_level.length > 0);

  if (!hasTrend && !hasBreakdown) {
    return null;
  }

  const hours = trends?.hours ?? breakdown?.hours ?? 24;
  const activeTab = tab === 'trend' && !hasTrend ? 'breakdown' : tab === 'breakdown' && !hasBreakdown ? 'trend' : tab;

  return (
    <Card className="!p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--sg-text-muted)]">
        近 {hours} 小时错误概览
      </p>

      <div className="mb-3 flex flex-wrap gap-1 border-b border-[var(--sg-border)]">
        {overviewTabs.map((item) => {
          const disabled = item.id === 'trend' ? !hasTrend : !hasBreakdown;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => setTab(item.id)}
              className={[
                'rounded-t px-2.5 py-1.5 text-xs font-medium transition-colors',
                activeTab === item.id
                  ? 'border border-b-0 border-[var(--sg-border)] bg-[var(--sg-surface)] text-[var(--sg-accent)]'
                  : 'text-[var(--sg-text-muted)] hover:bg-[var(--sg-row-hover)]',
                disabled ? 'cursor-not-allowed opacity-40' : '',
              ].join(' ')}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'trend' && hasTrend && trends && (
        <>
          <div className="mb-3 flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={dimension === 'type' ? 'primary' : 'default'}
              onClick={() => setDimension('type')}
            >
              异常类型
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dimension === 'mechanism' ? 'primary' : 'default'}
              onClick={() => setDimension('mechanism')}
            >
              捕获来源
            </Button>
          </div>
          <StackedErrorTypeTrendChart
            title={dimension === 'type' ? '按异常类型 · 横轴时间 · 纵轴事件量' : '按捕获来源 · 横轴时间 · 纵轴事件量'}
            data={trends}
            labelFn={dimension === 'mechanism' ? labelMechanism : undefined}
          />
        </>
      )}

      {activeTab === 'breakdown' && hasBreakdown && breakdown && (
        <div className="grid gap-4 md:grid-cols-3">
          <BarBreakdownChart title="异常类型" items={breakdown.by_type} />
          <BarBreakdownChart
            title="捕获来源"
            items={breakdown.by_mechanism}
            labelFn={labelMechanism}
          />
          <BarBreakdownChart title="严重级别" items={breakdown.by_level} labelFn={labelLevel} />
        </div>
      )}
    </Card>
  );
}
