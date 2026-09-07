# FemsqChart

**Версия:** 0.1.4 (2026-09-04), zoom +/−, вертикальная подпись Excel  
**Платформа:** [ADR 010 FEMSQ](../../../femsq/docs/project/decisions/010-chart-platform-echarts.md) (ECharts 5)

## Назначение

Обёртка **Apache ECharts** для интерактивных графиков FEMSQ/feQuLib. Первый потребитель: КСДД «Динамика» (ряд `DbtValue` по слоту).

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

## Props

| Prop | Тип | Default | Описание |
|------|-----|---------|----------|
| `spec` | `ChartSpec \| null` | — | данные графика |
| `fill` | `boolean` | `false` | заполнить высоту родителя (splitter) |
| `emptyLabel` | `string` | «Нет данных…» | пустое состояние |

`ChartSeriesSpec`: `color`, `symbolSize`, `showLine`, `pointLabel`, `pointLabelRotate`.

`ChartSpec.zoomControls` — панель масштаба.

`grid.containLabel: true`; при подписи Excel увеличен `right`. Подписи осей — `nameLocation: 'middle'` (не у правого края).

Tooltip при `y.format: 'money'` использует `formatChartMoney` → `formatMoney` + суффикс ` ₽` ([format-money.md](./format-money.md)).

## Зависимости

- `echarts` ^5.6
- `vue-echarts` ^7
- peer: `vue`, `quasar`

## PDF / отчёты

Интерактив — ECharts; печать — JasperReports (тот же SQL, см. ADR 010).
