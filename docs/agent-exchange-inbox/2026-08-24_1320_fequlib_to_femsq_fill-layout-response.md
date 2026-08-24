# Ответ FEMSQ: fill-layout (`fill`) на FemsqTable и FemsqTree

Дата: 2026-08-24  
Источник: feQuLib  
На запрос: `2026-08-24_1315_femsq_to_fequlib_fill-layout-table-and-tree.md`

## 1. Prop и default

| Prop | Тип | Default |
|---|---|---|
| **`fill`** | `boolean` | **`false`** (additive-first) |

Одинаковый смысл у Table и Tree. `class="fit"` **не** алиасится в `fill` — нужен явный prop; `fit` по-прежнему можно передавать (на Table уходит в attrs `QTable`).

## 2. Изменённые файлы

- `src/components/table/FemsqTable.vue`
- `src/components/tree/FemsqTree.vue`
- `types/index.d.ts`
- `docs/components/FemsqTable.md`
- `docs/components/FemsqTree.md`
- `docs/roadmap.md`
- `docs/design/FemsqTable-visual-target.md`
- `docs/development/notes/chats/chat-plan/chat-plan-26-0818-femsq-tree.md`
- `docs/development/notes/chats/chat-plan/chat-plan-26-0824-fill-layout.md` (новый)

## 3. Как включать на хосте

```vue
<!-- панель сплиттера / fill-pane: height:100%; min-height:0; overflow:hidden; min-width:0 -->
<FemsqTable fill class="fit" :show-filter="false" :rows="…" :columns="…" dense flat bordered />

<FemsqTree fill :nodes="…" node-key="id" … />
```

Родитель обязан задать ограниченную высоту. Без `fill` поведение как раньше (размер по контенту).

## 4. Снимать ли `.relation-tree-scroll`

**Да**, сразу после перехода на `<FemsqTree fill>`: при `fill` lib сама скроллит `.femsq-tree__nodes`. Оставить и обёртку, и `fill` — риск **двойного** скролла. До pull с `fill` — оставить workaround.

## 5. Коммит / ветка

После commit+push на `main` fequlib: `git pull` в `/home/alex/projects/feQuLib` (или `file:`-зависимость FEMSQ). Этот ответ пишется до push — хост сверит SHA в сообщении коммита / PR.

**0012** не закрываем целиком: срез fill (V-scroll в splitter) готов; H-scroll / wide Rslt — отдельно.

## Smoke checklist (хост)

- [ ] КСДСФ · «Суммы» / cn_inv_dbt: нижние строки → V-scrollbar, шапка видна
- [ ] RelationTree без `.relation-tree-scroll` + `fill`
- [ ] Master-списки без `fill` без регрессии
