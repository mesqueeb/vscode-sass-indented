import { AbstractSyntaxTree } from '../abstractSyntaxTree/abstractSyntaxTree';

test('AST: EmptyLine and empty property', async () => {
  const ast = new AbstractSyntaxTree();
  await ast.parseFile(
    `
.class
  margin-top:


`,
    `/file`,
    {
      insertSpaces: false,
      tabSize: 2,
    }
  );

  const expectedFiles: AbstractSyntaxTree['files'] = {
    '/file': {
      diagnostics: [],
      body: [
        { type: 'emptyLine', line: 0 },
        {
          type: 'selector',
          level: 0,
          line: 1,
          value: '.class',
          body: [
            {
              type: 'property',
              level: 1,
              line: 2,
              value: 'margin-top',
              body: [],
            },
          ],
        },
        { type: 'emptyLine', line: 3 },
        { type: 'emptyLine', line: 4 },
        { type: 'emptyLine', line: 5 },
      ],
    },
  };
  expect(ast.files).toStrictEqual(expectedFiles);
});
