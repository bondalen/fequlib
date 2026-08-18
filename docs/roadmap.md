# Roadmap feQuLib

## Сделано

- [x] Фаза A: `FemsqTable` (client filter/sort, `actionsColumn`, `mode`/`@request`)
- [x] Потребление из FEMSQ (`file:../../../feQuLib`)
- [x] GitHub: https://github.com/bondalen/fequlib
- [x] Projectize: `docs/` + `.cursorrules` + задачи в docs-registry
- [x] Фаза B: поколоночные текстовые фильтры (AND с глобальным; `columnFilters` в `@request`)
- [x] Unit-тесты контракта filter/sort (`vitest`, задача 0004)
- [x] Generic `Row` / `FemsqTableColumn<Row>` (задача 0003; без `as unknown as Record…`)
- [x] Docs: known gaps СУДЗ + backlog **0011–0015** (2026-08-08; код — отдельно)
- [x] docs-registry канон на VPS (`10.7.0.1`); локальный `docs-registry-pg` снят (2026-08-09, M0–M6)
- [x] `FemsqTree` v1: nested outline + H1 на FEMSQ `sudz-sf-double` (задача **0016**, 2026-08-18)

## Backlog (задачи в registry)

| Код | Тема | Приоритет |
|---|---|---|
| 0003 | Generic `rows`/`columns` (убрать `as unknown as Record…`) | ~~medium~~ **done** |
| 0004 | Unit-тесты: cellText / filter / sort | ~~medium~~ **done** |
| 0005 | Фаза B: поколоночные фильтры | ~~medium~~ **done** |
| **0011** | **Visual + sticky: DX-эталоны, `--fequlib-table-*`, sticky header/filter-row** | **high** |
| **0012** | **Wide-scroll / host viewport contract** (containment, overflow) | **high** |
| **0013** | Multiline / wrap заголовков (2–3 строки, clamp) | medium |
| **0014** | `@cell-click` API `(row, column, value/text)` | medium |
| **0015** | Уведомить FEMSQ (СУДЗ Rslt preview) после 0011–0014 | medium |
| 0016 | `FemsqTree` v1 (nested outline, H1 `sudz-sf-double`) | ~~high~~ **done** |
| 0006 | Фаза C: аудит остальных гридов потребителей | low |
| 0007 | Фаза D: Group By (плоские строки) | low |
| 0008 | Фазы E–G: column chooser / Filter Editor / server-side точечно | low |
| 0009 | Упаковка Quasar App Extension (когда ≥2 потребителя) | low |

План визуала: [chat-plan-26-0729-femsq-table-visual.md](./development/notes/chats/chat-plan/chat-plan-26-0729-femsq-table-visual.md) · бриф [design/FemsqTable-visual-target.md](./design/FemsqTable-visual-target.md).  
План дерева: [chat-plan-26-0818-femsq-tree.md](./development/notes/chats/chat-plan/chat-plan-26-0818-femsq-tree.md) · контракт [components/FemsqTree.md](./components/FemsqTree.md).

Gaps SUDZ / wide preview: [chat-plan-26-0808-sudz-gaps.md](./development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md) · секция в [FemsqTable.md](./components/FemsqTable.md).

Миграция registry: [chat-plan-26-0809-docs-registry-vps.md](./development/notes/chats/chat-plan/chat-plan-26-0809-docs-registry-vps.md) · резюме [chat-resume-26-0809-sudz-gaps-registry-vps.md](./development/notes/chats/chat-resume/chat-resume-26-0809-sudz-gaps-registry-vps.md).

## Рекомендации (очередь)

1. **0011 + 0012** вместе (sticky бесполезен без viewport containment в flex-хосте).  
2. **0013**, **0014** — для возврата Rslt preview на FemsqTable.  
3. **0015** — обязательный ping FEMSQ с версией/коммитом fequlib.  
4. Инфра registry: при сбое CLI — WG, потом `docker start fedoc-postgres-age`; не локальный `:5433`.

## Future (не сейчас)

- `FemsqTreeList` — колоночное дерево (агенты / стороны договора); отдельное обоснование, не режим `FemsqTree` v1.

## Принцип

Additive-first; не ломать FEMSQ без deprecate-цикла.

**Дизайн:** тема/цвета/шрифты — у хоста; хроматика грида (плотность, высоты) — у fequlib через CSS-переменные. Не дублировать тему продукта в библиотеке.
