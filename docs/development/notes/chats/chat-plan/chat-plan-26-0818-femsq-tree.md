# План: FemsqTree v1

**Дата создания:** 2026-08-18  
**Последнее обновление:** 2026-08-18  
**Проект:** feQuLib  
**Версия плана:** 0.1.0  
**Статус:** 🔄 D0 (docs + registry) выполнен в этом шаге; реализация не начата  
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

### D1 — Чистые функции ⬜

- [ ] `src/components/tree/femsq-tree.ts`: `getNodeKey`, `getChildren`, `isLeaf`, `shouldLoad`
- [ ] `src/components/tree/femsq-tree.test.ts` (Vitest node)
- [ ] `npm test` зелёный

### D2 — Vue SFC ⬜

- [ ] `FemsqTree.vue` (корень, v-model, empty/loading корня, проброс слотов)
- [ ] `FemsqTreeNode.vue` (`name: 'FemsqTreeNode'`, рекурсия + явный проброс слотов)
- [ ] семантика selected vs expanded vs leaf vs lazy — как в контракте
- [ ] `--fequlib-tree-*` в scoped CSS; Quasar-примитивы (`QBtn`, `QSpinner`), не `QTree`

### D3 — Публичный экспорт ⬜

- [ ] `src/index.ts` — `FemsqTree` + типы/хелперы
- [ ] `types/index.d.ts` — рукописные декларации (как у таблицы)
- [ ] `npm run typecheck` зелёный

### D4 — Синхронизация docs после кода ⬜

- [ ] сверить `FemsqTree.md` с фактическим API
- [ ] отметить исполненное в этом плане
- [ ] при необходимости `task update --status` для 0016 (не закрывать до smoke на хосте)

### H1 — Хост FEMSQ (не этот репозиторий) ⬜

- подключить `FemsqTree` на `sudz-sf-double` вместо нижней карточки `QMarkupTable`
- хост владеет `nodes` / `@load` / составными ключами
- оценка: нужен ли позже колоночный TreeList для «Договоры» / агентов

## 4. Порядок реализации

1. D0 docs + registry (этот шаг) → ответ в exchange.  
2. **Не начинать D1, пока FEMSQ не прочитает exchange-ответ D0** (этот файл).  
3. D1 → D2 → D3 в одном рабочем цикле feQuLib, отмечая чекбоксы здесь.  
4. D4 сразу после кода, в том же цикле.  
5. H1 — окно FEMSQ; feQuLib только сопровождает контракт.

Реализация снизу вверх, как `FemsqTable`: алгоритмы и тесты раньше вёрстки.

## 5. Критерии готовности v1 (lib)

- [ ] Контракт в `docs/components/FemsqTree.md` совпадает с кодом
- [ ] Экспорт `import { FemsqTree } from 'fequlib'`
- [ ] `npm test` и `npm run typecheck` без регрессии таблицы
- [ ] Default: `expandOnClick=false`; detail по `selectedKey`; дети по `expandedKeys`
- [ ] `@load` только при `lazy` + не leaf + `children === undefined`
- [ ] Нет доменных типов FEMSQ в lib
- [ ] Задача **0016** обновлена по статусу; закрытие — после smoke H1 или по договорённости с хостом

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

**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-18
