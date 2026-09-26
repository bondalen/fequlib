import { describe, expect, it } from 'vitest';

import { formatMoney } from '../../format/format-money';
import {
  buildWalkFolderNode,
  buildWalkRecordNode,
  createWalkActionContext,
  walkChildrenAfterRecordLoad,
  walkFlatListColumns,
  walkListUsesColumnSets,
  walkReloadToken,
  walkUsesForest,
  type FemsqWalkFetchRoots,
  type FemsqWalkTreeSpec
} from './femsq-walk-tree';

const fetchRoots: FemsqWalkFetchRoots = async () => [];

function spec(overrides: Partial<FemsqWalkTreeSpec> = {}): FemsqWalkTreeSpec {
  return {
    id: 'demo',
    version: 1,
    root: { table: 'parent', pk: 'id', queryId: 'roots' },
    title: ['name'],
    detail: ['name'],
    children: [],
    ...overrides
  };
}

describe('walkReloadToken', () => {
  it('числовой корень не включает queryId и rootsToken', () => {
    const tree = spec();
    expect(walkUsesForest(tree, 7, fetchRoots)).toBe(false);
    expect(walkReloadToken(tree, 7, 'хвост-999', fetchRoots)).toBe('row:parent:7');
  });

  it('лес включается только без числа и с fetchRoots, токен не разбирается', () => {
    const tree = spec();
    expect(walkUsesForest(tree, null, fetchRoots)).toBe(true);
    expect(walkUsesForest(tree, null, undefined)).toBe(false);
    expect(walkReloadToken(tree, null, 'не разбирать:12', fetchRoots)).toBe(
      'forest:roots:не разбирать:12'
    );
    expect(walkReloadToken(tree, null, 'не разбирать:12', undefined)).toBe('');
  });
});

describe('buildWalkRecordNode', () => {
  it('копирует level и в режиме комплектов берёт поля только своего набора', () => {
    const tree = spec({
      view: 'list',
      columns: [{ label: 'Чужое', field: 'other' }],
      columnSets: [
        { level: 'site', columns: [{ label: 'Код', field: 'code' }] },
        {
          level: 'point',
          columns: [
            { label: 'Сумма', field: 'sum' },
            { label: 'Имя', field: 'name' }
          ]
        }
      ],
      valueKinds: { sum: 'money' }
    });
    const node = buildWalkRecordNode(
      'parent',
      3,
      { code: 'A', name: 'из строки', sum: '186961.48', other: 'flat' },
      { title: ['name'], detail: '*', children: [], valueKinds: tree.valueKinds, level: 'point' },
      tree
    );
    expect(node.level).toBe('point');
    expect(node.code).toBeUndefined();
    expect(node.sum).toBe(formatMoney('186961.48'));
    expect(node.name).toBe('из строки');
    expect(node.other).toBeUndefined();
    expect(walkListUsesColumnSets(tree)).toBe(true);
    expect(walkFlatListColumns(tree)).toBeUndefined();
  });

  it('без комплектов list кладёт плоские колонки, outline их не проецирует', () => {
    const fields = { code: 'A', title: 'контур' };
    const list = spec({ view: 'list', columns: [{ label: 'Код', field: 'code' }] });
    const projected = buildWalkRecordNode('parent', 1, fields, { title: ['title'], detail: ['title'], children: [] }, list);
    expect(projected.code).toBe('A');

    const outline = spec({ view: 'outline', columnSets: [{ level: 'site', columns: [{ label: 'Код', field: 'code' }] }] });
    const card = buildWalkRecordNode('parent', 1, fields, { title: ['title'], detail: ['title'], children: [] }, outline);
    expect(card.code).toBeUndefined();
    expect(card.title).toBe('контур');
  });

  it('нет метки — структурный комплект table, чужая метка даёт пустые поля', () => {
    const tree = spec({
      view: 'list',
      columnSets: [{ level: 'table', columns: [{ label: 'Код', field: 'code' }] }]
    });
    const matched = buildWalkRecordNode('parent', 1, { code: 'A' }, { title: ['code'], detail: [], children: [] }, tree);
    expect(matched.code).toBe('A');
    const unmatched = buildWalkRecordNode(
      'parent',
      1,
      { code: 'A' },
      { title: ['code'], detail: [], children: [], level: 'site' },
      tree
    );
    expect(unmatched.code).toBeUndefined();
    expect(unmatched.level).toBe('site');
  });
});

describe('walkChildrenAfterRecordLoad', () => {
  it('1:N становится папкой, N:1 — записями, fromId число, level копируется', () => {
    const tree = spec({ view: 'list' });
    const parent = buildWalkRecordNode(
      'parent',
      4,
      { name: 'корень' },
      {
        title: ['name'],
        detail: [],
        children: [
          {
            edge: 'toChild',
            to: 'child',
            card: '1:N',
            folder: 'Дети',
            title: ['name'],
            detail: ['name'],
            children: [],
            level: 'point'
          },
          {
            edge: 'toLink',
            to: 'link',
            card: 'N:1',
            title: ['name'],
            detail: ['name'],
            children: [],
            level: 'site'
          }
        ]
      },
      tree
    );
    const children = walkChildrenAfterRecordLoad(
      parent,
      { toLink: [{ key: 9, fields: { name: 'связь' } }] },
      tree
    );
    expect(children).toHaveLength(2);
    expect(children[0]?.kind).toBe('folder');
    expect(children[0]?.fromId).toBe(4);
    expect(children[0]?.level).toBe('point');
    expect(children[1]?.kind).toBe('record');
    expect(children[1]?.id).toBe('link:9');
    expect(children[1]?.level).toBe('site');
  });
});

describe('createWalkActionContext', () => {
  it('прочерк в поле карточки становится null, fromId остаётся числом', () => {
    const tree = spec();
    const folder = buildWalkFolderNode(
      'parent:4',
      4,
      {
        queryId: 'q-children',
        to: 'child',
        card: '1:N',
        folder: 'Папка',
        title: ['name'],
        detail: ['name'],
        children: [],
        actions: [{ id: 'open', kind: 'open-form', label: 'Открыть', scope: 'folder' }]
      },
      tree
    );
    const context = createWalkActionContext('parent', null, folder, folder.actions![0]!);
    expect(context.root.id).toBeNull();
    expect(context.node.fromId).toBe(4);
    expect(context.actionId).toBe('open');

    const record = buildWalkRecordNode(
      'parent',
      1,
      {},
      { title: ['name'], detail: ['name'], children: [] },
      tree
    );
    const recordContext = createWalkActionContext(
      'parent',
      1,
      record,
      { id: 'go', kind: 'navigate', label: 'Перейти' }
    );
    expect(recordContext.node.fields.name).toBeNull();
  });
});
