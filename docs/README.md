# Документация feQuLib

| Документ | Назначение |
|---|---|
| [components/FemsqTable.md](./components/FemsqTable.md) | Контракт `FemsqTable` (функционал + known gaps) |
| [components/FemsqTree.md](./components/FemsqTree.md) | Контракт `FemsqTree` v1 (nested outline) |
| [design/FemsqTable-visual-target.md](./design/FemsqTable-visual-target.md) | Распределение дизайна хост↔lib; DX как эталон хроматики |
| [assets/devexpress-grid/](./assets/devexpress-grid/) | Скрины-эталоны DevExpress (плотность / filter row) |
| [roadmap.md](./roadmap.md) | Фазы, backlog, итоги инфраструктуры |
| [development/notes/chats/chat-plan/](./development/notes/chats/chat-plan/) | Планы чатов |
| [development/notes/chats/chat-resume/](./development/notes/chats/chat-resume/) | Краткие резюме чатов |
| [chat-plan-26-0808-sudz-gaps.md](./development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md) | Gaps wide preview (FEMSQ СУДЗ) → 0011–0015 |
| [chat-plan-26-0809-docs-registry-vps.md](./development/notes/chats/chat-plan/chat-plan-26-0809-docs-registry-vps.md) | docs-registry → VPS (M0–M6 ✅) |
| [chat-plan-26-0818-femsq-tree.md](./development/notes/chats/chat-plan/chat-plan-26-0818-femsq-tree.md) | `FemsqTree` v1 (задача **0016**) |
| [chat-resume-26-0809-sudz-gaps-registry-vps.md](./development/notes/chats/chat-resume/chat-resume-26-0809-sudz-gaps-registry-vps.md) | Резюме чата 2026-08-08…09 |

## Итоги

- **FemsqTable:** фазы A–B ок для списков FEMSQ; для СУДЗ Rslt preview зафиксированы gaps → задачи registry **0011–0015** (код грида — отдельно).
- **FemsqTree:** v1 закрыта (задача **0016**, 2026-08-18); контракт — [FemsqTree.md](./components/FemsqTree.md).
- **docs-registry:** канон на VPS (`10.7.0.1:5432` / DB `docs_registry` в `fedoc-postgres-age`); локальный Docker `:5433` снят; backlog fequlib **0001–0016**.

## Задачи

В docs-registry, проект `fequlib` — не локальный JSON.

```bash
cd /home/alex/projects/docs-registry
# нужен туннель nb-win-cloud-ru; .env → 10.7.0.1:5432/docs_registry
npm run cli -- task list --project fequlib
```

Если CLI не коннектится: сначала WG (порт **22** на `10.7.0.1`), затем при необходимости на VPS `docker start fedoc-postgres-age`. Ops: docs-registry `docs/development/ops-vps-access.md`. Не переключать `.env` на localhost.

Локальный `docker compose` в docs-registry — только аварийный fallback (после M5 контейнера на nb-win нет).

## DBHub (MCP)

Проектный `.cursor/mcp.json` → DSN на VPS. **Не** класть docs-registry DSN в `~/.cursor/mcp.json` (конфликт с FEMSQ). UI Customize→MCPs в Cursor 3.x может не показывать проектный сервер — для задач registry достаточно CLI.

## Рекомендации далее

1. Реализация **0011** (sticky + токены) и **0012** (viewport) — приоритет high.  
2. Затем **0013** / **0014**; закрытие цепочки — **0015** (уведомить FEMSQ).  
3. Additive-first: не ломать текущих потребителей списков.

**Репозиторий:** https://github.com/bondalen/fequlib
