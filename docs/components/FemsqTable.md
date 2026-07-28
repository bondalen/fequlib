# FemsqTable

Тонкая обёртка над Quasar `QTable`: единый контракт фильтрации/сортировки/форматирования.

**Пакет:** `fequlib` · **импорт:** `import { FemsqTable, actionsColumn } from 'fequlib'`

## Контракт (фазы A–B)

| Принцип | Суть |
|---|---|
| `cellText(row, col)` | `col.format ? col.format(value, row) : String(value ?? '')` |
| `filterValue?: (row) => string` | Для `#body-cell-*`, если колонка в поиске; иначе `filterable: false` или dev-warning |
| `actionsColumn()` | `filterable: false`, `sortable: false` — без UI колоночного фильтра |
| `mode: 'client' \| 'server'` | Server эмитит `@request` `{ filter, columnFilters?, sortBy, descending, page, rowsPerPage }` |
| Глобальный фильтр | `v-model:filter` / `showFilter` — подстрока по всем `filterable`-колонкам |
| Поколоночные фильтры (B) | Под заголовком у колонок с `filterable !== false`; `v-model:columnFilters`; AND с глобальным |
| `showColumnFilters` | Опционально выключить UI колоночных фильтров (по умолчанию `true`) |
| Additive-first | Новые API только опциональные |

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
