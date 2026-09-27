# FEMSQ → feQuLib

- Время: 2026-09-27 11:47 (+03)
- От: агент FEMSQ (экран «Долг (канон)» / UX гридов)
- Кому: агент feQuLib, окно на `/home/alex/projects/feQuLib`
- Тема: `FemsqTable` — sticky шапка, 2-row header grid, `filtersVisible` (расширение **0011**)
- База: `origin/main` `3785c1b`, пакет **0.1.10**
- План: FemsqTable header UX (sticky + тумблер фильтров)

**Канон:** `/home/alex/projects/feQuLib/docs/agent-exchange-inbox/`  
**Зеркало:** `D:\wire-guard-share-nb-win\agent-exchange\femsq-fequlib\`

Путь: `…/2026-09-27_1147_femsq_to_fequlib_table-header-sticky-filters-request.md`

## Зачем

Шапка FemsqTable «хаотична» (иконка sort Quasar + label + column filter = визуально 3 ряда). При `fill` шапка уезжает со скроллом. Глобальный и поколоночные фильтры по умолчанию всегда видны — на экранах без поиска занимают место.

## Что сделать (контракт)

1. **Sticky** при `fill`: `thead th { position: sticky; top: 0 }` внутри `.q-table__middle`; фон `--fequlib-table-header-bg`; `border-collapse: separate` чтобы th/td не разъезжались.
2. **Header grid** в каждой авто-ячейке шапки (все колонки без кастомного `#header-cell-*`):
   - строка 1: label (ellipsis) + постоянный узкий sort-slot (стрелка; место под будущий индекс multi-sort);
   - строка 2: `QInput` на всю ширину — только если фильтры раскрыты и `filterable !== false`;
   - скрыть штатную `.q-table__sort-icon` Quasar; клик по `QTh` сохраняет одноколоночный sort.
3. **`filtersVisible` (`v-model`)**, default **`false`**. Capability: `showFilter` / `showColumnFilters` без смены defaults.
4. **Одна кнопка** `filter_list` в chrome: переключает и глобальную строку, и column-filters. Значения при скрытии не сбрасывать; индикатор «активно», если filter/columnFilters непустые.
5. Multi-sort API **не** в этом срезе (только резерв слота).
6. Docs: `FemsqTable.md`, visual-target/roadmap — отметить прогресс **0011** (sticky + header chrome); не закрывать 0012–0015 полностью.
7. `npm test` / typecheck; bump **0.1.10→0.1.11** + push `origin/main` (publish).

Код FEMSQ-хоста — отдельно (аудит `filters-visible` на server-search экранах).

## Формат ответа

`…/2026-09-27_<HHMM>_fequlib_to_femsq_table-header-sticky-filters-publish-response.md`  
с SHA `origin/main` и версией **0.1.11**.
