interface SassBaseNode {
  body: SassNode[] | null;
  line: number;
  level: number;
  type: keyof SassNodes;
  value: string;
}

export type SassNodeValues = SassLiteralNode | SassVariableRefNode | SassExpressionNode;

interface SassImportNode extends SassBaseNode {
  body: null;
  type: 'import';
}
interface SassUseNode extends SassBaseNode {
  body: null;
  namespace?: string;
  type: 'use';
}
interface SassSelectorNode extends SassBaseNode {
  body: SassNode[];
  type: 'selector';
}

interface SassLiteralNode {
  type: 'literal';
  value: string;
}

interface SassVariableRefNode {
  type: 'variableRef';
  ref: {
    file: string;
    line: number;
    level: number;
  } | null;
  value: string;
}

interface SassExpressionNode {
  body: SassNodeValues[];
  type: 'expression';
  expressionType: 'func' | 'interpolated';
  funcName?: string;
}

interface SassPropertyNode extends SassBaseNode {
  body: SassNodeValues[];
  type: 'property';
}

interface SassVariableNode extends SassBaseNode {
  body: SassNodeValues[];
  type: 'variable';
}

type _SassNode<T extends keyof SassNodes> = SassNodes[T];

export type SassASTOptions = {
  tabSize: number;
  insertSpaces: boolean;
};

export type SassNode = _SassNode<keyof SassNodes>;

export interface SassNodes {
  import: SassImportNode;
  use: SassUseNode;
  selector: SassSelectorNode;
  literal: SassLiteralNode;
  property: SassPropertyNode;
  variable: SassVariableNode;
  variableRef: SassVariableRefNode;
  expression: SassExpressionNode;
}
export interface SassFile {
  body: SassNode[] | null;
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

export function execGlobalRegex(regex: RegExp, text: string, func: (m: RegExpExecArray) => void) {
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    func(m);
  }
}
