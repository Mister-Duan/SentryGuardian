import { METRIC_FILTER_OPTIONS, labelMetricKey } from './performance-labels.js';

/** Filterable performance list dimensions. 性能列表可筛选维度。 */
export type PerformanceFilterField = 'project_id' | 'metric';

/** Active filter values for the performance toolbar. 性能工具栏筛选状态。 */
export type PerformanceFilterState = {
  /** Selected project id (required scope). 当前项目 ID（必选范围）。 */
  project_id: string;
  /** Metric or transaction kind; empty means no filter. 指标或事务类型；空表示不过滤。 */
  metric: string;
};

/** Dropdown / pill label context. 筛选 pill 与弹层的上下文。 */
export type PerformanceFilterOptionsContext = {
  /** Available projects. 可选项目。 */
  projects: { id: string; name: string }[];
  /** Metric keys from recent breakdown (merged with presets). 近端分布中的指标键。 */
  metricOptions: string[];
};

/** One active filter pill. 一条生效中的筛选 pill。 */
export type ActivePerformanceFilter = {
  field: PerformanceFilterField;
  value: string;
  removable?: boolean;
};

export const PERFORMANCE_FILTER_FIELD_LABELS: Record<PerformanceFilterField, string> = {
  project_id: '项目',
  metric: '类型',
};

export const PERFORMANCE_ADD_FILTER_FIELDS: PerformanceFilterField[] = ['metric'];

/**
 * Human-readable label for a filter value.
 * 筛选值的展示标签。
 */
export function formatPerformanceFilterValue(
  field: PerformanceFilterField,
  value: string,
  context?: PerformanceFilterOptionsContext,
): string {
  if (field === 'project_id') {
    return context?.projects.find((p) => p.id === value)?.name ?? value;
  }
  return labelMetricKey(value);
}

export function getActivePerformanceFilters(state: PerformanceFilterState): ActivePerformanceFilter[] {
  const out: ActivePerformanceFilter[] = [];
  if (state.project_id) {
    out.push({ field: 'project_id', value: state.project_id, removable: false });
  }
  if (state.metric) {
    out.push({ field: 'metric', value: state.metric });
  }
  return out;
}

export function getPerformanceFilterValueOptions(
  field: PerformanceFilterField,
  context: PerformanceFilterOptionsContext,
): { value: string; label: string }[] {
  if (field === 'project_id') {
    return context.projects.map((p) => ({ value: p.id, label: p.name }));
  }
  const preset = METRIC_FILTER_OPTIONS.filter((o) => o.value).map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const seen = new Set(preset.map((o) => o.value));
  for (const key of context.metricOptions) {
    if (!seen.has(key)) {
      preset.push({ value: key, label: labelMetricKey(key) });
      seen.add(key);
    }
  }
  return preset;
}

export function getAvailablePerformanceAddFields(state: PerformanceFilterState): PerformanceFilterField[] {
  if (state.metric) return [];
  return PERFORMANCE_ADD_FILTER_FIELDS;
}

export function clearPerformanceFilter(
  state: PerformanceFilterState,
  field: PerformanceFilterField,
): PerformanceFilterState {
  if (field === 'project_id') return state;
  return { ...state, metric: '' };
}

export function clearAllPerformanceFilters(state: PerformanceFilterState): PerformanceFilterState {
  return { ...state, metric: '' };
}

export function setPerformanceFilter(
  state: PerformanceFilterState,
  field: PerformanceFilterField,
  value: string,
): PerformanceFilterState {
  return { ...state, [field]: value };
}

/** Merge breakdown keys with active metric filter value. 合并分布键与当前指标筛选。 */
export function mergeMetricFilterOptions(keys: string[], activeMetric: string): string[] {
  const set = new Set(keys);
  if (activeMetric) set.add(activeMetric);
  return [...set].sort();
}
