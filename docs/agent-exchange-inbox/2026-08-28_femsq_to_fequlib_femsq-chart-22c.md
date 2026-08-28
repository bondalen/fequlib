# feQuLib ← FEMSQ: FemsqChart (22c)

**Дата:** 2026-08-28  
**Статус:** ✅ реализовано в feQuLib (локальный клон)

## Что сделано

- `src/components/chart/FemsqChart.vue` — vue-echarts + tree-shaken echarts
- `femsq-chart.ts` — `ChartSpec`, `buildTimeSeriesChartSpec`
- экспорт из `src/index.ts`
- deps: `echarts`, `vue-echarts`

## FEMSQ

- `check-fequlib.sh` проверяет экспорт `FemsqChart`
- `SudzInvDbtDoubleView` — вкладка «Динамика» + `[advisor]`

## Если дорабатывать в отдельном окне Cursor (feQuLib)

1. Открыть `/home/alex/projects/feQuLib` как корень workspace.
2. После изменений: `npm test && npm run typecheck`
3. Commit + push в `github.com/bondalen/fequlib`
4. В FEMSQ: `git pull` в соседнем клоне, `./code/scripts/check-fequlib.sh`

## Промпт для агента feQuLib (шаблон)

```
Контекст: feQuLib, компонент FemsqChart (ECharts). Потребитель — FEMSQ КСДД.
Задача: <опишите доработку ChartSpec / темы / новый kind bar/combo>.
Ограничения: peer vue/quasar; не дублировать тему FEMSQ; fill-layout как FemsqTable.
Проверка: npm test, npm run typecheck; обновить docs/components/FemsqChart.md.
```
