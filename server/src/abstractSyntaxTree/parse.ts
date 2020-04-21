import {
  SassNode,
  SassNodes,
  createSassNode,
  SassNodeValues,
  isUse,
  isImport,
  SassASTOptions,
  SassFile,
} from './utils';
import { getDistance, isProperty, isSelector, isVar } from 'suf-regex';
import { resolve } from 'path';
import { addDotSassToPath } from '../utils';
import { AbstractSyntaxTree } from './abstractSyntaxTree';
import { SassDiagnostic, createSassDiagnostic, createRange } from './diagnostics';

const importAtPathRegex = /^[\t ]*(@import|@use)[\t ]*['"]?(.*?)['"]?[\t ]*([\t ]+as.*)?$/;

interface ASTScope {
  /**Stores references to the nodes in the current scope.
   *
   * ```sass
   *   .class // [.class node].
   *     margin: 20px
   *     .class2  // [.class node, .class2 node]
   *       padding: 20px
   *   .class3 // [.class3 node]
   * ``` */
  selectors: SassNodes['selector'][];
  /**Stores all the variables available in the current scope.
   *
   * ```sass
   *    $var: 1px // [[$var node]]
   *    .class
   *      $var2: 2px // [[$var node], [$var2 node]]
   *      &:hover
   *        $var3: 3px // [[$var node], [$var2 node], [$var3 node]]
   *    .class2
   *      $var4: 4px // [[$var node], [$var4 node]]
   * ``` */
  variables: SassNodes['variable'][][];
  /**Stores all the imports available in the current scope, work's same as `scope.variables`. */
  imports: (SassNodes['import'] | SassNodes['use'])[][];
}

interface ASTParserCurrentContext {
  index: number;
  /**text of the current line. */
  line: string;
  /**node type. */
  type: keyof SassNodes;
  /**distance to first char in spaces. */
  distance: number;
  /**line indentation level.*/
  level: number;
}

export class ASTParser {
  /**Stores all nodes. */
  nodes: SassNode[] = [];

  diagnostics: SassDiagnostic[] = [];

  scope: ASTScope = {
    selectors: [],
    variables: [],
    imports: [],
  };
  /**Stores information about the current line. */
  current: ASTParserCurrentContext = {
    index: -1,
    distance: 0,
    line: '',
    type: 'emptyLine',
    level: 0,
  };

  constructor(public uri: string, public options: SassASTOptions, public ast: AbstractSyntaxTree) {}

  async parse(text: string): Promise<SassFile> {
    const lines = text.split('\n');
    let canPushAtUseOrAtForwardNode = true;
    for (let index = 0; index < lines.length; index++) {
      this.current.index = index;
      this.current.line = lines[index];
      this.current.type = this.getLineType(this.current.line);
      this.current.distance = getDistance(this.current.line, this.options.tabSize);
      this.current.level = Math.round(this.current.distance / this.options.tabSize);

      if (this.current.type !== 'use') {
        canPushAtUseOrAtForwardNode = false;
      }
      switch (this.current.type) {
        case 'selector':
          {
            const node = createSassNode<'selector'>({
              body: [],
              level: Math.min(this.current.level, this.scope.selectors.length),
              line: index,
              type: this.current.type,
              value: this.current.line.trim(),
            });

            this.pushNode(node);

            if (this.scope.selectors.length > this.current.level) {
              this.scope.selectors.splice(this.current.level);
              this.scope.variables.splice(Math.max(this.current.level, 1));
              this.scope.imports.splice(Math.max(this.current.level, 1));
            }

            this.scope.selectors.push(node);
          }
          break;
        case 'property':
          {
            const { value, body } = this.splitProperty(this.current.line);
            this.scope.selectors[this.scope.selectors.length - 1].body.push(
              createSassNode<'property'>({
                body,
                level: Math.max(this.current.level, 1),
                line: index,
                type: this.current.type,
                value,
              })
            );
          }
          break;

        case 'variable':
          {
            this.current.level = Math.min(this.current.level, this.scope.selectors.length);
            const { value, body } = this.splitProperty(this.current.line);
            const node = createSassNode<'variable'>({
              body: body,
              level: this.current.level,
              line: index,
              type: this.current.type,
              value,
            });
            this.pushNode(node);
          }
          break;

        case 'import':
          {
            const path = this.current.line.replace(importAtPathRegex, '$2');
            const uri = resolve(this.uri, '../', addDotSassToPath(path));
            const clampedLevel = Math.min(this.current.level, this.scope.selectors.length);

            const node = createSassNode<'import'>({
              uri,
              level: clampedLevel,
              line: index,
              type: this.current.type,
              value: path,
            });
            this.pushNode(node);

            await this.ast.lookUpFile(uri, this.options);
          }
          break;
        case 'use':
          {
            const clampedLevel = Math.min(this.current.level, this.scope.selectors.length);
            if (canPushAtUseOrAtForwardNode) {
              const path = this.current.line.replace(importAtPathRegex, '$2');
              const uri = resolve(this.uri, '../', addDotSassToPath(path));
              let namespace: string | null = this.current.line
                .replace(/(.*?as |@use)[\t ]*['"]?.*?([*\w-]*?)['"]?[\t ]*$/, '$2')
                .trim();
              namespace = namespace === '*' ? null : namespace;

              const node = createSassNode<'use'>({
                uri,
                line: index,
                level: 0,
                namespace,
                type: this.current.type,
                value: path,
              });
              this.pushNode(node);

              await this.ast.lookUpFile(uri, this.options);
            } else {
              this.diagnostics.push(
                createSassDiagnostic(
                  '@useNotTopLevel',
                  createRange(index, this.current.distance, this.current.line.length)
                )
              );
              this.pushNode(
                createSassNode<'comment'>({
                  level: clampedLevel,
                  line: index,
                  isMultiLine: false,
                  type: 'comment',
                  value: '// '.concat(this.current.line.trimLeft()),
                })
              );
            }
          }
          break;

        case 'emptyLine':
          {
            // TODO ADD DIAGNOSTICS, when there is more than 1 empty line in a row.
            this.pushNode(
              createSassNode<'emptyLine'>({ line: this.current.index, type: 'emptyLine' })
            );
          }
          break;

        default:
          //TODO Handle default case ?
          //throw
          console.log(
            `\x1b[38;2;255;0;0;1mAST: PARSE DEFAULT CASE\x1b[m Line: ${this.current.line} Type: ${this.current.type} Index: ${index}`
          );
      }
    }

    return {
      body: this.nodes,
      diagnostics: this.diagnostics,
    };
  }

  private pushNode(node: SassNode) {
    // TODO EXTEND DIAGNOSTIC, invalid indentation, example, (tabSize: 2) ' .class'
    if (this.current.distance < this.options.tabSize || this.scope.selectors.length === 0) {
      this.nodes.push(node);
    } else if (this.current.level > this.scope.selectors.length) {
      this.diagnostics.push(
        createSassDiagnostic(
          'invalidIndentation',
          createRange(this.current.index, this.current.distance, this.current.line.length),
          this.scope.selectors.length,
          this.options.tabSize,
          this.options.insertSpaces
        )
      );
      this.scope.selectors[this.scope.selectors.length - 1].body.push(node);
    } else {
      this.scope.selectors[this.current.level - 1].body.push(node);
    }

    if (node.type === 'variable') {
      if (this.scope.variables[this.current.level]) {
        this.scope.variables[this.current.level].push(node);
      } else {
        this.scope.variables.push([node]);
      }
    } else if (node.type === 'import' || node.type === 'use') {
      if (this.scope.imports[this.current.level]) {
        this.scope.imports[this.current.level].push(node);
      } else {
        this.scope.imports.push([node]);
      }
    }
  }

  private splitProperty(line: string) {
    const split = /^[\t ]*(.*?):(.*)/.exec(line);
    if (!split) {
      return { value: '', body: [] };
    }
    const value = split[1];
    const rawExpression = split[2];

    return {
      value,
      body: this.parseExpression(rawExpression, value.length + 1 + this.current.distance),
    };
  }
  private parseExpression(expression: string, startOffset: number) {
    let token = '';
    const body: SassNodeValues[] = [];

    const expressionNodes: SassNodes['expression'][] = [];
    let level = 0;
    let i = 0;

    const pushExpressionNode = (node: SassNodeValues) => {
      if (level === 0) {
        body.push(node);
      } else {
        expressionNodes[level - 1].body.push(node);
      }
    };

    const pushToken = (value: string) => {
      if (/^[.\w-]*\$/.test(value)) {
        const [, namespace, val] = /^(.*?)\.?(\$.*)/.exec(value) || [];
        pushExpressionNode(
          createSassNode<'variableRef'>({
            type: 'variableRef',
            value,
            ref: this.getVarRef(val, namespace || null, startOffset + i - value.length),
          })
        );
      } else if (value) {
        pushExpressionNode(
          createSassNode<'literal'>({ type: 'literal', value })
        );
      }
    };
    for (i; i < expression.length; i++) {
      const char = expression[i];

      if (char === '#' && expression[i + 1] === '{') {
        i++; // skip open bracket

        const node = createSassNode<'expression'>({
          type: 'expression',
          body: [],
          expressionType: 'interpolated',
        });

        if (expressionNodes.length > level) {
          expressionNodes.splice(level, expressionNodes.length - level);
        }
        expressionNodes.push(node);
        pushExpressionNode(node);
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

        if (expressionNodes.length > level) {
          expressionNodes.splice(level, expressionNodes.length - level);
        }

        expressionNodes.push(node);
        pushExpressionNode(node);
        level++;

        token = '';
      } else if (char === ')') {
        pushToken(token);
        token = '';
        level--;
      } else if (char === '}') {
        pushToken(token);
        token = '';
        level--;
      } else if (i === expression.length - 1) {
        i++; // i is used to measure the current offset, so 1 needs to be added on the last loop iteration.
        pushToken(token + char);
      } else {
        token += char;
      }
    }

    return body;
  }

  private getVarRef(
    name: string,
    namespace: null | string,
    offset: number
  ): SassNodes['variableRef']['ref'] {
    let varNode: SassNodes['variable'] | null | undefined = this.scope.variables
      .flat()
      .find((v) => v.value === name);
    if (varNode) {
      return { uri: this.uri, line: varNode.line };
    }

    return this.findVariableInImports(name, namespace, offset);
  }

  private findVariableInImports(name: string, namespace: null | string, offset: number) {
    const imports = this.scope.imports.flat();

    for (let i = 0; i < imports.length; i++) {
      const importNode = imports[i];

      if (importNode.type === 'use' && importNode.namespace !== namespace) {
        continue;
      }
      const varNode = this.ast.findVariable(importNode.uri, name);
      if (varNode) {
        return { uri: importNode.uri, line: varNode.line };
      }
    }

    this.diagnostics.push(
      createSassDiagnostic(
        'variableNotFound',
        createRange(this.current.index, offset, offset + name.length),
        name
      )
    );
    return null;
  }

  private getLineType(line: string): keyof SassNodes {
    if (line.length === 0) {
      return 'emptyLine';
    } else if (isProperty(line)) {
      return 'property';
    } else if (isSelector(line)) {
      return 'selector';
    } else if (isVar(line)) {
      return 'variable';
    } else if (isUse(line)) {
      return 'use';
    } else if (isImport(line)) {
      return 'import';
    }
    return 'literal';
  }
}
