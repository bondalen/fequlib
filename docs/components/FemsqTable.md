# FemsqTable

Тонкая обёртка над Quasar `QTable`: единый контракт фильтрации/сортировки/форматирования.

**Пакет:** `fequlib` · **импорт:** `import { FemsqTable, actionsColumn, type FemsqTableColumn } from 'fequlib'`

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

## Границы

- **Group By** — группировка плоских строк по колонке (фаза D).
- **Иерархия** (TreeList) — не этот компонент.
- **Filter Editor** (фаза F) — не этот MVP.

## Потребители (FEMSQ)

| Форма | Файл |
|---|---|
| Стройки · перечень | `ConstructionSitesView.vue` |
| Стройки · отчёты | `CstReportsTab.vue` |
| Стройки · аренда | `CstRentReportsTab.vue` |

Подробнее в FEMSQ: `docs/development/notes/UI/02-8_femsq-table-component.md`.
