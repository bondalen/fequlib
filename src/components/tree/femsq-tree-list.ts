/**
 * Строка FemsqTreeList: отступ, ячейка, кнопка раскрытия.
 * Ключ / дети / leaf — в femsq-tree.ts. Без доменных типов FEMSQ.
 */

import { isLeaf, type FemsqTreeNodeBase } from './femsq-tree';

/**
 * `table` / `edge` — по `kind` узла.
 * Любая другая строка — метка ветви: ячейка непустая только при `node.level === level`.
 */
export type FemsqTreeListLevel = string;

/** Зарезервированные значения `column.level`: не метки ветви. */
export type FemsqTreeListStructuralLevel = 'table' | 'edge';

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
   * Если задан — ячейка непустая только на этом уровне.
   * `table` / `edge` смотрят на `kind`. Иная строка — на `node.level`.
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
 * `record` → `table`, `folder` → `edge`.
 * Метку ветви (`node.level`) эта функция не читает.
 */
export function walkNodeLevel(node: FemsqTreeNodeBase): FemsqTreeListStructuralLevel | undefined {
  if (node.kind === 'folder') {
    return 'edge';
  }
  if (node.kind === 'record') {
    return 'table';
  }
  return undefined;
}

/**
 * Совпадает ли узел с `column.level`.
 * Нет level — да. `table` / `edge` — по `kind`. Иная строка — строгое равенство с `node.level`.
 */
export function treeListLevelMatches(node: FemsqTreeNodeBase, level: string | undefined | null): boolean {
  if (level == null || level === '') {
    return true;
  }
  if (level === 'table' || level === 'edge') {
    return walkNodeLevel(node) === level;
  }
  return node.level === level;
}

/**
 * Текст ячейки. Пусто, если поля нет, значение null/'' или уровень колонки не совпал.
 */
export function treeListCellText<Node extends FemsqTreeNodeBase>(
  node: Node,
  column: FemsqTreeListColumn<Node>
): string {
  if (!treeListLevelMatches(node, column.level)) {
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
