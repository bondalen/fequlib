import type { QTableColumn } from 'quasar';

/**
 * Режим работы FemsqTable: client — фильтр/сортировка на клиенте;
 * server — данные готовит родитель, компонент эмитит @request.
 */
export type FemsqTableMode = 'client' | 'server';

/**
 * Параметры запроса (filter/sort/page) — контракт для mode=server и резерв для client.
 */
export interface FemsqTableRequest {
  filter: string;
  sortBy: string | null;
  descending: boolean;
  page: number;
  rowsPerPage: number;
}

/**
 * Колонка FemsqTable: расширяет QTableColumn полями фильтрации.
 */
export type FemsqTableColumn<Row extends Record<string, unknown> = Record<string, unknown>> =
  QTableColumn<Row> & {
    /** Участвует ли колонка в глобальном фильтре (по умолчанию true). */
    filterable?: boolean;
    /**
     * Текст для фильтра, если ячейка рисуется через #body-cell-* и стандартный
     * cellText не отражает смысл (иконки/кнопки).
     */
    filterValue?: (row: Row) => string;
  };

/**
 * Значение поля колонки (как у QTable: field string | function).
 */
export function columnFieldValue<Row extends Record<string, unknown>>(
  row: Row,
  col: FemsqTableColumn<Row>
): unknown {
  const field = col.field;
  if (typeof field === 'function') {
    return field(row);
  }
  if (typeof field === 'string' && field.length > 0) {
    return row[field];
  }
  return row[col.name as keyof Row];
}

/**
 * Текст ячейки для фильтра/отображения: format(value, row) либо String(value ?? '').
 */
export function cellText<Row extends Record<string, unknown>>(
  row: Row,
  col: FemsqTableColumn<Row>
): string {
  const value = columnFieldValue(row, col);
  if (typeof col.format === 'function') {
    return String(col.format(value, row) ?? '');
  }
  return value == null ? '' : String(value);
}

/**
 * Текст, по которому колонка участвует в глобальном поиске.
 */
export function columnFilterText<Row extends Record<string, unknown>>(
  row: Row,
  col: FemsqTableColumn<Row>
): string {
  if (typeof col.filterValue === 'function') {
    return col.filterValue(row) ?? '';
  }
  return cellText(row, col);
}

/**
 * Хелпер колонки действий: filterable/sortable выключены сразу.
 */
export function actionsColumn<Row extends Record<string, unknown> = Record<string, unknown>>(
  partial: Partial<FemsqTableColumn<Row>> = {}
): FemsqTableColumn<Row> {
  return {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right',
    filterable: false,
    sortable: false,
    ...partial
  };
}

/**
 * Нормализует значение для сортировки: число / дата / строка; null в конце.
 */
export function sortComparable(value: unknown): {
  kind: 'null' | 'number' | 'date' | 'string';
  number?: number;
  string?: string;
} {
  if (value == null || value === '') {
    return { kind: 'null' };
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { kind: 'number', number: value };
  }
  if (typeof value === 'boolean') {
    return { kind: 'number', number: value ? 1 : 0 };
  }
  const asString = String(value).trim();
  if (asString === '') {
    return { kind: 'null' };
  }
  const asNumber = Number(asString.replace(/\s/g, '').replace(',', '.'));
  if (
    asString !== '' &&
    !Number.isNaN(asNumber) &&
    /^-?\d+([.,]\d+)?$/.test(asString.replace(/\s/g, ''))
  ) {
    return { kind: 'number', number: asNumber };
  }
  const asDate = Date.parse(asString);
  if (
    !Number.isNaN(asDate) &&
    (/^\d{4}-\d{2}-\d{2}/.test(asString) || /^\d{2}\.\d{2}\.\d{4}/.test(asString))
  ) {
    return { kind: 'date', number: asDate };
  }
  return { kind: 'string', string: asString.toLowerCase() };
}

/**
 * Компаратор двух значений ячеек с учётом число/дата/null.
 */
export function compareCellValues(a: unknown, b: unknown): number {
  const left = sortComparable(a);
  const right = sortComparable(b);
  if (left.kind === 'null' && right.kind === 'null') {
    return 0;
  }
  if (left.kind === 'null') {
    return 1;
  }
  if (right.kind === 'null') {
    return -1;
  }
  if (
    (left.kind === 'number' || left.kind === 'date') &&
    (right.kind === 'number' || right.kind === 'date')
  ) {
    return (left.number ?? 0) - (right.number ?? 0);
  }
  return (left.string ?? '').localeCompare(right.string ?? '', 'ru', { sensitivity: 'base' });
}

/**
 * Строка проходит глобальный фильтр, если needle пустой или найден в filterable-колонках.
 */
export function rowMatchesFilter<Row extends Record<string, unknown>>(
  row: Row,
  columns: FemsqTableColumn<Row>[],
  filter: string
): boolean {
  const needle = filter.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return columns.some((col) => {
    if (col.filterable === false) {
      return false;
    }
    return columnFilterText(row, col).toLowerCase().includes(needle);
  });
}
