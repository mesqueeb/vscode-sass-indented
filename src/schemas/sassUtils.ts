import { CompletionItem, CompletionItemKind, SnippetString, TextDocumentChangeEvent, ExtensionContext, TextDocument } from 'vscode';
import sassSchemaUnits from './sassSchemaUnits';
import * as path from 'path';
import { STATE } from '../extension';

/**
 * gets unit completions.
 * @param currentword
 */
export function getUnits(currentword: string) {
  const units = [];

  sassSchemaUnits.forEach(item => {
    const lastWord = currentword.split(' ');
    const rep = lastWord[lastWord.length - 1];
    const completionItem = new CompletionItem(rep + item.name);
    completionItem.insertText = new SnippetString(rep + item.body);
    completionItem.detail = item.description;
    completionItem.kind = CompletionItemKind.Unit;
    units.push(completionItem);
  });
  return units;
}
/**
 * Get the imports.
 * @param text text of the current File.
 */
export function getImports(text: string) {
  const regex = /\/?\/? {0,}@import{1}.*/g; //
  let m: RegExpExecArray;
  const imports = [];

  while ((m = regex.exec(text)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    m.forEach((match: string) => {
      if (!match.startsWith('//')) {
        let rep = match.replace('@import', '').trim();
        const rEndsWithSass = /.sass$/;
        if (!rEndsWithSass.test(rep)) {
          rep = rep.concat('.sass');
        }

        imports.push(rep);
      }
    });
  }
  return imports;
}
export function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class ScanForVarsAndMixin {
  context: ExtensionContext;
  private _previousVars: { line: number; namespace: string }[] = [];
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  scanLine(listener: TextDocumentChangeEvent) {
    const document = listener.document;
    if (document.languageId === 'sass') {
      const previousVars = this._previousVars;
      this._previousVars = [];
      const pathBasename = path.basename(document.fileName);
      const varRegex = /\${1}\S*:/;
      const mixinRegex = /@mixin ?\S+ ?\(?.*\)?/;
      let variables: STATE = {};
      for (const change of listener.contentChanges) {
        const start = change.range.start;
        const end = change.range.end;
        for (let i = start.line; i <= end.line && i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const isVar = varRegex.test(line.text);
          let currentItem: { state: STATE; current: { line: number; namespace: string } };
          if (isVar) {
            variables = this.context.workspaceState.get(path.normalize(document.fileName));
            currentItem = createVar(line.text, pathBasename, variables);
          }
          const isMixin = mixinRegex.test(line.text);
          if (isMixin) {
            variables = this.context.workspaceState.get(path.normalize(document.fileName));
            currentItem = createMixin(line.text, pathBasename, variables);
          }

          if (isVar || isMixin) {
            variables = currentItem.state;
            this._previousVars.push(currentItem.current);
            previousVars.forEach((v, i) => {
              if (currentItem.current.line === v.line || currentItem.current.namespace.match(escapeRegExp(v.namespace))) {
                delete variables[v.namespace];
              }
            });
            this.context.workspaceState.update(path.normalize(document.fileName), variables);
          }
        }
      }
    }
  }
  scanFile(document: TextDocument) {
    if (document.languageId === 'sass') {
      const text = document.getText();
      const pathBasename = path.basename(document.fileName);

      let variables: STATE = {};
      variables = scanFileHandleGetVars(text, pathBasename, variables);
      variables = scanFileHandleGetMixin(text, pathBasename, variables);

      this.context.workspaceState.update(path.normalize(document.fileName), variables);
    }
  }
}

export function scanFileHandleGetVars(text: string, pathBasename: string, variables: STATE) {
  const varRegex = /\${1}\S*:/g;
  let varMatches: RegExpExecArray;
  while ((varMatches = varRegex.exec(text)) !== null) {
    if (varMatches.index === varRegex.lastIndex) {
      varRegex.lastIndex++;
    }
    varMatches.forEach((match: string) => {
      variables = createVar(match, pathBasename, variables).state;
    });
  }
  return variables;
}

export function scanFileHandleGetMixin(text: string, pathBasename: string, variables: STATE) {
  const mixinRegex = /@mixin ?\S+ ?\(?.*\)?/g;
  let mixinMatches: RegExpExecArray;
  while ((mixinMatches = mixinRegex.exec(text)) !== null) {
    if (mixinMatches.index === mixinRegex.lastIndex) {
      mixinRegex.lastIndex++;
    }
    mixinMatches.forEach((match: string) => {
      variables = createMixin(match, pathBasename, variables).state;
    });
  }
  return variables;
}

export function createMixin(
  match: string,
  pathBasename: string,
  variables: STATE,
  line?: number
): { state: STATE; current: { line: number; namespace: string } } {
  let argNum = 0;
  const rep = match.replace('@mixin', '').trim();
  const namespace = `${pathBasename}/${rep}`;
  const completionItem = new CompletionItem(`$${rep.split('(')[0]}`);
  completionItem.insertText = new SnippetString(
    `@include ${rep.replace(/(\$\S*)/g, (r, g) => {
      argNum++;
      return `$\{${argNum}:${g}\}`;
    })}`
  );
  completionItem.detail = `Include ${rep} - ${pathBasename} Mixin.`;
  completionItem.kind = CompletionItemKind.Method;
  variables[namespace] = { item: completionItem, type: 'Mixin' };
  return { state: variables, current: { line, namespace } };
}
export function createVar(
  match: string,
  pathBasename: string,
  variables: STATE,
  line?: number
): { state: STATE; current: { line: number; namespace: string } } {
  const rep = match.split(':')[0].replace(':', '');
  const namespace = `${pathBasename}/${rep}`;
  const completionItem = new CompletionItem(rep);
  completionItem.insertText = rep;
  completionItem.detail = `(${rep.replace('$', '')}) - ${pathBasename} Variable.`;
  completionItem.kind = CompletionItemKind.Variable;
  variables[namespace] = { item: completionItem, type: 'Variable' };
  return { state: variables, current: { line, namespace } };
}
