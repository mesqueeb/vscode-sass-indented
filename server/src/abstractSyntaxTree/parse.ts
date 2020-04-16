import {
  SassNode,
  SassNodes,
  createSassNode,
  SassNodeValues,
  execGlobalRegex,
  isUse,
  isImport,
  SassASTOptions,
} from './utils';
import { getDistance, isProperty, isSelector } from 'suf-regex';

export class ASTParser {
  nodes: SassNode[] = [];
  currentNode: SassNodes['selector'] | null = null;
  /**current scope selector nodes*/
  scopeNodes: SassNodes['selector'][] = [];
  fileVariables: SassNodes['variable'][] = [];
  /**current scope variable nodes*/
  scopeVariables: SassNodes['variable'][] = [];
  constructor(public uri: string) {}

  parse(text: string, options: SassASTOptions): SassNode[] {
    text.split('\n').forEach((line, index) => {
      const type = this.getLineType(line);
      /**distance to first char in spaces. */
      const distance = getDistance(line, options.tabSize);
      /**indentation level.*/
      const level = Math.round(distance / options.tabSize);

      const selectorNodesLengthMinusOne = this.scopeNodes.length - 1;
      switch (type) {
        case 'selector':
          this.currentNode = createSassNode<typeof type>({
            body: [],
            level: Math.min(level, this.scopeNodes.length),
            line: index,
            type,
            value: line.trim(),
          });

          if (distance < options.tabSize) {
            this.nodes.push(this.currentNode);
          } else if (level > selectorNodesLengthMinusOne) {
            // TODO ADD DIAGNOSTICS
            this.scopeNodes[selectorNodesLengthMinusOne].body.push(this.currentNode);
          } else {
            this.scopeNodes[level - 1].body.push(this.currentNode);
          }
          if (this.scopeNodes.length > level) {
            this.scopeNodes.splice(level, this.scopeNodes.length - level);
            this.scopeVariables.splice(level, this.scopeNodes.length - level);
          }
          this.scopeNodes.push(this.currentNode);
          break;
        case 'property':
          const { value, body } = this.splitProperty(line);
          this.scopeNodes[this.scopeNodes.length - 1].body.push(
            createSassNode<typeof type>({
              body,
              level: Math.max(level, 1),
              line: index,
              type,
              value,
            })
          );
          break;

        case 'variable':
          const varNode = createSassNode<typeof type>({
            body: [],
            level: Math.min(level, this.scopeNodes.length),
            line: index,
            type,
            value: line.trim(),
          });

          if (distance < options.tabSize) {
            this.nodes.push(varNode);
            this.fileVariables.push(varNode);
          } else if (level > selectorNodesLengthMinusOne) {
            // TODO ADD DIAGNOSTICS
            this.scopeNodes[selectorNodesLengthMinusOne].body.push(varNode);
            this.scopeVariables.push(varNode);
          } else {
            this.scopeNodes[level - 1].body.push(varNode);
            this.scopeVariables.push(varNode);
          }

          break;

        default:
          break;
      }
    });

    return this.nodes;
  }

  private splitProperty(line: string) {
    const split = /^[\t ]*(.*?):(.*)/.exec(line);
    if (!split) {
      return { value: '', body: [] };
    }
    const value = split[1];
    const rawExpression = split[2];

    return { value, body: this.parseExpression(rawExpression) };
  }
  private parseExpression(rawExpression: string) {
    const body: SassNodeValues[] = [];

    let token = '';
    let tokenType: 'func' | 'interpolated' | 'var' | null = null;
    for (let i = 0; i < rawExpression.length; i++) {
      const char = rawExpression[i];

      switch (tokenType) {
        case 'func':
          break;

        default:
          if (char === '(') {
            tokenType = 'func';
          } else if (/\s/.test(char)) {
            body.push(
              createSassNode<'literal'>({ type: 'literal', value: token + char })
            );
            break;
          }
          token += char;
          break;
      }
    }

    execGlobalRegex(
      /(?<func>[\w\-_\.]*\(.*?\))|(?<interpolated>#\{.*?\})|(?<var>\$[\w\-_\.]+)|(?<literal>[\w"+*=/\-<>%!]+)/g,
      rawExpression,
      (m) => {
        const func = m.groups?.func;
        if (func) {
          // console.log('FUNC', func);
          const funcSplit = /^(.*?)\((.*)\)/.exec(func);
          if (funcSplit) {
            body.push(
              createSassNode<'expression'>({
                type: 'expression',
                body: this.parseExpression(funcSplit[2]),
                expressionType: 'func',
                funcName: funcSplit[1],
              })
            );
          }
        }
        const interpolated = m.groups?.interpolated;
        if (interpolated) {
          // console.log('INT', interpolated);
        }
        const variable = m.groups?.var;
        if (variable) {
          // console.log('VAR', variable);
          body.push(
            createSassNode<'variableRef'>({
              type: 'variableRef',
              ref: this.getVarRef(variable),
              value: variable,
            })
          );
        }
        const literal = m.groups?.literal;
        if (literal) {
          // console.log('LIT', literal);
          body.push(
            createSassNode<'literal'>({ type: 'literal', value: literal })
          );
        }
      }
    );
    return body;
  }

  private getVarRef(name: string): SassNodes['variableRef']['ref'] {
    let varNode = this.scopeVariables.find((v) => v.value === name);
    if (varNode) {
      return { file: this.uri, level: varNode.level, line: varNode.line };
    }

    varNode = this.fileVariables.find((v) => v.value === name);
    if (varNode) {
      return { file: this.uri, level: varNode.level, line: varNode.line };
    }

    // TODO Implement finding variables from imported files.
    return null;
  }

  private getLineType(line: string): keyof SassNodes {
    if (isProperty(line)) {
      return 'property';
    } else if (isSelector(line)) {
      return 'selector';
    } else if (isUse(line)) {
      return 'use';
    } else if (isImport(line)) {
      return 'import';
    }
    // TODO return correct value.
    return 'variableRef';
  }
}

function parseExpression(expression: string) {
  console.log('PARSE:', expression);
  let token = '';

  const body: SassNodeValues[] = [];

  const nodes: SassNodes['expression'][] = [];
  let level = 0;

  const pushNode = (node: SassNodeValues) => {
    if (level === 0) {
      body.push(node);
    } else {
      nodes[level - 1].body.push(node);
    }
  };

  const pushToken = (value: string) => {
    if (value.startsWith('$')) {
      pushNode(
        createSassNode<'variableRef'>({ type: 'variableRef', value, ref: null })
      );
    } else {
      pushNode(
        createSassNode<'literal'>({ type: 'literal', value })
      );
    }
  };

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (char === '#' && expression[i + 1] === '{') {
      i++; // skip open bracket

      const node = createSassNode<'expression'>({
        type: 'expression',
        body: [],
        expressionType: 'interpolated',
      });

      if (nodes.length > level) {
        nodes.splice(level, nodes.length - level);
      }
      nodes.push(node);
      pushNode(node);
      level++;

      token = '';
    } else if (char === ' ') {
      pushToken(token);
      token = '';
    } else if (char === '(') {
      const node = createSassNode<'expression'>({
        type: 'expression',
        body: [],
        expressionType: 'func',
        funcName: token,
      });

      if (nodes.length > level) {
        nodes.splice(level, nodes.length - level);
      }

      nodes.push(node);
      pushNode(node);
      level++;

      token = '';
    } else {
      if (char === ')') {
        pushToken(token);

        level--;
      }
      if (char === '}') {
        pushToken(token);

        level--;
      }
      token += char;
    }
  }

  return body;
}

//  calc(calc(20px - $var2) + $var)
// console.log(JSON.stringify(parseExpression('#{calc(100vh - #{$var})}'), null, 2));
