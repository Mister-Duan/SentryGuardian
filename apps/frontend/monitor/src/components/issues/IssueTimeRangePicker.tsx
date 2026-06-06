import { useEffect, useRef, useState } from 'react';
import { Button, FilterField, Input, Select } from '../ui.js';
import {
  TIME_RANGE_PRESETS,
  createCustomTimeRange,
  createRelativeTimeRange,
  formatTimeRangeLabel,
  isoToDatetimeLocal,
  type IssueTimeRange,
  type TimeRangePreset,
} from '../../lib/issue-time-range.js';

type Props = {
  value: IssueTimeRange;
  onChange: (next: IssueTimeRange) => void;
};

function CustomRangePopover({
  value,
  onApply,
  onClose,
}: {
  value: IssueTimeRange;
  onApply: (next: IssueTimeRange) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [sinceLocal, setSinceLocal] = useState(isoToDatetimeLocal(value.since));
  const [untilLocal, setUntilLocal] = useState(isoToDatetimeLocal(value.until));

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [onClose]);

  const next = createCustomTimeRange(sinceLocal, untilLocal);

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full z-30 mt-1 w-72 rounded border border-[var(--sg-border)] bg-[var(--sg-surface)] p-3 shadow-lg"
      role="dialog"
      aria-label="自定义时间区间"
    >
      <p className="mb-2 text-xs font-semibold text-[var(--sg-text)]">自定义时间区间</p>
      <div className="space-y-2">
        <label className="block text-[10px] text-[var(--sg-text-muted)]">
          开始
          <Input
            type="datetime-local"
            className="mt-0.5"
            value={sinceLocal}
            onChange={(e) => setSinceLocal(e.target.value)}
          />
        </label>
        <label className="block text-[10px] text-[var(--sg-text-muted)]">
          结束
          <Input
            type="datetime-local"
            className="mt-0.5"
            value={untilLocal}
            onChange={(e) => setUntilLocal(e.target.value)}
          />
        </label>
        {!next && (
          <p className="text-[10px] text-[var(--sg-danger)]">结束时间须晚于开始时间</p>
        )}
        <div className="flex justify-end gap-1 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!next}
            onClick={() => next && onApply(next)}
          >
            应用
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Time range picker with presets and custom interval. 带预设与自定义区间的时间选择器。 */
export function IssueTimeRangePicker({ value, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const selectValue: TimeRangePreset = value.preset;

  return (
    <FilterField label="时间" className="min-w-[140px] max-w-[180px]">
      <div className="relative">
        <Select
          value={selectValue}
          onChange={(e) => {
            const next = e.target.value as TimeRangePreset;
            if (next === 'custom') {
              setCustomOpen(true);
              return;
            }
            onChange(createRelativeTimeRange(next));
            setCustomOpen(false);
          }}
        >
          {TIME_RANGE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">{value.preset === 'custom' ? formatTimeRangeLabel(value) : '自定义…'}</option>
        </Select>
        {customOpen && (
          <CustomRangePopover
            value={value}
            onApply={(next) => {
              onChange(next);
              setCustomOpen(false);
            }}
            onClose={() => setCustomOpen(false)}
          />
        )}
      </div>
    </FilterField>
  );
}
