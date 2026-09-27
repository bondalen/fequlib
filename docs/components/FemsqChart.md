# FemsqChart

**Версия:** 0.1.15 (2026-09-27), `area` / `stack` / `step` на line-сериях  
**Платформа:** [ADR 010 FEMSQ](../../../femsq/docs/project/decisions/010-chart-platform-echarts.md) (ECharts 5)

## Назначение

Обёртка **Apache ECharts** для интерактивных графиков FEMSQ/feQuLib. Потребители: КСДД «Динамика» (ряд `DbtValue` по слоту), СУДЗ · Долг (канон) — stacked areas по слоту.

## Контракт

```typescript
import { FemsqChart, buildSlotDynamicsChartSpec, type ChartSpec } from 'fequlib';

const spec = buildSlotDynamicsChartSpec(
  'ciaName=1',
  [{ date: '2025-07-18', value: 46988.82 }],
  { date: '2025-12-31', value: 30404.4 }
);
```

- Ряд `Excel` — одна точка, цвет `#c10015`, без линии; подпись **вертикально (rotate 90, снизу вверх)**.
- `zoomControls: true` — кнопки **+ / − / 1:1** (масштаб по оси X, правый край фиксирован при +) + zoom колесом.
- Отдельный `kind: 'area'` **не** вводится: область = `kind: 'line'` + `series[].area: true` (`areaStyle` в ECharts).

### Stacked area (канон долга)

```typescript
const spec: ChartSpec = {
  kind: 'line',
  x: { type: 'time' },
  y: { format: 'money' },
  series: [
    {
      id: 'slot-1-overd',
      name: '#0 проср.',
      area: true,
      areaOpacity: 0.55,
      stack: 'slot-1',
      step: 'end',
      color: '#d19a66',
      points: [
        { x: '2025-07-18', y: 100 },
        { x: '2025-12-31', y: 80 }
      ]
    },
    {
      id: 'slot-1-curr',
      name: '#0 текущ.',
      area: true,
      areaOpacity: 0.55,
      stack: 'slot-1',
      step: 'end',
      color: '#98c379',
      points: [
        { x: '2025-07-18', y: 50 },
        { x: '2025-12-31', y: 40 }
      ]
    }
  ]
};
```

Маппинг line-серий: `applyLineSeriesOptions` → `areaStyle.opacity` (default **0.45**), `stack`, `step`. Без `area` поведение КСДД «Динамика» без изменений.

## Props

| Prop | Тип | Default | Описание |
|------|-----|---------|----------|
| `spec` | `ChartSpec \| null` | — | данные графика |
| `fill` | `boolean` | `false` | заполнить высоту родителя (splitter) |
| `emptyLabel` | `string` | «Нет данных…» | пустое состояние |

### `ChartSeriesSpec`

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `color` | `string` | палитра | цвет серии |
| `symbolSize` | `number` | `6` | размер маркера |
| `showLine` | `boolean` | `true` | `false` — только маркеры |
| `pointLabel` | `string` | — | подпись у точки |
| `pointLabelRotate` | `number` | `0` | поворот подписи (°) |
| `area` | `boolean` | `false` | заливка под линией (`areaStyle`) |
| `areaOpacity` | `number` | `0.45`* | прозрачность заливки (*при маппинге) |
| `stack` | `string` | — | имя стопки ECharts |
| `step` | `'start' \| 'middle' \| 'end'` | — | ступенчатая линия/область |
| `chartType` | `'line' \| 'bar' \| 'scatter'` | из `kind` | тип серии |

`ChartSpec.zoomControls` — панель масштаба.

`grid.containLabel: true`; при подписи Excel увеличен `right`. Подписи осей — `nameLocation: 'middle'` (не у правого края).

Tooltip при `y.format: 'money'` использует `formatChartMoney` → `formatMoney` + суффикс ` ₽` ([format-money.md](./format-money.md)).

## Зависимости

- `echarts` ^5.6
- `vue-echarts` ^7
- peer: `vue`, `quasar`

## PDF / отчёты

Интерактив — ECharts; печать — JasperReports (тот же SQL, см. ADR 010).
