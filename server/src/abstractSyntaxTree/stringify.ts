import { SassNode, SassASTOptions, SassNodes } from './nodes';

interface StringifyState {
  currentLine: number;
  wasLastLineEmpty: boolean;
}

const STATE: StringifyState = {
  currentLine: 0,
  wasLastLineEmpty: false,
};

export function stringifyNodes(nodes: SassNode[], options: SassASTOptions, resetState = false) {
  if (resetState) {
    STATE.currentLine = 0;
    STATE.wasLastLineEmpty = false;
  }
  let text = '';
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === 'emptyLine' && STATE.wasLastLineEmpty) {
      nodes.splice(i, 1);
      i--; // without decreasing the index the loop will skip the next node, because the array is one element shorter.
    }
    text += stringifyNode(node, options);
  }
  return text;
}

function stringifyNode(node: SassNode, options: SassASTOptions) {
  let text = '';
  switch (node.type) {
    case 'comment':
      increaseStateLineNumber(node);
      text += addLine(node.value, node.level, options);
      break;
    case 'blockComment':
      increaseStateLineNumber(node);
      STATE.currentLine--; // decrease because the block comment node stores the first line twice, in the node and in the first element of the body.
      node.body.forEach((contentNode) => {
        increaseStateLineNumber(contentNode);
        text += addLine(contentNode.value, node.level, options);
      });
      break;
    case 'extend':
      increaseStateLineNumber(node);
      text += addLine(`@extend ${node.value}`, node.level, options);
      break;
    case 'include':
      increaseStateLineNumber(node);
      text += addLine(
        `${node.includeType === '+' ? '+' : '@include '}${node.value}`,
        node.level,
        options
      );
      break;
    case 'import':
      increaseStateLineNumber(node);
      text += addLine(`@import '${node.value}'`, node.level, options);
      break;
    case 'use':
      // TODO ADD @use "with" functionality
      increaseStateLineNumber(node);
      text += addLine(stringifyAtUse(node), 0, options);
      break;
    case 'selector':
      increaseStateLineNumber(node);
      text += addLine(node.value, node.level, options);
      text += stringifyNodes(node.body, options);
      break;
    case 'mixin':
      increaseStateLineNumber(node);
      text += addLine(
        `${node.mixinType === '=' ? '=' : '@mixin '}${node.value}${
          node.args.length === 0
            ? ''
            : node.args.reduce((acc, item, index) => {
                acc += `${item.value}${
                  item.body ? ':'.concat(stringifyNodes(item.body, options)) : ''
                }`;
                if (node.args.length - 1 !== index) {
                  acc += ', ';
                } else {
                  acc += ')';
                }
                return acc;
              }, '(')
        }`,
        node.level,
        options
      );
      text += stringifyNodes(node.body, options);
      break;
    case 'variable':
    case 'property':
      increaseStateLineNumber(node);
      text += addLine(`${node.value}:${stringifyNodes(node.body, options)}`, node.level, options);
      break;
    case 'expression':
      text += stringifyExpression(node, options);
      break;
    case 'emptyLine':
      if (!STATE.wasLastLineEmpty) {
        increaseStateLineNumber(node);
        text += '\n';
        STATE.wasLastLineEmpty = true;
      }
      break;
    case 'literal':
    case 'variableRef':
      text += ` ${node.value}`;
      break;
  }

  return text;
}

function increaseStateLineNumber(node: { line: number }) {
  node.line = STATE.currentLine;
  STATE.currentLine++;
  STATE.wasLastLineEmpty = false;
}

function stringifyAtUse(node: SassNodes['use']) {
  const useNamespace = node.namespace && !node.value.endsWith(node.namespace);
  return `@use '${node.value}'${useNamespace ? ` as ${node.namespace}` : ''}`;
}

function stringifyExpression(node: SassNodes['expression'], options: SassASTOptions) {
  switch (node.expressionType) {
    case 'func':
      return ` ${node.funcName}(${stringifyNodes(node.body, options).replace(/^ /, '')})`;
    case 'interpolated':
      return ` #{${stringifyNodes(node.body, options).replace(/^ /, '')}}`;
  }
}

function addLine(text: string, level: number, options: SassASTOptions) {
  return `${
    options.insertSpaces ? ' '.repeat(level * options.tabSize) : '\t'.repeat(level)
  }${text}\n`;
}
