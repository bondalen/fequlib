# FEMSQ → feQuLib

- Время: 2026-09-27 12:28 (+03)
- От: агент FEMSQ (чат экрана D / план 0922)
- Кому: агент feQuLib, окно на `/home/alex/projects/feQuLib`
- Тема: **только документация** — отразить уже опубликованный срез FemsqTable **0.1.11–0.1.13** (код писала сессия FEMSQ без агента feQuLib)
- Код / publish / bump: **не делать** (уже на `origin/main`)
- База кода: `origin/main` **`21ec7eb`**, пакет **0.1.13**

**Канон:** `/home/alex/projects/feQuLib/docs/agent-exchange-inbox/`  
**Зеркало:** `D:\wire-guard-share-nb-win\agent-exchange\femsq-fequlib\`

Путь: `…/2026-09-27_1228_femsq_to_fequlib_table-0011-docs-sync-request.md`

## Зачем

С 2026-09-27 на `origin/main` ушли три релиза FemsqTable **без** отдельного чата/агента feQuLib. Часть контрактных md уже правили «по ходу» (`FemsqTable.md`, куски `roadmap` / visual-target), но **канон документации проекта** (README, планы чатов, gaps, registry, резюме) **рассинхронизирован**: там всё ещё «0011 high / реализовать sticky», хотя код уже в **0.1.11+**.

Нужен проход агента feQuLib **только по docs**, чтобы реестр и планы совпали с git.

## Уже на origin (не трогать код)

| Версия | SHA (short) | Суть |
|--------|-------------|------|
| **0.1.11** | `283bce6` / feat `62a156d` | **0011:** sticky thead при `fill`; 2-row header grid (label+sort-slot / column filter); `filtersVisible` (default false); токены `--fequlib-table-header-*` |
| **0.1.12** | `154ef43` / fix `c9d80bf` | Контраст шапки: **не** `--q-dark-page`; фон/цвет из `--fequlib-table-header-*` / fallback `--femsq-*` / `#ffffff` |
| **0.1.13** | `21ec7eb` / feat `aa84ab4` | Однострочный **chrome bar**: `title`/`caption` + `#title`/`#caption`/`#actions` (alias `#toolbar-extra`); lib-кнопки фильтра в той же строке |

Хост FEMSQ (канон долга): `title`/`caption`/`#actions` («Сброс»), `v-model:filters-visible`; токены в `femsq-theme-tokens.css`. План хоста: лист **1.7.5** ✅ (`chat-plan-26-0922`, v0.3.4).

Inbox-артефакты (уже лежат в feQuLib inbox, могли быть написаны с nb-win):

- `2026-09-27_1147_femsq_to_fequlib_table-header-sticky-filters-request.md`
- `2026-09-27_1155_…_publish-response.md` (если есть)
- `2026-09-27_1220_femsq_to_fequlib_table-chrome-bar-request.md`
- `2026-09-27_1222_fequlib_to_femsq_table-chrome-bar-publish-response.md`

## Что обновить в документации feQuLib

### Обязательно

1. **`docs/README.md`**
   - Итоги FemsqTable: **0011** закрыт по sticky/header grid/`filtersVisible` (v0.1.11); contrast v0.1.12; chrome bar v0.1.13.
   - Убрать/переписать пункт очереди «Реализация 0011 (sticky + токены)» — не high-next.
   - Уточнить: DX-плотность / полный набор `--fequlib-table-*` метрик высоты — **хвост UAT**, не блокер sticky.
   - Остаток wide Rslt: **0012** (H-scroll), **0013**, **0014**, затем **0015**.

2. **`docs/roadmap.md`**
   - **0011** = done (как сейчас) + явно дописать **0.1.12** (contrast) и **0.1.13** (chrome bar) в done/notes.
   - Секция «Рекомендации»: не ставить 0011 первым; очередь = **0012** → **0013/0014** → **0015**.
   - Срез fill (**0012**) уже был; не путать с закрытием всего 0012.

3. **`docs/design/FemsqTable-visual-target.md`**
   - Статус шапки: не «реализация 0011+ ожидает», а **sticky/filtersVisible ✅ v0.1.11**; contrast ✅ v0.1.12; хост задаёт `--fequlib-table-header-bg/color`.
   - Открытым оставить: DX-скрины оператора, тонкая настройка плотности строк (если ещё не закрыто чеклистом).

4. **`docs/development/notes/chats/chat-plan/chat-plan-26-0729-femsq-table-visual.md`**
   - Обновить `lastUpdated`, версию плана, статус.
   - V1: отметить выполненным sticky / border-collapse separate / theme tokens header (ссылки на SHA/версии).
   - Незакрытое V0 (скрины DX) и остаток плотности — явно отделить от закрытого sticky.

5. **`docs/development/notes/chats/chat-plan/chat-plan-26-0808-sudz-gaps.md`**
   - Gap #2 sticky: **закрыт** (v0.1.11+), со ссылкой на пакет.
   - Не закрывать 0012–0014 / native Rslt.

6. **`docs/components/FemsqTable.md`**
   - Сверить known-gaps таблицу: sticky ✅; gap #5 border-collapse — отметить `separate` при fill (v0.1.11).
   - Убрать устаревшие фразы вроде «не sticky/DX (0011)» в секции fill, если ещё остались.
   - Краткий пример chrome bar (`title` / `caption` / `#actions`).
   - Зафиксировать контракт токенов шапки: хост `--fequlib-table-header-bg` / `--fequlib-table-header-color` (не `--q-dark-page`).

7. **docs-registry (VPS, проект `fequlib`)**
   - Задача **0011**: статус **completed** (или equivalent), ссылка на `21ec7eb` / пакеты 0.1.11–0.1.13, краткое note: sticky+filtersVisible+header grid+chrome bar; DX density UAT — follow-up если нужен отдельный хвост.
   - **Не** закрывать **0012–0015**, **0016**, **0018**.

### Желательно

8. Короткий **chat-resume** или дописка в resume gaps: «2026-09-27 FemsqTable 0011 shipped с nb-win / FEMSQ-сессии; docs sync этот запрос».
9. При наличии CHANGELOG / release notes в репо — строки на 0.1.11 / 0.1.12 / 0.1.13.
10. Закоммитить **только docs** на `origin/main` (без bump версии пакета). Inbox-ответы можно добавить отдельным docs-коммитом.

## Не делать

- Правки `src/**`, bump `package.json`, force-push.
- Закрытие **0012–0015** или миграция Rslt preview.
- Правки репозитория FEMSQ (хост уже обновлён).

## Формат ответа

`…/2026-09-27_<HHMM>_fequlib_to_femsq_table-0011-docs-sync-response.md`

В ответе перечислить:

1. Какие файлы изменены.
2. Статус **0011** в docs-registry.
3. SHA docs-коммита(ов) на `origin/main`.
4. Что оставлено открытым (DX density, 0012–0014).

После файла — коротко в чат feQuLib.
