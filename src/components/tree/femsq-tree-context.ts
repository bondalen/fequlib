import type { InjectionKey } from 'vue';

import type { FemsqTreeKey, FemsqTreeNodeBase, FemsqTreeNodeKey } from './femsq-tree';

export interface FemsqTreeContext<Node extends FemsqTreeNodeBase = FemsqTreeNodeBase> {
  nodeKey: FemsqTreeNodeKey<Node>;
  childrenKey: string;
  leafKey: string;
  indent: number;
  expandOnClick: boolean;
  selectable: boolean;
  lazy: boolean;
  isExpanded: (key: FemsqTreeKey) => boolean;
  isSelected: (key: FemsqTreeKey) => boolean;
  isLoading: (key: FemsqTreeKey) => boolean;
  onHeaderClick: (evt: Event, node: Node, key: FemsqTreeKey) => void;
  onToggle: (evt: Event, node: Node, key: FemsqTreeKey) => void;
}

export const femsqTreeContextKey: InjectionKey<FemsqTreeContext> = Symbol('FemsqTree');
