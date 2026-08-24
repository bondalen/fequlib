import { describe, expect, it } from 'vitest';

import {
  getChildren,
  getLoadReason,
  getNodeKey,
  isLeaf,
  keyListIncludes,
  shouldLoad,
  toggleKeyInList,
  toggleSelectedKey,
  type FemsqTreeNodeBase
} from './femsq-tree';

type Node = FemsqTreeNodeBase;

describe('getNodeKey', () => {
  it('reads a string field', () => {
    expect(getNodeKey({ id: 'sf:2' }, 'id')).toBe('sf:2');
    expect(getNodeKey({ id: 12 }, 'id')).toBe(12);
  });

  it('uses a function (composite host keys)', () => {
    const node = { type: 'sf', invKey: 2 };
    expect(getNodeKey(node, (n) => `${n.type}:${n.invKey}`)).toBe('sf:2');
  });
});

describe('getChildren', () => {
  it('returns undefined when missing, null, or non-array', () => {
    expect(getChildren({} as Node)).toBeUndefined();
    expect(getChildren({ children: null })).toBeUndefined();
    expect(getChildren({ children: 'x' })).toBeUndefined();
  });

  it('returns [] vs non-empty array', () => {
    expect(getChildren({ children: [] })).toEqual([]);
    const child = { id: 'a' };
    expect(getChildren({ children: [child] })).toEqual([child]);
  });

  it('honours childrenKey', () => {
    const items = [{ id: '1' }];
    expect(getChildren({ items }, 'items')).toEqual(items);
    expect(getChildren({ items }, 'children')).toBeUndefined();
  });
});

describe('isLeaf', () => {
  it('is true only for leaf === true (default key)', () => {
    expect(isLeaf({ leaf: true })).toBe(true);
    expect(isLeaf({ leaf: false })).toBe(false);
    expect(isLeaf({})).toBe(false);
    expect(isLeaf({ leaf: 'yes' })).toBe(false);
  });

  it('honours leafKey', () => {
    expect(isLeaf({ done: true }, 'done')).toBe(true);
    expect(isLeaf({ leaf: true }, 'done')).toBe(false);
  });
});

describe('shouldLoad', () => {
  it('false when lazy is off', () => {
    expect(shouldLoad({}, false)).toBe(false);
    expect(shouldLoad({ children: undefined }, false)).toBe(false);
  });

  it('false for leaf even if lazy and no children', () => {
    expect(shouldLoad({ leaf: true }, true)).toBe(false);
  });

  it('false when children is already an array (including empty)', () => {
    expect(shouldLoad({ children: [] }, true)).toBe(false);
    expect(shouldLoad({ children: [{ id: 'x' }] }, true)).toBe(false);
  });

  it('true when lazy, not leaf, children not a loaded array', () => {
    expect(shouldLoad({}, true)).toBe(true);
    expect(shouldLoad({ children: null }, true)).toBe(true);
  });
});

describe('getLoadReason', () => {
  it('expand then retry', () => {
    expect(getLoadReason(false)).toBe('expand');
    expect(getLoadReason(true)).toBe('retry');
  });
});

describe('keyListIncludes / toggleKeyInList', () => {
  it('includes by strict equality', () => {
    expect(keyListIncludes(['sf:2', 3], 'sf:2')).toBe(true);
    expect(keyListIncludes(['sf:2'], 2)).toBe(false);
    expect(keyListIncludes(undefined, 'sf:2')).toBe(false);
  });

  it('toggles add/remove without mutating the source', () => {
    const src = ['a'];
    expect(toggleKeyInList(src, 'b')).toEqual(['a', 'b']);
    expect(toggleKeyInList(['a', 'b'], 'b')).toEqual(['a']);
    expect(toggleKeyInList(src, 'a', true)).toEqual(['a']);
    expect(toggleKeyInList(src, 'c', false)).toEqual(['a']);
    expect(src).toEqual(['a']);
  });
});

describe('toggleSelectedKey', () => {
  it('returns null when clicked on already-selected key', () => {
    expect(toggleSelectedKey('a', 'a')).toBeNull();
    expect(toggleSelectedKey(1, 1)).toBeNull();
  });

  it('returns clicked key when selection differs (or is nullish)', () => {
    expect(toggleSelectedKey(null, 'a')).toBe('a');
    expect(toggleSelectedKey(undefined, 2)).toBe(2);
    expect(toggleSelectedKey('a', 'b')).toBe('b');
  });
});
