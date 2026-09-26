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

/** Комплект колонок одной ветви. Уровень задаёт комплект, не `column.level`. */
export interface FemsqTreeListColumnSet<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  /** Метка ветви, `node.level`, либо зарезервированные `table` / `edge`. */
  level: string;
  columns: FemsqTreeListColumn<Node>[];
}

/**
 * Число дорожек данных: максимум ширин комплектов, не их сумма.
 * Колонка действий сюда не входит.
 */
export function treeListSetTrackCount(
  sets: readonly { columns: readonly unknown[] }[] | undefined | null
): number {
  if (!sets || sets.length === 0) {
    return 0;
  }
  return sets.reduce((max, set) => Math.max(max, set.columns.length), 0);
}

/**
 * Подписи комплекта по дорожкам. У короткого комплекта справа пустые строки.
 */
export function treeListSetLabels(
  set: { columns: readonly { label: string }[] } | undefined,
  trackCount: number
): string[] {
  const count = Number.isFinite(trackCount) && trackCount > 0 ? Math.floor(trackCount) : 0;
  const labels: string[] = [];
  for (let index = 0; index < count; index += 1) {
    labels.push(set?.columns[index]?.label ?? '');
  }
  return labels;
}

/**
 * Комплект узла. Явный `node.level` важнее `kind`.
 * `table` / `edge` по `kind` — только если метки ветви нет.
 */
export function treeListSetForNode<Node extends FemsqTreeNodeBase>(
  node: Node,
  sets: readonly FemsqTreeListColumnSet<Node>[] | undefined | null
): FemsqTreeListColumnSet<Node> | undefined {
  if (!sets || sets.length === 0) {
    return undefined;
  }
  const explicit = node.level;
  if (typeof explicit === 'string' && explicit !== '') {
    return sets.find((set) => set.level === explicit);
  }
  const structural = walkNodeLevel(node);
  if (!structural) {
    return undefined;
  }
  return sets.find((set) => set.level === structural);
}

/** Уровень комплекта, который рисует узел. Нет комплекта — подписи нет. */
export function treeListSetLevel<Node extends FemsqTreeNodeBase>(
  node: Node,
  sets: readonly FemsqTreeListColumnSet<Node>[] | undefined | null
): string | undefined {
  return treeListSetForNode(node, sets)?.level;
}

/**
 * Перед каким соседом рисовать строку подписей.
 * Оставлено для совместимости тестов: renderer больше не вставляет отдельную линию.
 */
export function treeListGroupCaptionFlags(levels: readonly (string | undefined | null)[]): boolean[] {
  const flags: boolean[] = [];
  let previous: string | undefined;
  let hasPrevious = false;
  for (const level of levels) {
    const current = typeof level === 'string' && level !== '' ? level : undefined;
    if (!current) {
      flags.push(false);
      previous = undefined;
      hasPrevious = false;
      continue;
    }
    flags.push(!hasPrevious || current !== previous);
    previous = current;
    hasPrevious = true;
  }
  return flags;
}

/**
 * Папка в режиме комплектов: дорожки после нулевой показывают `columns[i].label`.
 * Нулевая дорожка остаётся названием группы (значение поля), не «Подпись».
 */
export function treeListFolderShowsSetLabels(node: FemsqTreeNodeBase, trackIndex: number): boolean {
  return node.kind === 'folder' && trackIndex >= 1;
}

/**
 * Текст ячейки при columnSets.
 * Папка: 0 — поле узла; 1…N — подпись колонки комплекта.
 * Запись: только значения полей.
 */
export function treeListSetCellText<Node extends FemsqTreeNodeBase>(
  node: Node,
  set: FemsqTreeListColumnSet<Node> | undefined,
  trackIndex: number
): string {
  const column = set?.columns[trackIndex];
  if (treeListFolderShowsSetLabels(node, trackIndex)) {
    return column?.label ?? '';
  }
  if (!column) {
    return '';
  }
  return treeListCellText(node, { ...column, level: undefined });
}
