# План: docs-registry на VPS (вторая БД в fedoc-PG)

**Дата создания:** 2026-08-09  
**Последнее обновление:** 2026-08-09 (итоги + рекомендации)  
**Проект:** feQuLib (+ docs-registry / инфраструктура nb-win ↔ cloud)  
**Версия плана:** 0.1.7  
**Статус:** ✅ миграция завершена (канон VPS; локальный PG снят; post-M5 smoke OK после WG)  
**Связь:** gaps СУДЗ [chat-plan-26-0808-sudz-gaps.md](./chat-plan-26-0808-sudz-gaps.md); docs-registry канон `10.7.0.1:5432`  
**Ops (docs-registry):** `/home/alex/projects/docs-registry/docs/development/ops-vps-access.md`

## 0. Зачем

Убрать локальный контейнер `docs-registry-pg` на nb-win (экономия Docker/диска; единый Postgres на cloud).  
**Решение владельца (2026-08-09):** не отдельный `postgres:16-alpine`, а **вторая database** в **fedoc-PG** (`fedoc-postgres-age` / PG 16 + Apache AGE) на VPS `cr-ubu` (`176.108.244.252`, WG `10.7.0.1`).

## 1. Цель

1. Поднять fedoc-PG на VPS (по требованию / с понятным restart-policy).  
2. Создать database `docs_registry` (+ роль при необходимости) **без** ломания БД `fedoc`.  
3. Перенести данные с nb-win (`pg_dump` → restore) или migrate+seed, если dump невозможен.  
4. Переключить CLI docs-registry и DBHub feQuLib на `10.7.0.1:5432` (или опубликованный порт).  
5. Smoke: `task list --project fequlib` (в т.ч. задачи **0011–0015**).  
6. Остановить и удалить локальный `docs-registry-pg` (+ volume) на nb-win.  
7. Зафиксировать доступ (SSH `user1`, DSN, порт только через WG).

## 2. Вне scope

- Отдельный контейнер только под docs-registry (отклонён в пользу shared fedoc-PG).  
- Реализация FemsqTable gaps **0011–0014** (см. план 26-0808).  
- Публикация Postgres в интернет на `176.108…` (только WG / localhost на VPS + publish на `10.7.0.1`).

## 3. Уже сделано в текущем чате (контекст → этот план)

### A. Документация / backlog feQuLib (2026-08-08)

- ✅ Known gaps FemsqTable (SUDZ) в docs + registry **0011–0015** — [chat-plan-26-0808-sudz-gaps.md](./chat-plan-26-0808-sudz-gaps.md)
- ✅ DBHub в feQuLib (`.cursor/dbhub`; DSN с M4 → `10.7.0.1:5432`)

### B. Диагностика окружения (2026-08-09)

- ✅ Выяснено: hostname = **nb-win**; локальный docs-registry — канон по докам (`:5433`), не «запасной вместо nb-win»
- ✅ Туннель **nb-win-cloud-ru** Up; WG: nb-win `10.7.0.3`, VPS `10.7.0.1` (= `176.108.244.252`)
- ✅ С публичного IP Postgres `:5432`/`:5433` **не** слушает
- ✅ На VPS **нет** живого docs-registry; есть остановленный `fedoc-postgres-age` (PG16+AGE, БД `fedoc`)
- ✅ SSH с nb-win: ключ `alex@nb-win` уже в `~user1/.ssh/authorized_keys`; вход **`user1@10.7.0.1`** работает (ранее ошибочно пробовали `alex`/`root`/`ubuntu`)
- ✅ Решение: вариант «вторая database в поднятом fedoc-PG» (не отдельный alpine-контейнер)

### C. Локальный nb-win (состояние на момент плана)

- ✅ Зафиксировано наличие/роль `docs-registry-pg` на Docker Desktop — позже снят в M5

## 4. Фазы миграции

### M0 — План и контракт доступа ✅

- ✅ Выбор варианта (shared fedoc-PG + DB `docs_registry`)
- ✅ Этот chat-plan
- ✅ Ссылка из `docs/README.md` feQuLib на этот план

### M1 — Поднять fedoc-PG на VPS ✅

- ✅ Инвентаризация: канон данных = контейнер **`fedoc-postgres-age`** (`apache/age`), не compose-сервис `fedoc-postgres` из `db-manager.sh` / `docker-compose.prod.yml` (другое имя, другой volume path)
- ✅ Старт + `pg_isready`; БД `fedoc` на месте (`\l`)
- ✅ Пересоздание publish: было `0.0.0.0:5432` → стало **`10.7.0.1:5432->5432`** (тот же volume); старый container shell удалён
- ✅ Проверка с nb-win: `nc -zv 10.7.0.1 5432` OK; с `176.108.244.252:5432` — timeout (не торчит в интернет)

**Заметки M1:** `restart=no` (как было). Пароль инстанса — существующий fedoc (не коммитить). Compose `127.0.0.1:5432` для нового `fedoc-postgres` **не** использовали, чтобы не плодить второй PG без данных.

### M2 — Создать database `docs_registry` ✅

- ✅ Роль `docs` (LOGIN) + `CREATE DATABASE docs_registry OWNER docs`
- ✅ БД `fedoc` цела; AGE `1.6.0` на месте
- ✅ Схема docs-registry: `001_init.sql` + `schema_migrations`; owner таблиц/`grants` → `docs`
- ✅ Smoke с nb-win: CLI `DATABASE_URL=…@10.7.0.1:5432/docs_registry project list` → `[]` (пусто до M3 — ожидаемо)

### M3 — Перенос данных с nb-win ✅

- ✅ Dump локальной `docs_registry` (`pg_dump --clean --if-exists` из `docs-registry-pg`)
- ✅ Restore на VPS (от роли `postgres` — из‑за `pgcrypto`; ownership таблиц → `docs`)
- ✅ Сверка: проекты `docs-registry` + `fequlib`; задачи fequlib **0001–0015** (в т.ч. **0011–0015**); CLI с nb-win на VPS OK
- ✅ БД `fedoc` / AGE `1.6.0` не затронуты

### M4 — Переключение клиентов ✅

- ✅ `docs-registry/.env` → `DATABASE_URL` на `10.7.0.1:5432` (`.env.example` + комментарий про localhost fallback)
- ✅ feQuLib `.cursor/mcp.json` + `mcp.json.example` DSN → VPS
- ✅ Smoke CLI без override env (`project list`, `task get 0015`)
- ✅ Docs: `feQuLib/docs/README.md`, `docs-registry/README.md`, `docs-registry/.cursorrules`
- ✅ DBHub UI в Cursor — нестабилен (Customize пуст / кэш User); **не блокер**: CLI канон на VPS

### M5 — Убрать локальный `docs-registry-pg` ✅

- ✅ Вердикт docs-registry (чат 2026-08-09): живых клиентов `:5433` нет; `down -v` безопасен
- ✅ `docker compose down -v` — контейнер + volume `docs-registry_docs_registry_pgdata` удалены; `:5433` свободен
- ✅ Образ `postgres:16-alpine` удалён (~420 MB); `ferag-postgres` / `postgres:16` не трогали
- ✅ Smoke после удаления: CLI на VPS — проекты + fequlib tasks OK
- ✅ `scripts/setup-dbhub.sh` — echo DSN обновлён на канон VPS
- ✅ Post-M5 (после краткого WG peer down): туннель оживлён оператором; `:22`/`:5432` OK; smoke без override — `docs-registry`+`fequlib`, задачи fequlib **0001–0015**, docs-registry **0001–0005**; `docker start` не понадобился (PG уже слушал)

### M6 — Эксплуатация ✅

- ✅ Зафиксировано: `fedoc-postgres-age` остаётся **`restart=no`** (как fedoc); после ребута VPS может понадобиться `docker start fedoc-postgres-age` — см. docs-registry `ops-vps-access.md`
- ✅ Доступ: SSH `user1@10.7.0.1`, ключ `alex@nb-win`; DSN/пароли не в git (`.env` / mcp.json в ignore)
- ✅ Backlog docs-registry **0005** (WG/WSL/ops) — закрыт на стороне docs-registry; канонический хост = VPS WG
- ✅ Симптом «канон недоступен» после M5 оказался **WG peer down**, не удаление локального контейнера

## 5. Критерий готовности

- ✅ CLI с nb-win ходит в `docs_registry` на VPS (канон `.env`)
- ✅ Задачи fequlib (включая 0011–0015) видны
- ✅ Локальный `docs-registry-pg` удалён (`compose down -v` + image `postgres:16-alpine`)
- ✅ DSN feQuLib/`docs-registry` на VPS (DBHub UI — optional/нестабилен, не блокер)
- ✅ БД `fedoc` на том же инстансе цела
- ✅ Post-M5 smoke повторён после восстановления WG (2026-08-09)

## 6. Порядок выполнения

1. M0 → M1 → M2 → M3 → M4 → M5 → M6 — **все ✅**

**Миграция закрыта.** Дальше — продуктовая работа (fequlib **0011+**), не инфраструктура registry.

## 7. Итоги выполненной работы (2026-08-09)

| Результат | Детали |
|---|---|
| Канон данных | VPS WG `10.7.0.1:5432`, DB `docs_registry` в `fedoc-postgres-age` (рядом с `fedoc`) |
| Клиенты | `docs-registry/.env`, feQuLib DBHub/MCP → VPS; без override env |
| Локальный PG | `docs-registry-pg` + volume + `postgres:16-alpine` сняты; `ferag-postgres` / `postgres:16` не трогали |
| Данные | проекты `docs-registry` + `fequlib`; fequlib tasks **0001–0015** (в т.ч. **0011–0015**) |
| Post-M5 smoke | после Deactivate→Activate `nb-win-cloud-ru`: `:22`/`:5432` OK с Windows и WSL; CLI OK; `docker start` не понадобился |
| Docs | `ops-vps-access.md` в docs-registry; backlog **0005** закрыт; README/`.cursorrules`/roadmap согласованы |

**Урок инцидента post-M5:** «канон недоступен» = **WG peer down** (адаптер Up, но `:22` timeout), а не следствие удаления локального контейнера. Пинг `176.108.244.252` через `happ-tun` — ложный ориентир; канон только по WG.

## 8. Рекомендации на последующее

1. **При недоступности registry** (порядок):  
   - WireGuard: Deactivate → Activate `nb-win-cloud-ru`; проверить `10.7.0.1:22`;  
   - затем при необходимости `ssh user1@10.7.0.1 'docker start fedoc-postgres-age'`;  
   - smoke: `npm run cli -- project list` из docs-registry **без** смены `.env`.  
2. **Не делать:** откат DSN на `localhost:5433`; подъём локального compose как «починку» (только emergency, см. ops).  
3. **WSL:** при живом peer NAT-режим достаточен (smoke прошёл); `networkingMode=mirrored` — опция при стойком fail WSL→`10.7`, не обязателен сейчас.  
4. **VPS:** `fedoc-postgres-age` с `restart=no` — после ребута VPS может понадобиться ручной `docker start`.  
5. **Продукт:** вернуться к fequlib backlog **0011–0015** (SUDZ gaps); инфраструктура registry не блокер.  
6. **Опционально позже:** политика restart PG (M6 follow-up), стабилизация DBHub UI — не блокеры CLI.

**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-09
