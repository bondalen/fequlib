<template>
  <div class="femsq-tree-list-node">
    <div
      class="femsq-tree-list__line femsq-tree-list-node__row"
      :class="{
        'femsq-tree-list-node__row--selected': selected,
        'femsq-tree-list-node__row--folder': isFolder
      }"
      @click="onRowClick"
    >
      <div class="femsq-tree-list__nav">
        <span class="femsq-tree-list__indent" :style="indentStyle" />
        <span class="femsq-tree-list__toggle" :style="{ width: `${ctx.toggleWidthPx}px` }" @click.stop>
          <slot v-if="showToggle" name="toggle" v-bind="toggleSlotProps">
            <QBtn
              flat
              dense
              round
              size="sm"
              :icon="expanded ? 'expand_more' : 'chevron_right'"
              :loading="loading"
              :aria-label="expanded ? 'Свернуть' : 'Развернуть'"
              @click="runToggle"
            />
          </slot>
        </span>
        <span class="femsq-tree-list__nav-label">
          {{ cellTextAt(0) }}
        </span>
        <span
          class="femsq-tree-list__resize femsq-tree-list__resize--zone"
          title="Ширина левой зоны"
          @mousedown.prevent.stop="ctx.beginResizeNav('zone', $event.clientX)"
        />
      </div>
      <div class="femsq-tree-list__data">
        <div
          v-for="index in dataIndexes"
          :key="`data-${index}`"
          class="femsq-tree-list__cell"
          :style="dataCellStyle(index)"
        >
          <span
            class="femsq-tree-list__cell-text"
            :class="{ 'femsq-tree-list__cell-text--muted': isFolderLabel(index) }"
          >{{ cellTextAt(index) }}</span>
          <span
            class="femsq-tree-list__resize"
            title="Ширина колонки"
            @mousedown.prevent.stop="ctx.beginResizeData(index - 1, $event.clientX)"
          />
        </div>
        <div v-if="ctx.hasActions" class="femsq-tree-list__cell femsq-tree-list__cell--actions" @click.stop>
          <slot name="actions" v-bind="nodeSlotProps" />
        </div>
      </div>
    </div>

    <div v-if="expanded && showToggle" class="femsq-tree-list-node__children">
      <div v-if="loading || childNodes === undefined" class="femsq-tree-list__status">
        <slot name="loading" v-bind="statusSlotProps">
          <QSpinner color="primary" size="1.1em" />
        </slot>
      </div>
      <div v-else-if="childNodes.length === 0" class="femsq-tree-list__status femsq-tree-list__empty">
        <slot name="empty" v-bind="statusSlotProps">—</slot>
      </div>
      <FemsqTreeListSiblings
        v-else
        :nodes="childNodes"
        :depth="depth + 1"
      >
        <template v-for="slotName in slotNames" :key="slotName" #[slotName]="slotProps: Record<string, unknown>">
          <slot :name="slotName" v-bind="bindSlot(slotProps)" />
        </template>
      </FemsqTreeListSiblings>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Строка FemsqTreeList: nav (indent + toggle + подпись) и data (дорожки 1…N).
 */
import { computed, inject, useSlots } from 'vue';
import { QBtn, QSpinner } from 'quasar';

import FemsqTreeListSiblings from './FemsqTreeListSiblings.vue';
import { femsqTreeListContextKey } from './femsq-tree-list-context';
import { getChildren, getNodeKey, type FemsqTreeKey, type FemsqTreeNodeBase } from './femsq-tree';
import {
  TREE_LIST_DATA_COL_MIN_PX,
  treeListCellText,
  treeListFolderShowsSetLabels,
  treeListRowIndentPx,
  treeListSetCellText,
  treeListSetForNode,
  treeListShowsToggle,
  type FemsqTreeListColumn
} from './femsq-tree-list';

defineOptions({
  name: 'FemsqTreeListNode'
});

const props = defineProps<{
  node: FemsqTreeNodeBase;
  depth: number;
}>();

const treeCtx = inject(femsqTreeListContextKey);
if (!treeCtx) {
  throw new Error('FemsqTreeListNode must be used inside FemsqTreeList');
}
const ctx = treeCtx;

const slots = useSlots();
const slotNames = Object.keys(slots);

function bindSlot(slotProps: unknown): Record<string, unknown> {
  if (slotProps && typeof slotProps === 'object') {
    return slotProps as Record<string, unknown>;
  }
  return {};
}

const nodeKey = computed(() => getNodeKey(props.node, ctx.nodeKey) as FemsqTreeKey);
const showToggle = computed(() => treeListShowsToggle(props.node, ctx.leafKey));
const expanded = computed(() => ctx.isExpanded(nodeKey.value));
const selected = computed(() => ctx.isSelected(nodeKey.value));
const loading = computed(() => ctx.isLoading(nodeKey.value));
const childNodes = computed(() => getChildren(props.node, ctx.childrenKey));
const isFolder = computed(() => props.node.kind === 'folder');

const nodeSlotProps = computed(() => ({
  node: props.node,
  key: nodeKey.value,
  depth: props.depth,
  expanded: expanded.value,
  selected: selected.value,
  loading: loading.value,
  leaf: !showToggle.value
}));

const statusSlotProps = computed(() => ({
  node: props.node,
  key: nodeKey.value,
  depth: props.depth
}));

const toggleSlotProps = computed(() => ({
  expanded: expanded.value,
  loading: loading.value,
  leaf: !showToggle.value,
  toggle: runToggle
}));

const indentStyle = computed(() => ({
  width: `${treeListRowIndentPx(props.depth, ctx.indent)}px`
}));

const rowSet = computed(() =>
  ctx.useColumnSets ? treeListSetForNode(props.node, ctx.columnSets) : undefined
);

const rowCells = computed(() => {
  if (!ctx.useColumnSets) {
    return ctx.columns;
  }
  const set = rowSet.value;
  const cells: Array<FemsqTreeListColumn | undefined> = [];
  for (let index = 0; index < ctx.trackCount; index += 1) {
    const column = set?.columns[index];
    cells.push(column ? { ...column, level: undefined } : undefined);
  }
  return cells;
});

const dataIndexes = computed(() =>
  Array.from({ length: ctx.dataTrackCount }, (_, offset) => offset + 1)
);

function cellTextAt(index: number): string {
  if (ctx.useColumnSets) {
    return treeListSetCellText(props.node, rowSet.value, index);
  }
  const column = rowCells.value[index];
  return column ? treeListCellText(props.node, column) : '';
}

function isFolderLabel(index: number): boolean {
  return ctx.useColumnSets && treeListFolderShowsSetLabels(props.node, index);
}

function dataCellStyle(trackIndex: number): Record<string, string> {
  const width = ctx.dataWidthsPx[trackIndex - 1] ?? TREE_LIST_DATA_COL_MIN_PX;
  const style: Record<string, string> = { width: `${width}px` };
  const column = rowCells.value[trackIndex];
  if (column?.align) {
    style.textAlign = column.align;
  }
  return style;
}

function runToggle(): void {
  ctx.onToggle(new Event('click'), props.node, nodeKey.value);
}

function onRowClick(evt: Event): void {
  ctx.onRowClick(evt, props.node, nodeKey.value);
}
</script>

<style scoped>
.femsq-tree-list-node {
  display: block;
  min-width: 0;
}

.femsq-tree-list-node__row {
  cursor: pointer;
  color: inherit;
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.femsq-tree-list-node__row--selected {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
}

.femsq-tree-list-node__row--selected :deep(.femsq-tree-list__nav) {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
}

.femsq-tree-list-node__row--folder {
  background: var(--fequlib-tree-folder-bg, color-mix(in srgb, currentColor 6%, transparent));
  font-weight: var(--fequlib-tree-folder-weight, 600);
  border-bottom-color: var(--fequlib-tree-folder-border, color-mix(in srgb, currentColor 16%, transparent));
}

.femsq-tree-list-node__row--folder :deep(.femsq-tree-list__nav) {
  background: var(--fequlib-tree-folder-bg, color-mix(in srgb, currentColor 6%, transparent));
}

.femsq-tree-list-node__row--folder.femsq-tree-list-node__row--selected,
.femsq-tree-list-node__row--folder.femsq-tree-list-node__row--selected :deep(.femsq-tree-list__nav) {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
}

.femsq-tree-list-node__children {
  display: block;
  min-width: 0;
}
</style>
