<template>
  <template v-for="node in nodes" :key="String(rowKey(node))">
    <FemsqTreeListNode :node="node" :depth="depth">
      <template v-for="slotName in slotNames" :key="slotName" #[slotName]="slotProps: Record<string, unknown>">
        <slot :name="slotName" v-bind="bindSlot(slotProps)" />
      </template>
    </FemsqTreeListNode>
  </template>
</template>

<script setup lang="ts">
/**
 * Соседи одного родителя. Подписи комплекта — в строке папки, не отдельной линией.
 */
import { inject, useSlots } from 'vue';

import FemsqTreeListNode from './FemsqTreeListNode.vue';
import { femsqTreeListContextKey } from './femsq-tree-list-context';
import { getNodeKey, type FemsqTreeKey, type FemsqTreeNodeBase } from './femsq-tree';

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

function rowKey(node: FemsqTreeNodeBase): FemsqTreeKey {
  return getNodeKey(node, ctx.nodeKey);
}
</script>
