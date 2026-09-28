# FemsqWalkTree

Обходчик JSON хоста. Собирает узлы и отдаёт их в `FemsqTree` или `FemsqTreeList` через `v-if`. Разметку ячеек и отступов не копирует.

План: [chat-plan-26-0926-femsq-walk-tree.md](../development/notes/chats/chat-plan/chat-plan-26-0926-femsq-walk-tree.md).

## Когда какой renderer

| `spec.view` | Компонент |
|---|---|
| нет поля, `outline` или любое значение кроме `list` | `FemsqTree`: `#header` (заголовок и кнопки), `#detail` (карточка полей) |
| ровно `list` и есть `columnSets` | `FemsqTreeList` с комплектами; плоский `columns` второй сеткой не рисуется |
| ровно `list` без комплектов | `FemsqTreeList` с липкой шапкой из `columns` |

Глубокое дерево `detail: "*"` при outline остаётся карточкой. Комплекты на outline не действуют.

## Корень

Числовой `rootId` — один вызов `fetchNode(table, rootId)`, одна запись. Пустой ответ — пустой список, без текста про ключ. `root.queryId` при числе не вызывается.

Лес — только если `rootId` пустой, у корня JSON есть `queryId` и передан `fetchRoots`. Каждая строка — запись корня, без папки-обёртки. Пересборка, когда меняется строка `rootsToken`. Библиотека её не разбирает.

После загрузки леса: `expandedKeys` = id всех корней, выбран первый корень, и для каждого корня с `children === undefined` вызывается тот же load, что при ручном expand (без ложного empty).

Нет числа и нет леса — текст «Нет ключа корня.». Запросов нет.

## Выбор строки

Prop `selectedKey` + `update:selectedKey` (`v-model:selected-key`), как у `FemsqTree` / `FemsqTreeList`. Без пропа — внутреннее состояние.

После загрузки одного корня выбирается эта запись.

## Шапка list

При `view: list` + `columnSets` WalkTree передаёт `headerLevel` = prop или `spec.root.level` в `FemsqTreeList`. Вложенные уровни не дублируются в глобальной шапке.

Дефолтный `#empty` — `—` (компактный muted в TreeList). Пока дети не загружены — спиннер, не empty.

## Дети и кнопки

Запись тянет рёбра `N:1` и `1:1` через `fetchExpand` и создаёт папки `1:N`. Папка с `queryId` вызывает `fetchQuery`, с `edge` — `fetchExpand`. `fromId` — число.

`level` у корня и у ребёнка JSON копируется в `node.level`. Деньги `valueKinds.money` в ячейках списка форматируются так же, как значения заголовка контура.

Кнопки (`label`, `icon`) рисует обходчик. Клик эмитит `action` с контекстом: id действия, корень, узел. Хост обрабатывает клик сам. `fetchQuery` не имеет библиотечного значения по умолчанию.
