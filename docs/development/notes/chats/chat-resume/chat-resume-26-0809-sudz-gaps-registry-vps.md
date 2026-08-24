# Резюме чата 26-0808…09: gaps FemsqTable (СУДЗ) + docs-registry → VPS

**Дата:** 2026-08-08 – 2026-08-09  
**Проект:** feQuLib  
**Машина:** nb-win (WSL2 Ubuntu)  
**Статус:** ✅ docs gaps + registry backlog зафиксированы; миграция docs-registry на VPS закрыта (M0–M6); **0016** закрыта отдельно (2026-08-18)

## Связанные документы

| Документ | Роль |
|----------|------|
| [chat-plan-26-0808-sudz-gaps.md](../chat-plan/chat-plan-26-0808-sudz-gaps.md) | Gaps wide preview / notify FEMSQ |
| [chat-plan-26-0809-docs-registry-vps.md](../chat-plan/chat-plan-26-0809-docs-registry-vps.md) | Миграция registry M0–M6 |
| [FemsqTable.md](../../../components/FemsqTable.md) | Known gaps |
| [roadmap.md](../../../roadmap.md) | Backlog **0011–0016** |
| [chat-plan-26-0818-femsq-tree.md](../chat-plan/chat-plan-26-0818-femsq-tree.md) | `FemsqTree` v1 (**0016** ✅) |
| docs-registry `ops-vps-access.md` | Ops WG / PG на VPS |

## Контекст

1. FEMSQ СУДЗ · предпросмотр Rslt не подошёл под FemsqTable (wide Excel-like grid) → native HTML; списки остаются на FemsqTable.  
2. Задачи fequlib ведутся в docs-registry; локальный Docker `:5433` на nb-win решено заменить второй БД в shared `fedoc-postgres-age` на VPS (`10.7.0.1`).

## Что сделано

### A. FemsqTable / СУДЗ (docs only, 2026-08-08)

- Секция known gaps в компонентной доке; visual-target: sticky = deliverable **0011**
- Registry: **0011** расширена; созданы **0012** (viewport), **0013** (multiline header), **0014** (`cell-click`), **0015** (notify FEMSQ)
- Код грида **не** реализовывали (отдельное решение по приоритету)

### B. Инфра docs-registry (2026-08-09)

- DBHub в feQuLib (проектный `.cursor/mcp.json`; UI Customize нестабилен — не блокер)
- Канон: `docs_registry` на VPS WG `10.7.0.1:5432` внутри `fedoc-postgres-age` (PG16+AGE); БД `fedoc` не ломали
- Dump/restore с nb-win; `.env` / DSN → VPS; локальный `docs-registry-pg` + volume + `postgres:16-alpine` удалены
- Post-M5: краткий WG peer down → Deactivate/Activate туннеля; smoke OK (`fequlib` 0001–0015 на момент M5, `docs-registry` 0001–0005)

### C. FemsqTree (после этого чата, 2026-08-18)

- **0016** закрыта: `FemsqTree` v1 + H1 smoke на FEMSQ `sudz-sf-double` — см. [chat-plan-26-0818-femsq-tree.md](../chat-plan/chat-plan-26-0818-femsq-tree.md)
- Registry на VPS: актуальный список **0001–0016** (без изменений DSN/инфра)

## Рекомендации на будущее

1. **FemsqTable:** следующий продуктовый фокус — **0011+0012** (sticky + viewport), затем **0013/0014**; по закрытии — **0015** (notify FEMSQ / миграция Rslt preview). **0016** не блокирует эту цепочку.  
2. **Registry недоступен:** сначала туннель `nb-win-cloud-ru` (`Test-NetConnection 10.7.0.1 -Port 22`); затем при необходимости `docker start fedoc-postgres-age` (`restart=no`). Не откатывать `.env` на localhost.  
3. **MCP:** DBHub только в **проектном** `feQuLib/.cursor/mcp.json`, не в `~/.cursor/mcp.json` (конфликт с FEMSQ FishEye). CLI registry достаточен без UI MCP.  
4. **SSH на VPS:** пользователь `user1`, не `alex`/`root`.  
5. **Additive-first:** новые API FemsqTable только опциональные.

## Критерий «чат закрыт»

- [x] Gaps и задачи 0011–0015 в docs + registry  
- [x] Канон docs-registry на VPS; локальный PG снят  
- [x] Post-M5 smoke после WG  
- [x] **0016** (`FemsqTree` v1) — закрыта 2026-08-18  
- [ ] Реализация 0011–0014 — **следующий** чат/приоритет

**Последнее обновление:** 2026-08-24  
**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-09
