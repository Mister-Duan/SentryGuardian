import { FilterBar } from '../ui.js';
import type { PerformanceFilterOptionsContext, PerformanceFilterState } from '../../lib/performance-filters.js';
import type { IssueTimeRange } from '../../lib/issue-time-range.js';
import { IssueTimeRangePicker } from '../issues/IssueTimeRangePicker.js';
import { PerformanceFilterBar } from './PerformanceFilterBar.js';

type Props = {
  filters: PerformanceFilterState;
  onFiltersChange: (next: PerformanceFilterState) => void;
  filterOptions: PerformanceFilterOptionsContext;
  timeRange: IssueTimeRange;
  onTimeRangeChange: (next: IssueTimeRange) => void;
};

/**
 * Performance stream toolbar: time range + Kibana-style filter pills.
 * 性能流工具栏：时间区间 + Kibana 风格筛选 pill。
 */
export function PerformanceListToolbar(props: Props) {
  return (
    <div className="space-y-2.5">
      <FilterBar className="!border-0 !pb-0">
        <IssueTimeRangePicker value={props.timeRange} onChange={props.onTimeRangeChange} />
      </FilterBar>
      <PerformanceFilterBar
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        filterOptions={props.filterOptions}
      />
    </div>
  );
}
