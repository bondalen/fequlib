# План: визуальный контракт FemsqTable (хост ↔ fequlib)

**Дата создания:** 2026-07-29  
**Последнее обновление:** 2026-07-29  
**Проект:** feQuLib  
**Версия плана:** 0.1.0  
**Статус:** 🔄 бриф принят; ожидает скрины DX + задача registry  
**Бриф:** [FemsqTable-visual-target.md](../../../design/FemsqTable-visual-target.md)  
**Связь FEMSQ:** `chat-plan-26-0725-femsq-table.md` §8; `02-8_femsq-table-component.md`

## 0. Зачем

После MVP A–B и закрытия форм cst (FEMSQ 0058) живой UAT упирается не только в функционал фильтрации, но и в ощущение грида. Тема продукта принадлежит хосту; у грида должны быть **свои** метрики (плотность, высоты), наследующие цвета/шрифты приложения. DevExpress — эталон хроматики, не бренд FEMSQ.

## 1. Цель

1. Зафиксировать распределение дизайна (хост / lib / экран) в docs обоих репозиториев.  
2. Подготовить место под эталоны DX (light/dark + filter row).  
3. Запланировать внедрение `--fequlib-table-*` и переопределений в теме FEMSQ.  
4. Разделить чеклисты UAT: поведение vs плотность vs тема оболочки.

## 2. Вне scope

- Фазы D–G (Group By, column chooser как фича, Filter Editor, server-side) — по backlog 0007–0008.  
- TreeList.  
- Пиксель-копия DX / отдельная тема Kimbie внутри fequlib.

## 3. Фазы

### V0 — Документация и эталоны 🔄

- [x] Бриф `docs/design/FemsqTable-visual-target.md`
- [x] Папка `docs/assets/devexpress-grid/` + README
- [x] Ссылки из `FemsqTable.md`, `roadmap.md`, `.cursorrules`, FEMSQ 02-8 / §8 плана 26-0725
- [x] Задача registry **0011** (visual chromatics / tokens) — создана 2026-07-29
- [ ] Оператор: 4–6 скринов DX в `docs/assets/devexpress-grid/`

### V1 — Токены и скин в fequlib ⬜

- [ ] CSS-переменные `--fequlib-table-*` с дефолтами (плотность ближе к DX-эталону)
- [ ] Без хардкода бренд-цветов; inherit / Quasar / `var(--femsq-…, fallback)`
- [ ] Краткая секция в `FemsqTable.md` «токены хоста»
- [ ] Smoke на FEMSQ перечень строек (light + dark)

### V2 — Хост FEMSQ ⬜

- [ ] Блок переопределений `--fequlib-table-*` в `femsq-theme-tokens.css` / frontend-themes
- [ ] UAT: поведение отдельно от плотности; тема оболочки — не дефект грида

## 4. Критерий готовности V0

Бриф и кросс-ссылки в git обоих проектов; понятно, куда класть скрины; задача 0011 в registry.

## 5. Порядок

1. V0 docs (этот чат) → 2. скрины DX (оператор) → 3. V1 в окне feQuLib → 4. V2 в FEMSQ → 5. живой UAT.

**Автор:** Cursor AI + Александр  
**Создано:** 2026-07-29
