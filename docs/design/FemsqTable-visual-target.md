# FemsqTable — целевой визуал и распределение дизайна

**Дата:** 2026-07-29  
**Статус:** принято (бриф); реализация токенов/скина — отдельная задача  
**Компонент:** [FemsqTable.md](../components/FemsqTable.md)  
**Эталоны DX:** [assets/devexpress-grid/](../assets/devexpress-grid/)

## Принцип совместной работы

| Слой | Владелец | Содержание |
|------|----------|------------|
| **Тема продукта** | Приложение-потребитель (FEMSQ) | светлая/тёмная, палитра, шрифты, радиусы chrome, focus, TopBar/StatusBar |
| **Примитивы Quasar** | Хост + Quasar | `$primary`, dark mode, типографика — то, что уже видит `QTable`/`QInput` |
| **Контракт грида** | fequlib | filter, sort, columnFilters, slots, `mode`/`@request`, additive API |
| **Хроматика грида** | fequlib | плотность, высоты строки/шапки/filter-row, padding ячеек, раскладка filter under header, sticky header |
| **Исключение экрана** | форма в хосте | редко: локальный `dense`/слот; не норма |

**Коротко:** продукт «кем выглядит» = хост; DataGrid «как ощущается контрол» = библиотека (метрики/паттерны). Мост = **CSS-переменные**, не копия темы Kimbie/VS внутрь fequlib.

## Что библиотека НЕ делает

- Не задаёт отдельную тему «fequlib Kimbie / VS».
- Не хардкодит `#hex` цветов текста/фона/selection под бренд FEMSQ.
- Не копирует WinForms/WPF chrome DevExpress пиксель-в-пиксель.

Цвета: `inherit` / Quasar / `var(--femsq-…, fallback на Quasar/нейтраль)`.

## Токены хроматики (целевой контракт, к внедрению)

Имена стабилизировать в коде additive-first; хост переопределяет в своей теме:

| Токен | Смысл |
|-------|--------|
| `--fequlib-table-row-height` | высота строки данных |
| `--fequlib-table-header-height` | шапка |
| `--fequlib-table-filter-row-height` | ряд поколоночных фильтров |
| `--fequlib-table-cell-padding-x` / `-y` | плотность ячеек |
| `--fequlib-table-header-font-weight` | акцент шапки (не цвет) |

Опционально selection/border — только через `var(--q-…)` или полупрозрачный primary хоста, не собственная палитра lib.

## DevExpress как эталон

Скриншоты DX — эталон **хроматики и UX-паттернов** (плотность, filter row, sort affordance), **не** эталон темы FEMSQ.

В каждом кадре в `docs/assets/devexpress-grid/` подпись: что именно эталон. Рекомендуемый набор (4–6 кадров):

1. Grid, светлая тема — плотность строк/шапки  
2. Grid, тёмная тема — те же роли  
3. Строка поколоночных фильтров  
4. Sort / selection (и опционально column chooser)

### Три колонки для UAT / ревью

| Берём из DX | Берём из приложения | Не берём из DX |
|-------------|---------------------|----------------|
| высоты, padding, filter under header, плотность | тема, цвета, шрифты, chrome | WinForms chrome, чужие системные шрифты, чужая палитра dark/light |

UAT разделять: **поведение** (filter/sort) vs **плотность/раскладка** vs **тема оболочки** (не винить грид за цвет StatusBar).

## FEMSQ как первый хост

- Тема и `--femsq-*`: `docs/development/frontend-themes.md`, `femsq-theme-tokens.css`.
- Переопределение `--fequlib-table-*` — один блок в теме хоста после появления токенов в lib.
- Контракт потребителей: FEMSQ `docs/development/notes/UI/02-8_femsq-table-component.md`.

## Связанные планы

- fequlib: [chat-plan-26-0729-femsq-table-visual.md](../development/notes/chats/chat-plan/chat-plan-26-0729-femsq-table-visual.md)
- FEMSQ: [chat-plan-26-0725-femsq-table.md](https://github.com/bondalen/femsq/blob/main/docs/development/notes/chats/chat-plan/chat-plan-26-0725-femsq-table.md) §8
