# План: fill-layout viewport (срез 0012)

**Дата создания:** 2026-08-24  
**Последнее обновление:** 2026-08-24  
**Проект:** feQuLib  
**Версия плана:** 0.1.0  
**Статус:** ✅ срез реализован (`fill` на FemsqTable + FemsqTree)  
**Задача registry:** **0012** (не закрывать целиком — wide H-scroll / Rslt ещё открыты)  
**Exchange:** [2026-08-24_1315_femsq_to_fequlib_fill-layout-table-and-tree.md](../../../agent-exchange-inbox/2026-08-24_1315_femsq_to_fequlib_fill-layout-table-and-tree.md)

## Зачем

FEMSQ КСДСФ (`SudzSfDoubleView`): flex + QSplitter + `overflow:hidden` на панелях → FemsqTable/FemsqTree раздуваются по контенту, V-scrollbar нет. Хост-workaround (`.relation-tree-scroll`) — не контракт lib.

## Контракт

| Prop | Default | Смысл |
|---|---|---|
| `fill` | `false` | заполнить высоту родителя; lib скроллит содержимое |

- Table: скролл `.q-table__middle`; шапка над телом (Quasar card + bounded height).
- Tree: скролл `.femsq-tree__nodes` (включая `#detail`).
- Без `fill` — размер по контенту (master-списки).
- При `fill` хост не дублирует `overflow:auto` на обёртке.

Не входит в срез: virtualization, sticky DX (**0011**), полный wide Excel Rslt, TreeList.

## Критерий для FEMSQ

1. `<FemsqTable fill class="fit" …>` в панели сплиттера — V-scrollbar при обрезке строк.
2. `<FemsqTree fill …>` без `.relation-tree-scroll`.
3. Экраны без `fill` без регрессии.

## Отметки

| Когда | Что |
|---|---|
| 2026-08-24 | Код + types + docs; **0012** остаётся pending (остаток H-scroll / wide). |

**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-24
