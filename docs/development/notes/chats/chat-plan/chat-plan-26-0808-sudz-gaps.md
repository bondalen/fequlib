# План: пробелы FemsqTable под wide preview (FEMSQ СУДЗ)

**Дата:** 2026-08-08  
**Статус:** ✅ зафиксировано в docs + registry (код — отдельно по приоритету)  
**Проект:** feQuLib  
**Потребитель:** FEMSQ · СУДЗ · Портфель года · Progress · предпросмотр Rslt  
**Источник опыта:** FEMSQ `docs/development/notes/UI/02-9_sudz-mvp-screens.md` (§ предпросмотр Rslt / таблицы UI), 2026-08-08

## 0. Зачем

На предпросмотре Rslt (wide Excel-like grid, десятки колонок, клик по ячейке → detail) FemsqTable **не подошёл**. FEMSQ временно держит native HTML-таблицу в scroll-рамке; FemsqTable остаётся для списков (годы, долги, стройки). Нужно зафиксировать gaps в fequlib и обязательство уведомить FEMSQ, когда доработки войдут в релиз/ветку.

## 1. Сделано в этом чате (docs only)

- [x] Секция known gaps в [FemsqTable.md](../../../components/FemsqTable.md)
- [x] Backlog в [roadmap.md](../../../roadmap.md): **0011** расширен; **0012–0015** новые
- [x] Sticky = обязательный deliverable в [FemsqTable-visual-target.md](../../../design/FemsqTable-visual-target.md)
- [x] Задачи в docs-registry, проект `fequlib`
- [ ] Крупная реализация — **не** в этом чате (отдельное решение по приоритету)

## 2. Задачи registry

| Код | Тема | Связь |
|-----|------|--------|
| **0011** | Visual + sticky header/filter-row + границы колонок | было: токены; теперь + sticky |
| **0012** | Wide-scroll / host viewport contract | containment, overflow |
| **0013** | Multiline header labels | prop / CSS token, clamp |
| **0014** | `@cell-click` API | additive-first |
| **0015** | Уведомить FEMSQ | после закрытия 0011–0014 |

Опционально позже: band/headerClasses; freeze левых колонок — не блокер MVP.

## 3. Критерий «уведомить FEMSQ» (задача 0015)

Сообщить в FEMSQ, когда все пункты выполнены:

- [ ] sticky header (+ filter-row) в ограниченном viewport без раздувания страницы (**0011** + **0012**)
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
