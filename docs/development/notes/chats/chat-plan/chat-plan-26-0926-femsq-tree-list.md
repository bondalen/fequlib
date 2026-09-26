# План: FemsqTreeList

**Дата создания:** 2026-09-26  
**Последнее обновление:** 2026-09-26 (метка ветви в `level`, без публикации)  
**Проект:** feQuLib  
**Версия плана:** 0.1.1  
**Статус:** lib v1 на `origin/main` — `d2530eb` (пакет **0.1.5**). Доработка метки ветви — локально, в origin не ушла. Задача **0018** остаётся `in_progress` до H1 на экране FEMSQ. **0016** не переоткрывается.  
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
| 2026-09-26 | Метка ветви: `column.level` кроме `"table"` / `"edge"` равен `node.level`. Новая задача реестра не заводилась. **0018** не закрыта. В origin не отправлялось. |

**Автор:** Cursor AI + Александр  
**Создано:** 2026-09-26
