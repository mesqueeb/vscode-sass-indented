import { CompletionItem, CompletionItemKind, SnippetString, TextDocumentChangeEvent, ExtensionContext, TextDocument } from 'vscode';
import sassSchemaUnits from '../schemas/sassSchemaUnits';
import * as path from 'path';
import { STATE } from '../extension';

export class ScanForVarsAndMixin {
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
            currentItem = this.createVar(line.text, pathBasename, variables);
          }
          const isMixin = mixinRegex.test(line.text);
          if (isMixin) {
            variables = this.context.workspaceState.get(path.normalize(document.fileName));
            currentItem = this.createMixin(line.text, pathBasename, variables);
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
  /**
   * scans for variables and mixin.
   */
  scanFile(document: TextDocument) {
    if (document.languageId === 'sass') {
      const text = document.getText();
      const pathBasename = path.basename(document.fileName);

      let variables: STATE = {};
      variables = this.scanFileHandleGetVars(text, pathBasename, variables);
      variables = this.scanFileHandleGetMixin(text, pathBasename, variables);

      this.context.workspaceState.update(path.normalize(document.fileName), variables);
    }
  }
  /**
   * handles finding the variables in a file.
   */
  private scanFileHandleGetVars(text: string, pathBasename: string, variables: STATE) {
    const varRegex = /\${1}\S*:/g;
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
  private scanFileHandleGetMixin(text: string, pathBasename: string, variables: STATE) {
    const mixinRegex = /@mixin ?\S+ ?\(?.*\)?/g;
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
  /**
   * creates a variable snippet.
   */
  private createVar(
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
}

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

/**
 * Check whether text is class, id or placeholder
 */
export function isClassOrId(text: string): boolean {
  return /^ *?#/.test(text) || /^ *\./.test(text) || /^ *%/.test(text);
}
/**
 * Check whether text is a property
 */
export function isProperty(text: string): boolean {
  return /^ *.*:/.test(text);
}
/**
 * Check whether the is text empty.
 */
export function isEmpty(text: string): boolean {
  return /^ *$/.test(text);
}
/**
 * Check whether text is a mixin
 */
export function isMixin(text: string): boolean {
  return /^ *@mixin/.test(text);
}
/**
 * Check whether text starts with &
 */
export function isAnd(text: string): boolean {
  return /^ *&/.test(text);
}
/**
 * Check whether currentWord is at rule
 */
export function isAtRule(currentWord: string): boolean {
  return /^ *@/.test(currentWord);
}
export function isSelector(currentWord: string): boolean {
  return currentWord === 'section' || currentWord === 'div';
}

/**
 * Naive check whether currentWord is value for given property
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isValue(cssSchema, currentWord: string): boolean {
  const property = getPropertyName(currentWord);

  return property && Boolean(findPropertySchema(cssSchema, property));
}

/**
 * Formats property name
 * @param {String} currentWord
 * @return {String}
 */
export function getPropertyName(currentWord: string): string {
  return currentWord
    .trim()
    .replace(':', ' ')
    .split(' ')[0];
}

/**
 * Search for property in cssSchema
 * @param {Object} cssSchema
 * @param {String} property
 * @return {Object}
 */
export function findPropertySchema(cssSchema, property: string) {
  return cssSchema.data.css.properties.find(item => item.name === property);
}

/**
 * Returns property list for completion
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getProperties(cssSchema, currentWord: string, useSeparator: boolean): CompletionItem[] {
  if (isClassOrId(currentWord) || isAtRule(currentWord) || isSelector(currentWord)) {
    return [];
  }

  return cssSchema.data.css.properties.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.insertText = property.name + (useSeparator ? ': ' : ' ');
    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Property;

    return completionItem;
  });
}

/**
 * Returns values for current property for completion list
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getValues(cssSchema, currentWord: string): CompletionItem[] {
  const property = getPropertyName(currentWord);
  const values = findPropertySchema(cssSchema, property).values;

  if (!values) {
    return [];
  }

  return values.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Value;

    return completionItem;
  });
}
/**
 * checks if currentWord last char is a number?
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function isNumber(currentWord: string): boolean {
  const reg = /[0-9]$/;
  return reg.test(currentWord) && !currentWord.includes('#');
}
/**
 * returns the difference between the current indentation and the indentation of the given text.
 */
export function detectTabOffset(text: string, indentation: number): { offset: number; distance: number } {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char !== ' ') {
      break;
    }
    count++;
  }
  return { offset: indentation - count, distance: count };
}

export function detectCLassOrIdOffset(distance: number, tabSize: number) {
  if (distance === 0) {
    return 0;
  }
  return tabSize * Math.round(distance / tabSize - 0.1) - distance;
}
export function replaceWithOffset(text: string, offset: number) {
  console.log(text);
  if (offset < 0) {
    text = text.replace(new RegExp(`^ {${Math.abs(offset)}}`), '');
  } else {
    let space = '';
    for (let i = 0; i < offset; i++) {
      space = space.concat(' ');
    }
    text = text.replace(/^/, space);
  }
  console.log(text);
  return text;
}
