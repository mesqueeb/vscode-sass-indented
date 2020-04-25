import { AbstractSyntaxTree } from '../../abstractSyntaxTree/abstractSyntaxTree';

test('Sass Format: Selector Interpolation', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `#{$body}
    color: red

#{$main}
    color:red`,
    '/file',
    { insertSpaces: true, tabSize: 2 }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        {
          type: 'selector',
          level: 0,
          line: 0,
          value: '#{$body}',
          body: [
            {
              type: 'property',
              level: 1,
              line: 1,
              value: 'color',
              body: [{ type: 'literal', value: 'red' }],
            },
          ],
        },
        { type: 'emptyLine', line: 2 },
        {
          type: 'selector',
          level: 0,
          line: 3,
          value: '#{$main}',
          body: [
            {
              type: 'property',
              level: 1,
              line: 4,
              value: 'color',
              body: [{ type: 'literal', value: 'red' }],
            },
          ],
        },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);

  expect(await ast.stringifyFile('/file', { insertSpaces: true, tabSize: 2 })).toBe(`#{$body}
  color: red

#{$main}
  color: red`);
});
