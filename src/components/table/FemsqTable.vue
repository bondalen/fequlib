<template>
  <div class="femsq-table" :class="[rootClass, { 'femsq-table--fill': fill }]">
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
      <template
        v-for="colName in autoFilterHeaderColumns"
        :key="`col-filter-${colName}`"
        #[`header-cell-${colName}`]="slotProps"
      >
        <QTh :props="slotProps" class="femsq-table__th">
          <div class="femsq-table__header-cell">
            <div class="femsq-table__header-label">{{ slotProps.col.label }}</div>
            <QInput
              dense
              borderless
              clearable
              debounce="200"
              :model-value="columnFilterValue(colName)"
              :placeholder="columnFilterPlaceholder"
              :data-test="`femsq-table-col-filter-${colName}`"
              class="femsq-table__col-filter"
              @update:model-value="(v) => onColumnFilterInput(colName, v)"
              @click.stop
              @keydown.stop
            />
          </div>
        </QTh>
      </template>

      <template v-for="(_, slotName) in forwardedSlots" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps || {}" />
      </template>
    </QTable>
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, any> = Record<string, any>">
/**
 * FemsqTable — обёртка над Quasar QTable с единым контрактом фильтрации/сортировки.
 * Фаза A: client-mode + server/@request.
 * Фаза B: поколоночные текстовые фильтры (AND с глобальным).
 * Generic Row: DTO-интерфейсы без index signature принимаются без кастов.
 */
import { computed, onMounted, ref, useAttrs, useSlots, watch } from 'vue';
import { QIcon, QInput, QTable, QTh, type QTableColumn, type QTableProps } from 'quasar';

import {
  cellText,
  columnFieldValue,
  compareCellValues,
  normalizeColumnFilters,
  rowMatchesAllFilters,
  type FemsqTableColumn,
  type FemsqTableMode,
  type FemsqTableRequest
} from './femsq-table';

defineOptions({
  name: 'FemsqTable',
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<{
    /** Исходные строки (полный набор в client; страница/выборка — в server). */
    rows: Row[];
    /** Описание колонок (FemsqTableColumn&lt;Row&gt;). */
    columns: FemsqTableColumn<Row>[];
    /** Режим: client (по умолчанию) или server. */
    mode?: FemsqTableMode;
    /** Внешний текст фильтра (v-model:filter). */
    filter?: string;
    /**
     * Поколоночные текстовые фильтры (v-model:columnFilters).
     * Ключ — `column.name`; значение — подстрока (case-insensitive).
     */
    columnFilters?: Record<string, string>;
    /** Показывать строку глобального фильтра над таблицей. */
    showFilter?: boolean;
    /** Показывать поля фильтра под заголовками filterable-колонок. */
    showColumnFilters?: boolean;
    /** Placeholder для поколоночных полей. */
    columnFilterPlaceholder?: string;
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
    /**
     * Fill-layout: заполнить высоту родителя и скроллить тело грида
     * (`.q-table__middle`). Default false — размер по контенту (additive-first).
     * Хост: ограничить родителя (flex/`height:100%`/`overflow:hidden`); не дублировать overflow-обёртку.
     */
    fill?: boolean;
    /** Пагинация QTable (v-model:pagination). */
    pagination?: QTableProps['pagination'];
  }>(),
  {
    mode: 'client',
    filter: '',
    columnFilters: undefined,
    showFilter: true,
    showColumnFilters: true,
    columnFilterPlaceholder: 'Фильтр',
    showFilterCount: true,
    filterLabel: 'Фильтр',
    filterIcon: 'search',
    filterTestId: 'femsq-table-filter',
    rootClass: '',
    fill: false,
    pagination: undefined
  }
);

const emit = defineEmits<{
  'update:filter': [value: string];
  'update:columnFilters': [value: Record<string, string>];
  'update:pagination': [value: NonNullable<QTableProps['pagination']>];
  /** Контракт запроса (server-режим; в client эмитится для единообразия). */
  request: [payload: FemsqTableRequest];
  'row-click': [evt: Event, row: Row, index: number];
}>();

const attrs = useAttrs();
const slots = useSlots();
const tableRef = ref<InstanceType<typeof QTable> | null>(null);

const filterModel = computed(() => props.filter ?? '');

/** Внутреннее состояние, если родитель не передаёт v-model:columnFilters. */
const internalColumnFilters = ref<Record<string, string>>({});

const columnFiltersModel = computed(() => props.columnFilters ?? internalColumnFilters.value);

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

/**
 * Колонки, для которых рисуем header-фильтр сами
 * (filterable !== false и родитель не переопределил #header-cell-*).
 */
const autoFilterHeaderColumns = computed(() => {
  if (!props.showColumnFilters) {
    return [] as string[];
  }
  return props.columns
    .filter((col) => col.filterable !== false)
    .filter((col) => !slots[`header-cell-${col.name}`])
    .map((col) => col.name);
});

const forwardedSlots = computed(() => {
  const result: Record<string, unknown> = {};
  const reserved = new Set(
    autoFilterHeaderColumns.value.map((name) => `header-cell-${name}`)
  );
  for (const name of Object.keys(slots)) {
    if (name === 'toolbar-extra') {
      continue;
    }
    if (reserved.has(name)) {
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
  return props.rows.filter((row) =>
    rowMatchesAllFilters(row, props.columns, filterModel.value, columnFiltersModel.value)
  );
});

/** В client — отфильтрованные строки (сортировку делает QTable через sort-method). */
const displayRows = computed(() => filteredRows.value);

const visibleCount = computed(() => filteredRows.value.length);
const totalCount = computed(() => props.rows.length);

function columnFilterValue(colName: string): string {
  return columnFiltersModel.value[colName] ?? '';
}

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
  const columnFilters = normalizeColumnFilters(columnFiltersModel.value);
  return {
    filter: filterModel.value,
    ...(columnFilters ? { columnFilters } : {}),
    sortBy: (pagination.sortBy as string | null | undefined) ?? null,
    descending: Boolean(pagination.descending),
    page: pagination.page ?? 1,
    rowsPerPage: pagination.rowsPerPage ?? 25
  };
}

function emitRequest(pagination?: NonNullable<QTableProps['pagination']>): void {
  emit('request', buildRequest(pagination));
}

function resetToFirstPageAndRequest(): void {
  const nextPagination: NonNullable<QTableProps['pagination']> = {
    ...paginationModel.value,
    page: 1
  };
  paginationModel.value = nextPagination;
  emitRequest(nextPagination);
}

function onFilterInput(value: string | number | null): void {
  const next = value == null ? '' : String(value);
  emit('update:filter', next);
  resetToFirstPageAndRequest();
}

function onColumnFilterInput(colName: string, value: string | number | null): void {
  const nextValue = value == null ? '' : String(value);
  const next: Record<string, string> = { ...columnFiltersModel.value };
  if (nextValue.trim() === '') {
    delete next[colName];
  } else {
    next[colName] = nextValue;
  }
  if (props.columnFilters === undefined) {
    internalColumnFilters.value = next;
  }
  emit('update:columnFilters', next);
  resetToFirstPageAndRequest();
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
  () => [props.filter, props.columnFilters, props.mode] as const,
  () => {
    if (props.mode === 'server') {
      emitRequest();
    }
  },
  { deep: true }
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

.femsq-table--fill {
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.femsq-table--fill .femsq-table__toolbar {
  flex: 0 0 auto;
}

.femsq-table__q-table {
  flex: 1 1 auto;
  min-height: 0;
}

.femsq-table--fill .femsq-table__q-table {
  flex: 1 1 0;
  min-width: 0;
  max-height: 100%;
}

/* QTable card = column flex; bounded height → .q-table__middle.scroll scrolls body */
.femsq-table--fill :deep(.q-table__container) {
  height: 100%;
  max-height: 100%;
  min-height: 0;
  min-width: 0;
}

.femsq-table--fill :deep(.q-table__middle) {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}

.femsq-table__header-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
}

.femsq-table__header-label {
  line-height: 1.2;
  white-space: nowrap;
}

.femsq-table__col-filter {
  min-width: 4.5rem;
  font-weight: normal;
}

.femsq-table__col-filter :deep(.q-field__control) {
  height: 28px;
  min-height: 28px;
  padding: 0 4px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
}

.femsq-table__col-filter :deep(.q-field__native),
.femsq-table__col-filter :deep(.q-field__prefix),
.femsq-table__col-filter :deep(.q-field__suffix) {
  padding: 0;
  min-height: 28px;
}

.col-sm-grow {
  flex: 1 1 auto;
}
</style>
