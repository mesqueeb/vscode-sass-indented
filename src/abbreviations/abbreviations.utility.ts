import { TextDocument, WorkspaceEdit, workspace, window, Range, Position, SnippetString } from 'vscode';
import { normalize, join, basename, resolve, relative } from 'path';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { replaceWithOffset } from '../format/format.utility';

export const abbreviationsUtility = {
  getTabs(chars: number) {
    let tabs = '';
    for (let i = 0; i < chars; i++) {
      tabs = tabs.concat(' ');
    }
    return tabs;
  },

  propRegex(firstLetter: string, secondary?: string, tertiary?: string) {
    let additional = '';
    if (secondary !== undefined) {
      additional = additional.concat(`[${secondary}]?`);
    }
    if (tertiary !== undefined) {
      additional = additional.concat(`[${tertiary}]?`);
    }
    return new RegExp(`^ ?${firstLetter}{1}${additional}`);
  },
  getHtmlStructure(document: TextDocument) {
    const path = normalize(join(document.fileName, '../', './'));
    const dir = readdirSync(path);
    const res: { name: string; indentation: number }[] = [];
    for (const file of dir) {
      if (new RegExp(`${basename(document.fileName).replace('.sass', '.html')}`).test(file)) {
        const text = readFileSync(normalize(document.fileName).replace('.sass', '.html')).toString();
        const textLines = text.split('\n');
        let indentation = 0;
        for (let index = 0; index < textLines.length; index++) {
          const line = textLines[index];
          const tags = line.split('<');
          for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            const regex = /class="(.*)"|id="(.*)"/g;
            if (tag.trim() !== '' && !tag.startsWith('/')) {
              let m;
              while ((m = regex.exec(tag)) !== null) {
                if (m.index === regex.lastIndex) {
                  regex.lastIndex++;
                }
                m.forEach((match: string, groupIndex) => {
                  if (groupIndex !== 0 && match !== undefined) {
                    if (groupIndex === 1) {
                      const classes = match.split(' ');
                      classes.forEach(className => res.push({ name: '.'.concat(className), indentation }));
                    } else {
                      res.push({ name: '#'.concat(match), indentation });
                    }
                  }
                });
              }
              indentation++;
            } else if (tag.startsWith('/')) {
              indentation--;
            }
          }
        }
      }
    }
    return res;
  },
  createHtmlSnippetText(tags: { name: string; indentation: number }[], tabSize) {
    let text = '';
    let pos = 0;
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      text = text.concat(
        replaceWithOffset(tag.name, tag.indentation * tabSize),
        '\n',
        `${replaceWithOffset('', (tag.indentation + 1) * tabSize)}$${(pos++, pos)}`,
        '\n'
      );
    }
    return text;
  },
  htmlCommand(document: TextDocument, start: Position, endLine: number, previousText: string, tabSize) {
    const edit = new WorkspaceEdit();
    edit.replace(document.uri, new Range(start, new Position(endLine, previousText.length)), '');
    workspace
      .applyEdit(edit)
      .then(() =>
        window.activeTextEditor.insertSnippet(
          new SnippetString(abbreviationsUtility.createHtmlSnippetText(abbreviationsUtility.getHtmlStructure(document), tabSize)),
          start
        )
      );
  },
  angularInit(document: TextDocument) {
    for (let i = 0; i < workspace.workspaceFolders.length; i++) {
      const path = workspace.workspaceFolders[i];
      if (existsSync(join(path.uri.fsPath, '/src/styles.sass'))) {
        const importPath = relative(join(document.uri.fsPath, '../'), join(path.uri.fsPath, 'src/styles.sass'));
        const rep = importPath.replace('\\', '/');
        setTimeout(() => {
          const edit = new WorkspaceEdit();
          edit.insert(document.uri, new Position(0, 0), `@import ${importPath.startsWith('.') ? rep : './'.concat(rep)}\n`);
          workspace.applyEdit(edit);
        }, 50);
      }
    }
  }
};
