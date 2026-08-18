# FemsqTree

Рекурсивный nested-tree: заголовок узла, опциональная деталь выбранного узла, дети по expand. Не режим `FemsqTable` и не колоночный TreeList.

**Пакет:** `fequlib` · **импорт:** `import { FemsqTree } from 'fequlib'`  
**План:** [chat-plan-26-0818-femsq-tree.md](../development/notes/chats/chat-plan/chat-plan-26-0818-femsq-tree.md)  
**Задача registry:** **0016**  
**Статус:** v1 закрыт (H1 `sudz-sf-double`, задача **0016** done)

**Дизайн хост ↔ lib:** тема/цвета/шрифты — у потребителя; плотность и indent — `--fequlib-tree-*` (`--fequlib-tree-indent`, `--fequlib-tree-row-height`, `--fequlib-tree-row-padding-x` / `-y`). Без бренд-`#hex` в lib. Не зависит от задачи **0011** (`FemsqTable`).

## Контракт v1

| Принцип | Суть |
|---|---|
| Generic `Node` | `Node extends Record<string, any>`; lib не требует доменной схемы |
| Ключ | обязательный prop `nodeKey`: `string` или `(node) => string \| number` |
| Дети | `childrenKey` (default `'children'`) |
| Лист | `leafKey` (default `'leaf'`); `true` = детей не бывает |
| Detail | слот `#detail` у узла с `selectedKey === key` |
| Дети на экране | ключ ∈ `expandedKeys` |
| Lazy | `@load`, если `lazy` и `children` ещё `undefined` |
| Хост владеет данными | lib не копирует и не мутирует дерево за хоста |
| Additive-first | новые API только опциональные |

Согласовано с FEMSQ (2026-08-18): `expandOnClick=false` по умолчанию; слот `#toggle` в v1 есть; хост обновляет `nodes` реактивно в `@load`.

## Runtime-формат узла

Тип в lib: `FemsqTreeNodeBase = Record<string, any>`.

Обязательно в runtime: передан `nodes`; `nodeKey` даёт стабильный уникальный ключ на каждый узел. Поля `id` / `children` / `leaf` **не** обязательны в типе — они читаются через props.

Рекомендуемая конвенция хоста (не схема lib):

```ts
type HostTreeNode = {
  id: string;                 // составной, напр. 'sf:12'
  children?: HostTreeNode[];  // undefined = не грузили; [] = грузили, пусто
  leaf?: boolean;
  title?: string;
  payload?: unknown;
};
```

На стороне хоста: доменные поля, маппинг DTO → `nodes`, когда ставить `leaf`, когда писать `children`, вёрстка слотов.

Ключи разных сущностей не должны совпадать (сырой `invKey` и `cnKey` с одним числом — плохо). Для SUDZ предпочтителен составной ключ или функция `nodeKey`.

## Props

| Prop | Тип / default | Смысл |
|---|---|---|
| `nodes` | `Node[]` | корни; обязательный |
| `nodeKey` | `string \| ((node) => Key)` | обязательный |
| `childrenKey` | `string`, default `'children'` | поле детей |
| `leafKey` | `string`, default `'leaf'` | признак листа |
| `expandedKeys` | `Key[]` | v-model: какие **дети** видны |
| `selectedKey` | `Key \| null` | v-model: какой узел выбран (detail) |
| `loadingKeys` | `Key[]` | v-model: спиннер на узле; lib сам не пишет |
| `indent` | `number`, default `16` | px на уровень |
| `expandOnClick` | `boolean`, default `false` | клик по header также раскрывает детей |
| `selectable` | `boolean`, default `true` | клик по header выбирает узел |
| `lazy` | `boolean`, default `false` | не loaded + не leaf → `@load` |
| `rootClass` | `string` | класс корня |

Controlled + uncontrolled: если родитель не передал `expandedKeys` / `selectedKey` / `loadingKeys`, живёт внутренний state, события `update:*` всё равно эмитятся.

`inheritAttrs: false`: class / `data-test` / aria — на корень.

## Selected vs expanded

| Механика | Состояние | UI |
|---|---|---|
| деталь | `selectedKey === key(node)` | `#detail` этого узла |
| дети | `key` ∈ `expandedKeys` | рекурсивный список children |

- select не раскрывает детей; expand не выбирает узел;
- отдельного `openKeys` нет;
- один выбранный узел; раскрытых — сколько угодно.

Клики:

| Жест | Поведение |
|---|---|
| toggle | только expand/collapse детей |
| header | select (если `selectable`); expand только если `expandOnClick` |

Для `sudz-sf-double`: `expandOnClick=false` (это и default).

## Leaf / empty / lazy

| Состояние узла | Toggle | При expand |
|---|---|---|
| `leaf === true` | скрыт | ничего; `@load` нет; `children` игнорируются |
| `children` непустой | показан | показать детей |
| `children === []` | показан | `#empty` на узле; `@load` нет |
| `children` undefined, `lazy=false` | показан | `#empty`; `@load` нет |
| `children` undefined, `lazy=true`, не leaf | показан | `@load`; хост пишет `loadingKeys` |

`leaf` = структурно конечный. `children: []` = загружено, пусто. Пустой массив ≠ «надо грузить».

`@load` стреляет, когда все условия истинны: `lazy`; пользователь раскрывает; не leaf; `children` нет (`undefined`), не `[]`.

```ts
{ node: Node; key: string | number; reason: 'expand' | 'retry' }
```

Повторный expand узла с уже заданными `children` (включая `[]`) не грузит. Если хост оставил `children` undefined после ошибки — `reason: 'retry'`.

Хост в `@load`: добавить ключ в `loadingKeys` → загрузить → записать `children` или `leaf: true` → убрать ключ из `loadingKeys`.

| Где | Условие | Слот |
|---|---|---|
| корень | `nodes.length === 0` и `loadingKeys.length > 0` | `#loading` без `node` |
| корень | `nodes.length === 0`, нет loading | `#empty` без `node` |
| узел | ключ ∈ `loadingKeys` | `#loading` |
| раскрытый узел | не loading, не leaf, `children.length === 0` | `#empty` с `{ node, key, depth }` |

Нет `#loading` → default `QSpinner` / `:loading` на toggle. Нет `#empty` → нейтральная пустая строка без доменного текста.

## Слоты

| Слот | Контекст | Роль |
|---|---|---|
| `#header` | `{ node, key, depth, expanded, selected, loading, leaf }` | узнаваемость; хост **всегда** передаёт |
| `#detail` | тот же | карточка выбранного узла; нет слота — нет детали |
| `#empty` | `{ node?, key?, depth }` | нет корней / нет детей |
| `#loading` | `{ node?, key?, depth }` | загрузка |
| `#toggle` | `{ expanded, loading, leaf, toggle }` | default: `QBtn` + `chevron_right` / `expand_more` |

## Emits

- `update:expandedKeys`, `update:selectedKey`, `update:loadingKeys`
- `node-click` — `(evt, node, key)`
- `toggle` — `(node, key, expanded)`
- `load` — `(payload: FemsqTreeLoadPayload<Node>)`

## Пример потребления

```vue
<template>
  <FemsqTree
    :nodes="nodes"
    node-key="id"
    v-model:expanded-keys="expandedKeys"
    v-model:selected-key="selectedKey"
    v-model:loading-keys="loadingKeys"
    :lazy="true"
    :expand-on-click="false"
    data-test="sf-double-tree"
    @load="onLoad"
  >
    <template #header="{ node, selected }">
      <span>{{ node.title }}</span>
      <span v-if="selected"> · выбран</span>
    </template>
    <template #detail="{ node }">
      <pre>{{ node.payload }}</pre>
    </template>
  </FemsqTree>
</template>
```

Хост в `@load` дописывает `payload.node.children` (или заменяет `nodes` иммутабельно — оба варианта ок, если дерево реактивно).

## Файлы реализации

```
src/components/tree/FemsqTree.vue
src/components/tree/FemsqTreeNode.vue
src/components/tree/femsq-tree.ts
src/components/tree/femsq-tree.test.ts
src/components/tree/femsq-tree-context.ts
```

Плюс экспорт в `src/index.ts` и декларации в `types/index.d.ts`. Хелперы: `getNodeKey`, `getChildren`, `isLeaf`, `shouldLoad`, `getLoadReason`.

## Границы v1

Не входит: multi-select, checkbox/tick, DnD, tree-table / `FemsqTreeList`, полный keyboard/ARIA tree, virtualization, filter внутри дерева, accordion, обёртка `QTree`, CRUD в API, линии-коннекторы, мутация `nodes` внутри lib, бренд-тема FEMSQ.

`FemsqTreeList` (колонки, как деревья агентов/сторон в FEMSQ) — отдельное обоснование, не этот компонент.

## Потребители (FEMSQ)

| Форма | Файл | Статус |
|---|---|---|
| СУДЗ · разбор СФ с совпадающими номерами | `SudzSfDoubleView.vue` | H1 закрыт (2026-08-18) |
| Договоры · стороны | `ContractPartiesPanel.vue` | не v1 (скорее TreeList / слоты позже) |

Целевой UX SUDZ: FEMSQ `docs/development/notes/chats/chat-plan/sudz-sf-double-tree.md`.
