import { Button, FilterBar, FilterField, Input, Select } from '../ui.js';
import { UnsupportedNotice } from '../UnsupportedNotice.js';
import type { IssueFilterOptionsContext, IssueFilterState } from '../../lib/issue-filters.js';
import type { IssueTimeRange } from '../../lib/issue-time-range.js';
import { IssueFilterBar } from './IssueFilterBar.js';
import { IssueTimeRangePicker } from './IssueTimeRangePicker.js';

export type IssueSort = 'last_seen' | 'first_seen' | 'events' | 'users';

type Props = {
  filters: IssueFilterState;
  onFiltersChange: (next: IssueFilterState) => void;
  filterOptions: IssueFilterOptionsContext;
  timeRange: IssueTimeRange;
  onTimeRangeChange: (next: IssueTimeRange) => void;
  search: string;
  onSearch: (s: string) => void;
  sort: IssueSort;
  onSort: (s: IssueSort) => void;
  realtime: boolean;
  onRealtimeToggle: () => void;
};

export function IssueListToolbar(props: Props) {
  return (
    <div className="space-y-2.5">
      <FilterBar className="!border-0 !pb-0">
        <IssueTimeRangePicker value={props.timeRange} onChange={props.onTimeRangeChange} />
        <FilterField label="搜索" className="min-w-[180px] flex-[2]">
          <Input
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            placeholder="标题、位置或指纹…"
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

      <IssueFilterBar
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        filterOptions={props.filterOptions}
      />

      {props.sort === 'users' && <UnsupportedNotice feature="按用户数排序" compact />}
    </div>
  );
}
