<template>
  <div class="femsq-walk-tree" :class="rootClass" :data-test="dataTest">
    <div v-if="missingRoot" class="femsq-walk-tree__message">Нет ключа корня.</div>
    <div v-else-if="error" class="femsq-walk-tree__message text-negative">{{ error }}</div>
    <div v-else-if="rootLoading" class="femsq-walk-tree__message">
      <QSpinner color="primary" size="1.25em" />
    </div>
    <FemsqTreeList
      v-else-if="listView"
      fill
      lazy
      :expand-on-click="false"
      node-key="id"
      :nodes="nodes"
      :columns="listColumns"
      :column-sets="listColumnSets"
      v-model:expanded-keys="expandedKeys"
      v-model:selected-key="selectedKeyModel"
      v-model:loading-keys="loadingKeys"
      @load="onLoad"
    >
      <template #actions="{ node }">
        <QBtn
          v-for="action in nodeActions(asWalkNode(node))"
          :key="action.id"
          flat
          dense
          no-caps
          color="primary"
          :label="action.label"
          :icon="action.icon"
          @click.stop="onAction(asWalkNode(node), action)"
        />
      </template>
      <template #empty>пока нет дочерних узлов</template>
    </FemsqTreeList>
    <FemsqTree
      v-else
      fill
      lazy
      :expand-on-click="false"
      node-key="id"
      :nodes="nodes"
      v-model:expanded-keys="expandedKeys"
      v-model:selected-key="selectedKeyModel"
      v-model:loading-keys="loadingKeys"
      @load="onLoad"
    >
      <template #header="{ node }">
        <span class="femsq-walk-tree__title">{{ asWalkNode(node).title }}</span>
        <QBtn
          v-for="action in nodeActions(asWalkNode(node))"
          :key="action.id"
          flat
          dense
          no-caps
          color="primary"
          :label="action.label"
          :icon="action.icon"
          @click.stop="onAction(asWalkNode(node), action)"
        />
      </template>
      <template #detail="{ node }">
        <QMarkupTable flat dense separator="horizontal" class="femsq-walk-tree__detail">
          <tbody>
            <tr v-for="field in asWalkNode(node).fields" :key="field.label">
              <td class="femsq-walk-tree__detail-label">{{ field.label }}</td>
              <td>{{ field.value }}</td>
            </tr>
          </tbody>
        </QMarkupTable>
      </template>
      <template #empty>пока нет дочерних узлов</template>
    </FemsqTree>
  </div>
</template>

<script setup lang="ts">
/**
 * FemsqWalkTree — обход JSON в узлы FemsqTree или FemsqTreeList.
 * Сам экраны не переключает: list только при view === "list".
 */
import { computed, ref, watch } from 'vue';
import { QBtn, QMarkupTable, QSpinner } from 'quasar';

import FemsqTree from './FemsqTree.vue';
import FemsqTreeList from './FemsqTreeList.vue';
import { usesWalkList } from './femsq-walk-view';
import type { FemsqTreeKey, FemsqTreeLoadPayload } from './femsq-tree';
import {
  buildWalkRecordNode,
  createWalkActionContext,
  patchWalkChildren,
  walkChildrenAfterFolderLoad,
  walkChildrenAfterRecordLoad,
  walkFieldMap,
  walkListColumnSetsOf,
  walkReloadToken,
  walkTreeListColumns,
  type FemsqWalkActionContext,
  type FemsqWalkActionSpec,
  type FemsqWalkFetchExpand,
  type FemsqWalkFetchNode,
  type FemsqWalkFetchQuery,
  type FemsqWalkFetchRoots,
  type FemsqWalkNode,
  type FemsqWalkTreeSpec
} from './femsq-walk-tree';

defineOptions({
  name: 'FemsqWalkTree'
});

const props = withDefaults(
  defineProps<{
    spec: FemsqWalkTreeSpec;
    /** Число — один корень. null — лес, если у корня JSON есть queryId и передан fetchRoots. */
    rootId?: number | null;
    /** Непрозрачная строка хоста. Меняется целиком и не разбирается. */
    rootsToken?: string;
    /** Выбор строки; хост может читать и задавать. */
    selectedKey?: FemsqTreeKey | null;
    fetchNode: FemsqWalkFetchNode;
    fetchExpand: FemsqWalkFetchExpand;
    fetchQuery?: FemsqWalkFetchQuery;
    fetchRoots?: FemsqWalkFetchRoots;
    rootClass?: string;
    dataTest?: string;
  }>(),
  {
    rootId: null,
    rootsToken: '',
    selectedKey: undefined,
    rootClass: '',
    dataTest: undefined
  }
);

const emit = defineEmits<{
  action: [context: FemsqWalkActionContext];
  'update:selectedKey': [value: FemsqTreeKey | null];
}>();

const nodes = ref<FemsqWalkNode[]>([]);
const expandedKeys = ref<FemsqTreeKey[]>([]);
const internalSelectedKey = ref<FemsqTreeKey | null>(null);
const loadingKeys = ref<FemsqTreeKey[]>([]);
const error = ref('');
const missingRoot = ref(false);
const rootLoading = ref(false);
let generation = 0;

const selectedKeyModel = computed({
  get(): FemsqTreeKey | null {
    return props.selectedKey === undefined ? internalSelectedKey.value : props.selectedKey;
  },
  set(value: FemsqTreeKey | null): void {
    if (props.selectedKey === undefined) {
      internalSelectedKey.value = value;
    }
    emit('update:selectedKey', value);
  }
});

const listView = computed(() => usesWalkList(props.spec));
const listColumnSets = computed(() => walkListColumnSetsOf(props.spec) ?? []);
const listColumns = computed(() => walkTreeListColumns(props.spec));

const reloadToken = computed(() => {
  const base = walkReloadToken(props.spec, props.rootId, props.rootsToken, props.fetchRoots);
  if (!base) {
    return '';
  }
  return `${base}|${props.spec.id}|${props.spec.version}`;
});

function rowsToMaps(rows: Awaited<ReturnType<FemsqWalkFetchExpand>>) {
  return rows.map((row) => ({ key: row.key, fields: walkFieldMap(row.fields) }));
}

function rootRecordSpec() {
  return {
    title: props.spec.title,
    detail: props.spec.detail,
    children: props.spec.children,
    actions: props.spec.actions,
    valueKinds: props.spec.valueKinds,
    level: props.spec.root.level
  };
}

async function loadRoot(token: string) {
  const gen = ++generation;
  nodes.value = [];
  expandedKeys.value = [];
  selectedKeyModel.value = null;
  loadingKeys.value = [];
  error.value = '';
  if (!token) {
    missingRoot.value = true;
    rootLoading.value = false;
    return;
  }
  missingRoot.value = false;
  rootLoading.value = true;
  try {
    if (typeof props.rootId === 'number') {
      const row = await props.fetchNode(props.spec.root.table, props.rootId);
      if (gen !== generation) {
        return;
      }
      if (!row) {
        nodes.value = [];
        return;
      }
      const node = buildWalkRecordNode(
        props.spec.root.table,
        row.key,
        walkFieldMap(row.fields),
        rootRecordSpec(),
        props.spec
      );
      nodes.value = [node];
      selectedKeyModel.value = node.id;
      return;
    }
    const queryId = props.spec.root.queryId ?? '';
    const rows = await props.fetchRoots!(queryId);
    if (gen !== generation) {
      return;
    }
    nodes.value = rows.map((row) =>
      buildWalkRecordNode(
        props.spec.root.table,
        row.key,
        walkFieldMap(row.fields),
        rootRecordSpec(),
        props.spec
      )
    );
    expandedKeys.value = nodes.value.map((node) => node.id);
    if (nodes.value[0]) {
      selectedKeyModel.value = nodes.value[0].id;
    }
  } catch (cause) {
    if (gen !== generation) {
      return;
    }
    error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить дерево.';
  } finally {
    if (gen === generation) {
      rootLoading.value = false;
    }
  }
}

watch(reloadToken, (token) => {
  void loadRoot(token);
}, { immediate: true });

async function onLoad(payload: FemsqTreeLoadPayload<FemsqWalkNode>) {
  const gen = generation;
  const node = payload.node;
  const key = payload.key;
  loadingKeys.value = [...loadingKeys.value, key];
  try {
    let children: FemsqWalkNode[] = [];
    if (node.kind === 'folder') {
      if (node.fromId == null) {
        throw new Error('Нет fromId.');
      }
      if (node.queryId) {
        if (!props.fetchQuery) {
          throw new Error('Нет обработчика запроса.');
        }
        const rows = await props.fetchQuery(node.queryId, node.fromId);
        if (gen !== generation) {
          return;
        }
        children = walkChildrenAfterFolderLoad(node, rowsToMaps(rows), props.spec);
      } else if (node.edge) {
        const rows = await props.fetchExpand(node.edge, node.fromId);
        if (gen !== generation) {
          return;
        }
        children = walkChildrenAfterFolderLoad(node, rowsToMaps(rows), props.spec);
      }
    } else {
      const specs = (node.childSpecs ?? []).filter((child) => child.card !== '1:N' && child.edge);
      const loaded: Record<string, Array<{ key: number; fields: Record<string, string | null> }>> = {};
      for (const child of specs) {
        if (node.rowKey == null) {
          throw new Error('Нет ключа записи.');
        }
        const rows = await props.fetchExpand(child.edge!, node.rowKey);
        loaded[child.edge!] = rowsToMaps(rows);
      }
      if (gen !== generation) {
        return;
      }
      children = walkChildrenAfterRecordLoad(node, loaded, props.spec);
    }
    nodes.value = patchWalkChildren(nodes.value, node.id, children);
  } catch (cause) {
    if (gen !== generation) {
      return;
    }
    error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить детей.';
  } finally {
    if (gen === generation) {
      loadingKeys.value = loadingKeys.value.filter((item) => item !== key);
    }
  }
}

function asWalkNode(node: unknown): FemsqWalkNode {
  return node as FemsqWalkNode;
}

function nodeActions(node: { actions?: FemsqWalkActionSpec[] }): FemsqWalkActionSpec[] {
  return node.actions ?? [];
}

function onAction(node: FemsqWalkNode, action: FemsqWalkActionSpec) {
  emit(
    'action',
    createWalkActionContext(
      props.spec.root.table,
      typeof props.rootId === 'number' ? props.rootId : null,
      node,
      action
    )
  );
}
</script>

<style scoped>
.femsq-walk-tree {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  color: inherit;
}

.femsq-walk-tree__message {
  padding: 4px;
  opacity: 0.72;
}

.femsq-walk-tree__title {
  margin-right: 8px;
}

.femsq-walk-tree__detail-label {
  width: 40%;
}
</style>
