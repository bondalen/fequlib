<template>
  <div class="femsq-table" :class="rootClass">
    <div v-if="showFilter" class="femsq-table__toolbar row q-col-gutter-sm items-center q-mb-xs">
      <div class="col-12 col-sm-grow">
        <QInput
          :model-value="filterModel"
          dense
          clearable
          debounce="200"
          :label="filterLabel"
          :data-test="filterTestId"
          @update:model-value="onFilterInput"
        >
          <template v-if="filterIcon" #prepend>
            <QIcon :name="filterIcon" />
          </template>
        </QInput>
      </div>
      <div v-if="showFilterCount" class="col-auto text-caption femsq-text-muted self-center">
        {{ visibleCount }} из {{ totalCount }}
      </div>
      <slot name="toolbar-extra" />
    </div>

    <QTable
      ref="tableRef"
      v-bind="tableAttrs"
      :rows="displayRows"
      :columns="normalizedColumns"
      :filter="undefined"
      :sort-method="mode === 'client' ? clientSortMethod : undefined"
      v-model:pagination="paginationModel"
      @request="mode === 'server' ? onQuasarRequest : undefined"
      @row-click="onRowClick"
    >
      <template v-for="(_, slotName) in forwardedSlots" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps || {}" />
      </template>
    </QTable>
  </div>
</template>

<script setup lang="ts">
/**
 * FemsqTable — обёртка над Quasar QTable с единым контрактом фильтрации/сортировки.
 * Фаза A: client-mode + зарезервированный server/@request; без поколоночных фильтров.
 */
import { computed, onMounted, ref, useAttrs, useSlots, watch } from 'vue';
import { QIcon, QInput, QTable, type QTableColumn, type QTableProps } from 'quasar';

import {
  cellText,
  columnFieldValue,
  compareCellValues,
  rowMatchesFilter,
  type FemsqTableColumn,
  type FemsqTableMode,
  type FemsqTableRequest
} from './femsq-table';

defineOptions({
  name: 'FemsqTable',
  inheritAttrs: false
});

type Row = Record<string, unknown>;

const props = withDefaults(
  defineProps<{
    /** Исходные строки (полный набор в client; страница/выборка — в server). */
    rows: Row[];
    /** Описание колонок (FemsqTableColumn). */
    columns: FemsqTableColumn[];
    /** Режим: client (по умолчанию) или server. */
    mode?: FemsqTableMode;
    /** Внешний текст фильтра (v-model:filter). */
    filter?: string;
    /** Показывать строку фильтра над таблицей. */
    showFilter?: boolean;
    /** Показывать счётчик «N из M». */
    showFilterCount?: boolean;
    /** Подпись поля фильтра. */
    filterLabel?: string;
    /** Иконка в поле фильтра (Material Icons name). */
    filterIcon?: string;
    /** data-test для поля фильтра. */
    filterTestId?: string;
    /** Доп. класс корневого контейнера. */
    rootClass?: string;
    /** Пагинация QTable (v-model:pagination). */
    pagination?: QTableProps['pagination'];
  }>(),
  {
    mode: 'client',
    filter: '',
    showFilter: true,
    showFilterCount: true,
    filterLabel: 'Фильтр',
    filterIcon: 'search',
    filterTestId: 'femsq-table-filter',
    rootClass: '',
    pagination: undefined
  }
);

const emit = defineEmits<{
  'update:filter': [value: string];
  'update:pagination': [value: NonNullable<QTableProps['pagination']>];
  /** Контракт запроса (server-режим; в client эмитится для единообразия). */
  request: [payload: FemsqTableRequest];
  'row-click': [evt: Event, row: Row, index: number];
}>();

const attrs = useAttrs();
const slots = useSlots();
const tableRef = ref<InstanceType<typeof QTable> | null>(null);

const filterModel = computed(() => props.filter ?? '');

const internalPagination = ref<NonNullable<QTableProps['pagination']>>({
  page: 1,
  rowsPerPage: 25,
  sortBy: null,
  descending: false
});

const paginationModel = computed({
  get: () => props.pagination ?? internalPagination.value,
  set: (value: NonNullable<QTableProps['pagination']>) => {
    internalPagination.value = value;
    emit('update:pagination', value);
  }
});

const tableAttrs = computed(() => {
  const { class: className, style, flat, bordered, dense, ...rest } = attrs as Record<
    string,
    unknown
  >;
  return {
    ...rest,
    class: ['femsq-table__q-table', className].filter(Boolean),
    style,
    flat: typeof flat === 'boolean' ? flat : true,
    bordered: typeof bordered === 'boolean' ? bordered : true,
    dense: typeof dense === 'boolean' ? dense : true
  };
});

const forwardedSlots = computed(() => {
  const result: Record<string, unknown> = {};
  for (const name of Object.keys(slots)) {
    if (name === 'toolbar-extra') {
      continue;
    }
    result[name] = slots[name];
  }
  return result;
});

const normalizedColumns = computed(() =>
  props.columns.map((col) => ({
    ...col,
    sortable: col.sortable ?? true
  }))
);

const filteredRows = computed(() => {
  if (props.mode === 'server') {
    return props.rows;
  }
  return props.rows.filter((row) => rowMatchesFilter(row, props.columns, filterModel.value));
});

/** В client — отфильтрованные строки (сортировку делает QTable через sort-method). */
const displayRows = computed(() => filteredRows.value);

const visibleCount = computed(() => filteredRows.value.length);
const totalCount = computed(() => props.rows.length);

/**
 * Кастомная сортировка QTable: число / дата / null в конце.
 */
function clientSortMethod(
  rows: readonly Row[],
  sortBy: string,
  descending: boolean
): Row[] {
  if (props.mode === 'server' || !sortBy) {
    return [...rows];
  }
  const col = props.columns.find((item) => item.name === sortBy) as FemsqTableColumn<Row> | undefined;
  if (!col || col.sortable === false) {
    return [...rows];
  }
  const copy = [...rows];
  copy.sort((a, b) => {
    const cmp = compareCellValues(columnFieldValue(a, col), columnFieldValue(b, col));
    return descending ? -cmp : cmp;
  });
  return copy;
}

function buildRequest(
  pagination: NonNullable<QTableProps['pagination']> = paginationModel.value
): FemsqTableRequest {
  return {
    filter: filterModel.value,
    sortBy: (pagination.sortBy as string | null | undefined) ?? null,
    descending: Boolean(pagination.descending),
    page: pagination.page ?? 1,
    rowsPerPage: pagination.rowsPerPage ?? 25
  };
}

function emitRequest(pagination?: NonNullable<QTableProps['pagination']>): void {
  emit('request', buildRequest(pagination));
}

function onFilterInput(value: string | number | null): void {
  const next = value == null ? '' : String(value);
  emit('update:filter', next);
  const nextPagination: NonNullable<QTableProps['pagination']> = {
    ...paginationModel.value,
    page: 1
  };
  paginationModel.value = nextPagination;
  emitRequest(nextPagination);
}

function onQuasarRequest(payload: {
  pagination: NonNullable<QTableProps['pagination']>;
  filter?: string;
  getCellValue: (col: QTableColumn, row: unknown) => unknown;
}): void {
  paginationModel.value = payload.pagination;
  emitRequest(payload.pagination);
}

function onRowClick(evt: Event, row: Row, index: number): void {
  emit('row-click', evt, row, index);
}

function warnSlottedColumnsWithoutFilterValue(): void {
  if (!import.meta.env.DEV) {
    return;
  }
  for (const col of props.columns) {
    const slotName = `body-cell-${col.name}`;
    if (!slots[slotName]) {
      continue;
    }
    if (col.filterable === false) {
      continue;
    }
    if (typeof col.filterValue === 'function') {
      continue;
    }
    console.warn(
      `[FemsqTable] column "${col.name}" has #${slotName} but no filterValue; ` +
        `set filterable: false or provide filterValue(row) so search stays correct.`
    );
  }
}

onMounted(() => {
  warnSlottedColumnsWithoutFilterValue();
  emitRequest();
});

watch(
  () => props.columns,
  () => warnSlottedColumnsWithoutFilterValue(),
  { deep: true }
);

watch(
  () => [props.filter, props.mode] as const,
  () => {
    if (props.mode === 'server') {
      emitRequest();
    }
  }
);

defineExpose({
  cellText,
  tableRef,
  buildRequest
});
</script>

<style scoped>
.femsq-table {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  min-height: 0;
  width: 100%;
}

.femsq-table__q-table {
  flex: 1 1 auto;
  min-height: 0;
}

.col-sm-grow {
  flex: 1 1 auto;
}
</style>
