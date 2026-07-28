/** Публичные типы fequlib (без импорта vue/quasar — потребители резолвят peerDeps сами). */

export type FemsqTableMode = 'client' | 'server';

export interface FemsqTableRequest {
  filter: string;
  sortBy: string | null;
  descending: boolean;
  page: number;
  rowsPerPage: number;
}

export interface FemsqTableColumn<Row extends Record<string, unknown> = Record<string, unknown>> {
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

export declare function columnFieldValue<Row extends Record<string, unknown>>(
  row: Row,
  col: FemsqTableColumn<Row>
): unknown;

export declare function cellText<Row extends Record<string, unknown>>(
  row: Row,
  col: FemsqTableColumn<Row>
): string;

export declare function columnFilterText<Row extends Record<string, unknown>>(
  row: Row,
  col: FemsqTableColumn<Row>
): string;

export declare function actionsColumn<Row extends Record<string, unknown> = Record<string, unknown>>(
  partial?: Partial<FemsqTableColumn<Row>>
): FemsqTableColumn<Row>;

export declare function sortComparable(value: unknown): {
  kind: 'null' | 'number' | 'date' | 'string';
  number?: number;
  string?: string;
};

export declare function compareCellValues(a: unknown, b: unknown): number;

export declare function rowMatchesFilter<Row extends Record<string, unknown>>(
  row: Row,
  columns: FemsqTableColumn<Row>[],
  filter: string
): boolean;

/** Vue SFC-компонент; пропсы см. README / исходник FemsqTable.vue. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export declare const FemsqTable: any;

export {};
