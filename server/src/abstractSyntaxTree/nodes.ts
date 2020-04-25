export interface BaseNode {
  body: SassNode[] | null;
  line: number;
  level: number;
  type: keyof SassNodes;
  value: string;
}
export type NodeValues = LiteralNode | VariableRefNode | ExpressionNode;

/** TODO
 * expand selector node, so that every class, id, tag have their own node,
 * its useful in case the selector has an interpolated section,
 * to check is var exist.
 */
export interface SelectorNode extends BaseNode {
  body: SassNode[];
  type: 'selector';
}

interface ImportNode extends Omit<BaseNode, 'body'> {
  value: string;
  uri: string;
  type: 'import';
}
interface UseNode extends Omit<BaseNode, 'body' | 'level'> {
  value: string;
  uri: string;
  namespace: string | null;
  type: 'use';
}
interface CommentNode extends Omit<BaseNode, 'body'> {
  value: string;
  type: 'comment';
}

interface BlockCommentContentNode {
  value: string;
  line: number;
}

interface BlockCommentNode extends Omit<BaseNode, 'body' | 'value'> {
  body: BlockCommentContentNode[];
  type: 'blockComment';
}

interface LiteralNode {
  type: 'literal';
  value: string;
}
interface VariableRefNode {
  type: 'variableRef';
  ref: {
    uri: string;
    line: number;
  } | null;
  value: string;
}
interface ExpressionNodeBase {
  body: NodeValues[];
  type: 'expression';
  expressionType: keyof SassExpressionNodes;
}
interface FuncExpressionNode extends ExpressionNodeBase {
  expressionType: 'func';
  funcName: string;
}
interface InterpolationExpressionNode extends ExpressionNodeBase {
  expressionType: 'interpolated';
}
interface SassExpressionNodes {
  func: FuncExpressionNode;
  interpolated: InterpolationExpressionNode;
}

type ExpressionNode = SassExpressionNodes[keyof SassExpressionNodes];
interface PropertyNode extends BaseNode {
  body: NodeValues[];
  type: 'property';
}
interface VariableNode extends BaseNode {
  body: NodeValues[];
  type: 'variable';
}
interface EmptyLineNode extends Pick<BaseNode, 'type' | 'line'> {
  type: 'emptyLine';
}
interface ExtendNode extends Pick<BaseNode, 'type' | 'line' | 'value' | 'level'> {
  type: 'extend';
}
interface IncludeNode extends Pick<BaseNode, 'type' | 'line' | 'value' | 'level'> {
  type: 'include';
  includeType: '@include' | '+';
}

interface FontFaceNode extends Omit<BaseNode, 'value'> {
  type: 'fontFace';
  body: SassNode[];
}

interface MixinNode extends BaseNode {
  body: SassNode[];
  type: 'mixin';
  mixinType: '@mixin' | '=';
  args: { value: string; body: NodeValues[] | null }[];
}

type _SassNode<T extends keyof SassNodes> = SassNodes[T];

export type SassASTOptions = {
  tabSize: number;
  insertSpaces: boolean;
};
export type SassNode = _SassNode<keyof SassNodes>;
export interface SassNodes {
  import: ImportNode;
  use: UseNode;
  selector: SelectorNode;
  literal: LiteralNode;
  property: PropertyNode;
  variable: VariableNode;
  variableRef: VariableRefNode;
  expression: ExpressionNode;
  comment: CommentNode;
  emptyLine: EmptyLineNode;
  mixin: MixinNode;
  extend: ExtendNode;
  blockComment: BlockCommentNode;
  include: IncludeNode;
  fontFace: FontFaceNode;
}
