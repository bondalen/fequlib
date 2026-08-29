import { describe, expect, it } from 'vitest';

import { formatMoney, formatMoneyOrDash } from './format-money';

describe('formatMoney', () => {
  it('formats ru-RU with space thousands and comma decimals', () => {
    expect(formatMoney(186961.48)).toBe('186\u00a0961,48');
    expect(formatMoney(800.91)).toBe('800,91');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatMoney(null)).toBe('');
    expect(formatMoney(undefined)).toBe('');
  });

  it('parses numeric strings', () => {
    expect(formatMoney('186961.48')).toBe('186\u00a0961,48');
  });

  it('appends currency suffix when requested', () => {
    expect(formatMoney(100, { currencySuffix: ' ₽' })).toBe('100,00 ₽');
  });
});

describe('formatMoneyOrDash', () => {
  it('returns dash for empty values', () => {
    expect(formatMoneyOrDash(null)).toBe('—');
    expect(formatMoneyOrDash(undefined)).toBe('—');
  });

  it('formats numbers like formatMoney', () => {
    expect(formatMoneyOrDash(186961.48)).toBe('186\u00a0961,48');
  });
});
