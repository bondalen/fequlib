/**
 * Представление JSON-обходчика: outline (как v1) или list.
 * fetchNode / fetchExpand остаются колбэками хоста — здесь их нет.
 * Экраны без поля view остаются outline.
 */

import type { FemsqTreeNodeBase } from './femsq-tree';
import {
  type FemsqTreeListColumn,
  type FemsqTreeListLevel
} from './femsq-tree-list';

export type FemsqWalkView = 'outline' | 'list';

/** Колонка в JSON экземпляра. Функций форматирования в JSON нет. */
export interface FemsqWalkListColumn {
  label: string;
  /** Имя поля узла. */
  field: string;
  /**
   * Уровень, на котором колонка заполняется.
   * Нет поля — ячейка пустая на любом узле, если значения нет.
   */
  level?: FemsqTreeListLevel;
}

export interface FemsqWalkSpecView {
  view?: FemsqWalkView | null;
  columns?: FemsqWalkListColumn[];
}

/**
 * Нет поля, `outline` и любое другое значение — outline.
 * `list` переключает только явный JSON.
 */
export function resolveWalkView(view: unknown): FemsqWalkView {
  return view === 'list' ? 'list' : 'outline';
}

export function usesWalkList(spec: { view?: unknown } | null | undefined): boolean {
  return resolveWalkView(spec?.view) === 'list';
}

/**
 * Колонки JSON → колонки FemsqTreeList. Имена уникальны, даже если field повторён.
 */
export function walkColumnsToTreeList(
  columns: readonly FemsqWalkListColumn[] | undefined | null
): FemsqTreeListColumn[] {
  return (columns ?? []).map((column, index) => ({
    name: `${column.field || 'col'}-${index}`,
    label: column.label,
    field: column.field,
    level: column.level
  }));
}

/**
 * Кладёт на узел только те поля строки, которые колонки list вообще читают.
 * Несоответствие уровня по-прежнему гасит ячейку в treeListCellText.
 * Поля outline (`title`, карточка) не затираются.
 */
export function assignWalkListFields<Node extends FemsqTreeNodeBase>(
  node: Node,
  fields: Record<string, string | null | undefined>,
  columns: readonly FemsqWalkListColumn[]
): Node {
  const next: FemsqTreeNodeBase = { ...node };
  for (const column of columns) {
    if (!column.field) {
      continue;
    }
    const raw = fields[column.field];
    if (raw == null || raw === '') {
      continue;
    }
    next[column.field] = raw;
  }
  return next as Node;
}
