/**
 * Сборка узлов FemsqWalkTree. Без GraphQL и без имён таблиц хоста.
 * Один rootId или лес по fetchRoots. Представление list / outline выбирает renderer.
 */

import type { FemsqTreeNodeBase } from './femsq-tree';
import type { FemsqTreeListColumnSet } from './femsq-tree-list';
import { formatMoney } from '../../format/format-money';
import {
  assignWalkListFields,
  usesWalkList,
  walkColumnsToTreeList,
  type FemsqWalkListColumn,
  type FemsqWalkView
} from './femsq-walk-view';

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
  /** Метка ветви. Копируется в node.level. */
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

const MISSING = '—';

export function formatWalkFieldValue(
  name: string,
  raw: string | null | undefined,
  valueKinds?: FemsqWalkValueKinds
): string {
  if (raw == null || raw === '') {
    return MISSING;
  }
  if (valueKinds?.[name] === 'money') {
    const formatted = formatMoney(raw);
    return formatted === '' ? MISSING : formatted;
  }
  return raw;
}

export function walkChildTable(spec: FemsqWalkChildSpec): string {
  if (!spec.to) {
    throw new Error(`JSON ребёнка без to: ${spec.edge ?? spec.queryId}`);
  }
  return spec.to;
}

export function walkChildExpandKey(spec: FemsqWalkChildSpec): string {
  if (spec.queryId) {
    return `query:${spec.queryId}`;
  }
  if (!spec.edge) {
    throw new Error('JSON ребёнка: нужен edge или queryId');
  }
  return spec.edge;
}

export function walkFieldMap(
  fields: Array<{ name: string; value: string | null }>
): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const field of fields) {
    map[field.name] = field.value;
  }
  return map;
}

export function formatWalkTitle(
  columns: string[],
  fields: Record<string, string | null>,
  valueKinds?: FemsqWalkValueKinds
): string {
  return columns.map((column) => formatWalkFieldValue(column, fields[column], valueKinds)).join(' · ');
}

export function formatWalkDetail(
  detail: string[] | '*',
  fields: Record<string, string | null>,
  valueKinds?: FemsqWalkValueKinds
): FemsqWalkField[] {
  const names = detail === '*' ? Object.keys(fields) : detail;
  return names.map((name) => ({
    label: name,
    value: formatWalkFieldValue(name, fields[name], valueKinds)
  }));
}

function filterActions(
  actions: FemsqWalkActionSpec[] | undefined,
  nodeKind: 'record' | 'folder'
): FemsqWalkActionSpec[] | undefined {
  if (!actions?.length) {
    return actions;
  }
  return actions.filter((action) => {
    if (!action.scope || action.scope === 'both') {
      return true;
    }
    return action.scope === nodeKind;
  });
}

function copyLevel(level: string | undefined): string | undefined {
  return typeof level === 'string' && level !== '' ? level : undefined;
}

/**
 * Лес: нет числового корня, у корня JSON есть queryId и хост передал fetchRoots.
 * Числовой rootId всегда сильнее.
 */
export function walkUsesForest(
  spec: Pick<FemsqWalkTreeSpec, 'root'>,
  rootId: number | null | undefined,
  fetchRoots: FemsqWalkFetchRoots | undefined
): boolean {
  if (typeof rootId === 'number') {
    return false;
  }
  const queryId = spec.root.queryId;
  return typeof queryId === 'string' && queryId !== '' && typeof fetchRoots === 'function';
}

/**
 * Ключ пересборки. Лес смотрит на rootsToken целиком и не разбирает его.
 * Числовой корень игнорирует queryId и token.
 */
export function walkReloadToken(
  spec: Pick<FemsqWalkTreeSpec, 'root'>,
  rootId: number | null | undefined,
  rootsToken: string | undefined,
  fetchRoots: FemsqWalkFetchRoots | undefined
): string {
  if (typeof rootId === 'number') {
    return `row:${spec.root.table}:${rootId}`;
  }
  if (!walkUsesForest(spec, rootId, fetchRoots)) {
    return '';
  }
  return `forest:${spec.root.queryId}:${rootsToken ?? ''}`;
}

export function walkListUsesColumnSets(spec: FemsqWalkTreeSpec): boolean {
  return usesWalkList(spec) && (spec.columnSets?.length ?? 0) > 0;
}

export function walkListColumnSetsOf(spec: FemsqWalkTreeSpec): FemsqTreeListColumnSet[] | undefined {
  if (!walkListUsesColumnSets(spec)) {
    return undefined;
  }
  return (spec.columnSets ?? []).map((set) => ({
    level: set.level,
    columns: set.columns.map((column, index) => ({
      name: `${set.level}-${column.field || 'col'}-${index}`,
      label: column.label,
      field: column.field
    }))
  }));
}

export function walkFlatListColumns(spec: FemsqWalkTreeSpec): FemsqWalkListColumn[] | undefined {
  if (!usesWalkList(spec) || walkListUsesColumnSets(spec)) {
    return undefined;
  }
  return spec.columns;
}

function columnsForNode(node: FemsqWalkNode, spec: FemsqWalkTreeSpec): FemsqWalkListColumn[] | undefined {
  if (!usesWalkList(spec)) {
    return undefined;
  }
  if (spec.columnSets?.length) {
    const explicit = copyLevel(node.level);
    if (explicit) {
      return spec.columnSets.find((set) => set.level === explicit)?.columns;
    }
    const structural = node.kind === 'folder' ? 'edge' : node.kind === 'record' ? 'table' : undefined;
    if (!structural) {
      return undefined;
    }
    return spec.columnSets.find((set) => set.level === structural)?.columns;
  }
  return spec.columns;
}

function projectListFields(
  node: FemsqWalkNode,
  rawFields: Record<string, string | null | undefined>,
  spec: FemsqWalkTreeSpec,
  valueKinds?: FemsqWalkValueKinds
): FemsqWalkNode {
  const columns = columnsForNode(node, spec);
  if (!columns?.length) {
    return node;
  }
  const formatted: Record<string, string | null> = {};
  for (const column of columns) {
    if (!column.field) {
      continue;
    }
    const raw = rawFields[column.field];
    if (raw == null || raw === '') {
      continue;
    }
    const value =
      valueKinds?.[column.field] === 'money' ? formatMoney(raw) : raw;
    if (value == null || value === '') {
      continue;
    }
    formatted[column.field] = value;
  }
  return assignWalkListFields(node, formatted, columns);
}

export function buildWalkRecordNode(
  table: string,
  rowKey: number,
  fields: Record<string, string | null>,
  spec: Pick<FemsqWalkChildSpec, 'title' | 'detail' | 'children' | 'actions' | 'valueKinds' | 'level'>,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode {
  const hasChildren = spec.children.length > 0;
  const level = copyLevel(spec.level);
  const node: FemsqWalkNode = {
    id: `${table}:${rowKey}`,
    kind: 'record',
    title: formatWalkTitle(spec.title, fields, spec.valueKinds),
    fields: formatWalkDetail(spec.detail, fields, spec.valueKinds),
    actions: filterActions(spec.actions, 'record'),
    table,
    rowKey,
    childSpecs: spec.children,
    ...(level ? { level } : {}),
    ...(hasChildren ? { children: undefined } : { leaf: true, children: [] })
  };
  return projectListFields(node, fields, treeSpec, spec.valueKinds);
}

export function buildWalkFolderNode(
  parentId: string,
  fromId: number,
  spec: FemsqWalkChildSpec,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode {
  const expandKey = walkChildExpandKey(spec);
  const level = copyLevel(spec.level);
  const node: FemsqWalkNode = {
    id: `${parentId}/${expandKey}`,
    kind: 'folder',
    title: spec.folder || spec.queryId || spec.edge || expandKey,
    fields: [],
    actions: filterActions(spec.actions, 'folder'),
    edge: spec.edge,
    queryId: spec.queryId,
    fromId,
    folderSpec: spec,
    table: walkChildTable(spec),
    children: undefined,
    ...(level ? { level } : {})
  };
  return projectListFields(node, { title: node.title }, treeSpec, spec.valueKinds);
}

export function walkChildrenAfterRecordLoad(
  parent: FemsqWalkNode,
  loaded: Record<string, Array<{ key: number; fields: Record<string, string | null> }>>,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode[] {
  const specs = parent.childSpecs ?? [];
  const out: FemsqWalkNode[] = [];
  for (const spec of specs) {
    if (spec.card === '1:N') {
      if (parent.rowKey == null) {
        continue;
      }
      out.push(buildWalkFolderNode(parent.id, parent.rowKey, spec, treeSpec));
      continue;
    }
    if (!spec.edge) {
      continue;
    }
    const rows = loaded[spec.edge] ?? [];
    const to = walkChildTable(spec);
    for (const row of rows) {
      out.push(buildWalkRecordNode(to, row.key, row.fields, spec, treeSpec));
    }
  }
  return out;
}

export function walkChildrenAfterFolderLoad(
  folder: FemsqWalkNode,
  rows: Array<{ key: number; fields: Record<string, string | null> }>,
  treeSpec: FemsqWalkTreeSpec
): FemsqWalkNode[] {
  const spec = folder.folderSpec;
  if (!spec) {
    return [];
  }
  const to = walkChildTable(spec);
  return rows.map((row) => buildWalkRecordNode(to, row.key, row.fields, spec, treeSpec));
}

export function createWalkActionContext(
  rootTable: string,
  rootId: number | null,
  node: FemsqWalkNode,
  action: FemsqWalkActionSpec
): FemsqWalkActionContext {
  return {
    actionId: action.id,
    root: { table: rootTable, id: rootId },
    node: {
      kind: node.kind,
      table: node.table ?? null,
      edge: node.edge ?? null,
      fromId: node.fromId ?? null,
      rowKey: node.rowKey ?? null,
      title: node.title,
      fields: Object.fromEntries(
        node.fields.map((field) => [field.label, field.value === MISSING ? null : field.value])
      )
    }
  };
}

export function patchWalkChildren(
  nodes: FemsqWalkNode[],
  id: string,
  children: FemsqWalkNode[]
): FemsqWalkNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, children };
    }
    if (!node.children) {
      return node;
    }
    return { ...node, children: patchWalkChildren(node.children, id, children) };
  });
}

export function walkTreeListColumns(spec: FemsqWalkTreeSpec) {
  if (!usesWalkList(spec) || walkListUsesColumnSets(spec)) {
    return [];
  }
  return walkColumnsToTreeList(spec.columns);
}
