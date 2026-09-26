import { describe, expect, it } from 'vitest';

import { treeListCellText, treeListLevelMatches, treeListRowIndentPx, treeListShowsToggle, walkNodeLevel } from './femsq-tree-list';
import { assignWalkListFields, resolveWalkView, usesWalkList, walkColumnsToTreeList } from './femsq-walk-view';

describe('treeListRowIndentPx', () => {
  it('does not indent the root row', () => {
    expect(treeListRowIndentPx(0, 16)).toBe(0);
  });

  it('shifts the first column by depth times indent', () => {
    expect(treeListRowIndentPx(1, 16)).toBe(16);
    expect(treeListRowIndentPx(3, 16)).toBe(48);
  });
});

describe('treeListShowsToggle', () => {
  it('hides the expand control on a leaf', () => {
    expect(treeListShowsToggle({ leaf: true })).toBe(false);
  });

  it('shows the expand control when the node is not a leaf', () => {
    expect(treeListShowsToggle({})).toBe(true);
    expect(treeListShowsToggle({ leaf: false })).toBe(true);
    expect(treeListShowsToggle({ children: [] })).toBe(true);
  });
});

describe('treeListCellText', () => {
  const label = { name: 'label-0', label: 'Подпись', field: 'label' };
  const keyCol = { name: 'key-1', label: 'Ключ', field: 'code', level: 'table' as const };

  it('leaves the cell empty when the field is missing', () => {
    expect(treeListCellText({ id: 'a' }, label)).toBe('');
    expect(treeListCellText({ label: null }, label)).toBe('');
    expect(treeListCellText({ label: '' }, label)).toBe('');
  });

  it('reads the field when it is present', () => {
    expect(treeListCellText({ label: 'Север' }, label)).toBe('Север');
    expect(treeListCellText({ label: 0 }, { name: 'n', label: 'N', field: 'label' })).toBe('0');
  });

  it('keeps a heterogeneous row empty when the level does not match', () => {
    const folder = { kind: 'folder', code: '900001' };
    const record = { kind: 'record', code: '900001' };
    expect(walkNodeLevel(folder)).toBe('edge');
    expect(walkNodeLevel(record)).toBe('table');
    expect(treeListCellText(folder, keyCol)).toBe('');
    expect(treeListCellText(record, keyCol)).toBe('900001');
    expect(treeListCellText({ code: '900001' }, keyCol)).toBe('');
  });

  it('fills a branch label only when node.level matches', () => {
    const siteCode = { name: 'code-site', label: 'Код стройки', field: 'code', level: 'site' };
    const pointCode = { name: 'code-point', label: 'Код точки', field: 'code', level: 'point' };
    const site = { id: 'a', kind: 'record', level: 'site', label: 'Север', code: '12' };
    const point = { id: 'b', kind: 'record', level: 'point', label: '051-1', code: '9', leaf: true };
    const label = { name: 'label', label: 'Подпись', field: 'label' };

    expect(treeListCellText(site, label)).toBe('Север');
    expect(treeListCellText(site, siteCode)).toBe('12');
    expect(treeListCellText(site, pointCode)).toBe('');
    expect(treeListCellText(point, siteCode)).toBe('');
    expect(treeListCellText(point, pointCode)).toBe('9');
    expect(treeListCellText({ kind: 'record', code: '12' }, siteCode)).toBe('');
    expect(treeListLevelMatches(site, 'site')).toBe(true);
    expect(treeListLevelMatches(site, 'point')).toBe(false);
    expect(treeListLevelMatches(point, 'table')).toBe(true);
  });

  it('still leaves the cell empty when the field is missing on a matching label', () => {
    const siteCode = { name: 'code-site', label: 'Код стройки', field: 'code', level: 'site' };
    expect(treeListCellText({ kind: 'record', level: 'site' }, siteCode)).toBe('');
  });
});

describe('resolveWalkView', () => {
  it('keeps outline when view is absent or outline', () => {
    expect(resolveWalkView(undefined)).toBe('outline');
    expect(resolveWalkView(null)).toBe('outline');
    expect(resolveWalkView('outline')).toBe('outline');
    expect(usesWalkList({})).toBe(false);
    expect(usesWalkList({ view: 'outline' })).toBe(false);
  });

  it('switches to list only when view is list', () => {
    expect(resolveWalkView('list')).toBe('list');
    expect(usesWalkList({ view: 'list' })).toBe(true);
    expect(resolveWalkView('grid')).toBe('outline');
  });
});

describe('walkColumnsToTreeList', () => {
  it('maps label, field, and level onto list columns', () => {
    const columns = walkColumnsToTreeList([
      { label: 'Подпись', field: 'title' },
      { label: 'Ключ', field: 'code', level: 'table' }
    ]);
    expect(columns).toEqual([
      { name: 'title-0', label: 'Подпись', field: 'title', level: undefined },
      { name: 'code-1', label: 'Ключ', field: 'code', level: 'table' }
    ]);
    expect(
      walkColumnsToTreeList([
        { label: 'Код стройки', field: 'code', level: 'site' },
        { label: 'Код точки', field: 'code', level: 'point' }
      ]).map((column) => column.level)
    ).toEqual(['site', 'point']);
  });

  it('copies present row fields onto the node and skips blanks', () => {
    const node = assignWalkListFields(
      { id: 'r:1', kind: 'record', title: 'header' },
      { title: 'из строки', code: '', note: null },
      [
        { label: 'Подпись', field: 'title' },
        { label: 'Ключ', field: 'code' }
      ]
    );
    expect(node).toEqual({ id: 'r:1', kind: 'record', title: 'из строки' });
  });
});
