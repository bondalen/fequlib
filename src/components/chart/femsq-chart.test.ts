import { describe, expect, it } from 'vitest';
import {
  applyLineSeriesOptions,
  buildSlotDynamicsChartSpec,
  buildTimeSeriesChartSpec,
  CHART_EXCEL_SERIES_COLOR,
  formatChartMoney,
  type ChartSeriesSpec,
  type ChartSpec,
  zoomInWindow,
  zoomOutWindow
} from './femsq-chart';

describe('femsq-chart', () => {
  it('buildTimeSeriesChartSpec maps points', () => {
    const spec = buildTimeSeriesChartSpec(
      'ciaName=1',
      [
        { date: '2025-04-21', value: 55281.03 },
        { date: '2025-07-18', value: 46988.82 }
      ],
      [{ type: 'horizontal', value: 30404.4, label: 'Excel', style: 'dashed' }]
    );
    expect(spec.series[0].points).toHaveLength(2);
    expect(spec.markers).toHaveLength(1);
    expect(spec.y.format).toBe('money');
  });

  it('buildSlotDynamicsChartSpec adds red Excel point with vertical label', () => {
    const spec = buildSlotDynamicsChartSpec(
      'ciaName=2',
      [{ date: '2025-06-30', value: 1401.57 }],
      { date: '2025-12-31', value: 200.23 },
      'DbtValue по выгрузкам'
    );
    expect(spec.zoomControls).toBe(true);
    expect(spec.series).toHaveLength(2);
    expect(spec.series[1].id).toBe('excel');
    expect(spec.series[1].color).toBe(CHART_EXCEL_SERIES_COLOR);
    expect(spec.series[1].showLine).toBe(false);
    expect(spec.series[1].chartType).toBe('scatter');
    expect(spec.series[1].pointLabelRotate).toBe(90);
    expect(spec.y.label).toBeUndefined();
    expect(spec.series[1].pointLabel).toMatch(/Excel/);
    expect(spec.series[1].points).toEqual([{ x: '2025-12-31', y: 200.23 }]);
    expect(spec.markers).toBeUndefined();
  });

  it('ChartSeriesSpec accepts area/stack/step without breaking dynamics series', () => {
    const stacked: ChartSeriesSpec = {
      id: 'slot-1-overd',
      name: '#0 проср.',
      area: true,
      areaOpacity: 0.55,
      stack: 'slot-1',
      step: 'end',
      color: '#d19a66',
      points: [{ x: '2025-07-18', y: 100 }]
    };
    const dynamics: ChartSeriesSpec = {
      id: 'slot',
      name: 'ciaName=1',
      points: [{ x: '2025-07-18', y: 10 }]
    };
    const spec: ChartSpec = {
      kind: 'line',
      x: { type: 'time' },
      y: { format: 'money' },
      series: [stacked, dynamics]
    };
    expect(spec.series[0].area).toBe(true);
    expect(spec.series[0].stack).toBe('slot-1');
    expect(spec.series[0].step).toBe('end');
    expect(spec.series[1].area).toBeUndefined();
  });

  it('applyLineSeriesOptions sets areaStyle/stack/step with default opacity', () => {
    const line: Parameters<typeof applyLineSeriesOptions>[0] = {};
    applyLineSeriesOptions(line, {
      area: true,
      stack: 'slot-1',
      step: 'end'
    });
    expect(line.areaStyle).toEqual({ opacity: 0.45 });
    expect(line.stack).toBe('slot-1');
    expect(line.step).toBe('end');
  });

  it('applyLineSeriesOptions uses areaOpacity and skips when area false', () => {
    const withOpacity: Parameters<typeof applyLineSeriesOptions>[0] = {};
    applyLineSeriesOptions(withOpacity, {
      area: true,
      areaOpacity: 0.55,
      stack: 'a',
      step: 'middle'
    });
    expect(withOpacity.areaStyle).toEqual({ opacity: 0.55 });
    expect(withOpacity.step).toBe('middle');

    const plain: Parameters<typeof applyLineSeriesOptions>[0] = {};
    applyLineSeriesOptions(plain, { area: false });
    expect(plain.areaStyle).toBeUndefined();
    expect(plain.stack).toBeUndefined();
    expect(plain.step).toBeUndefined();
  });

  it('zoomInWindow keeps right edge', () => {
    expect(zoomInWindow(0, 100, 2)).toEqual({ start: 50, end: 100 });
  });

  it('zoomOutWindow expands toward full range', () => {
    const out = zoomOutWindow(40, 60, 2);
    expect(out.start).toBeLessThan(40);
    expect(out.end).toBeGreaterThan(60);
  });

  it('formatChartMoney uses ru locale', () => {
    expect(formatChartMoney(30404.4)).toMatch(/30/);
  });
});
