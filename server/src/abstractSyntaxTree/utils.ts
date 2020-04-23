import { SassDiagnostic } from './diagnostics';

interface BaseNode {
  body: SassNode[] | null;
  line: number;
  level: number;
  type: keyof SassNodes;
  value: string;
}

export type NodeValues = LiteralNode | VariableRefNode | ExpressionNode;

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
  isMultiLine: boolean;
  value: string;
  type: 'comment';
}

interface SelectorNode extends BaseNode {
  body: SassNode[];
  type: 'selector';
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
}
export interface SassFile {
  body: SassNode[];
  diagnostics: SassDiagnostic[];
}

export function isUse(text: string) {
  return /^[\t ]*@use/.test(text);
}
export function isImport(text: string) {
  return /^[\t ]*@import/.test(text);
}

export function createSassNode<K extends keyof SassNodes>(values: SassNodes[K]) {
  return values;
}

// export function execGlobalRegex(regex: RegExp, text: string, func: (m: RegExpExecArray) => void) {
//   let m;
//   while ((m = regex.exec(text)) !== null) {
//     if (m.index === regex.lastIndex) {
//       regex.lastIndex++;
//     }
//     func(m);
//   }
// }
