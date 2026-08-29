# FemsqTable

Тонкая обёртка над Quasar `QTable`: единый контракт фильтрации/сортировки/форматирования.

**Пакет:** `fequlib` · **импорт:** `import { FemsqTable, actionsColumn, moneyColumn, formatMoney, type FemsqTableColumn } from 'fequlib'`

**Визуал / распределение с хостом:** [design/FemsqTable-visual-target.md](../design/FemsqTable-visual-target.md) (тема продукта ≠ хроматика грида; DX — эталон плотности, не палитры).

## Контракт (фазы A–B + generic Row)

| Принцип | Суть |
|---|---|
| Generic `Row` | `rows: Row[]`, `columns: FemsqTableColumn<Row>[]`; `@row-click` отдаёт `Row` |
| `FemsqTableRowBase` | `Record<string, any>` — DTO-интерфейсы без index signature без `as unknown as` |
| `cellText(row, col)` | `col.format ? col.format(value, row) : valueKind==='money' ? formatMoney(value) : String(value ?? '')` |
| `valueKind: 'money'` | ru-RU через [formatMoney](./format-money.md): пробел — разделитель тысяч, запятая — дробная часть (`186961.48` → `186 961,48`) |
| `moneyColumn({ name, label, field })` | хелпер: `align: 'right'`, `valueKind: 'money'` |
| `filterValue?: (row) => string` | Для `#body-cell-*`, если колонка в поиске; иначе `filterable: false` или dev-warning |
| `actionsColumn()` | `filterable: false`, `sortable: false` — без UI колоночного фильтра |
| `mode: 'client' \| 'server'` | Server эмитит `@request` `{ filter, columnFilters?, sortBy, descending, page, rowsPerPage }` |
| Глобальный фильтр | `v-model:filter` / `showFilter` — подстрока по всем `filterable`-колонкам |
| Поколоночные фильтры (B) | Под заголовком у колонок с `filterable !== false`; `v-model:columnFilters`; AND с глобальным |
| `fill` (срез **0012**) | Опционально: заполнить высоту родителя, скролл тела в `.q-table__middle`; default `false` |
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

### Денежные колонки (valueKind, v0.1.2)

```ts
import { FemsqTable, moneyColumn, formatMoneyOrDash, type FemsqTableColumn } from 'fequlib';

const columns: FemsqTableColumn<MyRow>[] = [
  moneyColumn({ name: 'amount', label: 'Сумма', field: 'amount' }),
  // эквивалент:
  { name: 'debt', label: 'Долг', field: 'debt', valueKind: 'money', align: 'right' }
];
```

- **Отображение в гриде:** `FemsqTable` прокидывает `formatMoney` в `col.format` для QTable (иначе `valueKind` не влиял бы на ячейку).
- **Фильтр:** через `cellText` → та же отформатированная строка (`186 961,48`).
- Сортировка — по **сырому** значению поля (`compareCellValues`), не по тексту ячейки.
- Вне таблицы (key-value): `formatMoneyOrDash(row.debt)` — см. [format-money.md](./format-money.md).

Агрегатные предикаты (COUNT/EXISTS) — обычные колонки строки, не единственный UI-тумблер.

### Поколоночные фильтры

- Текст, case-insensitive `includes`, через тот же `filterValue` / `cellText`, что и глобальный поиск.
- Client: фильтрация внутри компонента. Server: значения уходят в `@request.columnFilters` (поле опционально; отсутствие = нет активных колоночных фильтров).
- Кастомный `#header-cell-*` у родителя перекрывает встроенный UI фильтра для этой колонки.

### Fill-layout (`fill`, срез **0012**)

Опциональный boolean, **default `false`** (additive-first). Когда `true`:

1. Корень `.femsq-table--fill`: `height: 100%`, `min-width: 0`, `overflow: hidden`.
2. `QTable` занимает оставшуюся высоту под toolbar фильтра; скроллится **`.q-table__middle`** (шапка таблицы остаётся над телом — поведение Quasar card + bounded height).
3. Без `fill` — размер по контенту (master-списки без сплиттера не схлопываются).

Хост:

```vue
<div class="fill-pane"><!-- height:100%; min-height:0; overflow:hidden -->
  <FemsqTable fill class="fit" :rows="…" :columns="…" :show-filter="false" />
</div>
```

- `class="fit"` попадает на `QTable` (attrs) и помогает дотянуть карточку; **обязателен prop `fill`** на корне FemsqTable — одного `fit` недостаточно.
- Не ставить вторую обёртку с `overflow: auto` вокруг таблицы при `fill` (двойной скролл).
- Это **срез** задачи **0012** (viewport в flex/splitter), не полный wide Excel Rslt preview и не sticky/DX (**0011**).

## Дизайн: что в lib, что в хосте

| В fequlib | В приложении-потребителе |
|-----------|-------------------------|
| Контракт filter/sort/columnFilters | Тема (light/dark), цвета, шрифты |
| Метрики `--fequlib-table-*` + sticky header/filter-row — задача **0011** | Переопределение тех же токенов под продукт |
| Viewport containment / wide scroll — **0012** | Flex-хост: `min-width: 0`, высота рамки |
| **`fill`** (срез **0012**, 2026-08-24) | Родитель с ограниченной высотой (flex/splitter/`height:100%` + `overflow:hidden`); **не** дублировать `overflow:auto` на обёртке |
| Multiline header / `@cell-click` — **0013**, **0014** | Chrome (TopBar/StatusBar), Quasar brand |

Не хардкодить бренд-цвета в lib. Эталоны DX: `docs/assets/devexpress-grid/`.

## Границы

- **Group By** — группировка плоских строк по колонке (фаза D).
- **Иерархия** — не этот компонент. Nested outline: [`FemsqTree`](./FemsqTree.md) (v1). Колоночный TreeList — отдельно, позже.
- **Filter Editor** (фаза F) — не этот MVP.
- **Тема продукта** — не fequlib (см. visual-target).

## Потребители (FEMSQ)

| Форма | Файл / роль |
|---|---|
| Стройки · перечень | `ConstructionSitesView.vue` |
| Стройки · отчёты | `CstReportsTab.vue` |
| Стройки · аренда | `CstRentReportsTab.vue` |
| СУДЗ · КСДСФ / КСДД | `SudzSfDoubleView`, `SudzInvDbtDoubleView` — `moneyColumn`, `formatMoneyOrDash` (v0.1.2) |
| СУДЗ · предпросмотр Rslt | **не** FemsqTable — native HTML-grid (см. gaps ниже) |

Подробнее: FEMSQ `docs/development/notes/UI/02-8_femsq-table-component.md`, `02-9_sudz-mvp-screens.md`.

## Ограничения / known gaps (FEMSQ SUDZ 2026-08-08)

Фазы A–B (`filter` / `sort` / `showColumnFilters` / `columnFilters` / `mode` / `@request` / `@row-click`) хватает master-спискам. Для **wide Excel-like preview** (десятки колонок, viewport scroll, клик по ячейке → detail) FemsqTable на 2026-08-08 **не подошёл** — FEMSQ держит предпросмотр Rslt на native grid.

| # | Потребность | Сейчас | Зачем (Rslt preview) | Задача |
|---|-------------|---------|----------------------|--------|
| 1 | **Viewport containment** + H/V scroll без раздувания родителей (`min-width: 0`, рамка с собственным overflow) | Срез **`fill`** (2026-08-24): V-scroll в flex/splitter; H-scroll / wide Rslt — ещё открыто | Много колонок срезов Rslt | **0012** |
| 2 | **Sticky header** (+ ideally sticky filter-row) внутри viewport | В visual-target заявлено; в CSS/коде sticky **нет** | Длинный список строк | **0011** |
| 3 | **Multiline / wrap заголовков** (2–3 строки, clamp) | `.femsq-table__header-label { white-space: nowrap }` | Длинные подписи Excel (`2026. II-й квартал…`) | **0013** |
| 4 | **`@cell-click`** (или эквивалент) с `(row, column, value/text)` | Только `@row-click`; ячейка — через `#body-cell-*` + свой click | Нижняя detail-панель текста ячейки | **0014** |
| 5 | Согласованность **sticky + границы колонок** (избегать sticky + `border-collapse: collapse`) | Уточнить при реализации на QTable/обёртке | th/td не разъезжаются при H-scroll | **0011** |

Опционально (ниже приоритетом, не блокер MVP): band/`headerClasses` для групп колонок; freeze левых колонок.

**Уведомление FEMSQ:** при закрытии **0011–0014** — ping потребителя (задача **0015**; канал: план СУДЗ / changelog fequlib). До этого Rslt preview осознанно на native grid. Детали: [chat-plan-26-0808-sudz-gaps.md](../development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md).
