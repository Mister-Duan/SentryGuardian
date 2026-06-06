import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_PREFIX = 'sg-table-columns:';

/**
 * Merge persisted column order with the current default set.
 * 将持久化的列顺序与当前默认列集合并。
 */
export function mergeColumnOrder(saved: string[], defaults: string[]): string[] {
  const valid = saved.filter((id) => defaults.includes(id));
  const missing = defaults.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

/**
 * Load column order from localStorage.
 * 从 localStorage 读取列顺序。
 */
export function loadColumnOrder(tableId: string, defaults: string[]): string[] {
  if (typeof localStorage === 'undefined') {
    return defaults;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === 'string')) {
      return defaults;
    }
    return mergeColumnOrder(parsed, defaults);
  } catch {
    return defaults;
  }
}

/**
 * Persist column order to localStorage.
 * 将列顺序写入 localStorage。
 */
export function saveColumnOrder(tableId: string, order: string[]): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(order));
  } catch {
    // Quota or private mode — ignore.
  }
}

/**
 * Reorder a column within a list (move dragged id before drop target).
 * 在列表中重排列（将拖拽列移到目标列之前）。
 */
export function reorderColumns(order: string[], draggedId: string, targetId: string): string[] {
  if (draggedId === targetId) {
    return order;
  }
  const next = order.filter((id) => id !== draggedId);
  const targetIndex = next.indexOf(targetId);
  if (targetIndex < 0) {
    return order;
  }
  next.splice(targetIndex, 0, draggedId);
  return next;
}

/**
 * Hook for persisted reorderable table column ids.
 * 可持久化表格列顺序的 Hook。
 */
export function usePersistedColumnOrder(tableId: string, defaultOrder: string[]) {
  const [order, setOrder] = useState(() => loadColumnOrder(tableId, defaultOrder));

  useEffect(() => {
    setOrder((prev) => mergeColumnOrder(prev, defaultOrder));
  }, [defaultOrder]);

  const moveColumn = useCallback(
    (draggedId: string, targetId: string) => {
      setOrder((prev) => {
        const next = reorderColumns(prev, draggedId, targetId);
        saveColumnOrder(tableId, next);
        return next;
      });
    },
    [tableId],
  );

  const orderedIds = useMemo(() => mergeColumnOrder(order, defaultOrder), [order, defaultOrder]);

  return { orderedIds, moveColumn };
}
