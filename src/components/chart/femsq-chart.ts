/**
 * Контракт данных для FemsqChart (общий для UI и задел под отчёты).
 */

import { formatMoney } from '../../format/format-money';

/** Тип диаграммы v1. */
export type ChartKind = 'line' | 'bar' | 'combo';

/** Ось X: время (ISO date string) или категория. */
export type ChartXType = 'time' | 'category';

export interface ChartAxisSpec {
  type: ChartXType;
  label?: string;
}

export interface ChartYAxisSpec {
  label?: string;
  /** money — формат ₽ в tooltip. */
  format?: 'money' | 'number';
}

export interface ChartPoint {
  x: string | number;
  y: number;
}

export interface ChartSeriesSpec {
  id: string;
  name: string;
  points: ChartPoint[];
}

export interface ChartMarkerSpec {
  type: 'horizontal' | 'point';
  value: number;
  /** Для type=point — дата на оси X (ISO). */
  date?: string;
  label?: string;
  style?: 'dashed' | 'solid';
}

/**
 * Спецификация графика для FemsqChart.
 */
export interface ChartSpec {
  kind: ChartKind;
  title?: string;
  x: ChartAxisSpec;
  y: ChartYAxisSpec;
  series: ChartSeriesSpec[];
  markers?: ChartMarkerSpec[];
}

/**
 * Собирает ChartSpec для временного ряда (одна линия).
 *
 * @param seriesName подпись серии
 * @param points точки { date ISO, ttl }
 * @param markers маркеры (якорь Excel и т.п.)
 * @param title заголовок
 * @returns ChartSpec
 */
export function buildTimeSeriesChartSpec(
  seriesName: string,
  points: { date: string; value: number }[],
  markers?: ChartMarkerSpec[],
  title?: string
): ChartSpec {
  return {
    kind: 'line',
    title,
    x: { type: 'time', label: 'Дата среза' },
    y: { label: 'Сумма', format: 'money' },
    series: [
      {
        id: 'main',
        name: seriesName,
        points: points.map((p) => ({ x: p.date, y: p.value }))
      }
    ],
    markers
  };
}

/**
 * Форматирует число как деньги (ru-RU).
 *
 * @param value сумма
 * @returns строка
 */
export function formatChartMoney(value: number): string {
  return formatMoney(value, { currencySuffix: ' ₽' });
}
