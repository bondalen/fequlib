# FemsqTable

Тонкая обёртка над Quasar `QTable`: единый контракт фильтрации/сортировки/форматирования.

**Пакет:** `fequlib` · **импорт:** `import { FemsqTable, actionsColumn, type FemsqTableColumn } from 'fequlib'`

**Визуал / распределение с хостом:** [design/FemsqTable-visual-target.md](../design/FemsqTable-visual-target.md) (тема продукта ≠ хроматика грида; DX — эталон плотности, не палитры).

## Контракт (фазы A–B + generic Row)

| Принцип | Суть |
|---|---|
| Generic `Row` | `rows: Row[]`, `columns: FemsqTableColumn<Row>[]`; `@row-click` отдаёт `Row` |
| `FemsqTableRowBase` | `Record<string, any>` — DTO-интерфейсы без index signature без `as unknown as` |
| `cellText(row, col)` | `col.format ? col.format(value, row) : String(value ?? '')` |
| `filterValue?: (row) => string` | Для `#body-cell-*`, если колонка в поиске; иначе `filterable: false` или dev-warning |
| `actionsColumn()` | `filterable: false`, `sortable: false` — без UI колоночного фильтра |
| `mode: 'client' \| 'server'` | Server эмитит `@request` `{ filter, columnFilters?, sortBy, descending, page, rowsPerPage }` |
| Глобальный фильтр | `v-model:filter` / `showFilter` — подстрока по всем `filterable`-колонкам |
| Поколоночные фильтры (B) | Под заголовком у колонок с `filterable !== false`; `v-model:columnFilters`; AND с глобальным |
| Additive-first | Новые API только опциональные |

```ts
import { FemsqTable, type FemsqTableColumn } from 'fequlib';
import type { ConstructionSiteDto } from '@/types/...';

const columns: FemsqTableColumn<ConstructionSiteDto>[] = [
  { name: 'cstName', label: 'Имя', field: 'cstName' },
  { name: 'cstKey', label: 'Key', field: 'cstKey' }
];

// template: <FemsqTable :rows="sites" :columns="columns" @row-click="onClick" />
function onClick(_e: Event, row: ConstructionSiteDto) { /* row типизирован */ }
```

Агрегатные предикаты (COUNT/EXISTS) — обычные колонки строки, не единственный UI-тумблер.

### Поколоночные фильтры

- Текст, case-insensitive `includes`, через тот же `filterValue` / `cellText`, что и глобальный поиск.
- Client: фильтрация внутри компонента. Server: значения уходят в `@request.columnFilters` (поле опционально; отсутствие = нет активных колоночных фильтров).
- Кастомный `#header-cell-*` у родителя перекрывает встроенный UI фильтра для этой колонки.

## Дизайн: что в lib, что в хосте

| В fequlib | В приложении-потребителе |
|-----------|-------------------------|
| Контракт filter/sort/columnFilters | Тема (light/dark), цвета, шрифты |
| Метрики `--fequlib-table-*` + sticky header/filter-row — задача **0011** | Переопределение тех же токенов под продукт |
| Viewport containment / wide scroll — **0012** | Flex-хост: `min-width: 0`, высота рамки |
| Multiline header / `@cell-click` — **0013**, **0014** | Chrome (TopBar/StatusBar), Quasar brand |

Не хардкодить бренд-цвета в lib. Эталоны DX: `docs/assets/devexpress-grid/`.

## Границы

- **Group By** — группировка плоских строк по колонке (фаза D).
- **Иерархия** (TreeList) — не этот компонент.
- **Filter Editor** (фаза F) — не этот MVP.
- **Тема продукта** — не fequlib (см. visual-target).

## Потребители (FEMSQ)

| Форма | Файл / роль |
|---|---|
| Стройки · перечень | `ConstructionSitesView.vue` |
| Стройки · отчёты | `CstReportsTab.vue` |
| Стройки · аренда | `CstRentReportsTab.vue` |
| СУДЗ · списки (годы, долги, стройки) | FemsqTable — ок (фазы A–B) |
| СУДЗ · предпросмотр Rslt | **не** FemsqTable — native HTML-grid (см. gaps ниже) |

Подробнее: FEMSQ `docs/development/notes/UI/02-8_femsq-table-component.md`, `02-9_sudz-mvp-screens.md`.

## Ограничения / known gaps (FEMSQ SUDZ 2026-08-08)

Фазы A–B (`filter` / `sort` / `showColumnFilters` / `columnFilters` / `mode` / `@request` / `@row-click`) хватает master-спискам. Для **wide Excel-like preview** (десятки колонок, viewport scroll, клик по ячейке → detail) FemsqTable на 2026-08-08 **не подошёл** — FEMSQ держит предпросмотр Rslt на native grid.

| # | Потребность | Сейчас | Зачем (Rslt preview) | Задача |
|---|-------------|---------|----------------------|--------|
| 1 | **Viewport containment** + H/V scroll без раздувания родителей (`min-width: 0`, рамка с собственным overflow) | Нет контракта «wide grid in flex host» | Много колонок срезов Rslt | **0012** |
| 2 | **Sticky header** (+ ideally sticky filter-row) внутри viewport | В visual-target заявлено; в CSS/коде sticky **нет** | Длинный список строк | **0011** |
| 3 | **Multiline / wrap заголовков** (2–3 строки, clamp) | `.femsq-table__header-label { white-space: nowrap }` | Длинные подписи Excel (`2026. II-й квартал…`) | **0013** |
| 4 | **`@cell-click`** (или эквивалент) с `(row, column, value/text)` | Только `@row-click`; ячейка — через `#body-cell-*` + свой click | Нижняя detail-панель текста ячейки | **0014** |
| 5 | Согласованность **sticky + границы колонок** (избегать sticky + `border-collapse: collapse`) | Уточнить при реализации на QTable/обёртке | th/td не разъезжаются при H-scroll | **0011** |

Опционально (ниже приоритетом, не блокер MVP): band/`headerClasses` для групп колонок; freeze левых колонок.

**Уведомление FEMSQ:** при закрытии **0011–0014** — ping потребителя (задача **0015**; канал: план СУДЗ / changelog fequlib). До этого Rslt preview осознанно на native grid. Детали: [chat-plan-26-0808-sudz-gaps.md](../development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md).
