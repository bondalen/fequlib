# FemsqTable — целевой визуал и распределение дизайна

**Дата:** 2026-07-29 · **обновлено:** 2026-09-27  
**Статус:** бриф принят; sticky / `filtersVisible` / header grid ✅ **v0.1.11**; contrast шапки ✅ **v0.1.12**; chrome bar ✅ **v0.1.13**. DX-скрины оператора и тонкая плотность строк — хвост UAT.  
**Компонент:** [FemsqTable.md](../components/FemsqTable.md)  
**Эталоны DX:** [assets/devexpress-grid/](../assets/devexpress-grid/)

## Принцип совместной работы

| Слой | Владелец | Содержание |
|------|----------|------------|
| **Тема продукта** | Приложение-потребитель (FEMSQ) | светлая/тёмная, палитра, шрифты, радиусы chrome, focus, TopBar/StatusBar |
| **Примитивы Quasar** | Хост + Quasar | `$primary`, dark mode, типографика — то, что уже видит `QTable`/`QInput` |
| **Контракт грида** | fequlib | filter, sort, columnFilters, slots, `mode`/`@request`, additive API |
| **Хроматика грида** | fequlib | плотность, высоты строки/шапки/filter-row, padding ячеек, раскладка filter under header, **sticky header** (filter в той же `th`) |
| **Viewport / wide scroll** | fequlib + хост | задача **0012**; срез **`fill`** (2026-08-24): fill parent + V-scroll в splitter; H-scroll / wide Rslt — ещё открыто; sticky работает *внутри* этой рамки |
| **Исключение экрана** | форма в хосте | редко: локальный `dense`/слот; не норма |

**Коротко:** продукт «кем выглядит» = хост; DataGrid «как ощущается контрол» = библиотека (метрики/паттерны). Мост = **CSS-переменные**, не копия темы Kimbie/VS внутрь fequlib.

## Что библиотека НЕ делает

- Не задаёт отдельную тему «fequlib Kimbie / VS».
- Не хардкодит `#hex` цветов текста/фона/selection под бренд FEMSQ (кроме нейтрального fallback `#ffffff` у шапки, если хост не задал токены).
- Не копирует WinForms/WPF chrome DevExpress пиксель-в-пиксель.

Цвета: `inherit` / Quasar / `var(--femsq-…, fallback на Quasar/нейтраль)`.

## Токены хроматики

Имена стабилизировать additive-first; хост переопределяет в своей теме.

| Токен | Смысл | Статус |
|-------|--------|--------|
| `--fequlib-table-header-bg` / `--fequlib-table-header-color` | фон и текст sticky-шапки | ✅ v0.1.12 (хост; **не** `--q-dark-page`) |
| `--fequlib-table-header-h` | высота строки label в header grid | ✅ default в lib |
| `--fequlib-table-row-height` | высота строки данных | хвост UAT / DX density |
| `--fequlib-table-header-height` | общая высота шапки | хвост UAT |
| `--fequlib-table-filter-row-height` | ряд поколоночных фильтров | хвост UAT |
| `--fequlib-table-cell-padding-x` / `-y` | плотность ячеек | хвост UAT |
| `--fequlib-table-header-font-weight` | акцент шапки (не цвет) | хвост UAT |
| `--fequlib-table-header-label-lines` (или prop) | multiline wrap заголовков, clamp 2–3 | задача **0013** |

Опционально selection/border — только через `var(--q-…)` или полупрозрачный primary хоста, не собственная палитра lib.

### Sticky / header — deliverable 0011 ✅

- [x] `position: sticky` для `thead th` внутри scroll-viewport при `fill` (v0.1.11)
- [x] filter-row в той же `th` (раскрывается с `filtersVisible`, default false) — отдельный sticky-tr не нужен
- [x] 2-row header grid: label+sort-slot / column filter
- [x] без раздувания родителей: sticky + **0012** `fill`
- [x] `border-collapse: separate` при fill — th/td не разъезжаются при scroll
- [x] contrast: фон/цвет из `--fequlib-table-header-*` / `--femsq-*` / `#ffffff` (v0.1.12)
- [x] chrome bar: `title`/`caption` + `#title`/`#caption`/`#actions` (v0.1.13)

До закрытия **0012–0014** предпросмотр Rslt в FEMSQ остаётся на native grid; см. [chat-plan-26-0808-sudz-gaps.md](../development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md).

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

UAT разделять: **поведение** (filter/sort) vs **плотность/раскладка** vs **тема оболочки** (не винить грид за цвет StatusBar). Открыто: скрины DX оператора и тонкая настройка плотности строк (не блокер sticky).

## FEMSQ как первый хост

- Тема и `--femsq-*`: `docs/development/frontend-themes.md`, `femsq-theme-tokens.css`.
- Хост задаёт `--fequlib-table-header-bg` / `--fequlib-table-header-color` (и при необходимости остальные `--fequlib-table-*`) в теме после v0.1.11+.
- Контракт потребителей: FEMSQ `docs/development/notes/UI/02-8_femsq-table-component.md`.

## Связанные планы

- fequlib: [chat-plan-26-0729-femsq-table-visual.md](../development/notes/chats/chat-plan/chat-plan-26-0729-femsq-table-visual.md)
- fequlib: [chat-plan-26-0808-sudz-gaps.md](../development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md) (wide preview gaps → 0011–0015)
- FEMSQ: [chat-plan-26-0725-femsq-table.md](https://github.com/bondalen/femsq/blob/main/docs/development/notes/chats/chat-plan/chat-plan-26-0725-femsq-table.md) §8
- FEMSQ: `docs/development/notes/UI/02-9_sudz-mvp-screens.md` (§ предпросмотр Rslt)
