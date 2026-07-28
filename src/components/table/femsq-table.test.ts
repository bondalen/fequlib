import { describe, expect, it } from 'vitest';

import {
  cellText,
  columnFilterText,
  compareCellValues,
  normalizeColumnFilters,
  rowMatchesAllFilters,
  rowMatchesColumnFilters,
  rowMatchesFilter,
  sortComparable,
  type FemsqTableColumn
} from './femsq-table';

type Row = {
  name?: string | null;
  code?: string | null;
  amount?: number | null;
  note?: string | null;
  statusLabel?: string | null;
  [key: string]: unknown;
};

function col(partial: FemsqTableColumn<Row>): FemsqTableColumn<Row> {
  return partial;
}

const nameCol = col({ name: 'name', label: 'Name', field: 'name' });
const codeCol = col({ name: 'code', label: 'Code', field: 'code' });
const amountCol = col({ name: 'amount', label: 'Amount', field: 'amount' });
const actionsCol = col({
  name: 'actions',
  label: '',
  field: 'actions',
  filterable: false
});
const statusCol = col({
  name: 'status',
  label: 'Status',
  field: 'statusLabel',
  format: (value) => (value == null ? '' : `«${String(value)}»`),
  filterValue: (row) => String(row.statusLabel ?? '')
});

const columns: FemsqTableColumn<Row>[] = [nameCol, codeCol, amountCol, actionsCol, statusCol];

describe('cellText / columnFilterText', () => {
  it('stringifies field value; null/undefined → empty string', () => {
    expect(cellText({ name: 'Alpha' } as Row, nameCol)).toBe('Alpha');
    expect(cellText({ name: null } as Row, nameCol)).toBe('');
    expect(cellText({} as Row, nameCol)).toBe('');
  });

  it('uses format(value, row) when provided', () => {
    const formatted = col({
      name: 'amount',
      label: 'Amount',
      field: 'amount',
      format: (value, row) => `${row.name}:${value}`
    });
    expect(cellText({ name: 'A', amount: 10 } as Row, formatted)).toBe('A:10');
  });

  it('supports field as function', () => {
    const derived = col({
      name: 'full',
      label: 'Full',
      field: (row) => `${row.code}-${row.name}`
    });
    expect(cellText({ code: 'X', name: 'Y' } as Row, derived)).toBe('X-Y');
  });

  it('columnFilterText prefers filterValue over cellText/format', () => {
    expect(cellText({ statusLabel: 'ok' } as Row, statusCol)).toBe('«ok»');
    expect(columnFilterText({ statusLabel: 'ok' } as Row, statusCol)).toBe('ok');
  });

  it('columnFilterText falls back to cellText', () => {
    expect(columnFilterText({ name: 'Beta' } as Row, nameCol)).toBe('Beta');
  });
});

describe('rowMatchesFilter', () => {
  const row: Row = { name: 'Site Alpha', code: 'CST-01', amount: 12, statusLabel: 'active' };

  it('empty / whitespace filter matches all', () => {
    expect(rowMatchesFilter(row, columns, '')).toBe(true);
    expect(rowMatchesFilter(row, columns, '   ')).toBe(true);
  });

  it('matches case-insensitive substring across filterable columns', () => {
    expect(rowMatchesFilter(row, columns, 'alpha')).toBe(true);
    expect(rowMatchesFilter(row, columns, 'CST-01')).toBe(true);
    expect(rowMatchesFilter(row, columns, 'active')).toBe(true);
    expect(rowMatchesFilter(row, columns, 'zzz')).toBe(false);
  });

  it('skips filterable:false columns (actions)', () => {
    const withActionsOnly: Row = { name: 'hidden', actions: 'delete-me' };
    const onlyActions = [actionsCol];
    expect(rowMatchesFilter(withActionsOnly, onlyActions, 'delete')).toBe(false);
  });

  it('uses filterValue for slotted-style columns', () => {
    // format wraps as «active», but filterValue is plain "active"
    expect(rowMatchesFilter(row, columns, '«active»')).toBe(false);
    expect(rowMatchesFilter(row, columns, 'active')).toBe(true);
  });
});

describe('rowMatchesColumnFilters', () => {
  const row: Row = { name: 'Site Alpha', code: 'CST-01', amount: 12, statusLabel: 'active' };

  it('null / undefined / empty map → true', () => {
    expect(rowMatchesColumnFilters(row, columns, null)).toBe(true);
    expect(rowMatchesColumnFilters(row, columns, undefined)).toBe(true);
    expect(rowMatchesColumnFilters(row, columns, {})).toBe(true);
    expect(rowMatchesColumnFilters(row, columns, { name: '  ' })).toBe(true);
  });

  it('AND across columns', () => {
    expect(rowMatchesColumnFilters(row, columns, { name: 'alpha', code: 'cst' })).toBe(true);
    expect(rowMatchesColumnFilters(row, columns, { name: 'alpha', code: 'zzz' })).toBe(false);
  });

  it('ignores filterable:false and unknown column names', () => {
    expect(rowMatchesColumnFilters(row, columns, { actions: 'anything' })).toBe(true);
    expect(rowMatchesColumnFilters(row, columns, { missing: 'x' })).toBe(true);
  });
});

describe('rowMatchesAllFilters', () => {
  const row: Row = { name: 'Site Alpha', code: 'CST-01', amount: 12, statusLabel: 'active' };

  it('requires global AND column filters', () => {
    expect(rowMatchesAllFilters(row, columns, 'alpha', { code: 'cst' })).toBe(true);
    expect(rowMatchesAllFilters(row, columns, 'alpha', { code: 'zzz' })).toBe(false);
    expect(rowMatchesAllFilters(row, columns, 'zzz', { code: 'cst' })).toBe(false);
  });

  it('passes when both sides empty', () => {
    expect(rowMatchesAllFilters(row, columns, '', {})).toBe(true);
  });
});

describe('normalizeColumnFilters', () => {
  it('returns undefined for null / empty / whitespace-only', () => {
    expect(normalizeColumnFilters(null)).toBeUndefined();
    expect(normalizeColumnFilters(undefined)).toBeUndefined();
    expect(normalizeColumnFilters({})).toBeUndefined();
    expect(normalizeColumnFilters({ a: '', b: '  ' })).toBeUndefined();
  });

  it('keeps trimmed non-empty values', () => {
    expect(normalizeColumnFilters({ name: '  Alpha ', code: '' })).toEqual({ name: 'Alpha' });
  });
});

describe('sortComparable / compareCellValues', () => {
  it('classifies number, date (ISO), string, null', () => {
    expect(sortComparable(null).kind).toBe('null');
    expect(sortComparable('').kind).toBe('null');
    expect(sortComparable(10)).toEqual({ kind: 'number', number: 10 });
    expect(sortComparable('3,5')).toEqual({ kind: 'number', number: 3.5 });
    expect(sortComparable('2024-01-15').kind).toBe('date');
    expect(sortComparable('Alpha')).toEqual({ kind: 'string', string: 'alpha' });
  });

  it('compares numbers ascending', () => {
    expect(compareCellValues(1, 2)).toBeLessThan(0);
    expect(compareCellValues(2, 1)).toBeGreaterThan(0);
    expect(compareCellValues(2, 2)).toBe(0);
  });

  it('compares ISO dates', () => {
    expect(compareCellValues('2024-01-01', '2024-06-01')).toBeLessThan(0);
  });

  it('puts null / empty at the end', () => {
    expect(compareCellValues(null, 1)).toBeGreaterThan(0);
    expect(compareCellValues(1, null)).toBeLessThan(0);
    expect(compareCellValues(null, null)).toBe(0);
    expect(compareCellValues('', 'a')).toBeGreaterThan(0);
  });

  it('sorts mixed list with nulls last', () => {
    const values = [null, 3, 1, '', 2];
    const sorted = [...values].sort(compareCellValues);
    expect(sorted.slice(0, 3)).toEqual([1, 2, 3]);
    expect(sorted.slice(3)).toEqual([null, '']);
  });
});

describe('generic Row (DTO interface without index signature)', () => {
  interface SiteDto {
    cstKey: number;
    cstName: string;
  }

  it('accepts interface rows/columns without cast', () => {
    const columns: FemsqTableColumn<SiteDto>[] = [
      { name: 'cstName', label: 'Name', field: 'cstName' },
      { name: 'cstKey', label: 'Key', field: 'cstKey' }
    ];
    const row: SiteDto = { cstKey: 1, cstName: 'Alpha' };
    expect(cellText(row, columns[0])).toBe('Alpha');
    expect(rowMatchesFilter(row, columns, 'alp')).toBe(true);
    expect(rowMatchesAllFilters(row, columns, '', { cstName: 'Alpha' })).toBe(true);
  });
});
