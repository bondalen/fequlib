/**
 * Контракт FemsqTree v1: ключ / дети / leaf / lazy.
 * Без доменных типов FEMSQ. Хост владеет массивом nodes.
 */

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

/**
 * Стабильный ключ узла: поле `nodeKey` или функция.
 */
export function getNodeKey<Node extends FemsqTreeNodeBase>(
  node: Node,
  nodeKey: FemsqTreeNodeKey<Node>
): FemsqTreeKey {
  if (typeof nodeKey === 'function') {
    return nodeKey(node);
  }
  return node[nodeKey] as FemsqTreeKey;
}

/**
 * Дети узла. `undefined` — ещё не загружали (или поле не массив);
 * `[]` — загрузили, пусто.
 */
export function getChildren<Node extends FemsqTreeNodeBase>(
  node: Node,
  childrenKey = 'children'
): Node[] | undefined {
  const value = node[childrenKey];
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value as Node[];
}

/**
 * `leaf === true` — детей не бывает; иначе не лист.
 */
export function isLeaf<Node extends FemsqTreeNodeBase>(node: Node, leafKey = 'leaf'): boolean {
  return node[leafKey] === true;
}

/**
 * Нужно ли эмитить `@load`: lazy, не leaf, children ещё не массив.
 */
export function shouldLoad<Node extends FemsqTreeNodeBase>(
  node: Node,
  lazy: boolean,
  childrenKey = 'children',
  leafKey = 'leaf'
): boolean {
  if (!lazy || isLeaf(node, leafKey)) {
    return false;
  }
  return getChildren(node, childrenKey) === undefined;
}

/**
 * Первый `@load` — `expand`; повтор, пока children всё ещё undefined — `retry`.
 */
export function getLoadReason(alreadyRequested: boolean): FemsqTreeLoadReason {
  return alreadyRequested ? 'retry' : 'expand';
}

export function keyListIncludes(
  keys: readonly FemsqTreeKey[] | undefined | null,
  key: FemsqTreeKey
): boolean {
  if (!keys || keys.length === 0) {
    return false;
  }
  return keys.includes(key);
}

/**
 * Добавить или убрать ключ в списке expand/loading.
 */
export function toggleKeyInList(
  keys: readonly FemsqTreeKey[],
  key: FemsqTreeKey,
  nextOn?: boolean
): FemsqTreeKey[] {
  const has = keys.includes(key);
  const on = nextOn ?? !has;
  if (on) {
    return has ? [...keys] : [...keys, key];
  }
  return has ? keys.filter((item) => item !== key) : [...keys];
}
