import type { IssueStatus, ProjectResponse } from '@sentry-guardian/types';
import { Button, FilterBar, FilterField, Input, Select } from '../ui.js';
import { UnsupportedNotice } from '../UnsupportedNotice.js';

export type IssueSort = 'last_seen' | 'first_seen' | 'events' | 'users';

type StatusFilter = IssueStatus | 'all';

type Props = {
  projects: ProjectResponse[];
  projectId: string;
  onProjectId: (id: string) => void;
  statusFilter: StatusFilter;
  onStatusFilter: (s: StatusFilter) => void;
  search: string;
  onSearch: (s: string) => void;
  environment: string;
  onEnvironment: (s: string) => void;
  release: string;
  onRelease: (s: string) => void;
  sort: IssueSort;
  onSort: (s: IssueSort) => void;
  realtime: boolean;
  onRealtimeToggle: () => void;
  dateLabel: string;
};

export function IssueListToolbar(props: Props) {
  return (
    <div className="space-y-2">
      <FilterBar className="!border-0 !pb-0">
        <FilterField label="项目">
          <Select value={props.projectId} onChange={(e) => props.onProjectId(e.target.value)}>
            {props.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="环境" className="max-w-[100px]">
          <Select
            value={props.environment || 'all'}
            onChange={(e) =>
              props.onEnvironment(e.target.value === 'all' ? '' : e.target.value)
            }
          >
            <option value="all">全部环境</option>
            <option value="production">生产 (production)</option>
            <option value="development">开发 (development)</option>
          </Select>
        </FilterField>
        <FilterField label="时间" className="max-w-[120px]">
          <Button type="button" variant="default" size="sm" className="w-full" disabled>
            {props.dateLabel}
          </Button>
        </FilterField>
        <FilterField label="搜索" className="min-w-[140px] flex-[2]">
          <Input
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="is:unresolved 标题:…"
          />
        </FilterField>
        <FilterField label="排序" className="max-w-[120px]">
          <Select
            value={props.sort}
            onChange={(e) => props.onSort(e.target.value as IssueSort)}
          >
            <option value="last_seen">最近出现</option>
            <option value="first_seen">存在时长</option>
            <option value="events">事件数</option>
            <option value="users">用户数</option>
          </Select>
        </FilterField>
        <div className="flex items-end pb-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={props.onRealtimeToggle}
            title={props.realtime ? '暂停实时刷新' : '开启实时刷新'}
          >
            {props.realtime ? '⏸' : '▶'}
          </Button>
        </div>
      </FilterBar>
      {props.sort === 'users' && <UnsupportedNotice feature="按用户数排序" compact />}
    </div>
  );
}
