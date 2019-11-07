import { State, StateItem } from '../../extension';
import { CompletionItemKind, ExtensionContext, TextDocumentChangeEvent, TextDocument } from 'vscode';
import { normalize, basename } from 'path';
import { escapeRegExp } from 'suf-regex';

export class Scanner {
  context: ExtensionContext;
  private _previousVars: { line: number; namespace: string }[] = [];
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  /**
   * scans for variables and mixin.
   */
  scanLine(listener: TextDocumentChangeEvent) {
    const document = listener.document;
    if (document.languageId === 'sass') {
      const previousVars = this._previousVars;
      this._previousVars = [];
      const pathBasename = basename(document.fileName);
      const varRegex = /\${1}\S*:/;
      const mixinRegex = /@mixin ?\S+ ?\(?.*\)?/;
      let variables: State = {};
      for (const change of listener.contentChanges) {
        const start = change.range.start;
        const end = change.range.end;
        for (let i = start.line; i <= end.line && i < document.lineCount; i++) {
          const line = document.lineAt(i);
          const isVar = varRegex.test(line.text);
          let currentItem: { state: State; current: { line: number; namespace: string } };
          if (isVar) {
            variables = this.context.workspaceState.get(normalize(document.fileName));
            currentItem = this.createVar(line.text, pathBasename, variables);
          }
          const isMixin = mixinRegex.test(line.text);
          if (isMixin) {
            variables = this.context.workspaceState.get(normalize(document.fileName));
            currentItem = this.createMixin(line.text, pathBasename, variables);
          }

          if (isVar || isMixin) {
            variables = currentItem.state;
            this._previousVars.push(currentItem.current);
            previousVars.forEach((v, i) => {
              if (
                currentItem.current.line === v.line ||
                currentItem.current.namespace.match(escapeRegExp(v.namespace))
              ) {
                delete variables[v.namespace];
              }
            });
            this.context.workspaceState.update(normalize(document.fileName), variables);
          }
        }
      }
    }
  }
  /**
   * scans for variables and mixin.
   */
  scanFile(document: TextDocument) {
    if (document.languageId === 'sass') {
      const text = document.getText();
      const pathBasename = basename(document.fileName);

      let variables: State = {};

      variables = this.scanFileHandleGetVars(text, pathBasename, variables);
      variables = this.scanFileHandleGetMixin(text, pathBasename, variables);

      this.context.workspaceState.update(normalize(document.fileName), variables);
    }
  }
  /**
   * handles finding the variables in a file.
   */
  private scanFileHandleGetVars(text: string, pathBasename: string, variables: State) {
    const varRegex = /^ *\${1}\S*:/gm;
    let varMatches: RegExpExecArray;
    while ((varMatches = varRegex.exec(text)) !== null) {
      if (varMatches.index === varRegex.lastIndex) {
        varRegex.lastIndex++;
      }
      varMatches.forEach((match: string) => {
        variables = this.createVar(match, pathBasename, variables).state;
      });
    }
    return variables;
  }
  /**
   * handles finding the mixins in a file.
   */
  private scanFileHandleGetMixin(text: string, pathBasename: string, variables: State) {
    const mixinRegex = /^ *@mixin ?\S+ ?\(?.*\)?/gm;
    let mixinMatches: RegExpExecArray;
    while ((mixinMatches = mixinRegex.exec(text)) !== null) {
      if (mixinMatches.index === mixinRegex.lastIndex) {
        mixinRegex.lastIndex++;
      }
      mixinMatches.forEach((match: string) => {
        variables = this.createMixin(match, pathBasename, variables).state;
      });
    }
    return variables;
  }
  /**
   * creates a mixin state item.
   */
  private createMixin(
    match: string,
    pathBasename: string,
    variables: State,
    line?: number
  ): { state: State; current: { line: number; namespace: string } } {
    let argNum = 0;
    const rep = match.replace('@mixin', '').trim();
    const namespace = `${pathBasename}/${rep}`;
    const item: StateItem = {
      title: `$${rep.split('(')[0]}`,
      insert: `@include ${rep
        .replace(/(\$\w*:? ?[\w-]*,?)/g, r => {
          argNum++;
          return `$\{${argNum}:${
            r
              .replace('$', '\\$')
              .replace(',', '')
              .split(':')[0]
          }: \},`;
        })
        .replace(/,\)$/, ')')}\n$0`,
      detail: `Include ${rep} - ${pathBasename} Mixin.`,
      kind: CompletionItemKind.Method
    };
    variables[namespace] = { item, type: 'Mixin' };
    return { state: variables, current: { line, namespace } };
  }
  /**
   * creates a variable snippet.
   */
  private createVar(
    match: string,
    pathBasename: string,
    variables: State,
    line?: number
  ): { state: State; current: { line: number; namespace: string } } {
    const rep = match.split(':')[0].replace(':', '');
    const namespace = `${pathBasename}/${rep}`;
    const item: StateItem = {
      title: rep,
      insert: rep,
      detail: `(${rep.replace('$', '')}) - ${pathBasename} Variable.`,
      kind: CompletionItemKind.Variable
    };
    variables[namespace] = { item, type: 'Variable' };
    return { state: variables, current: { line, namespace } };
  }
}
