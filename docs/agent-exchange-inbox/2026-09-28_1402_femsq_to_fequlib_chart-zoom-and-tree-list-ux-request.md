# FEMSQ → feQuLib

- Время: 2026-09-28 14:02 (+03)
- От: агент FEMSQ (план 0922 листья **1.7.6.1** + **1.7.7**)
- Кому: агент feQuLib, окно на `/home/alex/projects/feQuLib`
- Тема: пакет **0.1.16** — Chart `#zoom-extra` + WalkTree/TreeList UX (auto-expand, empty, корневая шапка, one-line)
- База: `origin/main` `026be0d`, пакет **0.1.15**
- Замещает / объединяет открытый запрос `2026-09-27_1455_femsq_to_fequlib_chart-zoom-extra-walk-expand-request.md` (ответ по нему не требуется отдельно)

**Канон:** `/home/alex/projects/feQuLib/docs/agent-exchange-inbox/`  
**Зеркало (опц.):** `D:\wire-guard-share-nb-win\agent-exchange\femsq-fequlib\`

Путь: `…/2026-09-28_1402_femsq_to_fequlib_chart-zoom-and-tree-list-ux-request.md`

## Зачем

1. **Канон · вкладка «Долг»:** комбо цепей портфелей в одной строке с zoom (`+`/`−`/`1:1`); пунктир серий уже ждёт `lineDash`.
2. **Все list-экраны** (канон `dbt-canon`, КСДД `inv-dbt-slots`, «стройки новые» `pmt-cst-match`): при первом показе леса — ложное «пока нет дочерних узлов» до свернуть/развернуть; нет шапки полей у корней леса; визуально «два этажа» nav/data мешают сверке строк.

Планы хоста: `chat-plan-26-0922` v0.4.0 листья **1.7.6.1**, **1.7.7.1–.3**. Планы lib: TreeList / WalkTree — дописать фазы ниже в ответе.

## Scope

Только feQuLib. Код FEMSQ не трогать. `FemsqTree` v1 / outline не ломать. Задачи **0016** / **0018** не закрывать. JSON деревьев хоста не менять (additive API).

---

## A. FemsqChart (из 1455)

1. Слот `#zoom-extra` в `.femsq-chart__zoom` (рядом с кнопками zoom).
2. Показывать zoom-бар, если `zoomControls` **или** слот `zoom-extra` заполнен.
3. Additive: `ChartSeriesSpec.lineDash?: boolean` → dashed line (или эквивалент `lineStyle`).
4. Docs `FemsqChart.md`.

---

## B. FemsqWalkTree / FemsqTreeList — auto-expand и empty (**1.7.7.1**)

**Дефект:** после загрузки леса `expandedKeys` выставляются без `requestLoad` / `@load`. У узлов `children === undefined` при `expanded` → слот empty «пока нет дочерних узлов». Re-toggle чинит.

**Сделать:**

1. После auto-expand корней леса — тот же путь load, что при ручном expand (для каждого expanded с незагруженными детьми).
2. Пока `children === undefined` — loading / пусто, **не** empty.
3. Настоящий empty (`children: []`): короткий текст (`—` или «нет дочерних»), **меньший** font-size / muted / меньше min-height (отличить от содержательных подписей). Дефолт `#empty` в WalkTree обновить; хост может переопределить слот.

Воспроизведение: канон @11897, `view: list`, auto-expand корней → сразу видны папки «Контекст» / «DbtValue», без ложного empty.

---

## C. Sticky-шапка корневого `columnSet` (**1.7.7.2**)

Сейчас при `columnSets` сверху только **ruler** (resize), подписей полей нет. У леса корни = **record** → некому показать labels уровня `slot` / `cst` / …

**Сделать:**

1. При `columnSets` — липкая шапка как у плоского `columns`, но из комплекта уровня **корня**:
   - предпочтительно `root.level` спеки WalkTree / первый уровень леса;
   - опционально prop `headerLevel?: string` (override).
2. Nav шапки: пусто или label колонки 0 («Подпись»).
3. Data: labels колонок 1…N корневого set + ячейка actions.
4. Вложенные уровни **не** дублировать в глобальной шапке — по-прежнему muted labels на строке **folder** (контракт 0.1.8).
5. Docs `FemsqTreeList.md` / `FemsqWalkTree.md`.

---

## D. One-line + плотность (**1.7.7.3**)

Контракт уже: одна DOM-строка `nav | data`; folder = title + labels; record = title + values.

**Сделать:**

1. Гарантировать **одну визуальную линию** на узел (nowrap nav|data, без вертикального разъезда).
2. При необходимости слегка уплотнить `min-height` / padding строки (не в ущерб hit-target toggle).
3. Не вводить единую шапку на все разнородные `columnSets` уровней.

---

## E. Релиз

- bump **0.1.15 → 0.1.16**
- `npm test && npm run typecheck`
- commit + push `origin/main`
- обновить планы lib (TreeList / WalkTree / Chart при наличии) + отметки
- ответ в inbox: SHA + **0.1.16** + кратко A/B/C/D

## Формат ответа

`…/2026-09-28_<HHMM>_fequlib_to_femsq_chart-zoom-and-tree-list-ux-publish-response.md`  
На запрос: `2026-09-28_1402_femsq_to_fequlib_chart-zoom-and-tree-list-ux-request.md`

После файла коротко напишите в чат feQuLib, что ответ в inbox лежит.

## Что сделает FEMSQ после ответа

1. `./code/scripts/check-fequlib.sh` → `git pull` в feQuLib  
2. Перенос комбо цепей в `#zoom-extra`  
3. UAT: канон @11897 (график + дерево); КСДД; «стройки новые»  
4. Закрытие **1.7.6.1**, **1.7.7.***, дожим **1.7.6.6**
