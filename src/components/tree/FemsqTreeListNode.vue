<template>
  <div class="femsq-tree-list-node">
    <div
      class="femsq-tree-list__line femsq-tree-list-node__row"
      :class="{ 'femsq-tree-list-node__row--selected': selected }"
      @click="onRowClick"
    >
      <div
        v-for="(cell, index) in rowCells"
        :key="cell?.name ?? `track-${index}`"
        class="femsq-tree-list__cell"
        :style="cell ? cellStyle(cell) : undefined"
      >
        <template v-if="index === 0">
          <span class="femsq-tree-list__indent" :style="indentStyle" />
          <span class="femsq-tree-list__toggle" @click.stop>
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
        </template>
        <span
          class="femsq-tree-list__cell-text"
          :class="{ 'femsq-tree-list__cell-text--muted': isFolderLabel(index) }"
        >{{ cellTextAt(index) }}</span>
      </div>
      <div v-if="ctx.hasActions" class="femsq-tree-list__cell femsq-tree-list__cell--actions" @click.stop>
        <slot name="actions" v-bind="nodeSlotProps" />
      </div>
    </div>

    <div v-if="expanded && showToggle" class="femsq-tree-list-node__children">
      <div v-if="loading" class="femsq-tree-list__status">
        <slot name="loading" v-bind="statusSlotProps">
          <QSpinner color="primary" size="1.1em" />
        </slot>
      </div>
      <div v-else-if="!childNodes || childNodes.length === 0" class="femsq-tree-list__status femsq-tree-list__empty">
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
 * Строка FemsqTreeList. Слоты пробрасываются явно на каждый уровень.
 * Кнопка раскрытия только у не-листа, в первой колонке.
 */
import { computed, inject, useSlots } from 'vue';
import { QBtn, QSpinner } from 'quasar';

import FemsqTreeListSiblings from './FemsqTreeListSiblings.vue';
import { femsqTreeListContextKey } from './femsq-tree-list-context';
import { getChildren, getNodeKey, type FemsqTreeKey, type FemsqTreeNodeBase } from './femsq-tree';
import {
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

function cellStyle(column: FemsqTreeListColumn): Record<string, string> | undefined {
  if (!column.align) {
    return undefined;
  }
  return { textAlign: column.align };
}

function runToggle(): void {
  ctx.onToggle(new Event('click'), props.node, nodeKey.value);
}

function onRowClick(evt: Event): void {
  ctx.onRowClick(evt, props.node, nodeKey.value);
}
</script>

<style scoped>
.femsq-tree-list-node,
.femsq-tree-list-node__row,
.femsq-tree-list-node__children {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  align-items: center;
  min-width: 0;
}

.femsq-tree-list-node__row {
  min-height: var(--fequlib-tree-row-height, 32px);
  cursor: pointer;
  color: inherit;
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.femsq-tree-list-node__row--selected {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
}

.femsq-tree-list-node__children > .femsq-tree-list__status {
  grid-column: 1 / -1;
}
</style>
