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
  /** Семантика значения: `money` → ru-RU формат суммы в cellText. */
  valueKind?: 'money';
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
  /**
   * Fill parent height; scroll body in `.q-table__middle`. Default false.
   * Slice of registry **0012** (viewport containment in flex/splitter).
   */
  fill?: boolean;
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

export declare function moneyColumn<Row extends FemsqTableRowBase = FemsqTableRowBase>(
  partial: Partial<FemsqTableColumn<Row>> & Pick<FemsqTableColumn<Row>, 'name' | 'label' | 'field'>
): FemsqTableColumn<Row>;

export interface FormatMoneyOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  currencySuffix?: string;
}

export declare function formatMoney(value: unknown, options?: FormatMoneyOptions): string;

export declare function formatMoneyOrDash(value: unknown, options?: FormatMoneyOptions): string;

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

export type FemsqTreeNodeBase = Record<string, any>;

export type FemsqTreeKey = string | number;

export type FemsqTreeNodeKey<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> =
  | string
  | ((node: Node) => FemsqTreeKey);

export type FemsqTreeLoadReason = 'expand' | 'retry';

export interface FemsqTreeLoadPayload<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  node: Node;
  key: FemsqTreeKey;
  reason: FemsqTreeLoadReason;
}

export interface FemsqTreeProps<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  nodes: readonly Node[];
  nodeKey: FemsqTreeNodeKey<Node>;
  childrenKey?: string;
  leafKey?: string;
  expandedKeys?: FemsqTreeKey[];
  selectedKey?: FemsqTreeKey | null;
  loadingKeys?: FemsqTreeKey[];
  indent?: number;
  expandOnClick?: boolean;
  selectable?: boolean;
  lazy?: boolean;
  rootClass?: string;
  /**
   * Fill parent height; scroll outline in `.femsq-tree__nodes` (incl. `#detail`).
   * Default false. Same contract as FemsqTable `fill` (slice of **0012**).
   */
  fill?: boolean;
}

export declare const FemsqTree: <Node extends FemsqTreeNodeBase = FemsqTreeNodeBase>(
  props: FemsqTreeProps<Node> & Record<string, unknown>
) => any;

export declare function getNodeKey<Node extends FemsqTreeNodeBase>(
  node: Node,
  nodeKey: FemsqTreeNodeKey<Node>
): FemsqTreeKey;

export declare function getChildren<Node extends FemsqTreeNodeBase>(
  node: Node,
  childrenKey?: string
): Node[] | undefined;

export declare function isLeaf<Node extends FemsqTreeNodeBase>(node: Node, leafKey?: string): boolean;

export declare function shouldLoad<Node extends FemsqTreeNodeBase>(
  node: Node,
  lazy: boolean,
  childrenKey?: string,
  leafKey?: string
): boolean;

export declare function getLoadReason(alreadyRequested: boolean): FemsqTreeLoadReason;

/** Метка ветви или зарезервированные `table` / `edge`. */
export type FemsqTreeListLevel = string;

export type FemsqTreeListStructuralLevel = 'table' | 'edge';

export interface FemsqTreeListColumn<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  name: string;
  label: string;
  field: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  format?: (value: unknown, node: Node) => string;
  /**
   * Нет значения — поле на любом узле.
   * `table` / `edge` — по `kind`. Иная строка — только если `node.level` равен ей.
   */
  level?: FemsqTreeListLevel;
}

export interface FemsqTreeListProps<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  nodes: readonly Node[];
  nodeKey: FemsqTreeNodeKey<Node>;
  columns?: FemsqTreeListColumn<Node>[];
  /** Absent — sticky header from `columns`. Present — per-branch sets, track count is the widest set. */
  columnSets?: FemsqTreeListColumnSet<Node>[];
  childrenKey?: string;
  leafKey?: string;
  expandedKeys?: FemsqTreeKey[];
  selectedKey?: FemsqTreeKey | null;
  loadingKeys?: FemsqTreeKey[];
  indent?: number;
  expandOnClick?: boolean;
  selectable?: boolean;
  lazy?: boolean;
  rootClass?: string;
  /** Fill parent height; scroll in `.femsq-tree-list__scroll`, sticky header. */
  fill?: boolean;
}

export declare const FemsqTreeList: <Node extends FemsqTreeNodeBase = FemsqTreeNodeBase>(
  props: FemsqTreeListProps<Node> & Record<string, unknown>
) => any;

export declare function treeListRowIndentPx(depth: number, indent: number): number;

export declare function treeListShowsToggle<Node extends FemsqTreeNodeBase>(
  node: Node,
  leafKey?: string
): boolean;

export declare function walkNodeLevel(node: FemsqTreeNodeBase): FemsqTreeListStructuralLevel | undefined;

export declare function treeListLevelMatches(
  node: FemsqTreeNodeBase,
  level: string | undefined | null
): boolean;

export declare function treeListCellText<Node extends FemsqTreeNodeBase>(
  node: Node,
  column: FemsqTreeListColumn<Node>
): string;

export declare function treeListColumnTracks(
  columns: readonly { width?: string }[],
  hasActions: boolean
): string;

export declare const TREE_LIST_DEFAULT_INDENT: number;
export declare const TREE_LIST_DATA_COL_MIN_PX: number;
export declare const TREE_LIST_TOGGLE_MIN_PX: number;
export declare const TREE_LIST_LABEL_MIN_PX: number;
export declare const TREE_LIST_TOGGLE_DEFAULT_PX: number;
export declare const TREE_LIST_LABEL_DEFAULT_PX: number;

export declare function treeListDataTrackCount(trackCount: number): number;

export declare function treeListParseWidthPx(width: string | undefined, fallback: number): number;

export declare function treeListInitialDataWidths(
  columns: readonly { width?: string }[],
  dataTrackCount: number,
  minPx?: number
): number[];

export declare function treeListDataColumnsTemplate(
  widths: readonly number[],
  hasActions: boolean
): string;

export declare function treeListDataColumnsMinWidthPx(
  widths: readonly number[],
  hasActions: boolean
): number;

export interface FemsqTreeListColumnSet<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  level: string;
  columns: FemsqTreeListColumn<Node>[];
}

export declare function treeListSetTrackCount(
  sets: readonly { columns: readonly unknown[] }[] | undefined | null
): number;

export declare function treeListSetLabels(
  set: { columns: readonly { label: string }[] } | undefined,
  trackCount: number
): string[];

export declare function treeListSetForNode<Node extends FemsqTreeNodeBase>(
  node: Node,
  sets: readonly FemsqTreeListColumnSet<Node>[] | undefined | null
): FemsqTreeListColumnSet<Node> | undefined;

export declare function treeListSetLevel<Node extends FemsqTreeNodeBase>(
  node: Node,
  sets: readonly FemsqTreeListColumnSet<Node>[] | undefined | null
): string | undefined;

export declare function treeListGroupCaptionFlags(
  levels: readonly (string | undefined | null)[]
): boolean[];

export declare function treeListFolderShowsSetLabels(
  node: FemsqTreeNodeBase,
  trackIndex: number
): boolean;

export declare function treeListSetCellText(
  node: FemsqTreeNodeBase,
  set: FemsqTreeListColumnSet | undefined,
  trackIndex: number
): string;

export type FemsqWalkView = 'outline' | 'list';

export interface FemsqWalkListColumn {
  label: string;
  field: string;
  level?: FemsqTreeListLevel;
}

export interface FemsqWalkSpecView {
  view?: FemsqWalkView | null;
  columns?: FemsqWalkListColumn[];
}

export declare function resolveWalkView(view: unknown): FemsqWalkView;

export declare function usesWalkList(spec: { view?: unknown } | null | undefined): boolean;

export declare function walkColumnsToTreeList(
  columns: readonly FemsqWalkListColumn[] | undefined | null
): FemsqTreeListColumn[];

export declare function assignWalkListFields<Node extends FemsqTreeNodeBase>(
  node: Node,
  fields: Record<string, string | null | undefined>,
  columns: readonly FemsqWalkListColumn[]
): Node;

export type FemsqWalkCard = 'N:1' | '1:1' | '1:N';

export type FemsqWalkValueKind = 'money';

export type FemsqWalkValueKinds = Record<string, FemsqWalkValueKind>;

export interface FemsqWalkActionSpec {
  id: string;
  kind:
    | 'create-child'
    | 'link-related'
    | 'unlink-related'
    | 'open-form'
    | 'navigate'
    | 'delete-record';
  label: string;
  icon?: string;
  scope?: 'record' | 'folder' | 'both';
  modal?: 'record' | 'none';
  form?: string;
  visibleWhen?: {
    nodeKind?: 'record' | 'folder';
    edge?: string;
    table?: string;
  };
}

export interface FemsqWalkChildSpec {
  edge?: string;
  queryId?: string;
  to: string;
  card: FemsqWalkCard;
  folder?: string;
  title: string[];
  detail: string[] | '*';
  valueKinds?: FemsqWalkValueKinds;
  actions?: FemsqWalkActionSpec[];
  children: FemsqWalkChildSpec[];
  level?: string;
}

export interface FemsqWalkColumnSet {
  level: string;
  columns: FemsqWalkListColumn[];
}

export interface FemsqWalkTreeSpec {
  id: string;
  version: number;
  root: { table: string; pk: string; queryId?: string; level?: string };
  title: string[];
  detail: string[] | '*';
  valueKinds?: FemsqWalkValueKinds;
  view?: FemsqWalkView;
  columns?: FemsqWalkListColumn[];
  columnSets?: FemsqWalkColumnSet[];
  actions?: FemsqWalkActionSpec[];
  children: FemsqWalkChildSpec[];
}

export interface FemsqWalkField {
  label: string;
  value: string;
}

export interface FemsqWalkFetchRow {
  key: number;
  fields: Array<{ name: string; value: string | null }>;
}

export type FemsqWalkFetchNode = (table: string, id: number) => Promise<FemsqWalkFetchRow | null>;

export type FemsqWalkFetchExpand = (edge: string, fromId: number) => Promise<FemsqWalkFetchRow[]>;

export type FemsqWalkFetchQuery = (queryId: string, fromId: number) => Promise<FemsqWalkFetchRow[]>;

export type FemsqWalkFetchRoots = (queryId: string) => Promise<FemsqWalkFetchRow[]>;

export interface FemsqWalkNode extends FemsqTreeNodeBase {
  id: string;
  kind: 'record' | 'folder';
  title: string;
  fields: FemsqWalkField[];
  actions?: FemsqWalkActionSpec[];
  children?: FemsqWalkNode[];
  leaf?: boolean;
  table?: string;
  rowKey?: number;
  childSpecs?: FemsqWalkChildSpec[];
  edge?: string;
  queryId?: string;
  fromId?: number;
  folderSpec?: FemsqWalkChildSpec;
  level?: string;
}

export interface FemsqWalkActionContext {
  actionId: string;
  root: { table: string; id: number | null };
  node: {
    kind: 'record' | 'folder';
    table: string | null;
    edge: string | null;
    fromId: number | null;
    rowKey: number | null;
    title: string;
    fields: Record<string, string | null>;
  };
}

export declare function walkUsesForest(
  spec: Pick<FemsqWalkTreeSpec, 'root'>,
  rootId: number | null | undefined,
  fetchRoots: FemsqWalkFetchRoots | undefined
): boolean;

export declare function walkReloadToken(
  spec: Pick<FemsqWalkTreeSpec, 'root'>,
  rootId: number | null | undefined,
  rootsToken: string | undefined,
  fetchRoots: FemsqWalkFetchRoots | undefined
): string;

export declare function walkListUsesColumnSets(spec: FemsqWalkTreeSpec): boolean;

export declare function walkListColumnSetsOf(spec: FemsqWalkTreeSpec): FemsqTreeListColumnSet[] | undefined;

export declare function walkFlatListColumns(spec: FemsqWalkTreeSpec): FemsqWalkListColumn[] | undefined;

export declare function walkTreeListColumns(spec: FemsqWalkTreeSpec): FemsqTreeListColumn[];

export declare function buildWalkRecordNode(
  table: string,
  rowKey: number,
  fields: Record<string, string | null>,
  spec: Pick<FemsqWalkChildSpec, 'title' | 'detail' | 'children' | 'actions' | 'valueKinds' | 'level'>,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode;

export declare function buildWalkFolderNode(
  parentId: string,
  fromId: number,
  spec: FemsqWalkChildSpec,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode;

export declare function walkChildrenAfterRecordLoad(
  parent: FemsqWalkNode,
  loaded: Record<string, Array<{ key: number; fields: Record<string, string | null> }>>,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode[];

export declare function walkChildrenAfterFolderLoad(
  folder: FemsqWalkNode,
  rows: Array<{ key: number; fields: Record<string, string | null> }>,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode[];

export declare function createWalkActionContext(
  rootTable: string,
  rootId: number | null,
  node: FemsqWalkNode,
  action: FemsqWalkActionSpec
): FemsqWalkActionContext;

export declare const FemsqWalkTree: (props: {
  spec: FemsqWalkTreeSpec;
  rootId?: number | null;
  rootsToken?: string;
  fetchNode: FemsqWalkFetchNode;
  fetchExpand: FemsqWalkFetchExpand;
  fetchQuery?: FemsqWalkFetchQuery;
  fetchRoots?: FemsqWalkFetchRoots;
  rootClass?: string;
  dataTest?: string;
} & Record<string, unknown>) => any;

export type ChartKind = 'line' | 'bar' | 'combo';
export type ChartXType = 'time' | 'category';

export interface ChartPoint {
  x: string | number;
  y: number;
}

export interface ChartSeriesSpec {
  id: string;
  name: string;
  points: ChartPoint[];
  chartType?: 'line' | 'bar' | 'scatter';
  color?: string;
  symbolSize?: number;
  showLine?: boolean;
  pointLabel?: string;
  pointLabelRotate?: number;
}

export interface ChartMarkerSpec {
  type: 'horizontal' | 'point';
  value: number;
  date?: string;
  label?: string;
  style?: 'dashed' | 'solid';
}

export interface ChartSpec {
  kind: ChartKind;
  title?: string;
  x: { type: ChartXType; label?: string };
  y: { label?: string; format?: 'money' | 'number' };
  series: ChartSeriesSpec[];
  markers?: ChartMarkerSpec[];
  zoomControls?: boolean;
}

export declare const FemsqChart: (
  props: { spec?: ChartSpec | null; fill?: boolean; rootClass?: string; emptyLabel?: string; dataTest?: string } & Record<string, unknown>
) => any;

export declare const CHART_EXCEL_SERIES_COLOR: string;

export declare function buildTimeSeriesChartSpec(
  seriesName: string,
  points: { date: string; value: number }[],
  markers?: ChartMarkerSpec[],
  title?: string
): ChartSpec;

export declare function buildSlotDynamicsChartSpec(
  slotSeriesName: string,
  slotPoints: { date: string; value: number }[],
  excel?: { date: string; value: number } | null,
  title?: string
): ChartSpec;

export declare function zoomInWindow(
  start: number,
  end: number,
  factor?: number
): { start: number; end: number };

export declare function zoomOutWindow(
  start: number,
  end: number,
  factor?: number
): { start: number; end: number };

export declare function formatChartMoney(value: number): string;

export {};
