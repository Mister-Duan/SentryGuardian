import { Button } from '../ui.js';
import { UnsupportedNotice } from '../UnsupportedNotice.js';

type Props = {
  selectedCount: number;
  totalOnPage: number;
  onSelectAll: () => void;
  allSelected: boolean;
};

const BULK_ACTIONS = ['解决', '归档', '合并', '设置优先级', '标为已审阅'] as const;

export function IssueBulkBar({ selectedCount, totalOnPage, onSelectAll, allSelected }: Props) {
  return (
    <div className="border-b border-[var(--sg-border)] bg-[var(--sg-content-bg)] px-3 py-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={allSelected && totalOnPage > 0}
            onChange={onSelectAll}
            className="rounded border-[var(--sg-border)]"
          />
          {selectedCount > 0 ? `已选 ${selectedCount}` : '全选'}
        </label>
        {BULK_ACTIONS.map((label) => (
          <Button key={label} type="button" variant="default" size="sm" disabled title="尚未实现">
            {label}
          </Button>
        ))}
      </div>
      {selectedCount > 0 && (
        <div className="mt-1.5">
          <UnsupportedNotice feature="批量操作" compact />
        </div>
      )}
    </div>
  );
}
