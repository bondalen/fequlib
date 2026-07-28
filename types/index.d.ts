/** Публичные типы fequlib (без runtime-импорта vue/quasar — peerDeps у потребителей). */

/**
 * Базовый тип строки. `any` в значении — чтобы DTO-интерфейсы без index signature
 * принимались без `as unknown as Record<string, unknown>`.
 */
export type FemsqTableRowBase = Record<string, any>;

export type FemsqTableMode = 'client' | 'server';

export interface FemsqTableRequest {
  filter: string;
  /** Текстовые фильтры по имени колонки (AND с `filter`). Опционально, фаза B. */
  columnFilters?: Record<string, string>;
  sortBy: string | null;
  descending: boolean;
  page: number;
  rowsPerPage: number;
}

export interface FemsqTableColumn<Row extends FemsqTableRowBase = FemsqTableRowBase> {
  name: string;
  label: string;
  field: string | ((row: Row) => unknown);
  required?: boolean;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sort?: (a: unknown, b: unknown, rowA: Row, rowB: Row) => number;
  style?: string | ((row: Row) => string);
  classes?: string | ((row: Row) => string);
  headerStyle?: string;
  headerClasses?: string;
  format?: (value: unknown, row: Row) => string;
  /** Участвует ли колонка в глобальном фильтре (по умолчанию true). */
  filterable?: boolean;
  /**
   * Текст для фильтра при кастомном #body-cell-* слоте.
   */
  filterValue?: (row: Row) => string;
}

/**
 * Пропсы FemsqTable. `columns` через `any` в параметре Row, чтобы
 * `FemsqTableColumn<YourDto>[]` принимался без кастов (иначе invariance).
 */
export interface FemsqTableProps<Row extends FemsqTableRowBase = FemsqTableRowBase> {
  rows: readonly Row[];
  columns: ReadonlyArray<FemsqTableColumn<Row> | FemsqTableColumn<FemsqTableRowBase>>;
  mode?: FemsqTableMode;
  filter?: string;
  columnFilters?: Record<string, string>;
  showFilter?: boolean;
  showColumnFilters?: boolean;
  columnFilterPlaceholder?: string;
  showFilterCount?: boolean;
  filterLabel?: string;
  filterIcon?: string;
  filterTestId?: string;
  rootClass?: string;
  pagination?: {
    sortBy?: string | null;
    descending?: boolean;
    page?: number;
    rowsPerPage?: number;
    rowsNumber?: number;
  };
}

/**
 * Generic-friendly декларация: Row выводится из `rows`.
 * Доп. attrs QTable (row-key, loading, selection, …) допустимы через пересечение.
 */
export declare const FemsqTable: <Row extends FemsqTableRowBase = FemsqTableRowBase>(
  props: FemsqTableProps<Row> & Record<string, unknown>
) => any;

export declare function columnFieldValue<Row extends FemsqTableRowBase>(
  row: Row,
  col: FemsqTableColumn<Row>
): unknown;

export declare function cellText<Row extends FemsqTableRowBase>(
  row: Row,
  col: FemsqTableColumn<Row>
): string;

export declare function columnFilterText<Row extends FemsqTableRowBase>(
  row: Row,
  col: FemsqTableColumn<Row>
): string;

export declare function actionsColumn<Row extends FemsqTableRowBase = FemsqTableRowBase>(
  partial?: Partial<FemsqTableColumn<Row>>
): FemsqTableColumn<Row>;

export declare function sortComparable(value: unknown): {
  kind: 'null' | 'number' | 'date' | 'string';
  number?: number;
  string?: string;
};

export declare function compareCellValues(a: unknown, b: unknown): number;

export declare function rowMatchesFilter<Row extends FemsqTableRowBase>(
  row: Row,
  columns: FemsqTableColumn<Row>[],
  filter: string
): boolean;

export declare function rowMatchesColumnFilters<Row extends FemsqTableRowBase>(
  row: Row,
  columns: FemsqTableColumn<Row>[],
  columnFilters: Record<string, string> | undefined | null
): boolean;

export declare function rowMatchesAllFilters<Row extends FemsqTableRowBase>(
  row: Row,
  columns: FemsqTableColumn<Row>[],
  filter: string,
  columnFilters?: Record<string, string> | null
): boolean;

export declare function normalizeColumnFilters(
  columnFilters: Record<string, string> | undefined | null
): Record<string, string> | undefined;

export {};
