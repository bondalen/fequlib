# Запрос агенту feQuLib: fill-layout viewport для FemsqTable и FemsqTree

Дата: 2026-08-24  
Источник: FEMSQ  
Контекст обмена: `D:\wire-guard-share-nb-win\agent-exchange\femsq-fequlib`  
Дубликат inbox: этот файл.

## Зачем

На экране FEMSQ «КСДСФ / Разбор СФ» (`SudzSfDoubleView`) виджеты стоят в **flex + QSplitter** с `overflow: hidden` на панелях. Контент выходит за рамку, **вертикальный scrollbar не появляется**.

Это уже дважды проявилось:

1. **FemsqTree** — хост закрыл workaround-обёрткой `.relation-tree-scroll { height:100%; overflow:auto }` в `RelationTree.vue`. Это **не** контракт библиотеки.
2. **FemsqTable** — то же на вкладке «Суммы» (и аналогично на списке СФ / очереди): тело `QTable` растёт по строкам, `.q-table__middle` не получает ограниченную высоту, строки обрезаются без полосы прокрутки.

Хост просит **контракт fill-layout в feQuLib**, а не копировать обёртки на каждый экран.

## Ответ на вопрос хоста: делать ли то же для tree?

**Да.** Один и тот же контракт для обоих виджетов:

> Если родитель задал ограниченный viewport (flex/splitter/`height: 100%`), компонент **заполняет родителя** и **сам** скроллит содержимое. Хост не обязан оборачивать виджет в `overflow: auto`.

Различия реализации (не разные UX-правила):

| | FemsqTable | FemsqTree |
|---|---|---|
| Что скроллить | тело грида (`.q-table__middle`), шапка sticky внутри viewport | весь outline (`.femsq-tree__nodes`), включая `#detail` выбранного узла |
| Горизонт | колонки шире панели → H-scroll **в том же** viewport (это кусок задачи **0012**) | длинные `#header` не раздувают предков |
| Текущий хост | `class="fit"` на таблице **не** даёт скролл | workaround `.relation-tree-scroll` в FEMSQ — **снять после** fill-layout в lib |
| Additive-first | новый опциональный prop, default не ломает «таблицу по контенту» | тот же prop / тот же смысл |

Не делать: virtualization, keyboard/ARIA tree, `FemsqTreeList`, sticky table (**0011** можно учесть в CSS, но не блокер этого среза).

Связь с roadmap: это **срез 0012** (viewport containment в flex-хосте), не полный wide Excel preview Rslt. Не закрывать 0012 целиком, если wide-grid ещё не готов; завести/описать срез «fill-layout в splitter» и связать с 0012.

## Наблюдаемое сейчас (код lib)

`FemsqTable.vue`:

- `.femsq-table` — `display:flex; flex-direction:column; min-height:0; width:100%` — **нет** `height:100%` / `flex:1` / overflow;
- `.femsq-table__q-table` — `flex:1; min-height:0` — недостаточно: Quasar `QTable` без высоты родителя растягивает таблицу по всем строкам;
- пагинация по умолчанию `rowsPerPage: 25` **не** спасает, если высота панели меньше 25 строк (кейс КСДСФ: ~18 совпадений `cn_inv_dbt`, сплиттер ниже).

`FemsqTree.vue`:

- `.femsq-tree` / `__nodes` — flex + `min-height:0`, **нет** `height:100%` и `overflow:auto`.

Хост FEMSQ:

- `.sudz-sf-splitter :deep(> .q-splitter__panel) { overflow: hidden; min-height: 0; }`
- `.fill-pane { height: 100%; min-height: 0; overflow: hidden; }`
- таблицы: `<FemsqTable class="fit" …>` без обёртки-скролла;
- дерево: обёртка `.relation-tree-scroll`.

## Что сделать в коде

### 1. Общий контракт fill-layout

Опциональный prop (имя на усмотрение, хост предлагает **`fill`**, boolean, **default `false`** — additive-first).

Когда `fill === true` (и/или хост дал `class="fit"` + bounded parent — если решите алиасить, задокументируйте явно):

1. Корень виджета: `height: 100%` (или `flex: 1 1 auto` + `min-height: 0` + `min-width: 0`), `overflow: hidden`.
2. Внутренний viewport: `flex: 1; min-height: 0; min-width: 0; overflow: auto`.
3. Предки не раздуваются (`min-width: 0` обязательно для H-scroll в flex).

Когда `fill === false`: поведение как сейчас (размер по контенту) — master-списки без сплиттера не должны схлопнуться в 0.

### 2. FemsqTable

- При `fill`: прокинуть в `QTable` ограниченную высоту (CSS-колонка, не магическое px). Цель — чтобы скроллилось **`.q-table__middle`**, шапка оставалась видимой.
- Не полагаться только на пагинацию.
- `virtual-scroll` **не** обязателен в этом срезе.
- Проверить: `class="fit"` с `fill` и без; dense/flat как на КСДСФ; `showFilter=false`.

### 3. FemsqTree

- При `fill`: корень `height:100%`; `.femsq-tree__nodes` — единственный scroll-viewport (`overflow: auto`).
- `#detail` скроллится вместе с узлами (как сейчас в хост-обёртке) — так и нужно.
- После релиза хост удалит `.relation-tree-scroll`; до тех пор двойной скролл недопустим — либо lib fill, либо хост-обёртка, не оба. В docs явно: «при `fill` хост не ставит overflow на обёртку».

### 4. Тесты и docs

- Unit: если есть хуки на классы/стиль — покрыть; иначе зафиксировать контракт в docs и smoke-checklist.
- Обновить:
  - `docs/components/FemsqTable.md` — prop `fill`, связь со срезом **0012**;
  - `docs/components/FemsqTree.md` — тот же prop, снятие обязанности хоста скроллить;
  - `docs/roadmap.md` / план 0012 и при необходимости план дерева (уточнение v1, не новая фаза TreeList);
  - visual-target / gaps СУДЗ: fill-layout в splitter ≠ полный Rslt wide-grid.
- Additive-first: не ломать существующие экраны без `fill`.

## Чего делать не надо

- не копировать FEMSQ `RelationTree` / GraphQL / домен СУДЗ в lib;
- не закрывать целиком **0011** (sticky/DX) и **0012** (wide Excel), если срез только fill-layout;
- не включать virtualization, Filter Editor, TreeList;
- не хардкодить бренд-цвета.

## Критерий готовности для FEMSQ

Хост сможет:

1. На КСДСФ: `<FemsqTable fill class="fit" …>` в панели сплиттера «Старая структура · cn_inv_dbt» — при обрезке строк виден **вертикальный** scrollbar, шапка на месте.
2. `<FemsqTree fill …>` в `RelationTree` **без** `.relation-tree-scroll` — длинное дерево скроллится внутри панели.
3. Экраны без `fill` визуально как раньше.

Вернуть в ответе обмена:

1. имя prop и default;
2. список изменённых файлов;
3. как хосту включать fill (таблица + дерево);
4. можно ли сразу снимать `.relation-tree-scroll`;
5. коммит / ветка для `git pull` в `/home/alex/projects/feQuLib`.

## UAT-якорь хоста (не выполнять в lib)

FEMSQ DEV, экран КСДСФ, очередь `ciusKey=13` (СФ `106647`, долг `41666666.67`): вкладка «Суммы» / старая структура — много строк `cn_inv_dbt`, нижние обрезались без scrollbar.
