/**
 * Тема ECharts для FemsqChart (feQuLib).
 * Хост может переопределить через CSS-переменные --fequlib-chart-*.
 */

import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';

/** Базовые цвета серий (расширяемо). */
export const CHART_SERIES_COLORS = [
  '#1976d2',
  '#26a69a',
  '#f2c037',
  '#c10015',
  '#9c27b0'
];

/**
 * Строит базовые option-фрагменты ECharts из ChartSpec.
 *
 * @param isDark тёмная тема Quasar
 * @returns partial ECharts option
 */
export function baseChartTheme(isDark: boolean): {
  textColor: string;
  axisColor: string;
  splitLine: string;
  background: string;
} {
  return {
    textColor: isDark ? '#e0e0e0' : '#424242',
    axisColor: isDark ? '#9e9e9e' : '#757575',
    splitLine: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    background: 'transparent'
  };
}

export type ThemedLineSeries = LineSeriesOption;
