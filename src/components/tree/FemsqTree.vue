<template>
  <div
    class="femsq-tree"
    :class="[rootClassList, { 'femsq-tree--fill': fill }]"
    :style="rootStyle"
    v-bind="rootAttrs"
  >
    <div v-if="showRootLoading" class="femsq-tree__status">
      <slot name="loading" :depth="0">
        <QSpinner color="primary" size="1.25em" />
      </slot>
    </div>
    <div v-else-if="nodes.length === 0" class="femsq-tree__status femsq-tree__empty">
      <slot name="empty" :depth="0">—</slot>
    </div>
    <div v-else class="femsq-tree__nodes" role="presentation">
      <FemsqTreeNode v-for="node in nodes" :key="String(nodeKeyOf(node))" :node="node" :depth="0">
        <template v-for="(_, slotName) in forwardedSlots" :key="String(slotName)" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps || {}" />
        </template>
      </FemsqTreeNode>
    </div>
  </div>
</template>

<script setup lang="ts" generic="Node extends Record<string, any> = Record<string, any>">
/**
 * FemsqTree — nested outline: #header всегда, #detail у selectedKey, дети у expandedKeys.
 * Lib не мутирует nodes. Lazy: @load, loadingKeys пишет хост.
 */
import { computed, provide, ref, useAttrs, useSlots } from 'vue';
import { QSpinner } from 'quasar';

import FemsqTreeNode from './FemsqTreeNode.vue';
import { femsqTreeContextKey, type FemsqTreeContext } from './femsq-tree-context';
import {
  getLoadReason,
  getNodeKey,
  keyListIncludes,
  shouldLoad,
  toggleKeyInList,
  toggleSelectedKey,
  type FemsqTreeKey,
  type FemsqTreeLoadPayload,
  type FemsqTreeNodeKey
} from './femsq-tree';

defineOptions({
  name: 'FemsqTree',
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<{
    nodes: Node[];
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
     * Fill-layout: заполнить высоту родителя; скролл в `.femsq-tree__nodes`
     * (включая `#detail`). Default false — размер по контенту.
     * При fill=true хост не ставит overflow:auto на обёртку (двойной скролл).
     */
    fill?: boolean;
  }>(),
  {
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

const rootClassList = computed(() => [props.rootClass, (attrs as Record<string, unknown>).class]);

const rootAttrs = computed(() => {
  const { class: _className, style: _style, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const rootStyle = computed(() => {
  const fromAttrs = (attrs as Record<string, unknown>).style;
  const indentVar = { '--fequlib-tree-indent': `${props.indent}px` };
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

function nodeKeyOf(node: Node): FemsqTreeKey {
  return getNodeKey(node, props.nodeKey);
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

function onHeaderClick(evt: Event, node: Node, key: FemsqTreeKey): void {
  emit('node-click', evt, node, key);
  if (props.selectable) {
    setSelectedKey(toggleSelectedKey(selectedKeyModel.value, key));
  }
  if (props.expandOnClick) {
    onToggle(evt, node, key);
  }
}

const treeContext: FemsqTreeContext<Node> = {
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
  onHeaderClick,
  onToggle
};

provide(femsqTreeContextKey, treeContext as FemsqTreeContext);
</script>

<style scoped>
.femsq-tree {
  --fequlib-tree-row-height: 32px;
  --fequlib-tree-row-padding-y: 4px;
  --fequlib-tree-row-padding-x: 4px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  color: inherit;
}

.femsq-tree--fill {
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.femsq-tree__nodes {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.femsq-tree--fill .femsq-tree__nodes,
.femsq-tree--fill .femsq-tree__status {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.femsq-tree__status,
.femsq-tree__empty {
  padding: var(--fequlib-tree-row-padding-y) var(--fequlib-tree-row-padding-x);
  min-height: var(--fequlib-tree-row-height);
  color: inherit;
  opacity: 0.7;
}
</style>
