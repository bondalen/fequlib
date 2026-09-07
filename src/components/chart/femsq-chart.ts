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
  /** Тип серии (scatter — якорь Excel без линии). По умолчанию line/bar из kind. */
  chartType?: 'line' | 'bar' | 'scatter';
  /** Цвет серии (иначе палитра по индексу). */
  color?: string;
  /** Размер маркера (по умолчанию 6). */
  symbolSize?: number;
  /** false — только маркеры без линии (якорь Excel). По умолчанию true. */
  showLine?: boolean;
  /** Подпись у каждой точки серии. */
  pointLabel?: string;
  /**
   * Поворот подписи в градусах (ECharts: против часовой).
   * 90 — снизу вверх.
   */
  pointLabelRotate?: number;
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
  /** Кнопки +/− масштаба по оси X (по умолчанию false). */
  zoomControls?: boolean;
}

/** Красный якорь Excel на динамике КСДД. */
export const CHART_EXCEL_SERIES_COLOR = '#c10015';

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
 * Динамика слота КСДД: ряд истории + опционально одна точка Excel (красный).
 *
 * @param slotSeriesName подпись истории
 * @param slotPoints канонические точки слота
 * @param excel якорь Excel (дата среза выгрузки + сумма) или null
 * @param title заголовок
 * @returns ChartSpec
 */
export function buildSlotDynamicsChartSpec(
  slotSeriesName: string,
  slotPoints: { date: string; value: number }[],
  excel?: { date: string; value: number } | null,
  title?: string
): ChartSpec {
  const series: ChartSeriesSpec[] = [
    {
      id: 'slot',
      name: slotSeriesName,
      points: slotPoints.map((p) => ({ x: p.date, y: p.value }))
    }
  ];
  if (excel != null && excel.date && Number.isFinite(excel.value)) {
    series.push({
      id: 'excel',
      name: 'Excel',
      points: [{ x: excel.date, y: excel.value }],
      chartType: 'scatter',
      color: CHART_EXCEL_SERIES_COLOR,
      symbolSize: 11,
      showLine: false,
      pointLabel: `Excel ${formatChartMoney(excel.value)}`,
      pointLabelRotate: 90
    });
  }
  return {
    kind: 'line',
    title,
    x: { type: 'time', label: 'Дата среза' },
    y: { format: 'money' },
    series,
    zoomControls: true
  };
}

/**
 * Новый диапазон dataZoom после «приблизить» (правый край фиксирован).
 *
 * @param start текущий start %
 * @param end текущий end %
 * @param factor во сколько раз сузить окно (&gt;1)
 * @returns новый start/end
 */
export function zoomInWindow(
  start: number,
  end: number,
  factor = 1.5
): { start: number; end: number } {
  const span = Math.max(0, end - start);
  const newSpan = Math.max(5, span / factor);
  return { start: Math.max(0, end - newSpan), end };
}

/**
 * Новый диапазон dataZoom после «отдалить».
 *
 * @param start текущий start %
 * @param end текущий end %
 * @param factor во сколько раз расширить окно (&gt;1)
 * @returns новый start/end
 */
export function zoomOutWindow(
  start: number,
  end: number,
  factor = 1.5
): { start: number; end: number } {
  const span = Math.max(0, end - start);
  const newSpan = Math.min(100, span * factor);
  const mid = (start + end) / 2;
  let nextStart = mid - newSpan / 2;
  let nextEnd = mid + newSpan / 2;
  if (nextStart < 0) {
    nextEnd = Math.min(100, nextEnd - nextStart);
    nextStart = 0;
  }
  if (nextEnd > 100) {
    nextStart = Math.max(0, nextStart - (nextEnd - 100));
    nextEnd = 100;
  }
  return { start: nextStart, end: nextEnd };
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
