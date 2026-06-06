import type { IssueStatus } from '@sentry-guardian/types';
import { ISSUE_STATUS_LABELS } from './format-event.js';
import { LEVEL_FILTER_OPTIONS, labelLevel, labelMechanism } from './error-labels.js';

/** Filterable issue list dimensions (Kibana-style field keys). 可筛选的 Issue 维度字段。 */
export type IssueFilterField =
  | 'project_id'
  | 'exception_type'
  | 'mechanism'
  | 'level'
  | 'environment'
  | 'status';

/** Active filter values for the issue list toolbar. Issue 列表工具栏的筛选状态。 */
export type IssueFilterState = {
  /** Selected project id (required scope). 当前选中项目 ID（必选范围）。 */
  project_id: string;
  /** Workflow status; `all` means no status filter. 工作流状态；`all` 表示不过滤。 */
  status: IssueStatus | 'all';
  /** Environment on latest occurrence. 最近出现的环境。 */
  environment: string;
  /** Exception class on latest occurrence. 最近事件的异常类型。 */
  exception_type: string;
  /** Capture mechanism on latest occurrence. 最近事件的捕获机制。 */
  mechanism: string;
  /** Severity level on the issue. Issue 严重级别。 */
  level: string;
};

/** Dropdown / pill label context for dynamic filter values. 动态筛选值的上下文。 */
export type IssueFilterOptionsContext = {
  /** Available projects. 可选项目列表。 */
  projects: { id: string; name: string }[];
  /** Exception type keys from recent error breakdown. 近端错误分布中的异常类型。 */
  exceptionTypeOptions: string[];
  /** Mechanism keys from recent error breakdown. 近端错误分布中的捕获机制。 */
  mechanismOptions: string[];
};

/** One active filter pill. 一条生效中的筛选 pill。 */
export type ActiveIssueFilter = {
  /** Field key. 字段键。 */
  field: IssueFilterField;
  /** Raw filter value sent to the API. 传给 API 的原始值。 */
  value: string;
  /** When false, pill has no remove button (e.g. required project scope). 不可移除（如必选项目）。 */
  removable?: boolean;
};

export const ISSUE_FILTER_FIELD_LABELS: Record<IssueFilterField, string> = {
  project_id: '项目',
  exception_type: '异常类型',
  mechanism: '捕获类型',
  level: '严重级别',
  environment: '环境',
  status: '状态',
};

/** Fields available in the add-filter popover (project handled via pill click). 添加筛选弹层可选字段。 */
export const ISSUE_ADD_FILTER_FIELDS: IssueFilterField[] = [
  'exception_type',
  'mechanism',
  'level',
  'environment',
  'status',
];

const ENVIRONMENT_FILTER_OPTIONS = [
  { value: 'production', label: '生产 (production)' },
  { value: 'development', label: '开发 (development)' },
];

/**
 * Human-readable label for a filter value in pills and popovers.
 * 筛选 pill 与弹层中展示用的值标签。
 *
 * @example
 * ```ts
 * // Input / 输入
 * formatFilterDisplayValue('mechanism', 'onerror', { projects: [], exceptionTypeOptions: [], mechanismOptions: [] })
 * // Output / 输出
 * '全局错误'
 * ```
 */
export function formatFilterDisplayValue(
  field: IssueFilterField,
  value: string,
  context?: IssueFilterOptionsContext,
): string {
  switch (field) {
    case 'project_id':
      return context?.projects.find((p) => p.id === value)?.name ?? value;
    case 'mechanism':
      return labelMechanism(value);
    case 'level':
      return labelLevel(value);
    case 'status':
      return ISSUE_STATUS_LABELS[value as IssueStatus] ?? value;
    case 'environment':
      return ENVIRONMENT_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? value;
    default:
      return value;
  }
}

/**
 * Derive active filter pills from toolbar state.
 * 从工具栏状态推导当前生效的筛选 pill 列表。
 *
 * @example
 * ```ts
 * // Input / 输入
 * getActiveIssueFilters({ project_id: 'p1', status: 'unresolved', environment: '', exception_type: 'TypeError', mechanism: '', level: '' })
 * // Output / 输出
 * [{ field: 'project_id', value: 'p1', removable: false }, { field: 'status', value: 'unresolved' }, …]
 * ```
 */
export function getActiveIssueFilters(state: IssueFilterState): ActiveIssueFilter[] {
  const out: ActiveIssueFilter[] = [];
  if (state.project_id) {
    out.push({ field: 'project_id', value: state.project_id, removable: false });
  }
  if (state.status !== 'all') out.push({ field: 'status', value: state.status });
  if (state.environment) out.push({ field: 'environment', value: state.environment });
  if (state.exception_type) out.push({ field: 'exception_type', value: state.exception_type });
  if (state.mechanism) out.push({ field: 'mechanism', value: state.mechanism });
  if (state.level) out.push({ field: 'level', value: state.level });
  return out;
}

/**
 * Value options for the add-filter popover.
 * 「添加筛选」弹层的可选值列表。
 */
export function getFilterValueOptions(
  field: IssueFilterField,
  context: IssueFilterOptionsContext,
): { value: string; label: string }[] {
  switch (field) {
    case 'project_id':
      return context.projects.map((p) => ({ value: p.id, label: p.name }));
    case 'exception_type':
      return context.exceptionTypeOptions.map((v) => ({ value: v, label: v }));
    case 'mechanism':
      return context.mechanismOptions.map((v) => ({
        value: v,
        label: labelMechanism(v),
      }));
    case 'level':
      return LEVEL_FILTER_OPTIONS.map((v) => ({ value: v, label: labelLevel(v) }));
    case 'environment':
      return ENVIRONMENT_FILTER_OPTIONS;
    case 'status':
      return (Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map((v) => ({
        value: v,
        label: ISSUE_STATUS_LABELS[v],
      }));
  }
}

/** Fields not yet represented as pills (for add-filter popover). 尚未添加为 pill 的字段。 */
export function getAvailableAddFilterFields(state: IssueFilterState): IssueFilterField[] {
  const active = new Set(
    getActiveIssueFilters(state)
      .filter((item) => item.field !== 'project_id')
      .map((item) => item.field),
  );
  return ISSUE_ADD_FILTER_FIELDS.filter((f) => !active.has(f));
}

/** Remove one field from filter state. 从筛选状态移除单个字段。 */
export function clearIssueFilter(
  state: IssueFilterState,
  field: IssueFilterField,
): IssueFilterState {
  if (field === 'project_id') {
    return state;
  }
  if (field === 'status') {
    return { ...state, status: 'all' };
  }
  return { ...state, [field]: '' };
}

/** Reset optional list filters while keeping project scope. 清除可选筛选，保留项目范围。 */
export function clearAllIssueFilters(state: IssueFilterState): IssueFilterState {
  return {
    ...state,
    status: 'all',
    environment: '',
    exception_type: '',
    mechanism: '',
    level: '',
  };
}

/** Set or replace a single filter field. 设置或替换单个筛选字段。 */
export function setIssueFilter(
  state: IssueFilterState,
  field: IssueFilterField,
  value: string,
): IssueFilterState {
  return { ...state, [field]: value };
}

/** Merge breakdown keys with the active filter value so pills stay selectable. 合并分布键与当前筛选值。 */
export function mergeFilterOptions(keys: string[], activeValue: string): string[] {
  const set = new Set(keys);
  if (activeValue) set.add(activeValue);
  return [...set].sort();
}
