<template>
  <div
    class="femsq-chart"
    :class="[rootClass, { 'femsq-chart--fill': fill }]"
    :data-test="dataTest"
  >
    <div v-if="!hasData" class="femsq-chart__empty text-grey-6 q-pa-md">
      {{ emptyLabel }}
    </div>
    <VChart
      v-else
      class="femsq-chart__canvas"
      :option="chartOption"
      :autoresize="autoresize"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  LegendComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption, BarSeriesOption } from 'echarts/charts';
import type {
  GridComponentOption,
  TooltipComponentOption,
  MarkLineComponentOption,
  LegendComponentOption
} from 'echarts/components';

import {
  type ChartSpec,
  formatChartMoney
} from './femsq-chart';
import { baseChartTheme, CHART_SERIES_COLORS } from './chart-theme';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  LegendComponent
]);

type EChartsOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | MarkLineComponentOption
  | LegendComponentOption
>;

const props = withDefaults(
  defineProps<{
    /** Спецификация графика. */
    spec: ChartSpec | null | undefined;
    /** Заполнить высоту родителя (splitter). */
    fill?: boolean;
    rootClass?: string;
    emptyLabel?: string;
    dataTest?: string;
    autoresize?: boolean;
  }>(),
  {
    fill: false,
    rootClass: '',
    emptyLabel: 'Нет данных для графика',
    dataTest: 'femsq-chart',
    autoresize: true
  }
);

const $q = useQuasar();

const hasData = computed(() => {
  const s = props.spec;
  if (!s?.series?.length) return false;
  return s.series.some((ser) => ser.points.length > 0);
});

/**
 * ECharts option из ChartSpec.
 */
const chartOption = computed((): EChartsOption => {
  const spec = props.spec;
  if (!spec) {
    return {};
  }
  const theme = baseChartTheme($q.dark.isActive);
  const isTime = spec.x.type === 'time';

  const seriesList: LineSeriesOption[] = spec.series.map((ser, idx) => {
    const data = ser.points.map((p) =>
      isTime ? [p.x, p.y] : [String(p.x), p.y]
    );
    return {
      id: ser.id,
      name: ser.name,
      type: spec.kind === 'bar' ? 'bar' : 'line',
      smooth: false,
      symbol: 'circle',
      symbolSize: 6,
      connectNulls: true,
      color: CHART_SERIES_COLORS[idx % CHART_SERIES_COLORS.length],
      data
    } as LineSeriesOption;
  });

  const markLineData: MarkLineComponentOption['data'] = [];
  for (const m of spec.markers ?? []) {
    if (m.type === 'horizontal') {
      markLineData.push({
        yAxis: m.value,
        label: {
          formatter: m.label ?? formatChartMoney(m.value),
          position: 'insideEndTop'
        },
        lineStyle: {
          type: m.style === 'dashed' ? 'dashed' : 'solid',
          color: theme.axisColor
        }
      });
    }
  }
  if (markLineData.length > 0 && seriesList[0]) {
    seriesList[0].markLine = { symbol: 'none', data: markLineData, silent: true };
  }

  const moneyFmt = spec.y.format === 'money';

  return {
    backgroundColor: theme.background,
    title: spec.title
      ? {
          text: spec.title,
          left: 'center',
          textStyle: { color: theme.textColor, fontSize: 12, fontWeight: 600 }
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) =>
        typeof v === 'number' && moneyFmt ? formatChartMoney(v) : String(v ?? '')
    },
    legend:
      spec.series.length > 1
        ? { bottom: 0, textStyle: { color: theme.textColor, fontSize: 11 } }
        : undefined,
    grid: { left: 56, right: 16, top: spec.title ? 36 : 16, bottom: spec.series.length > 1 ? 36 : 24 },
    xAxis: {
      type: isTime ? 'time' : 'category',
      name: spec.x.label,
      nameTextStyle: { color: theme.axisColor, fontSize: 11 },
      axisLabel: { color: theme.axisColor, fontSize: 11 },
      axisLine: { lineStyle: { color: theme.axisColor } }
    },
    yAxis: {
      type: 'value',
      name: spec.y.label,
      nameTextStyle: { color: theme.axisColor, fontSize: 11 },
      axisLabel: {
        color: theme.axisColor,
        fontSize: 11,
        formatter: (v: number) => (moneyFmt ? formatChartMoney(v) : String(v))
      },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    series: seriesList
  };
});
</script>

<style scoped>
.femsq-chart {
  min-height: 120px;
  position: relative;
}
.femsq-chart--fill {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.femsq-chart--fill .femsq-chart__canvas {
  flex: 1;
  min-height: 0;
  width: 100%;
}
.femsq-chart__canvas {
  width: 100%;
  height: 220px;
}
.femsq-chart__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}
</style>
