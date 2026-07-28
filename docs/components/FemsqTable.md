# FemsqTable

Тонкая обёртка над Quasar `QTable`: единый контракт фильтрации/сортировки/форматирования.

**Пакет:** `fequlib` · **импорт:** `import { FemsqTable, actionsColumn } from 'fequlib'`

## Контракт (фаза A)

| Принцип | Суть |
|---|---|
| `cellText(row, col)` | `col.format ? col.format(value, row) : String(value ?? '')` |
| `filterValue?: (row) => string` | Для `#body-cell-*`, если колонка в поиске; иначе `filterable: false` или dev-warning |
| `actionsColumn()` | `filterable: false`, `sortable: false` |
| `mode: 'client' \| 'server'` | Server эмитит `@request` `{ filter, sortBy, descending, page, rowsPerPage }` |
| Additive-first | Новые API только опциональные |

Агрегатные предикаты (COUNT/EXISTS) — обычные колонки строки, не единственный UI-тумблер.

## Границы

- **Group By** — группировка плоских строк по колонке (фаза D).
- **Иерархия** (TreeList) — не этот компонент.

## Потребители (FEMSQ)

| Форма | Файл |
|---|---|
| Стройки · перечень | `ConstructionSitesView.vue` |
| Стройки · отчёты | `CstReportsTab.vue` |
| Стройки · аренда | `CstRentReportsTab.vue` |

Подробнее в FEMSQ: `docs/development/notes/UI/02-8_femsq-table-component.md`.
