# План: пробелы FemsqTable под wide preview (FEMSQ СУДЗ)

**Дата:** 2026-08-08 · **обновлено:** 2026-09-27  
**Статус:** docs + registry; **0011** completed (v0.1.11–0.1.13). Код **0012–0014** — отдельно.  
**Проект:** feQuLib  
**Потребитель:** FEMSQ · СУДЗ · Портфель года · Progress · предпросмотр Rslt  
**Источник опыта:** FEMSQ `docs/development/notes/UI/02-9_sudz-mvp-screens.md` (§ предпросмотр Rslt / таблицы UI), 2026-08-08

## 0. Зачем

На предпросмотре Rslt (wide Excel-like grid, десятки колонок, клик по ячейке → detail) FemsqTable **не подошёл**. FEMSQ временно держит native HTML-таблицу в scroll-рамке; FemsqTable остаётся для списков (годы, долги, стройки). Нужно зафиксировать gaps в fequlib и обязательство уведомить FEMSQ, когда доработки войдут в релиз/ветку.

## 1. Сделано в docs / registry

- [x] Секция known gaps в [FemsqTable.md](../../../components/FemsqTable.md)
- [x] Backlog в [roadmap.md](../../../roadmap.md): **0011** расширен; **0012–0015** новые
- [x] Sticky = обязательный deliverable в [FemsqTable-visual-target.md](../../../design/FemsqTable-visual-target.md)
- [x] Задачи в docs-registry, проект `fequlib`
- [x] **0011** shipped 2026-09-27 (пакеты **0.1.11–0.1.13**, HEAD `21ec7eb`): sticky + filtersVisible + header grid + contrast + chrome bar

## 2. Задачи registry

| Код | Тема | Связь | Статус |
|-----|------|--------|--------|
| **0011** | Visual + sticky header/filter-row + границы колонок + chrome | sticky ✅ v0.1.11; contrast ✅ v0.1.12; chrome ✅ v0.1.13 | **completed** |
| **0012** | Wide-scroll / host viewport contract | containment, overflow; **срез `fill`** (2026-08-24) — V-scroll; H-scroll/wide Rslt ещё открыт | open |
| **0013** | Multiline header labels | prop / CSS token, clamp | open |
| **0014** | `@cell-click` API | additive-first | open |
| **0015** | Уведомить FEMSQ | после закрытия 0011–0014 | open |

Опционально позже: band/headerClasses; freeze левых колонок — не блокер MVP.

## 3. Критерий «уведомить FEMSQ» (задача 0015)

Сообщить в FEMSQ, когда все пункты выполнены:

- [x] sticky header (+ filter в `th`) в ограниченном viewport при `fill` (**0011**; срез **0012** `fill` уже был)
- [ ] остаток **0012**: H-scroll / wide Rslt без раздувания страницы
- [ ] заголовки multiline (prop/CSS token) (**0013**)
- [ ] стабильный `cell-click` или документированный паттерн без кастомного slot на каждую колонку (**0014**)
- [ ] указана версия/коммит `fequlib`, с которой можно пробовать миграцию Rslt-предпросмотра обратно на FemsqTable

### Канал уведомления

1. **Changelog / note в fequlib** (release notes или комментарий к коммиту/PR): строка `notify FEMSQ: SUDZ Rslt preview gaps 0011–0014`.
2. **FEMSQ:** короткий комментарий в `02-9_sudz-mvp-screens.md` (§ таблицы UI) и/или в плане СУДЗ / chat-plan Progress — что можно пробовать миграцию preview на FemsqTable; ссылка на версию/коммит fequlib.
3. При открытом issue/задаче СУДЗ по native grid — закрывающий комментарий со ссылкой на fequlib.

До пункта 0015 FEMSQ **осознанно** держит Rslt preview на native grid.

## 4. Принцип

Additive-first: не ломать текущих потребителей списков; новые API только опциональные.

**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-08
