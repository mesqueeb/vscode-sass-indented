import { SassNode, SassASTOptions, SassNodes } from './utils';

export function stringifyNodes(nodes: SassNode[], options: SassASTOptions) {
  let text = '';
  for (let i = 0; i < nodes.length; i++) {
    text += stringifyNode(nodes[i], options);
  }
  return text;
}

function stringifyNode(node: SassNode, options: SassASTOptions) {
  let text = '';
  switch (node.type) {
    case 'comment':
      text += addLine(node.value, node.level, options);
      break;
    case 'import':
      text += addLine(`@import '${node.value}'`, node.level, options);
      break;
    case 'use':
      // TODO ADD @use "with" functionality
      text += addLine(stringifyAtUse(node), 0, options);
      break;
    case 'selector':
      text += addLine(node.value, node.level, options);
      text += stringifyNodes(node.body, options);
      break;
    case 'variable':
    case 'property':
      text += addLine(`${node.value}:${stringifyNodes(node.body, options)}`, node.level, options);
      break;
    case 'expression':
      text += stringifyExpression(node, options);
      break;
    case 'emptyLine':
      text += '\n';
      break;
    case 'literal':
    case 'variableRef':
      text += ` ${node.value}`;
      break;
  }

  return text;
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
