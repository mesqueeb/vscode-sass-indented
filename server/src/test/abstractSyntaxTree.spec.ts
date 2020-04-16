import { AbstractSyntaxTree } from '../abstractSyntaxTree/abstractSyntaxTree';

test('AST: Check Selector tabSize', () => {
  // expect('2').toEqual('2');
  const ast = new AbstractSyntaxTree();
  ast.addFile('.class\n  .class\n .class', '/file1', { insertSpaces: false, tabSize: 1 });
  ast.addFile('.class\n  .class\n .class', '/file2', { insertSpaces: false, tabSize: 2 });
  ast.addFile('.class\n  .class\n .class', '/file12', { insertSpaces: false, tabSize: 12 });
  const body = new Map();
  const margin = new Map();
  margin.set('body', '2px');
  body.set('margin', margin);
  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file1': {
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: '.class',
          body: [
            { line: 1, level: 1, body: [], value: '.class', type: 'selector' },
            { line: 2, level: 1, body: [], value: '.class', type: 'selector' },
          ],
        },
      ],
    },
    '/file2': {
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: '.class',
          body: [{ line: 1, level: 1, type: 'selector', value: '.class', body: [] }],
        },
        { line: 2, level: 1, type: 'selector', value: '.class', body: [] },
      ],
    },
    '/file12': {
      body: [
        { line: 0, level: 0, type: 'selector', body: [], value: '.class' },
        { line: 1, level: 0, type: 'selector', value: '.class', body: [] },
        { line: 2, level: 0, type: 'selector', value: '.class', body: [] },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});

test('AST: Simple Class', () => {
  const ast = new AbstractSyntaxTree();
  ast.addFile('.class\n  margin: 20px\n  &:hover\n    color: red', '/file', {
    insertSpaces: false,
    tabSize: 2,
  });
  const body = new Map();
  const margin = new Map();
  margin.set('body', '2px');
  body.set('margin', margin);
  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: '.class',
          body: [
            {
              line: 1,
              level: 1,
              value: 'margin',
              type: 'property',
              body: [{ type: 'literal', value: '20px' }],
            },
            {
              line: 2,
              level: 1,
              body: [
                {
                  level: 2,
                  line: 3,
                  type: 'property',
                  value: 'color',
                  body: [{ type: 'literal', value: 'red' }],
                },
              ],
              value: '&:hover',
              type: 'selector',
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});

test('AST: Property Values', () => {
  const ast = new AbstractSyntaxTree();
  ast.addFile('.class\n  margin: calc(calc(20px - $var2) + $var)', '/file', {
    insertSpaces: false,
    tabSize: 2,
  });
  const body = new Map();
  const margin = new Map();
  margin.set('body', '2px');
  body.set('margin', margin);
  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      body: [
        {
          line: 0,
          level: 0,
          type: 'selector',
          value: '.class',
          body: [
            {
              line: 1,
              level: 1,
              value: 'margin',
              type: 'property',
              body: [
                {
                  type: 'expression',
                  expressionType: 'func',
                  funcName: 'calc',
                  body: [
                    { type: 'literal', value: '20px' },
                    { type: 'literal', value: '+' },
                    {
                      type: 'variableRef',
                      ref: null,
                      value: '$var',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
