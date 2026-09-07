<template>
  <div
    class="femsq-chart"
    :class="[rootClass, { 'femsq-chart--fill': fill }]"
    :data-test="dataTest"
  >
    <div v-if="!hasData" class="femsq-chart__empty text-grey-6 q-pa-md">
      {{ emptyLabel }}
    </div>
    <template v-else>
      <div
        v-if="showZoomControls"
        class="femsq-chart__zoom"
        data-test="femsq-chart-zoom"
      >
        <button
          type="button"
          class="femsq-chart__zoom-btn"
          title="Приблизить"
          data-test="femsq-chart-zoom-in"
          @click="onZoomIn"
        >
          +
        </button>
        <button
          type="button"
          class="femsq-chart__zoom-btn"
          title="Отдалить"
          data-test="femsq-chart-zoom-out"
          @click="onZoomOut"
        >
          −
        </button>
        <button
          type="button"
          class="femsq-chart__zoom-btn"
          title="Сбросить масштаб"
          data-test="femsq-chart-zoom-reset"
          @click="onZoomReset"
        >
          1:1
        </button>
      </div>
      <VChart
        class="femsq-chart__canvas"
        :option="chartOption"
        :autoresize="autoresize"
        @datazoom="onDataZoom"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption, BarSeriesOption, ScatterSeriesOption } from 'echarts/charts';
import type {
  GridComponentOption,
  TooltipComponentOption,
  MarkLineComponentOption,
  LegendComponentOption,
  DataZoomComponentOption
} from 'echarts/components';

import {
  type ChartSpec,
  formatChartMoney,
  zoomInWindow,
  zoomOutWindow
} from './femsq-chart';
import { baseChartTheme, CHART_SERIES_COLORS } from './chart-theme';

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  LegendComponent,
  DataZoomComponent
]);

type EChartsOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | ScatterSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | MarkLineComponentOption
  | LegendComponentOption
  | DataZoomComponentOption
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

/** Окно dataZoom по X в процентах (0–100). */
const xZoom = ref({ start: 0, end: 100 });

const hasData = computed(() => {
  const s = props.spec;
  if (!s?.series?.length) return false;
  return s.series.some((ser) => ser.points.length > 0);
});

const showZoomControls = computed(() => !!props.spec?.zoomControls && hasData.value);

watch(
  () => props.spec,
  () => {
    xZoom.value = { start: 0, end: 100 };
  }
);

/**
 * Приблизить: сузить окно, правый край (актуальные даты / Excel) фиксирован.
 */
function onZoomIn(): void {
  xZoom.value = zoomInWindow(xZoom.value.start, xZoom.value.end);
}

/**
 * Отдалить.
 */
function onZoomOut(): void {
  xZoom.value = zoomOutWindow(xZoom.value.start, xZoom.value.end);
}

/**
 * Полный диапазон.
 */
function onZoomReset(): void {
  xZoom.value = { start: 0, end: 100 };
}

/**
 * Синхронизация окна после жеста (колесо / drag).
 *
 * @param payload событие ECharts datazoom
 */
function onDataZoom(payload: {
  start?: number;
  end?: number;
  batch?: Array<{ start?: number; end?: number }>;
}): void {
  const part = payload?.batch?.[0] ?? payload;
  if (part?.start == null || part?.end == null) {
    return;
  }
  xZoom.value = { start: part.start, end: part.end };
}

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
  const excelLabeled = spec.series.some((s) => !!s.pointLabel);

  const seriesList = spec.series.map((ser, idx) => {
    const data = ser.points.map((p) =>
      isTime ? [p.x, p.y] : [String(p.x), p.y]
    );
    const showLine = ser.showLine !== false;
    const color = ser.color ?? CHART_SERIES_COLORS[idx % CHART_SERIES_COLORS.length];
    const seriesType =
      ser.chartType ?? (spec.kind === 'bar' ? 'bar' : 'line');
    const option: LineSeriesOption | ScatterSeriesOption | BarSeriesOption = {
      id: ser.id,
      name: ser.name,
      type: seriesType,
      symbol: 'circle',
      symbolSize: ser.symbolSize ?? 6,
      color,
      data
    };
    if (seriesType === 'line') {
      const line = option as LineSeriesOption;
      line.smooth = false;
      line.showSymbol = true;
      line.connectNulls = false;
      line.clip = true;
      if (!showLine) {
        line.lineStyle = { width: 0, opacity: 0 };
      }
    }
    if (ser.pointLabel) {
      option.label = {
        show: true,
        formatter: ser.pointLabel,
        color,
        fontSize: 11,
        fontWeight: 600,
        rotate: ser.pointLabelRotate ?? 0,
        position: 'right',
        distance: 8,
        align: 'left',
        verticalAlign: 'middle'
      };
      option.labelLayout = { hideOverlap: true };
    }
    return option;
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
  const hasLegend = spec.series.length > 1;
  const zoomOn = !!spec.zoomControls;

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
    legend: hasLegend
      ? { bottom: 0, textStyle: { color: theme.textColor, fontSize: 11 } }
      : undefined,
    grid: {
      containLabel: true,
      left: 12,
      right: excelLabeled ? 88 : 28,
      top: spec.title ? 40 : 28,
      bottom: hasLegend ? 52 : 40
    },
    dataZoom: zoomOn
      ? [
          {
            type: 'inside',
            xAxisIndex: 0,
            start: xZoom.value.start,
            end: xZoom.value.end,
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false
          }
        ]
      : undefined,
    xAxis: {
      type: isTime ? 'time' : 'category',
      name: spec.x.label,
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: theme.axisColor, fontSize: 11 },
      axisLabel: { color: theme.axisColor, fontSize: 11 },
      axisLine: { lineStyle: { color: theme.axisColor } }
    },
    yAxis: {
      type: 'value',
      name: spec.y.label || undefined,
      nameLocation: 'middle',
      nameGap: 48,
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
  overflow: hidden;
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
.femsq-chart__zoom {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  display: flex;
  gap: 2px;
}
.femsq-chart__zoom-btn {
  min-width: 28px;
  height: 26px;
  padding: 0 6px;
  border: 1px solid rgba(128, 128, 128, 0.45);
  border-radius: 4px;
  background: rgba(30, 30, 30, 0.72);
  color: #eee;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}
.femsq-chart__zoom-btn:hover {
  background: rgba(60, 60, 60, 0.9);
}
</style>
