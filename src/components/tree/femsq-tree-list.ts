/**
 * Строка FemsqTreeList: отступ, ячейка, кнопка раскрытия.
 * Ключ / дети / leaf — в femsq-tree.ts. Без доменных типов FEMSQ.
 */

import { isLeaf, type FemsqTreeNodeBase } from './femsq-tree';

/** Уровень узла обходчика, на котором колонка заполняется. */
export type FemsqTreeListLevel = 'table' | 'edge';

export interface FemsqTreeListColumn<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  /** Стабильное имя колонки (ключ в шапке и строке). */
  name: string;
  /** Подпись в шапке. */
  label: string;
  /** Поле узла. Нет поля — ячейка пустая. */
  field: string;
  align?: 'left' | 'right' | 'center';
  /** Ширина трека CSS grid. По умолчанию `minmax(0, 1fr)`. */
  width?: string;
  /**
   * Формат ячейки. Нет функции — `String(value)` для непустого значения.
   */
  format?: (value: unknown, node: Node) => string;
  /**
   * Если задан — ячейка непустая только у узла этого уровня
   * (`kind: 'record'` → `table`, `kind: 'folder'` → `edge`).
   */
  level?: FemsqTreeListLevel;
}

/**
 * Сдвиг первой колонки: глубина × шаг indent (px).
 * Корень (depth 0) не сдвигается.
 */
export function treeListRowIndentPx(depth: number, indent: number): number {
  const safeDepth = Number.isFinite(depth) && depth > 0 ? Math.floor(depth) : 0;
  const step = Number.isFinite(indent) && indent > 0 ? indent : 0;
  return safeDepth * step;
}

/**
 * Кнопка раскрытия есть у не-листа. Лист занимает ту же ширину слота без кнопки.
 */
export function treeListShowsToggle<Node extends FemsqTreeNodeBase>(
  node: Node,
  leafKey = 'leaf'
): boolean {
  return !isLeaf(node, leafKey);
}

/**
 * `record` / table — строка записи. `folder` — узел ребра.
 * Без `kind` уровень неизвестен: колонка с `level` остаётся пустой.
 */
export function walkNodeLevel(node: FemsqTreeNodeBase): FemsqTreeListLevel | undefined {
  if (node.kind === 'folder') {
    return 'edge';
  }
  if (node.kind === 'record') {
    return 'table';
  }
  return undefined;
}

/**
 * Текст ячейки. Пусто, если поля нет, значение null/'' или уровень колонки не совпал.
 */
export function treeListCellText<Node extends FemsqTreeNodeBase>(
  node: Node,
  column: FemsqTreeListColumn<Node>
): string {
  if (column.level && walkNodeLevel(node) !== column.level) {
    return '';
  }
  const value = node[column.field];
  if (value == null || value === '') {
    return '';
  }
  if (typeof column.format === 'function') {
    return String(column.format(value, node) ?? '');
  }
  return String(value);
}

/**
 * Треки шапки и строк. Колонка действий — последняя, только если хост дал слот.
 */
export function treeListColumnTracks(
  columns: readonly { width?: string }[],
  hasActions: boolean
): string {
  const tracks = columns.map((column) => column.width || 'minmax(0, 1fr)');
  if (hasActions) {
    tracks.push('max-content');
  }
  if (tracks.length === 0) {
    return 'minmax(0, 1fr)';
  }
  return tracks.join(' ');
}
