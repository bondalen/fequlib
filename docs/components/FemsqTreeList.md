# FemsqTreeList

Колоночное дерево: одна шапка, отступ и раскрытие в первой колонке, остальные ячейки — поля узла. Не режим `FemsqTable` и не контур `FemsqTree` (слот `#header` и карточка `#detail`).

**Пакет:** `fequlib` · **импорт:** `import { FemsqTreeList } from 'fequlib'`  
**План:** [chat-plan-26-0926-femsq-tree-list.md](../development/notes/chats/chat-plan/chat-plan-26-0926-femsq-tree-list.md)  
**Задача registry:** **0018** (lib; хост FEMSQ подключает следующим шагом)  
**База:** [`FemsqTree`](./FemsqTree.md) v1, задача **0016** — не ломается

Ключ, дети, лист, `expandedKeys`, `selectedKey`, `loadingKeys`, lazy `@load` — те же функции `src/components/tree/femsq-tree.ts`. Второй шаблон их вызывает, класс Vue не наследуется.

## Props

| Prop | Тип / default | Смысл |
|---|---|---|
| `nodes` | `Node[]` | корни; обязательный |
| `nodeKey` | `string \| ((node) => Key)` | обязательный |
| `columns` | `FemsqTreeListColumn<Node>[]` | обязательный. Тип рядом с деревом, не `FemsqTableColumn` |
| `childrenKey` | `string`, default `'children'` | поле детей |
| `leafKey` | `string`, default `'leaf'` | `true` — лист, кнопки раскрытия нет |
| `expandedKeys` | `Key[]` | v-model: какие дети видны |
| `selectedKey` | `Key \| null` | v-model: подсветка строки (повторный клик → `null`). Карточки `#detail` нет |
| `loadingKeys` | `Key[]` | v-model: спиннер; lib сам не пишет |
| `indent` | `number`, default `16` | px на уровень, только первая колонка |
| `expandOnClick` | `boolean`, default `false` | клик по строке также раскрывает |
| `selectable` | `boolean`, default `true` | клик переключает `selectedKey` |
| `lazy` | `boolean`, default `false` | не loaded + не leaf → `@load` |
| `rootClass` | `string` | класс корня |
| `fill` | `boolean`, default `false` | высота родителя; скролл в `.femsq-tree-list__scroll`; шапка sticky |

Controlled / uncontrolled — как у `FemsqTree`. `inheritAttrs: false`.

`fill`: хост задаёт высоту обёртки (`height:100%`, `min-height:0`, `overflow:hidden`) и не вешает второй `overflow:auto`.

## Колонка `FemsqTreeListColumn`

| Поле | Смысл |
|---|---|
| `name` | стабильный ключ колонки |
| `label` | подпись шапки |
| `field` | имя поля узла |
| `format?` | `(value, node) => string` |
| `align?` | `left` / `right` / `center` |
| `width?` | трек CSS grid; иначе `minmax(0, 1fr)` |
| `level?` | нет — поле на любом узле; `"table"` / `"edge"` — по `kind` (`record` / `folder`); любая другая строка — только если `node.level` равен ей |

Первая колонка общая: отступ `depth * indent` и слот кнопки, без своей шапки на глубину. Её `level` хост не задаёт. У листа кнопка скрыта, слот той же ширины (`--fequlib-tree-list-toggle`, 28px), колонки не прыгают.

Нет поля, `null` или `''` — ячейка пустая, в том числе когда метка ветви совпала. `0` показывается. Шапка одна на всё дерево: колонки с разными `level` стоят рядом. Одинаковое имя поля на двух ветвях разводится разными метками. Нет `node.level` — колонка с произвольной меткой пустая. `"table"` и `"edge"` зарезервированы и смотрят на `kind`, не на строку `node.level`.

## Слоты

| Слот | Контекст | Роль |
|---|---|---|
| `#actions` | `{ node, key, depth, expanded, selected, loading, leaf }` | действия строки. Нет слота — нет колонки действий. Доменных кнопок в lib нет |
| `#toggle` | `{ expanded, loading, leaf, toggle }` | default: `QBtn` |
| `#empty` | `{ node?, key?, depth? }` | нет корней / нет детей |
| `#loading` | `{ node?, key?, depth? }` | загрузка |

## Emits

Те же, что у `FemsqTree`: `update:expandedKeys`, `update:selectedKey`, `update:loadingKeys`, `node-click`, `toggle`, `load`.

`@load` — `shouldLoad`: `lazy`, не leaf, `children` ещё не массив.

## Пример узла

```ts
type Row = {
  id: string;
  kind?: 'record' | 'folder';
  level?: string;
  label?: string;
  code?: string;
  children?: Row[];
  leaf?: boolean;
};

const columns = [
  { name: 'label', label: 'Подпись', field: 'label' },
  { name: 'site-code', label: 'Код стройки', field: 'code', level: 'site' },
  { name: 'point-code', label: 'Код точки', field: 'code', level: 'point' }
];
```

У `{ kind: 'record', level: 'site', label: 'Север', code: '12' }` код стройки `12`, код точки пустой. У `{ kind: 'record', level: 'point', label: '051-1', code: '9', leaf: true }` наоборот. Колонка `"table"` по-прежнему видна у `kind: 'record'` и пуста у `kind: 'folder'`.

```vue
<FemsqTreeList
  fill
  :nodes="nodes"
  :columns="columns"
  node-key="id"
  :lazy="true"
  v-model:expanded-keys="expandedKeys"
  v-model:loading-keys="loadingKeys"
  @load="onLoad"
>
  <template #actions="{ node }">
    <QBtn flat dense label="Создать" @click="onCreate(node)" />
  </template>
</FemsqTreeList>
```

## Представление обходчика

Обходчик один. Поле `view` в JSON экземпляра необязательное. Хелперы: `resolveWalkView`, `usesWalkList`, `walkColumnsToTreeList`, `assignWalkListFields`.

| `view` | Как рисовать |
|---|---|
| нет поля, `outline`, любое другое | как сейчас: `title` в шапке `FemsqTree`, `fields` в `#detail` |
| `list` | `FemsqTreeList` и `columns` |

Колонка JSON (`FemsqWalkListColumn`): `label`, `field`, необязательный `level` — та же строка, что у `FemsqTreeListColumn` (`table`, `edge` или метка ветви). `walkColumnsToTreeList` её не отбрасывает. Формат-функцию в JSON не кладут.

```ts
resolveWalkView(undefined); // 'outline'
resolveWalkView('list'); // 'list'

const columns = walkColumnsToTreeList(spec.columns);
const node = assignWalkListFields(recordNode, fieldMap, spec.columns ?? []);
```

`fetchNode` / `fetchExpand` этот модуль не принимает и не меняет. Фильтр корня (хвост кода, очередь) в JSON и в lib не входит: хост передаёт его в загрузку корня так же, как `rootId`. Существующие JSON без `view` остаются outline.

Узел list: те же `id` / `children` / `leaf` / `kind`, плюс необязательный `level` (метка ветви) и поля строки, которые читают колонки. `kind: 'record' | 'folder'` нужен для колонок `"table"` / `"edge"`. Для произвольной метки нужен `node.level`. `assignWalkListFields` по-прежнему не затирает уже лежащие поля пустым значением.

## Не входит в v1

Фильтр, сортировка, постраничность `FemsqTable`, виртуализация, DnD, multi-select, чекбоксы, полный keyboard/ARIA, доменные кнопки и имена таблиц хоста.

## Файлы

```
src/components/tree/FemsqTreeList.vue
src/components/tree/FemsqTreeListNode.vue
src/components/tree/femsq-tree-list.ts
src/components/tree/femsq-tree-list.test.ts
src/components/tree/femsq-walk-view.ts
src/components/tree/femsq-tree-list-context.ts
```

Плотность: те же `--fequlib-tree-row-*` и `--fequlib-tree-indent`. Фон шапки: `--fequlib-tree-header-bg` (fallback `--femsq-surface`, затем `Canvas`). Без бренд-`#hex`.
