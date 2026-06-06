import { useEffect, useRef, useState } from 'react';
import { Button, Select } from '../ui.js';
import {
  PERFORMANCE_FILTER_FIELD_LABELS,
  type PerformanceFilterField,
  type PerformanceFilterOptionsContext,
  type PerformanceFilterState,
  clearAllPerformanceFilters,
  clearPerformanceFilter,
  formatPerformanceFilterValue,
  getActivePerformanceFilters,
  getAvailablePerformanceAddFields,
  getPerformanceFilterValueOptions,
  setPerformanceFilter,
} from '../../lib/performance-filters.js';

type Props = {
  filters: PerformanceFilterState;
  onFiltersChange: (next: PerformanceFilterState) => void;
  filterOptions: PerformanceFilterOptionsContext;
};

function FilterPill({
  field,
  displayValue,
  removable,
  onRemove,
  onEdit,
}: {
  field: PerformanceFilterField;
  displayValue: string;
  removable: boolean;
  onRemove: () => void;
  onEdit?: () => void;
}) {
  const body = (
    <>
      <span className="shrink-0 text-[var(--sg-text-muted)]">
        {PERFORMANCE_FILTER_FIELD_LABELS[field]}
      </span>
      <span className="shrink-0 text-[var(--sg-text-muted)]">is</span>
      <span className="min-w-0 truncate font-medium">{displayValue}</span>
      {removable && (
        <button
          type="button"
          className="ml-0.5 shrink-0 rounded px-0.5 leading-none text-[var(--sg-text-muted)] hover:bg-[var(--sg-accent)]/10 hover:text-[var(--sg-text)]"
          aria-label={`移除筛选：${PERFORMANCE_FILTER_FIELD_LABELS[field]}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </>
  );

  const className =
    'inline-flex max-w-full items-center gap-1 rounded border border-[var(--sg-accent)]/30 bg-[var(--sg-row-selected)] px-1.5 py-0.5 text-[11px] text-[var(--sg-text)]';

  if (onEdit) {
    return (
      <button
        type="button"
        className={`${className} cursor-pointer hover:border-[var(--sg-accent)]/60`}
        title={`${PERFORMANCE_FILTER_FIELD_LABELS[field]} is ${displayValue}（点击切换）`}
        onClick={onEdit}
      >
        {body}
      </button>
    );
  }

  return (
    <span className={className} title={`${PERFORMANCE_FILTER_FIELD_LABELS[field]} is ${displayValue}`}>
      {body}
    </span>
  );
}

function FilterPopover({
  filters,
  filterOptions,
  initialField,
  title,
  onApply,
  onClose,
}: {
  filters: PerformanceFilterState;
  filterOptions: PerformanceFilterOptionsContext;
  initialField: PerformanceFilterField;
  title: string;
  onApply: (field: PerformanceFilterField, value: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const fieldChoices =
    initialField === 'project_id'
      ? (['project_id'] as PerformanceFilterField[])
      : getAvailablePerformanceAddFields(filters);
  const [field, setField] = useState<PerformanceFilterField>(
    fieldChoices.includes(initialField) ? initialField : (fieldChoices[0] ?? initialField),
  );
  const effectiveField = fieldChoices.includes(field) ? field : (fieldChoices[0] ?? field);
  const valueOptions = getPerformanceFilterValueOptions(effectiveField, filterOptions);
  const currentValue = filters[effectiveField];
  const [value, setValue] = useState(currentValue || (valueOptions[0]?.value ?? ''));

  useEffect(() => {
    const options = getPerformanceFilterValueOptions(effectiveField, filterOptions);
    const existing = filters[effectiveField];
    setValue(existing || (options[0]?.value ?? ''));
  }, [effectiveField, filterOptions, filters]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [onClose]);

  function submit() {
    if (!value) return;
    onApply(effectiveField, value);
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full z-20 mt-1 w-64 rounded border border-[var(--sg-border)] bg-[var(--sg-surface)] p-3 shadow-lg"
      role="dialog"
      aria-label={title}
    >
      <p className="mb-2 text-xs font-semibold text-[var(--sg-text)]">{title}</p>
      {fieldChoices.length === 0 ? (
        <p className="text-xs text-[var(--sg-text-muted)]">所有字段均已添加筛选</p>
      ) : (
        <div className="space-y-2">
          {fieldChoices.length > 1 && (
            <label className="block text-[10px] text-[var(--sg-text-muted)]">
              字段
              <Select
                className="mt-0.5"
                value={effectiveField}
                onChange={(e) => setField(e.target.value as PerformanceFilterField)}
              >
                {fieldChoices.map((f) => (
                  <option key={f} value={f}>
                    {PERFORMANCE_FILTER_FIELD_LABELS[f]}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <label className="block text-[10px] text-[var(--sg-text-muted)]">
            运算符
            <Select className="mt-0.5" value="is" disabled>
              <option value="is">is</option>
            </Select>
          </label>
          <label className="block text-[10px] text-[var(--sg-text-muted)]">
            值
            {valueOptions.length > 0 ? (
              <Select className="mt-0.5" value={value} onChange={(e) => setValue(e.target.value)}>
                {valueOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="mt-1 rounded border border-dashed border-[var(--sg-border)] px-2 py-1.5 text-xs text-[var(--sg-text-muted)]">
                暂无可用值（请先上报性能事务）
              </p>
            )}
          </label>
          <div className="flex justify-end gap-1 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={!value} onClick={submit}>
              确定
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Kibana-style performance filter pills (project + metric).
 * Kibana 风格的性能筛选 pill 栏。
 */
export function PerformanceFilterBar({ filters, onFiltersChange, filterOptions }: Props) {
  const [popover, setPopover] = useState<'add' | 'project' | null>(null);
  const active = getActivePerformanceFilters(filters);
  const hasOptional = Boolean(filters.metric);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      {active.map((item) => (
        <div key={item.field} className="relative">
          <FilterPill
            field={item.field}
            displayValue={formatPerformanceFilterValue(item.field, item.value, filterOptions)}
            removable={item.removable !== false}
            onRemove={() => onFiltersChange(clearPerformanceFilter(filters, item.field))}
            onEdit={
              item.field === 'project_id'
                ? () => setPopover((v) => (v === 'project' ? null : 'project'))
                : undefined
            }
          />
          {popover === 'project' && item.field === 'project_id' && (
            <FilterPopover
              filters={filters}
              filterOptions={filterOptions}
              initialField="project_id"
              title="切换项目"
              onApply={(field, value) => onFiltersChange(setPerformanceFilter(filters, field, value))}
              onClose={() => setPopover(null)}
            />
          )}
        </div>
      ))}

      <div className="relative">
        <Button
          type="button"
          variant="default"
          size="sm"
          className="!border-dashed"
          onClick={() => setPopover((v) => (v === 'add' ? null : 'add'))}
          aria-expanded={popover === 'add'}
        >
          + 添加筛选
        </Button>
        {popover === 'add' && (
          <FilterPopover
            filters={filters}
            filterOptions={filterOptions}
            initialField="metric"
            title="添加筛选"
            onApply={(field, value) => onFiltersChange(setPerformanceFilter(filters, field, value))}
            onClose={() => setPopover(null)}
          />
        )}
      </div>

      {hasOptional && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange(clearAllPerformanceFilters(filters))}
        >
          清除全部
        </Button>
      )}
    </div>
  );
}
