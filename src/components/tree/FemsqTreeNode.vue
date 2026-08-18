<template>
  <div class="femsq-tree-node">
    <div
      class="femsq-tree-node__row"
      :class="{ 'femsq-tree-node__row--selected': selected }"
      :style="rowStyle"
      @click="onRowClick"
    >
      <div class="femsq-tree-node__toggle" @click.stop>
        <slot v-if="!leaf" name="toggle" v-bind="toggleSlotProps">
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
      </div>
      <div class="femsq-tree-node__header">
        <slot name="header" v-bind="nodeSlotProps">
          {{ nodeKey }}
        </slot>
      </div>
    </div>

    <div v-if="selected && slots.detail" class="femsq-tree-node__detail" :style="bodyStyle">
      <slot name="detail" v-bind="nodeSlotProps" />
    </div>

    <div v-if="expanded && !leaf" class="femsq-tree-node__children">
      <div v-if="loading" class="femsq-tree-node__status">
        <slot name="loading" v-bind="statusSlotProps">
          <QSpinner color="primary" size="1.1em" />
        </slot>
      </div>
      <div v-else-if="!childNodes || childNodes.length === 0" class="femsq-tree-node__status femsq-tree-node__empty">
        <slot name="empty" v-bind="statusSlotProps">—</slot>
      </div>
      <FemsqTreeNode
        v-else
        v-for="child in childNodes"
        :key="String(childKey(child))"
        :node="child"
        :depth="depth + 1"
      >
        <template v-for="slotName in slotNames" :key="slotName" #[slotName]="slotProps: Record<string, unknown>">
          <slot :name="slotName" v-bind="bindSlot(slotProps)" />
        </template>
      </FemsqTreeNode>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Рекурсивный узел FemsqTree. Слоты пробрасываются явно на каждый уровень.
 */
import { computed, inject, useSlots } from 'vue';
import { QBtn, QSpinner } from 'quasar';

import { femsqTreeContextKey } from './femsq-tree-context';
import { getChildren, getNodeKey, isLeaf, type FemsqTreeKey, type FemsqTreeNodeBase } from './femsq-tree';
import FemsqTreeNode from './FemsqTreeNode.vue';

defineOptions({
  name: 'FemsqTreeNode'
});

const props = defineProps<{
  node: FemsqTreeNodeBase;
  depth: number;
}>();

const treeCtx = inject(femsqTreeContextKey);
if (!treeCtx) {
  throw new Error('FemsqTreeNode must be used inside FemsqTree');
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
const leaf = computed(() => isLeaf(props.node, ctx.leafKey));
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
  leaf: leaf.value
}));

const statusSlotProps = computed(() => ({
  node: props.node,
  key: nodeKey.value,
  depth: props.depth
}));

const toggleSlotProps = computed(() => ({
  expanded: expanded.value,
  loading: loading.value,
  leaf: leaf.value,
  toggle: runToggle
}));

const rowStyle = computed(() => ({
  paddingLeft: `calc(${props.depth} * var(--fequlib-tree-indent, ${ctx.indent}px))`
}));

const bodyStyle = computed(() => ({
  paddingLeft: `calc(${props.depth + 1} * var(--fequlib-tree-indent, ${ctx.indent}px))`
}));

function childKey(child: FemsqTreeNodeBase): FemsqTreeKey {
  return getNodeKey(child, ctx.nodeKey);
}

function runToggle(): void {
  ctx.onToggle(new Event('click'), props.node, nodeKey.value);
}

function onRowClick(evt: Event): void {
  ctx.onHeaderClick(evt, props.node, nodeKey.value);
}
</script>

<style scoped>
.femsq-tree-node {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.femsq-tree-node__row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  min-height: var(--fequlib-tree-row-height, 32px);
  padding-top: var(--fequlib-tree-row-padding-y, 4px);
  padding-right: var(--fequlib-tree-row-padding-x, 4px);
  padding-bottom: var(--fequlib-tree-row-padding-y, 4px);
  cursor: pointer;
  color: inherit;
}

.femsq-tree-node__row--selected {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
}

.femsq-tree-node__toggle {
  flex: 0 0 auto;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.femsq-tree-node__header {
  flex: 1 1 auto;
  min-width: 0;
}

.femsq-tree-node__detail,
.femsq-tree-node__status {
  padding-top: var(--fequlib-tree-row-padding-y, 4px);
  padding-bottom: var(--fequlib-tree-row-padding-y, 4px);
  padding-right: var(--fequlib-tree-row-padding-x, 4px);
  min-width: 0;
  color: inherit;
}

.femsq-tree-node__empty {
  opacity: 0.7;
}
</style>
