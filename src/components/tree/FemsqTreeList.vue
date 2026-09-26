<template>
  <div
    class="femsq-tree-list"
    :class="[rootClassList, { 'femsq-tree-list--fill': fill }]"
    :style="rootStyle"
    v-bind="rootAttrs"
  >
    <div v-if="showRootLoading" class="femsq-tree-list__status">
      <slot name="loading" :depth="0">
        <QSpinner color="primary" size="1.25em" />
      </slot>
    </div>
    <div v-else-if="nodes.length === 0" class="femsq-tree-list__status femsq-tree-list__empty">
      <slot name="empty" :depth="0">—</slot>
    </div>
    <div v-else class="femsq-tree-list__scroll">
      <div v-if="!useColumnSets" class="femsq-tree-list__header femsq-tree-list__line">
        <div
          v-for="(column, index) in columns"
          :key="column.name"
          class="femsq-tree-list__cell"
          :style="headerCellStyle(column)"
        >
          <span v-if="index === 0" class="femsq-tree-list__toggle" />
          <span class="femsq-tree-list__cell-text">{{ column.label }}</span>
        </div>
        <div v-if="hasActions" class="femsq-tree-list__cell femsq-tree-list__cell--actions" />
      </div>
      <FemsqTreeListSiblings :nodes="nodes" :depth="0">
        <template v-for="(_, slotName) in forwardedSlots" :key="String(slotName)" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps || {}" />
        </template>
      </FemsqTreeListSiblings>
    </div>
  </div>
</template>

<script setup lang="ts" generic="Node extends Record<string, any> = Record<string, any>">
/**
 * FemsqTreeList — колоночное дерево на ядре FemsqTree.
 * Не extends и не режим FemsqTable. FemsqTree (outline) не используется.
 * Lib не мутирует nodes. Lazy: @load, loadingKeys пишет хост.
 */
import { computed, provide, ref, useAttrs, useSlots } from 'vue';
import { QSpinner } from 'quasar';

import FemsqTreeListSiblings from './FemsqTreeListSiblings.vue';
import { femsqTreeListContextKey, type FemsqTreeListContext } from './femsq-tree-list-context';
import {
  getLoadReason,
  keyListIncludes,
  shouldLoad,
  toggleKeyInList,
  toggleSelectedKey,
  type FemsqTreeKey,
  type FemsqTreeLoadPayload,
  type FemsqTreeNodeKey
} from './femsq-tree';
import { treeListColumnTracks, treeListSetTrackCount, type FemsqTreeListColumn, type FemsqTreeListColumnSet } from './femsq-tree-list';

defineOptions({
  name: 'FemsqTreeList',
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<{
    nodes: Node[];
    nodeKey: FemsqTreeNodeKey<Node>;
    columns?: FemsqTreeListColumn<Node>[];
    /**
     * Комплекты колонок ветвей. Пока нет — одна липкая шапка из `columns`.
     * Дорожек столько, сколько колонок у самого широкого комплекта.
     */
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
    /**
     * Fill-layout: высота родителя, скролл в `.femsq-tree-list__scroll`, шапка sticky.
     * Default false. Хост задаёт высоту и не ставит второй overflow:auto.
     */
    fill?: boolean;
  }>(),
  {
    columns: () => [],
    columnSets: () => [],
    childrenKey: 'children',
    leafKey: 'leaf',
    expandedKeys: undefined,
    selectedKey: undefined,
    loadingKeys: undefined,
    indent: 16,
    expandOnClick: false,
    selectable: true,
    lazy: false,
    rootClass: '',
    fill: false
  }
);

const emit = defineEmits<{
  'update:expandedKeys': [value: FemsqTreeKey[]];
  'update:selectedKey': [value: FemsqTreeKey | null];
  'update:loadingKeys': [value: FemsqTreeKey[]];
  'node-click': [evt: Event, node: Node, key: FemsqTreeKey];
  toggle: [node: Node, key: FemsqTreeKey, expanded: boolean];
  load: [payload: FemsqTreeLoadPayload<Node>];
}>();

const attrs = useAttrs();
const slots = useSlots();

const internalExpandedKeys = ref<FemsqTreeKey[]>([]);
const internalSelectedKey = ref<FemsqTreeKey | null>(null);
const internalLoadingKeys = ref<FemsqTreeKey[]>([]);
const loadRequestedKeys = ref<FemsqTreeKey[]>([]);

const expandedKeysModel = computed(() => props.expandedKeys ?? internalExpandedKeys.value);
const selectedKeyModel = computed(() =>
  props.selectedKey === undefined ? internalSelectedKey.value : props.selectedKey
);
const loadingKeysModel = computed(() => props.loadingKeys ?? internalLoadingKeys.value);

const forwardedSlots = computed(() => slots);
const hasActions = computed(() => typeof slots.actions === 'function');

const rootClassList = computed(() => [props.rootClass, (attrs as Record<string, unknown>).class]);

const rootAttrs = computed(() => {
  const { class: _className, style: _style, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const useColumnSets = computed(() => (props.columnSets?.length ?? 0) > 0);
const trackCount = computed(() =>
  useColumnSets.value ? treeListSetTrackCount(props.columnSets) : props.columns.length
);

const rootStyle = computed(() => {
  const layoutColumns = useColumnSets.value
    ? Array.from({ length: trackCount.value }, () => ({}))
    : props.columns;
  const indentVar = {
    '--fequlib-tree-indent': `${props.indent}px`,
    '--fequlib-tree-list-columns': treeListColumnTracks(layoutColumns, hasActions.value)
  };
  const fromAttrs = (attrs as Record<string, unknown>).style;
  if (fromAttrs && typeof fromAttrs === 'object' && !Array.isArray(fromAttrs)) {
    return { ...indentVar, ...(fromAttrs as Record<string, string>) };
  }
  if (typeof fromAttrs === 'string' && fromAttrs.length > 0) {
    return [indentVar, fromAttrs];
  }
  return indentVar;
});

const showRootLoading = computed(
  () => props.nodes.length === 0 && loadingKeysModel.value.length > 0
);

function headerCellStyle(column: FemsqTreeListColumn<Node>): Record<string, string> | undefined {
  if (!column.align) {
    return undefined;
  }
  return { textAlign: column.align };
}

function setExpandedKeys(next: FemsqTreeKey[]): void {
  if (props.expandedKeys === undefined) {
    internalExpandedKeys.value = next;
  }
  emit('update:expandedKeys', next);
}

function setSelectedKey(next: FemsqTreeKey | null): void {
  if (props.selectedKey === undefined) {
    internalSelectedKey.value = next;
  }
  emit('update:selectedKey', next);
}

function isExpanded(key: FemsqTreeKey): boolean {
  return keyListIncludes(expandedKeysModel.value, key);
}

function isSelected(key: FemsqTreeKey): boolean {
  return selectedKeyModel.value === key;
}

function isLoading(key: FemsqTreeKey): boolean {
  return keyListIncludes(loadingKeysModel.value, key);
}

function requestLoad(node: Node, key: FemsqTreeKey): void {
  if (!shouldLoad(node, props.lazy, props.childrenKey, props.leafKey)) {
    return;
  }
  const already = keyListIncludes(loadRequestedKeys.value, key);
  if (!already) {
    loadRequestedKeys.value = toggleKeyInList(loadRequestedKeys.value, key, true);
  }
  emit('load', {
    node,
    key,
    reason: getLoadReason(already)
  });
}

function onToggle(_evt: Event, node: Node, key: FemsqTreeKey): void {
  const nextExpanded = !isExpanded(key);
  setExpandedKeys(toggleKeyInList(expandedKeysModel.value, key, nextExpanded));
  emit('toggle', node, key, nextExpanded);
  if (nextExpanded) {
    requestLoad(node, key);
  }
}

function onRowClick(evt: Event, node: Node, key: FemsqTreeKey): void {
  emit('node-click', evt, node, key);
  if (props.selectable) {
    setSelectedKey(toggleSelectedKey(selectedKeyModel.value, key));
  }
  if (props.expandOnClick) {
    onToggle(evt, node, key);
  }
}

const listContext: FemsqTreeListContext<Node> = {
  get nodeKey() {
    return props.nodeKey;
  },
  get childrenKey() {
    return props.childrenKey;
  },
  get leafKey() {
    return props.leafKey;
  },
  get indent() {
    return props.indent;
  },
  get columns() {
    return props.columns;
  },
  get columnSets() {
    return props.columnSets;
  },
  get useColumnSets() {
    return useColumnSets.value;
  },
  get trackCount() {
    return trackCount.value;
  },
  get hasActions() {
    return hasActions.value;
  },
  get expandOnClick() {
    return props.expandOnClick;
  },
  get selectable() {
    return props.selectable;
  },
  get lazy() {
    return props.lazy;
  },
  isExpanded,
  isSelected,
  isLoading,
  onRowClick,
  onToggle
};

provide(femsqTreeListContextKey, listContext as FemsqTreeListContext);
</script>

<style scoped>
.femsq-tree-list {
  --fequlib-tree-row-height: 32px;
  --fequlib-tree-row-padding-y: 4px;
  --fequlib-tree-row-padding-x: 4px;
  --fequlib-tree-list-toggle: 28px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  width: 100%;
  color: inherit;
}

.femsq-tree-list--fill {
  height: 100%;
  overflow: hidden;
}

.femsq-tree-list__scroll {
  display: grid;
  grid-template-columns: var(--fequlib-tree-list-columns);
  align-content: start;
  column-gap: 8px;
  min-height: 0;
  min-width: 0;
  width: 100%;
}

.femsq-tree-list--fill .femsq-tree-list__scroll,
.femsq-tree-list--fill .femsq-tree-list__status {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

.femsq-tree-list__header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  min-height: var(--fequlib-tree-row-height, 32px);
  background: var(--fequlib-tree-header-bg, var(--femsq-surface, Canvas));
  color: inherit;
  font-weight: 600;
  border-bottom: 1px solid color-mix(in srgb, currentColor 24%, transparent);
}

:deep(.femsq-tree-list__cell) {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  padding: var(--fequlib-tree-row-padding-y, 4px) var(--fequlib-tree-row-padding-x, 4px);
  color: inherit;
}

:deep(.femsq-tree-list__cell-text) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.femsq-tree-list__cell-text--muted) {
  opacity: 0.62;
  font-weight: 600;
}

:deep(.femsq-tree-list__indent) {
  flex: 0 0 auto;
  height: 1px;
}

:deep(.femsq-tree-list__toggle) {
  flex: 0 0 var(--fequlib-tree-list-toggle, 28px);
  width: var(--fequlib-tree-list-toggle, 28px);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.femsq-tree-list__cell--actions) {
  justify-content: flex-end;
}

.femsq-tree-list__status,
.femsq-tree-list__empty {
  padding: var(--fequlib-tree-row-padding-y) var(--fequlib-tree-row-padding-x);
  min-height: var(--fequlib-tree-row-height);
  color: inherit;
  opacity: 0.7;
}
</style>
