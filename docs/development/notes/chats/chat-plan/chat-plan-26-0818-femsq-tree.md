# План: FemsqTree v1

**Дата создания:** 2026-08-18  
**Последнее обновление:** 2026-08-24 (post-H1: toggle selected; fill-layout срез **0012**)  
**Проект:** feQuLib  
**Версия плана:** 0.3.2  
**Статус:** ✅ D0–D4 + H1 (`sudz-sf-double`); задача **0016** закрыта; UX toggle selected + `fill` — уточнения контракта v1, не новая фаза  
**Контракт:** [FemsqTree.md](../../../components/FemsqTree.md)  
**Задача registry:** **0016** (проект `fequlib`)  
**Связь FEMSQ:** экран `sudz-sf-double` (правый нижний блок); обмен `agent-exchange/femsq-fequlib/`  
**База контракта:** exchange `2026-08-18_1230_fequlib_to_femsq_tree-v1-contract-response.md` (принято хостом 12:29)

## 0. Зачем

FEMSQ нужен универсальный nested-tree (заголовок / деталь / дети) сначала на `sudz-sf-double`, затем на других экранах. Это **не** режим `FemsqTable` и **не** колоночный TreeList. Домен (`inv`, `cn`, `Dbt`, …) остаётся в хосте; lib даёт renderer.

## 1. Цель

1. Зафиксировать контракт `FemsqTree` v1 в docs и registry.  
2. Реализовать компонент по контракту (чистые функции → SFC → экспорт/типы).  
3. Отдать FEMSQ smoke-API для `sudz-sf-double` через существующую `file:`-зависимость.  
4. Не обещать колоночный `FemsqTreeList` (агенты / стороны договора) в этом плане.

## 2. Scope / вне scope

**В scope v1**

- `FemsqTree` + рекурсивный `FemsqTreeNode`
- props: `nodes`, `nodeKey`, `childrenKey`, `leafKey`, `expandedKeys`, `selectedKey`, `loadingKeys`, `indent`, `expandOnClick` (default **false**), `selectable`, `lazy`, `rootClass`
- слоты: `#header`, `#detail`, `#empty`, `#loading`, `#toggle`
- события: `update:*`, `node-click`, `toggle`, `load`
- CSS-токены `--fequlib-tree-*` (плотность/indent), без бренд-цветов
- unit-тесты чистых функций в текущем Vitest (node)

**Вне scope v1**

- multi-select / `selectedKeys`, checkbox/tick, DnD
- tree-table / `FemsqTreeList`
- keyboard/ARIA tree целиком, virtualization, filter внутри дерева, accordion
- обёртка над Quasar `QTree`
- CRUD в API компонента
- jsdom / SFC UI-тесты
- зависимость от задачи **0011** (хроматика `FemsqTable`)
- домен FEMSQ в lib

## 3. Фазы

### D0 — Документация и registry ✅

- [x] План `docs/development/notes/chats/chat-plan/chat-plan-26-0818-femsq-tree.md`
- [x] Контракт `docs/components/FemsqTree.md`
- [x] `docs/roadmap.md` + `docs/README.md`
- [x] Задача docs-registry **0016** (проект `fequlib`)
- [x] Exchange-ответ FEMSQ (после D0, до кода)

### D1 — Чистые функции ✅

- [x] `src/components/tree/femsq-tree.ts`: `getNodeKey`, `getChildren`, `isLeaf`, `shouldLoad`
- [x] `src/components/tree/femsq-tree.test.ts` (Vitest node)
- [x] `npm test` зелёный

### D2 — Vue SFC ✅

- [x] `FemsqTree.vue` (корень, v-model, empty/loading корня, проброс слотов)
- [x] `FemsqTreeNode.vue` (`name: 'FemsqTreeNode'`, рекурсия + явный проброс слотов)
- [x] семантика selected vs expanded vs leaf vs lazy — как в контракте
- [x] `--fequlib-tree-*` в scoped CSS; Quasar-примитивы (`QBtn`, `QSpinner`), не `QTree`

### D3 — Публичный экспорт ✅

- [x] `src/index.ts` — `FemsqTree` + типы/хелперы
- [x] `types/index.d.ts` — рукописные декларации (как у таблицы)
- [x] `npm run typecheck` зелёный

### D4 — Синхронизация docs после кода ✅

- [x] сверить `FemsqTree.md` с фактическим API
- [x] отметить исполненное в этом плане
- [x] `task update` описания **0016** (закрыта после H1, 2026-08-18)

### H1 — Хост FEMSQ (не этот репозиторий) ✅

- [x] подключить `FemsqTree` на `sudz-sf-double` (предварительный smoke 2026-08-18, `upl=910` / `inv=85069`)
- [x] полный smoke: наполнение узлов vs БД (стороны / СГК / ДЗ) — хост; расхождений lib нет
- [ ] оценка: нужен ли позже колоночный TreeList для «Договоры» / агентов — не этот план; FEMSQ обратится отдельно

## 4. Порядок реализации

1. D0 docs + registry (этот шаг) → ответ в exchange.  
2. **Не начинать D1, пока FEMSQ не прочитает exchange-ответ D0** (этот файл).  
3. D1 → D2 → D3 в одном рабочем цикле feQuLib, отмечая чекбоксы здесь.  
4. D4 сразу после кода, в том же цикле.  
5. H1 — окно FEMSQ; feQuLib только сопровождает контракт.

Реализация снизу вверх, как `FemsqTable`: алгоритмы и тесты раньше вёрстки.

## 5. Критерии готовности v1 (lib)

- [x] Контракт в `docs/components/FemsqTree.md` совпадает с кодом
- [x] Экспорт `import { FemsqTree } from 'fequlib'`
- [x] `npm test` и `npm run typecheck` без регрессии таблицы
- [x] Default: `expandOnClick=false`; detail по `selectedKey`; дети по `expandedKeys`
- [x] Header-click при `selectable` переключает `selectedKey` (повторный клик → `null`, `#detail` скрыт) — post-H1, 2026-08-24
- [x] `@load` только при `lazy` + не leaf + `children === undefined`
- [x] Нет доменных типов FEMSQ в lib
- [x] Задача **0016** закрыта после smoke H1 на `sudz-sf-double` (2026-08-18)

## 6. Связь с FEMSQ

| Тема | Где |
|---|---|
| Первый экран | `SudzSfDoubleView.vue`, правый нижний блок вкладки «Счета-фактуры» |
| Целевой UX узлов | FEMSQ `docs/.../sudz-sf-double-tree.md` (заголовок / деталь / вложенность) |
| Обмен | `/mnt/nb-win-share/agent-exchange/femsq-fequlib/` |
| Не этот план | колоночные деревья агентов и сторон договора |

## 7. Отметки исполнения

| Когда | Что |
|---|---|
| 2026-08-18 | D0: план, контракт, roadmap, README, registry **0016**. Код Tree не писался. |
| 2026-08-18 | D1–D4: runtime `FemsqTree` + тесты хелперов + экспорт/types. **0016** не закрыта (ждём H1). |
| 2026-08-18 | H1 финал: сверка узлов с БД ок; правок runtime нет; **0016** → completed. |
| 2026-08-24 | Post-H1 уточнение UX: повторный header-click по выбранному узлу → `selectedKey = null`, `#detail` сворачивается. Не новая фаза; API не расширяли. Код: `toggleSelectedKey` + `onHeaderClick`. Docs: `FemsqTree.md`. Exchange: `2026-08-24_1102_femsq_to_fequlib_docs-femsq-tree-toggle-selected.md`. |
| 2026-08-24 | Срез **0012** fill-layout: prop `fill` (default false) — дерево заполняет родителя, скролл в `.femsq-tree__nodes`. Exchange: `2026-08-24_1315_femsq_to_fequlib_fill-layout-table-and-tree.md`. Хост снимает `.relation-tree-scroll` после `fill`. |

**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-18
