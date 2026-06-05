import { useLocation } from 'react-router-dom';
import { UnsupportedNotice } from '../components/UnsupportedNotice.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import { findSecondaryItem } from '../layout/sentry-nav.js';

const LABELS: Record<string, string> = {
  '/issues/warnings': '警告',
  '/issues/feedback': '用户反馈',
  '/issues/autofix': '自动修复',
  '/issues/views': '问题视图',
  '/explore/traces': '链路追踪',
  '/explore/logs': '日志',
  '/explore/metrics': '指标',
  '/explore/errors': '探索 · 错误',
  '/explore/discover': '发现',
  '/explore/profiles': '性能剖析',
  '/explore/replays': '会话回放',
  '/explore/saved-queries': '已保存查询',
  '/dashboards': '仪表盘',
  '/dashboards/new': '创建仪表盘',
  '/insights/frontend': '前端洞察',
  '/insights/backend': '后端洞察',
  '/monitors/cron': '定时任务监控',
  '/settings': '组织设置',
  '/settings/members': '成员',
  '/settings/auth': '认证',
  '/settings/project': '项目设置',
};

export function PlaceholderPage() {
  const { pathname, search } = useLocation();
  const item = findSecondaryItem(pathname, search);
  const feature = item?.label ?? LABELS[pathname] ?? pathname;

  usePageHeader({ title: feature, description: '功能预览（尚未实现）' });

  return (
    <div className="max-w-lg space-y-3">
      <UnsupportedNotice feature={feature} />
      <p className="text-xs text-[var(--sg-text-muted)]">
        此页面 UI 已从 Sentry 控制台迁移占位。当前可用的能力请使用侧栏中已实现的导航项（如
        问题 → 动态流、探索 → 版本、设置 → 项目）。
      </p>
    </div>
  );
}
