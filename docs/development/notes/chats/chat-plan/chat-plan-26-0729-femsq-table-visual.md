# План: визуальный контракт FemsqTable (хост ↔ fequlib)

**Дата создания:** 2026-07-29  
**Последнее обновление:** 2026-09-27  
**Проект:** feQuLib  
**Версия плана:** 0.1.2  
**Статус:** sticky / header grid / `filtersVisible` / contrast / chrome bar на `origin/main` (**0.1.11–0.1.13**, HEAD `21ec7eb`). Задача **0011** completed. V0: скрины DX оператора ещё открыты; плотность строк — хвост UAT.  
**Бриф:** [FemsqTable-visual-target.md](../../../design/FemsqTable-visual-target.md)  
**Связь FEMSQ:** `chat-plan-26-0725-femsq-table.md` §8; `02-8_femsq-table-component.md`  
**Gaps wide preview:** [chat-plan-26-0808-sudz-gaps.md](./chat-plan-26-0808-sudz-gaps.md)

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
- [x] Задача registry **0011** (visual chromatics / tokens) — создана 2026-07-29; **completed** 2026-09-27
- [ ] Оператор: 4–6 скринов DX в `docs/assets/devexpress-grid/`

### V1 — Токены и скин в fequlib ✅ (ядро 0011)

- [x] Sticky header + filter в той же `th` / `filtersVisible` / 2-row header grid — **v0.1.11** (`62a156d` / `283bce6`)
- [x] `border-collapse: separate` при `fill` — v0.1.11
- [x] Contrast шапки: `--fequlib-table-header-bg/color`, без `--q-dark-page` — **v0.1.12** (`c9d80bf` / `154ef43`)
- [x] Chrome bar: `title` / `caption` / `#actions` — **v0.1.13** (`aa84ab4` / `21ec7eb`)
- [x] Без хардкода бренд-цверов; inherit / Quasar / `var(--femsq-…, fallback)` (+ нейтральный `#ffffff` у шапки)
- [x] Секция токенов / chrome в `FemsqTable.md`
- [ ] Полный набор метрик плотности `--fequlib-table-row-height` и т.п. ближе к DX — **хвост UAT**, не блокер sticky
- [ ] Smoke на FEMSQ перечень строек (light + dark) — у хоста / UAT

Смежные задачи wide preview (**0012–0014**) и notify FEMSQ (**0015**) — [chat-plan-26-0808-sudz-gaps.md](./chat-plan-26-0808-sudz-gaps.md).

### V2 — Хост FEMSQ 🔄

- [x] Токены шапки / chrome на каноне долга (лист **1.7.5**, 2026-09-27)
- [ ] Блок остальных `--fequlib-table-*` плотности в `femsq-theme-tokens.css` по итогам UAT
- [ ] UAT: поведение отдельно от плотности; тема оболочки — не дефект грида

## 4. Критерий готовности V0

Бриф и кросс-ссылки в git обоих проектов; понятно, куда класть скрины; задача 0011 в registry.

## 5. Порядок

1. V0 docs → 2. скрины DX (оператор, ещё открыто) → 3. V1 ядро ✅ → 4. V2 хост (частично) → 5. живой UAT плотности.

**Автор:** Cursor AI + Александр  
**Создано:** 2026-07-29
