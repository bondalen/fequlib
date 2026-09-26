<template>
  <template v-for="(node, index) in nodes" :key="String(rowKey(node))">
    <div v-if="showCaption(index)" class="femsq-tree-list__line femsq-tree-list__set-labels">
      <div v-for="(label, labelIndex) in labelsFor(node)" :key="labelIndex" class="femsq-tree-list__cell">
        <template v-if="labelIndex === 0">
          <span class="femsq-tree-list__indent" :style="indentStyle" />
          <span class="femsq-tree-list__toggle" />
        </template>
        <span class="femsq-tree-list__cell-text">{{ label }}</span>
      </div>
      <div v-if="ctx.hasActions" class="femsq-tree-list__cell femsq-tree-list__cell--actions" />
    </div>
    <FemsqTreeListNode :node="node" :depth="depth">
      <template v-for="slotName in slotNames" :key="slotName" #[slotName]="slotProps: Record<string, unknown>">
        <slot :name="slotName" v-bind="bindSlot(slotProps)" />
      </template>
    </FemsqTreeListNode>
  </template>
</template>

<script setup lang="ts">
/**
 * Соседи одного родителя. При columnSets перед первой строкой группы — подписи комплекта.
 */
import { computed, inject, useSlots } from 'vue';

import FemsqTreeListNode from './FemsqTreeListNode.vue';
import { femsqTreeListContextKey } from './femsq-tree-list-context';
import { getNodeKey, type FemsqTreeKey, type FemsqTreeNodeBase } from './femsq-tree';
import {
  treeListGroupCaptionFlags,
  treeListRowIndentPx,
  treeListSetForNode,
  treeListSetLabels,
  treeListSetLevel
} from './femsq-tree-list';

defineOptions({
  name: 'FemsqTreeListSiblings'
});

const props = defineProps<{
  nodes: FemsqTreeNodeBase[];
  depth: number;
}>();

const treeCtx = inject(femsqTreeListContextKey);
if (!treeCtx) {
  throw new Error('FemsqTreeListSiblings must be used inside FemsqTreeList');
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

const captionFlags = computed(() => {
  if (!ctx.useColumnSets) {
    return props.nodes.map(() => false);
  }
  return treeListGroupCaptionFlags(props.nodes.map((node) => treeListSetLevel(node, ctx.columnSets)));
});

const indentStyle = computed(() => ({
  width: `${treeListRowIndentPx(props.depth, ctx.indent)}px`
}));

function showCaption(index: number): boolean {
  return captionFlags.value[index] === true;
}

function labelsFor(node: FemsqTreeNodeBase): string[] {
  return treeListSetLabels(treeListSetForNode(node, ctx.columnSets), ctx.trackCount);
}

function rowKey(node: FemsqTreeNodeBase): FemsqTreeKey {
  return getNodeKey(node, ctx.nodeKey);
}
</script>
