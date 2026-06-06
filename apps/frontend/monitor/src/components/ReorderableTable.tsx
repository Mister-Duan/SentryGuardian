import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { usePersistedColumnOrder } from '../lib/table-columns.js';
import { Table, TableHead, TableRow } from './ui.js';

/** Default min column width (px). 默认最小列宽（像素）。 */
export const TABLE_COLUMN_MIN_WIDTH_CLASS = 'min-w-[100px]';

/** Column definition for {@link ReorderableTable}. {@link ReorderableTable} 列定义。 */
export type TableColumnDef<T> = {
  /** Stable column id for ordering persistence. 列稳定 id（用于顺序持久化）。 */
  id: string;
  /** Header label. 表头文案。 */
  header: ReactNode;
  /** Optional extra `<th>` class names. 额外表头 class。 */
  headerClassName?: string;
  /** Optional extra `<td>` class names. 额外单元格 class。 */
  cellClassName?: string;
  /** Cell renderer for a row. 行单元格渲染。 */
  render: (row: T) => ReactNode;
  /** When true, column stays fixed and cannot be dragged. 固定列不可拖动。 */
  locked?: boolean;
};

type ReorderableTableProps<T> = {
  /** Unique table id for localStorage key. 表格唯一 id（localStorage 键）。 */
  tableId: string;
  columns: TableColumnDef<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  getRowClassName?: (row: T) => string;
  className?: string;
};

function headerClassName<T>(col: TableColumnDef<T>, draggable: boolean, stateClass: string): string {
  const base = col.locked
    ? 'min-w-0 pb-2'
    : `${TABLE_COLUMN_MIN_WIDTH_CLASS} pb-2 pr-2`;
  return [
    base,
    col.headerClassName ?? '',
    draggable ? 'cursor-grab select-none active:cursor-grabbing' : '',
    stateClass,
  ]
    .filter(Boolean)
    .join(' ');
}

function cellClassName<T>(col: TableColumnDef<T>): string {
  const base = col.locked
    ? 'min-w-0 py-1.5'
    : `${TABLE_COLUMN_MIN_WIDTH_CLASS} py-1.5 pr-2`;
  return [base, col.cellClassName ?? ''].filter(Boolean).join(' ');
}

/**
 * Table with drag-reorderable columns persisted in localStorage.
 * 支持列拖动排序且顺序持久化到 localStorage 的表格。
 *
 * Default column sizing: min-width 100px, no max-width.
 * 默认列宽：最小 100px，不限制最大宽度。
 */
export function ReorderableTable<T>({
  tableId,
  columns,
  rows,
  getRowKey,
  getRowClassName,
  className = '',
}: ReorderableTableProps<T>) {
  const reorderableDefaults = useMemo(
    () => columns.filter((c) => !c.locked).map((c) => c.id),
    [columns],
  );
  const { orderedIds, moveColumn } = usePersistedColumnOrder(tableId, reorderableDefaults);

  const orderedColumns = useMemo(() => {
    const locked = columns.filter((c) => c.locked);
    const byId = new Map(columns.map((c) => [c.id, c]));
    const reorderable = orderedIds.map((id) => byId.get(id)).filter((c): c is TableColumnDef<T> => !!c);
    return [...locked, ...reorderable];
  }, [columns, orderedIds]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  return (
    <Table className={className}>
      <TableHead>
        <tr>
          {orderedColumns.map((col) => {
            const draggable = !col.locked;
            const stateClass =
              dragOverId === col.id
                ? 'bg-[var(--sg-row-hover)]'
                : draggingId === col.id
                  ? 'opacity-50'
                  : '';
            return (
              <th
                key={col.id}
                draggable={draggable}
                onDragStart={
                  draggable
                    ? (e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', col.id);
                        setDraggingId(col.id);
                      }
                    : undefined
                }
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                onDragOver={
                  draggable
                    ? (e) => {
                        e.preventDefault();
                        if (draggingId && draggingId !== col.id) {
                          setDragOverId(col.id);
                        }
                      }
                    : undefined
                }
                onDragLeave={() => {
                  if (dragOverId === col.id) {
                    setDragOverId(null);
                  }
                }}
                onDrop={
                  draggable
                    ? (e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        if (draggedId && draggedId !== col.id) {
                          moveColumn(draggedId, col.id);
                        }
                        setDraggingId(null);
                        setDragOverId(null);
                      }
                    : undefined
                }
                className={headerClassName(col, draggable, stateClass)}
                title={draggable ? '拖动调整列顺序' : undefined}
              >
                {draggable ? (
                  <span className="mr-1 inline-block text-[10px] opacity-40" aria-hidden>
                    ⋮⋮
                  </span>
                ) : null}
                {col.header}
              </th>
            );
          })}
        </tr>
      </TableHead>
      <tbody>
        {rows.map((row) => (
          <TableRow key={getRowKey(row)} className={getRowClassName?.(row) ?? ''}>
            {orderedColumns.map((col) => (
              <td key={col.id} className={cellClassName(col)}>
                {col.render(row)}
              </td>
            ))}
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
