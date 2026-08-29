# FemsqChart

**Версия:** 0.1.0 (2026-08-28), tooltip money — общий `formatMoney` с v0.1.2  
**Платформа:** [ADR 010 FEMSQ](../../../femsq/docs/project/decisions/010-chart-platform-echarts.md) (ECharts 5)

## Назначение

Обёртка **Apache ECharts** для интерактивных графиков FEMSQ/feQuLib. Первый потребитель: КСДД «Динамика» (ряд `DbtValue` по слоту).

## Контракт

```typescript
import { FemsqChart, buildTimeSeriesChartSpec, formatChartMoney, type ChartSpec } from 'fequlib';

const spec = buildTimeSeriesChartSpec(
  'ciaName=1',
  [{ date: '2025-07-18', value: 46988.82 }],
  [{ type: 'horizontal', value: 30404.4, label: 'Excel', style: 'dashed' }]
);
```

## Props

| Prop | Тип | Default | Описание |
|------|-----|---------|----------|
| `spec` | `ChartSpec \| null` | — | данные графика |
| `fill` | `boolean` | `false` | заполнить высоту родителя (splitter) |
| `emptyLabel` | `string` | «Нет данных…» | пустое состояние |

Tooltip при `y.format: 'money'` использует `formatChartMoney` → `formatMoney` + суффикс ` ₽` ([format-money.md](./format-money.md)).

## Зависимости

- `echarts` ^5.6
- `vue-echarts` ^7
- peer: `vue`, `quasar`

## PDF / отчёты

Интерактив — ECharts; печать — JasperReports (тот же SQL, см. ADR 010).
