import type { InjectionKey } from 'vue';

import type { FemsqTreeKey, FemsqTreeNodeBase, FemsqTreeNodeKey } from './femsq-tree';
import type { FemsqTreeListColumn, FemsqTreeListColumnSet } from './femsq-tree-list';

export interface FemsqTreeListContext<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  nodeKey: FemsqTreeNodeKey<Node>;
  childrenKey: string;
  leafKey: string;
  indent: number;
  columns: FemsqTreeListColumn<Node>[];
  columnSets: FemsqTreeListColumnSet<Node>[];
  useColumnSets: boolean;
  trackCount: number;
  dataTrackCount: number;
  hasActions: boolean;
  toggleWidthPx: number;
  labelWidthPx: number;
  dataWidthsPx: number[];
  expandOnClick: boolean;
  selectable: boolean;
  lazy: boolean;
  isExpanded: (key: FemsqTreeKey) => boolean;
  isSelected: (key: FemsqTreeKey) => boolean;
  isLoading: (key: FemsqTreeKey) => boolean;
  onRowClick: (evt: Event, node: Node, key: FemsqTreeKey) => void;
  onToggle: (evt: Event, node: Node, key: FemsqTreeKey) => void;
  beginResizeNav: (part: 'toggle' | 'label' | 'zone', clientX: number) => void;
  beginResizeData: (index: number, clientX: number) => void;
}

export const femsqTreeListContextKey: InjectionKey<FemsqTreeListContext> = Symbol('FemsqTreeList');
