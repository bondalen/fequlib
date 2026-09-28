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
      <div v-if="showStickyHeader" class="femsq-tree-list__header femsq-tree-list__line">
        <div class="femsq-tree-list__nav">
          <span class="femsq-tree-list__toggle" :style="{ width: `${toggleWidthPx}px` }" />
          <span class="femsq-tree-list__nav-label">
            {{ headerNavLabel }}
          </span>
          <span
            class="femsq-tree-list__resize femsq-tree-list__resize--zone"
            title="Ширина левой зоны"
            @mousedown.prevent="beginResizeNav('zone', $event.clientX)"
          />
        </div>
        <div class="femsq-tree-list__data" :style="dataPaneStyle">
          <div
            v-for="(column, index) in headerDataColumns"
            :key="column.name"
            class="femsq-tree-list__cell"
            :style="headerCellStyle(column, index)"
          >
            <span class="femsq-tree-list__cell-text">{{ column.label }}</span>
            <span
              class="femsq-tree-list__resize"
              title="Ширина колонки"
              @mousedown.prevent="beginResizeData(index, $event.clientX)"
            />
          </div>
          <div v-if="hasActions" class="femsq-tree-list__cell femsq-tree-list__cell--actions" />
        </div>
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
 * FemsqTreeList — две зоны: nav (toggle + подпись) и data (поля 1…N).
 * Не extends и не режим FemsqTable. FemsqTree (outline) не используется.
 */
import { computed, onBeforeUnmount, provide, ref, useAttrs, useSlots, watch } from 'vue';
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
import {
  TREE_LIST_DATA_COL_MIN_PX,
  TREE_LIST_DEFAULT_INDENT,
  TREE_LIST_LABEL_DEFAULT_PX,
  TREE_LIST_LABEL_MIN_PX,
  TREE_LIST_TOGGLE_DEFAULT_PX,
  TREE_LIST_TOGGLE_MIN_PX,
  treeListDataColumnsMinWidthPx,
  treeListDataColumnsTemplate,
  treeListDataTrackCount,
  treeListInitialDataWidths,
  treeListSetForNode,
  treeListSetTrackCount,
  type FemsqTreeListColumn,
  type FemsqTreeListColumnSet
} from './femsq-tree-list';

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
    /**
     * Уровень комплекта для sticky-шапки при `columnSets`.
     * Нет — комплект первого корня (`treeListSetForNode`).
     */
    headerLevel?: string;
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
    headerLevel: undefined,
    childrenKey: 'children',
    leafKey: 'leaf',
    expandedKeys: undefined,
    selectedKey: undefined,
    loadingKeys: undefined,
    indent: TREE_LIST_DEFAULT_INDENT,
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

const toggleWidthPx = ref(TREE_LIST_TOGGLE_DEFAULT_PX);
const labelWidthPx = ref(TREE_LIST_LABEL_DEFAULT_PX);
const dataWidthsPx = ref<number[]>([]);

type ResizeKind = { type: 'toggle' | 'label' | 'zone' | 'data'; index?: number; startX: number; startValue: number };
let activeResize: ResizeKind | null = null;

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
const dataTrackCount = computed(() => treeListDataTrackCount(trackCount.value));

const headerColumnSet = computed(() => {
  if (!useColumnSets.value) {
    return undefined;
  }
  const sets = props.columnSets ?? [];
  const explicit = props.headerLevel;
  if (typeof explicit === 'string' && explicit !== '') {
    return sets.find((set) => set.level === explicit);
  }
  const first = props.nodes[0];
  if (first) {
    return treeListSetForNode(first, sets);
  }
  return sets[0];
});

const seedDataColumns = computed(() => {
  if (useColumnSets.value) {
    const header = headerColumnSet.value;
    if (header?.columns.length) {
      return header.columns.slice(1);
    }
    const widest = (props.columnSets ?? []).reduce<FemsqTreeListColumnSet<Node> | undefined>((best, set) => {
      if (!best || set.columns.length > best.columns.length) {
        return set;
      }
      return best;
    }, undefined);
    return (widest?.columns ?? []).slice(1);
  }
  return props.columns.slice(1);
});

const showStickyHeader = computed(() => {
  if (!useColumnSets.value) {
    return props.columns.length > 0;
  }
  return (headerColumnSet.value?.columns.length ?? 0) > 0;
});

watch(
  [dataTrackCount, seedDataColumns],
  () => {
    const next = treeListInitialDataWidths(seedDataColumns.value, dataTrackCount.value);
    if (
      next.length === dataWidthsPx.value.length &&
      next.every((width, index) => width === dataWidthsPx.value[index])
    ) {
      return;
    }
    // Keep resized widths when only trailing columns appear/disappear.
    const merged: number[] = [];
    for (let index = 0; index < next.length; index += 1) {
      merged.push(dataWidthsPx.value[index] ?? next[index]!);
    }
    dataWidthsPx.value = merged;
  },
  { immediate: true }
);

const navWidthPx = computed(() => toggleWidthPx.value + labelWidthPx.value);
const dataTemplate = computed(() => treeListDataColumnsTemplate(dataWidthsPx.value, hasActions.value));
const dataMinWidthPx = computed(() => treeListDataColumnsMinWidthPx(dataWidthsPx.value, hasActions.value));

const dataPaneStyle = computed(() => ({
  gridTemplateColumns: dataTemplate.value,
  minWidth: `${dataMinWidthPx.value}px`
}));

const headerNavLabel = computed(() => {
  if (useColumnSets.value) {
    return headerColumnSet.value?.columns[0]?.label ?? '';
  }
  return props.columns[0]?.label ?? '';
});
const headerDataColumns = computed(() => {
  if (useColumnSets.value) {
    return (headerColumnSet.value?.columns ?? []).slice(1);
  }
  return props.columns.slice(1);
});

const rootStyle = computed(() => {
  const layout = {
    '--fequlib-tree-indent': `${props.indent}px`,
    '--fequlib-tree-list-nav-width': `${navWidthPx.value}px`,
    '--fequlib-tree-list-toggle': `${toggleWidthPx.value}px`,
    '--fequlib-tree-list-label-width': `${labelWidthPx.value}px`,
    '--fequlib-tree-list-data-columns': dataTemplate.value,
    '--fequlib-tree-list-data-min-width': `${dataMinWidthPx.value}px`
  };
  const fromAttrs = (attrs as Record<string, unknown>).style;
  if (fromAttrs && typeof fromAttrs === 'object' && !Array.isArray(fromAttrs)) {
    return { ...layout, ...(fromAttrs as Record<string, string>) };
  }
  if (typeof fromAttrs === 'string' && fromAttrs.length > 0) {
    return [layout, fromAttrs];
  }
  return layout;
});

const showRootLoading = computed(
  () => props.nodes.length === 0 && loadingKeysModel.value.length > 0
);

function headerCellStyle(
  column: FemsqTreeListColumn<Node>,
  index: number
): Record<string, string> | undefined {
  const style: Record<string, string> = {
    width: `${dataWidthsPx.value[index] ?? TREE_LIST_DATA_COL_MIN_PX}px`
  };
  if (column.align) {
    style.textAlign = column.align;
  }
  return style;
}

function clamp(value: number, min: number): number {
  return Math.max(min, Math.floor(value));
}

function onPointerMove(evt: MouseEvent): void {
  if (!activeResize) {
    return;
  }
  const delta = evt.clientX - activeResize.startX;
  if (activeResize.type === 'toggle') {
    toggleWidthPx.value = clamp(activeResize.startValue + delta, TREE_LIST_TOGGLE_MIN_PX);
    return;
  }
  if (activeResize.type === 'label') {
    labelWidthPx.value = clamp(activeResize.startValue + delta, TREE_LIST_LABEL_MIN_PX);
    return;
  }
  if (activeResize.type === 'zone') {
    const nextNav = clamp(activeResize.startValue + delta, TREE_LIST_TOGGLE_MIN_PX + TREE_LIST_LABEL_MIN_PX);
    const toggleShare = toggleWidthPx.value / Math.max(1, toggleWidthPx.value + labelWidthPx.value);
    toggleWidthPx.value = clamp(nextNav * toggleShare, TREE_LIST_TOGGLE_MIN_PX);
    labelWidthPx.value = clamp(nextNav - toggleWidthPx.value, TREE_LIST_LABEL_MIN_PX);
    return;
  }
  if (activeResize.type === 'data' && activeResize.index != null) {
    const next = dataWidthsPx.value.slice();
    next[activeResize.index] = clamp(activeResize.startValue + delta, TREE_LIST_DATA_COL_MIN_PX);
    dataWidthsPx.value = next;
  }
}

function endResize(): void {
  if (!activeResize) {
    return;
  }
  activeResize = null;
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('mouseup', endResize);
}

function beginResizeNav(part: 'toggle' | 'label' | 'zone', clientX: number): void {
  endResize();
  const startValue =
    part === 'toggle'
      ? toggleWidthPx.value
      : part === 'label'
        ? labelWidthPx.value
        : toggleWidthPx.value + labelWidthPx.value;
  activeResize = { type: part, startX: clientX, startValue };
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', endResize);
}

function beginResizeData(index: number, clientX: number): void {
  endResize();
  activeResize = {
    type: 'data',
    index,
    startX: clientX,
    startValue: dataWidthsPx.value[index] ?? TREE_LIST_DATA_COL_MIN_PX
  };
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', endResize);
}

onBeforeUnmount(endResize);

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
  get dataTrackCount() {
    return dataTrackCount.value;
  },
  get hasActions() {
    return hasActions.value;
  },
  get toggleWidthPx() {
    return toggleWidthPx.value;
  },
  get labelWidthPx() {
    return labelWidthPx.value;
  },
  get dataWidthsPx() {
    return dataWidthsPx.value;
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
  onToggle,
  beginResizeNav,
  beginResizeData
};

provide(femsqTreeListContextKey, listContext as FemsqTreeListContext);
</script>

<style scoped>
.femsq-tree-list {
  --fequlib-tree-row-height: 28px;
  --fequlib-tree-row-padding-y: 2px;
  --fequlib-tree-row-padding-x: 4px;
  --fequlib-tree-list-toggle: 28px;
  --fequlib-tree-folder-bg: color-mix(in srgb, currentColor 6%, transparent);
  --fequlib-tree-folder-weight: 600;
  --fequlib-tree-folder-border: color-mix(in srgb, currentColor 16%, transparent);
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
  display: block;
  align-content: start;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: auto;
}

.femsq-tree-list--fill .femsq-tree-list__scroll,
.femsq-tree-list--fill .femsq-tree-list__status {
  flex: 1 1 0;
  min-height: 0;
}

.femsq-tree-list__line {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  min-width: max(100%, calc(var(--fequlib-tree-list-nav-width) + var(--fequlib-tree-list-data-min-width)));
  min-height: var(--fequlib-tree-row-height, 28px);
}

.femsq-tree-list__header {
  position: sticky;
  top: 0;
  z-index: 3;
  font-weight: 600;
  border-bottom: 1px solid color-mix(in srgb, currentColor 24%, transparent);
  background: var(--fequlib-tree-header-bg, var(--femsq-surface, Canvas));
}

:deep(.femsq-tree-list__nav) {
  position: sticky;
  left: 0;
  z-index: 2;
  flex: 0 0 var(--fequlib-tree-list-nav-width);
  width: var(--fequlib-tree-list-nav-width);
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  padding: var(--fequlib-tree-row-padding-y, 4px) 0;
  background: var(--fequlib-tree-header-bg, var(--femsq-surface, Canvas));
  box-shadow: 1px 0 0 color-mix(in srgb, currentColor 12%, transparent);
}

:deep(.femsq-tree-list__nav-label) {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 var(--fequlib-tree-row-padding-x, 4px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

:deep(.femsq-tree-list__data) {
  flex: 1 0 auto;
  display: grid;
  grid-template-columns: var(--fequlib-tree-list-data-columns);
  align-items: center;
  min-width: var(--fequlib-tree-list-data-min-width);
  column-gap: 0;
}

:deep(.femsq-tree-list__cell) {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  padding: var(--fequlib-tree-row-padding-y, 4px) var(--fequlib-tree-row-padding-x, 4px);
  color: inherit;
  box-sizing: border-box;
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

:deep(.femsq-tree-list__resize) {
  position: absolute;
  top: 0;
  right: -3px;
  z-index: 4;
  width: 6px;
  height: 100%;
  cursor: col-resize;
}

:deep(.femsq-tree-list__resize--zone) {
  position: relative;
  right: auto;
  flex: 0 0 6px;
  width: 6px;
  align-self: stretch;
  cursor: col-resize;
}

.femsq-tree-list__status {
  padding: var(--fequlib-tree-row-padding-y) var(--fequlib-tree-row-padding-x);
  min-height: var(--fequlib-tree-row-height);
  color: inherit;
  opacity: 0.7;
}

.femsq-tree-list__empty {
  padding: var(--fequlib-tree-row-padding-y) var(--fequlib-tree-row-padding-x);
  min-height: calc(var(--fequlib-tree-row-height) * 0.7);
  color: inherit;
  opacity: 0.5;
  font-size: 0.82em;
  font-weight: 400;
}
</style>
