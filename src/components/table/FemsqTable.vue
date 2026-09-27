<template>
  <div
    class="femsq-table"
    :class="[
      rootClass,
      {
        'femsq-table--fill': fill,
        'femsq-table--filters-open': filtersVisibleModel
      }
    ]"
  >
    <div
      v-if="chromeVisible"
      class="femsq-table__chrome row items-center no-wrap q-gutter-xs q-mb-xs"
      data-test="femsq-table-chrome"
    >
      <div
        v-if="titleSlotOrText"
        class="femsq-table__chrome-title ellipsis"
        data-test="femsq-table-chrome-title"
      >
        <slot name="title">{{ title }}</slot>
      </div>
      <div
        v-if="captionSlotOrText"
        class="femsq-table__chrome-caption col ellipsis text-caption"
        data-test="femsq-table-chrome-caption"
        :title="captionTitleAttr"
      >
        <slot name="caption">{{ caption }}</slot>
      </div>
      <div v-else class="col" />
      <div class="femsq-table__chrome-commands row items-center no-wrap q-gutter-xs shrink-0">
        <template v-if="filterCapability">
          <QBtn
            flat
            dense
            round
            size="sm"
            :icon="filtersVisibleModel ? 'filter_alt' : 'filter_list'"
            :color="filtersToggleColor"
            :aria-pressed="filtersVisibleModel ? 'true' : 'false'"
            aria-label="Показать или скрыть фильтры"
            data-test="femsq-table-filters-toggle"
            @click="toggleFiltersVisible"
          />
          <span
            v-if="hasActiveFilters"
            class="femsq-table__filters-active text-caption"
            data-test="femsq-table-filters-active"
            title="Есть активные фильтры"
          >●</span>
          <div v-if="showFilterCount" class="col-auto text-caption femsq-text-muted">
            {{ visibleCount }} из {{ totalCount }}
          </div>
        </template>
        <div
          v-if="actionsSlotPresent"
          class="femsq-table__chrome-actions row items-center no-wrap q-gutter-xs"
          data-test="femsq-table-chrome-actions"
        >
          <slot name="actions" />
          <slot name="toolbar-extra" />
        </div>
      </div>
    </div>

    <div
      v-if="filtersVisibleModel && showFilter"
      class="femsq-table__toolbar row q-col-gutter-sm items-center q-mb-xs"
    >
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
        v-for="colName in autoHeaderColumns"
        :key="`hdr-${colName}`"
        #[`header-cell-${colName}`]="slotProps"
      >
        <QTh :props="slotProps" class="femsq-table__th">
          <div class="femsq-table__header-cell">
            <div class="femsq-table__header-row1">
              <div class="femsq-table__header-label">{{ slotProps.col.label }}</div>
              <div class="femsq-table__sort-slot" aria-hidden="true">
                <span class="femsq-table__sort-index" />
                <QIcon
                  v-if="isColumnSorted(colName)"
                  class="femsq-table__sort-arrow"
                  size="xs"
                  :name="paginationModel.descending ? 'arrow_downward' : 'arrow_upward'"
                />
              </div>
            </div>
            <QInput
              v-if="columnFilterUiVisible(colName)"
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
 * 0011: sticky header (fill), 2-row header grid, filtersVisible toggle.
 */
import { computed, onMounted, ref, useAttrs, useSlots, watch } from 'vue';
import { QBtn, QIcon, QInput, QTable, QTh, type QTableColumn, type QTableProps } from 'quasar';

import { formatMoney } from '../../format/format-money';
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
    /** Заголовок в однострочной панели chrome (сегмент title). */
    title?: string;
    /** Подпись / путь справа от title (сегмент caption, ellipsis). */
    caption?: string;
    /**
     * Показаны ли UI-поля фильтров (глобальный + поколоночные).
     * Capability задают showFilter / showColumnFilters. Default false.
     */
    filtersVisible?: boolean;
    /** Capability: глобальный фильтр над таблицей. */
    showFilter?: boolean;
    /** Capability: поколоночные фильтры в шапке. */
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
     * При fill шапка thead sticky внутри viewport.
     */
    fill?: boolean;
    /** Пагинация QTable (v-model:pagination). */
    pagination?: QTableProps['pagination'];
  }>(),
  {
    mode: 'client',
    filter: '',
    columnFilters: undefined,
    title: '',
    caption: '',
    filtersVisible: undefined,
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
  'update:filtersVisible': [value: boolean];
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

/** Внутреннее filtersVisible, если родитель не передаёт v-model. */
const internalFiltersVisible = ref(false);

const filtersVisibleModel = computed({
  get: () => (props.filtersVisible !== undefined ? props.filtersVisible : internalFiltersVisible.value),
  set: (value: boolean) => {
    internalFiltersVisible.value = value;
    emit('update:filtersVisible', value);
  }
});

const filterCapability = computed(() => props.showFilter || props.showColumnFilters);

const titleSlotOrText = computed(
  () => Boolean(slots.title) || Boolean((props.title ?? '').trim())
);

const captionSlotOrText = computed(
  () => Boolean(slots.caption) || Boolean((props.caption ?? '').trim())
);

const actionsSlotPresent = computed(() => Boolean(slots.actions) || Boolean(slots['toolbar-extra']));

/** Панель chrome: title/caption/actions или filter-capability. */
const chromeVisible = computed(
  () =>
    titleSlotOrText.value ||
    captionSlotOrText.value ||
    actionsSlotPresent.value ||
    filterCapability.value
);

const captionTitleAttr = computed(() => {
  if (slots.caption) {
    return undefined;
  }
  const text = (props.caption ?? '').trim();
  return text || undefined;
});

const hasActiveFilters = computed(() => {
  if ((filterModel.value ?? '').trim() !== '') {
    return true;
  }
  return Object.values(columnFiltersModel.value).some((v) => (v ?? '').trim() !== '');
});

const filtersToggleColor = computed(() =>
  filtersVisibleModel.value || hasActiveFilters.value ? 'primary' : undefined
);

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
 * Колонки с авто-шапкой (label + sort-slot [+ filter]), если нет #header-cell-*.
 */
const autoHeaderColumns = computed(() =>
  props.columns.filter((col) => !slots[`header-cell-${col.name}`]).map((col) => col.name)
);

const forwardedSlots = computed(() => {
  const result: Record<string, unknown> = {};
  const reserved = new Set(autoHeaderColumns.value.map((name) => `header-cell-${name}`));
  for (const name of Object.keys(slots)) {
    if (name === 'toolbar-extra' || name === 'actions' || name === 'title' || name === 'caption') {
      continue;
    }
    if (reserved.has(name)) {
      continue;
    }
    result[name] = slots[name];
  }
  return result;
});

/**
 * QTable рисует ячейки через `col.format`, а не через cellText.
 * valueKind=money без своего format → подставляем formatMoney.
 */
const normalizedColumns = computed(() =>
  props.columns.map((col) => {
    const base = {
      ...col,
      sortable: col.sortable ?? true
    };
    if (col.valueKind === 'money' && typeof col.format !== 'function') {
      return {
        ...base,
        format: (value: unknown) => formatMoney(value)
      };
    }
    return base;
  })
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

/**
 * Показать поколоночный фильтр для колонки.
 *
 * @param colName имя колонки
 */
function columnFilterUiVisible(colName: string): boolean {
  if (!filtersVisibleModel.value || !props.showColumnFilters) {
    return false;
  }
  const col = props.columns.find((item) => item.name === colName);
  return col != null && col.filterable !== false;
}

/**
 * Колонка сейчас ведущая в одноколоночной сортировке.
 *
 * @param colName имя колонки
 */
function isColumnSorted(colName: string): boolean {
  return paginationModel.value.sortBy === colName;
}

function columnFilterValue(colName: string): string {
  return columnFiltersModel.value[colName] ?? '';
}

/** Переключить видимость фильтров. */
function toggleFiltersVisible(): void {
  filtersVisibleModel.value = !filtersVisibleModel.value;
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

function paginationRequestKey(
  pagination: NonNullable<QTableProps['pagination']>
): string {
  return JSON.stringify({
    page: pagination.page ?? 1,
    rowsPerPage: pagination.rowsPerPage ?? 25,
    sortBy: (pagination.sortBy as string | null | undefined) ?? null,
    descending: Boolean(pagination.descending)
  });
}

function requestPayloadKey(payload: FemsqTableRequest): string {
  return JSON.stringify({
    filter: payload.filter ?? '',
    columnFilters: payload.columnFilters ?? {},
    sortBy: payload.sortBy,
    descending: payload.descending,
    page: payload.page,
    rowsPerPage: payload.rowsPerPage
  });
}

let lastEmittedRequestKey = '';

function emitRequest(pagination?: NonNullable<QTableProps['pagination']>): void {
  const payload = buildRequest(pagination);
  const key = requestPayloadKey(payload);
  if (key === lastEmittedRequestKey) {
    return;
  }
  lastEmittedRequestKey = key;
  emit('request', payload);
}

/**
 * Сбросить на первую страницу без лишнего emit, если page уже 1.
 */
function ensureFirstPage(): void {
  const current = paginationModel.value;
  if ((current.page ?? 1) === 1) {
    return;
  }
  paginationModel.value = {
    ...current,
    page: 1
  };
}

function resetToFirstPageAndRequest(): void {
  ensureFirstPage();
  emitRequest({
    ...paginationModel.value,
    page: 1
  });
}

function onFilterInput(value: string | number | null): void {
  const next = value == null ? '' : String(value);
  emit('update:filter', next);
  ensureFirstPage();
  // Controlled filter: watch(props.filter) эмитит @request.
  // Uncontrolled: props.filter не изменится — эмитим здесь.
  if (props.filter === undefined) {
    emitRequest();
  }
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
  ensureFirstPage();
  // Controlled columnFilters: watch(props.columnFilters) эмитит @request.
  // Uncontrolled: эмитим здесь после internal update.
  if (props.columnFilters === undefined) {
    emitRequest();
  }
}

function onQuasarRequest(payload: {
  pagination: NonNullable<QTableProps['pagination']>;
  filter?: string;
  getCellValue: (col: QTableColumn, row: unknown) => unknown;
}): void {
  const next = payload.pagination;
  const current = paginationModel.value;
  if (paginationRequestKey(current) !== paginationRequestKey(next)) {
    paginationModel.value = next;
  }
  emitRequest(next);
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
  /*
   * Sticky header surface: host sets --fequlib-table-header-* on html[data-femsq-theme].
   * Do not reassign those tokens here (would override host). Do NOT use --q-dark-page.
   */
  --fequlib-table-header-h: 1.75rem;
  --fequlib-table-filter-row-h: 1.75rem;
  --fequlib-table-sort-slot-w: 1.25rem;

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

.femsq-table--fill .femsq-table__chrome,
.femsq-table--fill .femsq-table__toolbar {
  flex: 0 0 auto;
}

.femsq-table__chrome {
  min-height: 28px;
  gap: 4px;
}

.femsq-table__chrome-title {
  flex: 0 1 auto;
  max-width: 40%;
  font-size: inherit;
  font-weight: 600;
  line-height: 1.3;
  min-width: 0;
}

.femsq-table__chrome-caption {
  flex: 1 1 0;
  min-width: 0;
  opacity: 0.85;
  line-height: 1.3;
}

.femsq-table__chrome-commands {
  margin-left: auto;
}

.femsq-table__filters-active {
  color: var(--q-primary);
  line-height: 1;
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

/* Sticky header inside fill viewport; separate borders avoid th/td drift */
.femsq-table--fill :deep(table.q-table) {
  border-collapse: separate;
  border-spacing: 0;
}

.femsq-table--fill :deep(thead tr > th) {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--fequlib-table-header-bg, var(--femsq-bg-elevated, #ffffff));
  color: var(--fequlib-table-header-color, var(--femsq-text, inherit));
  background-clip: padding-box;
}

.femsq-table__th {
  vertical-align: top;
  color: var(--fequlib-table-header-color, var(--femsq-text, inherit));
}

/* Hide Quasar default sort glyph — arrow lives in sort-slot */
.femsq-table :deep(thead th .q-table__sort-icon) {
  display: none !important;
}

.femsq-table__header-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
  color: var(--fequlib-table-header-color, var(--femsq-text, inherit));
}

.femsq-table__header-row1 {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  min-height: var(--fequlib-table-header-h);
  min-width: 0;
}

.femsq-table__header-label {
  flex: 1 1 auto;
  min-width: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fequlib-table-header-color, var(--femsq-text, inherit));
}

.femsq-table__sort-slot {
  flex: 0 0 var(--fequlib-table-sort-slot-w);
  width: var(--fequlib-table-sort-slot-w);
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  opacity: 0.85;
}

/* Reserved for future multi-sort index digit */
.femsq-table__sort-index {
  flex: 0 0 0.55rem;
  width: 0.55rem;
  min-height: 1em;
  font-size: 0.65rem;
  line-height: 1;
  text-align: right;
}

.femsq-table__sort-arrow {
  flex: 0 0 auto;
}

.femsq-table__col-filter {
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  min-height: var(--fequlib-table-filter-row-h);
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
