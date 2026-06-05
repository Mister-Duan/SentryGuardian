import type { ComponentType, SVGProps } from 'react';
import {
  IconCompass,
  IconDashboard,
  IconGraph,
  IconIssues,
  IconSettings,
  IconSiren,
} from '../components/icons.js';

export type NavBadge = 'beta' | 'new' | 'alpha';

export type SecondaryNavItem = {
  id: string;
  label: string;
  to: string;
  supported: boolean;
  end?: boolean;
  badge?: NavBadge;
};

export type SecondaryNavSection = {
  title?: string;
  items: SecondaryNavItem[];
};

export type PrimaryNavItem = {
  id: string;
  label: string;
  shortLabel: string;
  to: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  match: (pathname: string) => boolean;
  sections: SecondaryNavSection[];
};

/** 主导航 + 次级导航（对齐 Sentry page-frame 结构） */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    id: 'issues',
    label: '问题',
    shortLabel: '问题',
    to: '/issues',
    Icon: IconIssues,
    match: (p) => p.startsWith('/issues') || p.startsWith('/events'),
    sections: [
      {
        title: '动态',
        items: [{ id: 'feed', label: '动态流', to: '/issues', supported: true, end: true }],
      },
      {
        title: '问题类型',
        items: [
          {
            id: 'errors',
            label: '错误与故障',
            to: '/issues?taxonomy=errors',
            supported: true,
          },
          { id: 'warnings', label: '警告', to: '/issues/warnings', supported: false },
          {
            id: 'feedback',
            label: '用户反馈',
            to: '/issues/feedback',
            supported: false,
            badge: 'beta',
          },
        ],
      },
      {
        title: '自动修复',
        items: [
          {
            id: 'autofix',
            label: '最近运行',
            to: '/issues/autofix',
            supported: false,
            badge: 'new',
          },
        ],
      },
      {
        title: '视图',
        items: [{ id: 'views', label: '全部视图', to: '/issues/views', supported: false }],
      },
      {
        title: '配置',
        items: [{ id: 'alerts', label: '告警', to: '/alerts', supported: true }],
      },
    ],
  },
  {
    id: 'explore',
    label: '探索',
    shortLabel: '探索',
    to: '/explore/traces',
    Icon: IconCompass,
    match: (p) => p.startsWith('/explore'),
    sections: [
      {
        items: [
          { id: 'traces', label: '链路追踪', to: '/explore/traces', supported: false },
          { id: 'logs', label: '日志', to: '/explore/logs', supported: false, badge: 'new' },
          { id: 'metrics', label: '指标', to: '/explore/metrics', supported: false, badge: 'new' },
          {
            id: 'errors-explore',
            label: '错误',
            to: '/explore/errors',
            supported: false,
            badge: 'alpha',
          },
          { id: 'discover', label: '发现', to: '/explore/discover', supported: false },
          { id: 'profiles', label: '性能剖析', to: '/explore/profiles', supported: false },
          { id: 'replays', label: '会话回放', to: '/explore/replays', supported: false },
          { id: 'releases', label: '版本', to: '/releases', supported: true },
          { id: 'saved-queries', label: '全部查询', to: '/explore/saved-queries', supported: false },
        ],
      },
    ],
  },
  {
    id: 'dashboards',
    label: '仪表盘',
    shortLabel: '仪表盘',
    to: '/dashboards',
    Icon: IconDashboard,
    match: (p) => p.startsWith('/dashboards'),
    sections: [
      {
        items: [
          { id: 'all', label: '全部仪表盘', to: '/dashboards', supported: false },
          { id: 'create', label: '创建仪表盘', to: '/dashboards/new', supported: false },
        ],
      },
    ],
  },
  {
    id: 'insights',
    label: '洞察',
    shortLabel: '洞察',
    to: '/performance',
    Icon: IconGraph,
    match: (p) => p.startsWith('/insights') || p.startsWith('/performance'),
    sections: [
      {
        items: [
          { id: 'perf', label: '性能', to: '/performance', supported: true },
          { id: 'frontend', label: '前端', to: '/insights/frontend', supported: false },
          { id: 'backend', label: '后端', to: '/insights/backend', supported: false },
        ],
      },
    ],
  },
  {
    id: 'monitors',
    label: '监控',
    shortLabel: '监控',
    to: '/alerts',
    Icon: IconSiren,
    match: (p) => p.startsWith('/monitors') || p.startsWith('/alerts'),
    sections: [
      {
        items: [
          { id: 'cron', label: '定时任务监控', to: '/monitors/cron', supported: false },
          { id: 'alerts', label: '告警规则', to: '/alerts', supported: true },
        ],
      },
    ],
  },
  {
    id: 'settings',
    label: '设置',
    shortLabel: '设置',
    to: '/settings',
    Icon: IconSettings,
    match: (p) => p.startsWith('/settings') || p === '/projects',
    sections: [
      {
        title: '组织',
        items: [
          { id: 'general', label: '常规', to: '/settings', supported: false },
          { id: 'projects', label: '项目', to: '/projects', supported: true },
          { id: 'members', label: '成员', to: '/settings/members', supported: false },
          { id: 'auth', label: '认证', to: '/settings/auth', supported: false },
        ],
      },
      {
        title: '项目',
        items: [
          { id: 'project-general', label: '常规设置', to: '/settings/project', supported: false },
          { id: 'source-maps', label: '源码映射', to: '/releases', supported: true },
        ],
      },
    ],
  },
];

export function getActivePrimaryNav(pathname: string): PrimaryNavItem {
  return PRIMARY_NAV.find((item) => item.match(pathname)) ?? PRIMARY_NAV[0]!;
}

export function findSecondaryItem(pathname: string, search: string): SecondaryNavItem | undefined {
  for (const primary of PRIMARY_NAV) {
    for (const section of primary.sections) {
      for (const item of section.items) {
        const [path] = item.to.split('?');
        if (pathname === path || pathname.startsWith(`${path}/`)) {
          if (!item.to.includes('?') || search === item.to.split('?')[1]) {
            return item;
          }
        }
        if (item.to.includes('?') && pathname === path) {
          const q = item.to.split('?')[1];
          if (search.includes(q?.split('=')[1] ?? '')) {
            return item;
          }
        }
      }
    }
  }
  return undefined;
}

export type IssueDetailTab = {
  id: string;
  label: string;
  path: string;
  supported: boolean;
};

export function issueDetailTabs(issueId: string): IssueDetailTab[] {
  const base = `/issues/${issueId}`;
  return [
    { id: 'details', label: '详情', path: base, supported: true },
    { id: 'activity', label: '动态', path: `${base}/activity`, supported: true },
    { id: 'events', label: '事件', path: `${base}/events`, supported: true },
    { id: 'feedback', label: '用户反馈', path: `${base}/feedback`, supported: false },
    { id: 'attachments', label: '附件', path: `${base}/attachments`, supported: false },
    { id: 'tags', label: '标签', path: `${base}/tags`, supported: false },
    { id: 'replays', label: '回放', path: `${base}/replays`, supported: false },
    { id: 'merged', label: '已合并问题', path: `${base}/merged`, supported: false },
    { id: 'similar', label: '相似问题', path: `${base}/similar`, supported: false },
  ];
}
