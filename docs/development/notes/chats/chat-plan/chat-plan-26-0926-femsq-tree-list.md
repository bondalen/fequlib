# План: FemsqTreeList

**Дата создания:** 2026-09-26  
**Последнее обновление:** 2026-09-28 (публикация L5.2 nav-zone resize hit-area, пакет **0.1.18**)  
**Проект:** feQuLib  
**Версия плана:** 0.1.10  
**Статус:** на `origin/main` пакет **0.1.18**. L5.2: hit-area ручки левой зоны (≥ высоты строки). Задачи **0016** / **0018** не закрыты. SHA `HEAD` — в задаче **0018** и в ответе обмена.  
**Контракт:** [FemsqTreeList.md](../../../components/FemsqTreeList.md)  
**Задача registry:** **0018** (следующий код после занятых **0016** и **0017**, не номер FEMSQ)  
**База, которую не ломаем:** [chat-plan-26-0818-femsq-tree.md](./chat-plan-26-0818-femsq-tree.md) — `FemsqTree` v1, задача **0016**. Там зафиксировано «не обещать колоночный TreeList»; этот план его не дописывает.  
**Запрос:** `agent-exchange/femsq-fequlib/2026-09-26_1738_femsq_to_fequlib_tree-list-request.md`  
**Связь:** решение FEMSQ 009 — обходчик не живёт внутри renderer; домен и SQL остаются у хоста

## 0. Зачем

На экране D FEMSQ (загрузка платежей, вкладка «стройки новые») нужен грид-дерево: одна шапка, отступ и раскрытие в первой колонке. Тот же вид уже собран вручную в `ConstructionSitesView`, `ConstructionSitesByCodeView`, `ContractPartiesPanel`. `FemsqTree` v1 остаётся контуром (`#header` / `#detail`).

## 1. Цель

1. Второй шаблон `FemsqTreeList` на ядре `femsq-tree.ts` (ключ, дети, лист, expand, select, lazy). Не `extends`, не режим `FemsqTable`.  
2. Необязательное представление JSON-обходчика: нет поля или `outline` — как сейчас; `list` — колонки.  
3. `FemsqTree.vue` и контракт v1 не менять. Экраны outline (КСДСФ, канон) не переключать: у их JSON поля `view` нет.  
4. Код FEMSQ в этом цикле не трогать.

## 2. Scope / вне scope

**В scope**

- `FemsqTreeList` + `FemsqTreeListNode`
- колонка `FemsqTreeListColumn`: подпись, поле, формат ячейки; пустая ячейка, если поля нет
- первая колонка: отступ и кнопка раскрытия; лист без кнопки
- слот действий строки; `fill`
- `resolveWalkView` / `walkColumnsToTreeList` / `assignWalkListFields`
- колонка JSON: `label`, `field`, необязательный `level` (`table` / `edge`)
- unit-тесты чистых функций (indent, пустая ячейка, лист, outline vs list)

**Вне scope**

- фильтр, сортировка, постраничность `FemsqTable`
- виртуализация, DnD, multi-select, чекбоксы, полный keyboard/ARIA
- смена `fetchNode` / `fetchExpand`
- фильтр «правые шесть цифр кода» и очередь `cipuCacNot` в JSON и в lib
- имена таблиц хоста в `src/`
- перенос трёх ручных деревьев FEMSQ
- правка `FemsqTree` v1

## 3. Фазы

### L0 — Документация и registry

- [x] Этот план
- [x] Контракт `docs/components/FemsqTreeList.md`
- [x] Короткая отсылка в `FemsqTree.md`: колонки — TreeList, не v1
- [x] Задача **0018** в docs-registry (`in_progress`, 2026-09-26). Код **0018**: в локальном roadmap **0017** — `FemsqChart`; в самом реестре строки **0017** не было.

### L1 — Чистые функции

- [x] `femsq-tree-list.ts`: indent, ячейка, лист без toggle, уровень `table`/`edge`
- [x] `femsq-walk-view.ts`: `view` outline | list
- [x] `femsq-tree-list.test.ts`

### L2 — Vue SFC

- [x] `FemsqTreeList.vue`, `FemsqTreeListNode.vue`
- [x] ядро читается из `femsq-tree.ts`, не копируется
- [x] `fill`, sticky-шапка, общая сетка колонок (`subgrid`)

### L3 — Экспорт

- [x] `src/index.ts`, `types/index.d.ts`

### L4 — Хост FEMSQ (не этот репозиторий)

- [ ] pull `fequlib`, `check-fequlib.sh`
- [ ] на JSON нового экрана `view: "list"` и колонки; КСДСФ и канон не трогать
- [ ] `RelationTree` при `usesWalkList(spec)` рисует `FemsqTreeList`; `fetchNode` / `fetchExpand` те же
- [ ] действия строки — слот хоста

## 4. Первый потребитель (только этот план)

Правая часть вкладки «стройки новые» за вертикальным сплиттером.

Очередь слева: `cacOrNull`, `sh`, `ipCode`. Справа дерево: корни `cst` с тем же хвостом из шести цифр, дети `cstAg`, затем `cstAgPn`. Колонки: подпись, ключ, дополнение; у кода с тем же хвостом — отметка. Создание записей — слот действий хоста. Этих имён в `src/` feQuLib нет.

## 5. Критерии готовности lib

- [x] Контракт совпадает с кодом
- [x] `import { FemsqTreeList, resolveWalkView } from 'fequlib'`
- [x] `npm test` и `npm run typecheck`
- [x] Нет доменных имён стройки в `src/`
- [x] Задача **0018** записана в registry (`in_progress`; хост ещё не подключал)
- [ ] H1 на экране D — окно FEMSQ

## 6. Отметки исполнения

| Когда | Что |
|---|---|
| 2026-09-26 | Публикация lib: `d2530eb` `feat(FemsqTreeList): add columnar tree and walk list view (v0.1.5)`. Задача **0018** не закрыта. |
| 2026-09-26 | Registry: задача **0018** создана (`in_progress`), после того как WG снова достучался до `10.7.0.1`. |
| 2026-09-26 | Метка ветви: `column.level` кроме `"table"` / `"edge"` равен `node.level`. Локальный `efe4ca6`. Новая задача реестра не заводилась. **0018** не закрыта. В origin не отправлялось. |
| 2026-09-26 | Комплекты `columnSets`: число дорожек — максимум, не сумма; подпись только у первой строки группы одного уровня. Поверх `efe4ca6`. **0018** не закрыта. |
| 2026-09-26 | Публикация пакетом **0.1.6**. `efe4ca6` и `22376d1` не переписывались. Третий коммит — только версия и эта отметка. SHA `HEAD` `origin/main` — в задаче **0018** и в ответе обмена. |
| 2026-09-26 | Подписи комплекта в строке папки (дорожки 1…N); отдельная caption-строка убрана. Пакет **0.1.7**, пуша нет. |
| 2026-09-26 | Публикация пакетом **0.1.8**. `56fa130` не переписывался. Второй коммит — только версия и эта отметка. SHA `HEAD` `origin/main` — в задаче **0018** и в ответе обмена. |
| 2026-09-27 | Две зоны nav\|data: indent default 8, data min 96px, H-scroll + sticky nav, session resize, folder tokens. Пакет **0.1.8**, пуша нет. |
| 2026-09-27 | Публикация пакетом **0.1.9**. `f3d4d97` не переписывался. Второй коммит — только версия и эта отметка. SHA `HEAD` `origin/main` — в задаче **0018** и в ответе обмена. |
| 2026-09-28 | Запрос FEMSQ `1402` (пакет **0.1.16**): sticky-шапка корневого `columnSet` вместо ruler; компактный empty; one-line nav\|data. Auto-expand — план WalkTree. |
| 2026-09-28 | L5 реализован. Публикация пакетом **0.1.16** вместе с WalkTree auto-expand и Chart zoom-extra. Feature-коммит не переписывался. SHA `HEAD` `origin/main` — в задаче **0018** и в ответе обмена. |
| 2026-09-28 | UAT @11897: L5 nowrap на узлах не действовал (scoped List). Запрос `1439` → L5.1. |
| 2026-09-28 | L5.1: flex на `FemsqTreeListNode` row. Публикация пакетом **0.1.17**. Feature-коммит не переписывался. SHA `HEAD` `origin/main` — в задаче **0018** и в ответе обмена. |
| 2026-09-28 | UAT: ручка nav-зоны height 0 (`height:100%` от базы resize). Запрос `1510` → L5.2. |
| 2026-09-28 | L5.2: zone `height:auto` + stretch / min-height строки, hit 8px. Публикация пакетом **0.1.18**. Feature-коммит не переписывался. SHA `HEAD` `origin/main` — в задаче **0018** и в ответе обмена. |

### L5 — UX list после двух зон (запрос `1402`) ✅

- [x] Sticky-шапка из `columnSets[root.level]` (опц. `headerLevel`); ruler не оставлять пустым
- [x] Empty: не показывать при `children === undefined`; стиль меньше содержательных подписей
- [x] One-line: nav|data без вертикального разъезда; лёгкая плотность строк
- [x] Docs `FemsqTreeList.md`
- [x] Релиз вместе с WalkTree auto-expand + Chart zoom → **0.1.16**

### L5.1 — flex на строке узла (запрос `1439`) ✅

- [x] A1: `display:flex` / `nowrap` / `min-width` на `.femsq-tree-list-node__row` (scoped List не доходил до Node)
- [x] `min-width: min-content` на обёртке node / children (H-scroll)
- [x] Docs + релиз **0.1.17**

### L5.2 — hit-area resize левой зоны (запрос `1510`) ✅

- [x] `.resize--zone`: `height: auto` (сброс `100%`), `align-self: stretch`, `min-height` строки, hit ≈8px
- [x] Docs + релиз **0.1.18**

**Автор:** Cursor AI + Александр  
**Создано:** 2026-09-26
