# План: FemsqChart — платформа графиков (22c)

**Дата создания:** 2026-08-28  
**Последнее обновление:** 2026-08-28  
**Проект:** feQuLib  
**Версия плана:** 0.1.0  
**Статус:** ✅ v1 реализован  
**Потребитель:** FEMSQ KSDD (`SudzInvDbtDoubleView`, сегм. 22c)  
**FEMSQ ADR:** [010-chart-platform-echarts](https://github.com/bondalen/femsq/blob/main/docs/project/decisions/010-chart-platform-echarts.md) (локально: `femsq/docs/project/decisions/010-chart-platform-echarts.md`)

**Exchange:** [2026-08-28_femsq_to_fequlib_femsq-chart-22c.md](../../../agent-exchange-inbox/2026-08-28_femsq_to_fequlib_femsq-chart-22c.md)

## Зачем

FEMSQ на ранней стадии UI; графики понадобятся в КСДД, форме `cst` (график всего/виды), отчётах. Единая библиотека **ECharts 5** вместо точечных SVG.

## Контракт v1

| Элемент | Смысл |
|---------|--------|
| `FemsqChart.vue` | обёртка `vue-echarts`, tree-shaken `echarts/core` |
| `ChartSpec` | kind, series, markers, оси |
| `buildTimeSeriesChartSpec()` | одна линия + markLine (якорь Excel) |
| `fill` | как FemsqTable — высота в QSplitter |

## Зависимости (runtime)

- `echarts` ^5.6  
- `vue-echarts` ^7  
- peer: `vue`, `quasar`

## Критерий для FEMSQ

1. `import { FemsqChart, buildTimeSeriesChartSpec } from 'fequlib'` — без ошибок типов.  
2. `./code/scripts/check-fequlib.sh` — экспорт `FemsqChart`.  
3. КСДД вкладка «Динамика»: линия `DbtValue` + пунктир Excel.

## Backlog (feQuLib)

| # | Тема | Приоритет |
|---|------|-----------|
| C1 | `--fequlib-chart-*` токены + dark sync | medium |
| C2 | `kind: bar` / `combo` | medium |
| C3 | export PNG (`getDataURL`) для Jasper/WYSIWYG | low |
| C4 | registry задача **0017** (уведомить docs-registry) | low |

## Отметки

| Когда | Что |
|-------|-----|
| 2026-08-28 | Код, тесты, docs/components/FemsqChart.md; версия **0.1.1** |

**Автор:** Cursor AI + Александр  
**Создано:** 2026-08-28
