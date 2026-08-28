import { describe, expect, it } from 'vitest';
import { buildTimeSeriesChartSpec, formatChartMoney } from './femsq-chart';

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

  it('formatChartMoney uses ru locale', () => {
    expect(formatChartMoney(30404.4)).toMatch(/30/);
  });
});
