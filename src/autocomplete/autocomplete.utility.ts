import {
  CompletionItem,
  CompletionItemKind,
  SnippetString,
  TextDocument,
  Position,
  ExtensionContext,
  workspace
} from 'vscode';

import sassSchemaUnits from './schemas/autocomplete.units';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, normalize, basename } from 'path';
import { BasicRawCompletion } from './autocomplete.interfaces';
import { isClassOrId, isAtRule } from 'suf-regex';
import { StateElement, State } from '../extension';
import { getSassModule } from './schemas/autocomplete.builtInModules';
import { generatedData, dataProps } from './schemas/autocomplete.generatedData';

interface ImportsItem {
  path: string;
  namespace: string | undefined;
}

export class AutocompleteUtilities {
  /**
   * Naive check whether currentWord is value for given property
   * @param {Object} cssSchema
   * @param {String} currentWord
   * @return {Boolean}
   */

  static isValue(cssSchema, currentWord: string): boolean {
    const property = AutocompleteUtilities.getPropertyName(currentWord);
    if (workspace.getConfiguration('sass').get('autocomplete.useExperimentalData') === true) {
      return property && !!dataProps[property];
    }
    return property && Boolean(AutocompleteUtilities.findPropertySchema(cssSchema, property));
  }

  /**
   * Formats property name
   * @param {String} currentWord
   * @return {String}
   */

  static getPropertyName(currentWord: string): string {
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
  static findPropertySchema(cssSchema, property: string): BasicRawCompletion | any {
    if (workspace.getConfiguration('sass').get('autocomplete.useExperimentalData') === true) {
      return dataProps[property];
    }
    return cssSchema.data.css.properties.find(item => item.name === property);
  }

  /**
   * Returns property list for completion
   * @param {Object} cssSchema
   * @param {String} currentWord
   * @return {CompletionItem}
   */
  static getProperties(cssSchema, currentWord: string): CompletionItem[] {
    if (isClassOrId(currentWord) || isAtRule(currentWord)) {
      return [];
    }
    if (workspace.getConfiguration('sass').get('autocomplete.useExperimentalData') === true) {
      return generatedData;
    }
    return cssSchema.data.css.properties.map(property => {
      const completionItem = new CompletionItem(property.name);

      completionItem.insertText = property.name.concat(': ');
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
  static getPropertyValues(cssSchema, currentWord: string): CompletionItem[] {
    const property = AutocompleteUtilities.getPropertyName(currentWord);
    const values = AutocompleteUtilities.findPropertySchema(cssSchema, property).values;

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
   * Get the imports.
   * @param text text of the current File.
   */

  static getImports(text: string) {
    const regex = /\/?\/? {0,}(@import|@use){1}.*/g; //
    let m: RegExpExecArray;
    const imports: ImportsItem[] = [];
    const varScopeModules: any[] = [];
    const globalScopeModules: any[] = [];
    while ((m = regex.exec(text)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      m.forEach((match: string) => {
        // prevent commented lines from being imported.
        if (!match.startsWith('//')) {
          let path = match.replace(/^(@import|@use) *['"]?(.*?)['"]? *( as.*)?$/, '$2');
          let namespace = match.replace(/(.*?as |@use) *['"]?.*?([\w-]*?)['"]? *$/, '$2').trim();
          namespace = namespace === '*' || match.startsWith('@import') ? undefined : namespace;
          if (/sass:(math|color|string|list|map|selector|meta)/.test(path)) {
            switch (path) {
              case 'sass:math':
                varScopeModules.push(...getSassModule('MATH', namespace));
                break;
              case 'sass:color':
                varScopeModules.push(...getSassModule('COLOR', namespace));
                break;
              case 'sass:string':
                varScopeModules.push(...getSassModule('STRING', namespace));
                break;
              case 'sass:list':
                varScopeModules.push(...getSassModule('LIST', namespace));
                break;
              case 'sass:map':
                varScopeModules.push(...getSassModule('MAP', namespace));
                break;
              case 'sass:selector':
                globalScopeModules.push(...getSassModule('SELECTOR', namespace));
                break;
              case 'sass:meta':
                // TODO
                varScopeModules.push(...getSassModule('META', namespace));
                break;
            }
          } else {
            if (!/\.sass$/.test(path)) {
              path = path.concat('.sass');
            }

            imports.push({ path, namespace });
          }
        }
      });
    }
    return { imports, varScopeModules, globalScopeModules };
  }

  /**
   * gets unit completions.
   * @param currentword
   */
  static getUnits(currentword: string) {
    const units = [];

    sassSchemaUnits.forEach(item => {
      const lastWord = currentword.split(' ');
      const rep = lastWord[lastWord.length - 1];
      const completionItem = new CompletionItem(rep + item.name);
      completionItem.insertText = new SnippetString(rep + item.body);
      completionItem.detail = item.desc;
      completionItem.kind = CompletionItemKind.Unit;
      units.push(completionItem);
    });
    return units;
  }

  static getImportSuggestionsForCurrentWord(
    document: TextDocument,
    currentWord: string
  ): CompletionItem[] {
    const suggestions: CompletionItem[] = [];
    const path = normalize(
      join(
        document.fileName,
        '../',
        currentWord.replace(/(@import|@use) *['"]?([\w-]*)['"]?/, '$2').trim()
      )
    );

    const dir = readdirSync(path);
    for (const file of dir) {
      if (/.sass$/.test(file) && file !== basename(document.fileName)) {
        const rep = file.replace('.sass', '');
        const item = new CompletionItem(rep);
        item.insertText = rep;
        item.detail = `Import - ${rep}`;
        item.kind = CompletionItemKind.Reference;
        suggestions.push(item);
      } else if (statSync(path + '/' + file).isDirectory()) {
        const item = new CompletionItem(file);
        item.insertText = file;
        item.detail = `Folder - ${file}`;
        item.kind = CompletionItemKind.Folder;
        suggestions.push(item);
      }
    }
    return suggestions;
  }

  static getHtmlClassOrIdCompletions(document: TextDocument) {
    const path = normalize(join(document.fileName, '../', './'));
    const dir = readdirSync(path);
    const classesAndIds = this.getDocumentClassesAndIds(document);
    const res: CompletionItem[] = [];
    const addedClasses: string[] = [];
    const regex = /class="([\w ]*)"|id="(\w*)"/g;
    for (const file of dir) {
      const fileName = basename(document.fileName).replace('.sass', '.html');
      if (new RegExp(fileName).test(file)) {
        const text = readFileSync(
          normalize(document.fileName).replace('.sass', '.html')
        ).toString();
        let m;
        while ((m = regex.exec(text)) !== null) {
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          m.forEach((match: string, groupIndex) => {
            if (groupIndex !== 0 && match !== undefined) {
              if (groupIndex === 1) {
                const classes = match.split(' ');
                classes.forEach(className => {
                  if (classesAndIds.find(value => value === '.'.concat(className)) === undefined) {
                    if (addedClasses.find(item => className === item) === undefined) {
                      addedClasses.push(className);
                      const item = new CompletionItem('.'.concat(className));
                      item.kind = CompletionItemKind.Class;
                      item.detail = `Class From: ${fileName}`;
                      item.insertText = new SnippetString('.'.concat(className, '\n\t$0'));
                      res.push(item);
                    }
                  }
                });
              } else {
                if (classesAndIds.find(value => value === '#'.concat(match)) === undefined) {
                  const item = new CompletionItem('#'.concat(match));
                  item.kind = CompletionItemKind.Class;
                  item.detail = `Id From: ${fileName}`;
                  item.insertText = new SnippetString('#'.concat(match, '\n\t$0'));
                  res.push(item);
                }
              }
            }
          });
        }
      }
    }
    return res;
  }
  /**
   * sets the block variable, don't get confused by the return values.
   */
  static isInVueStyleBlock(start: Position, document: TextDocument) {
    for (let i = start.line; i > 0; i--) {
      const line = document.lineAt(i);
      if (/^ *<[\w"'= ]*lang=['"]sass['"][\w"'= ]*>/.test(line.text)) {
        if (!(i === start.line)) {
          return false;
        }
        break;
      } else if (/<\/ *style *>/.test(line.text)) {
        if (!(i === start.line)) {
          return true;
        }
        break;
      }
    }
    return true;
  }
  static isInMixinBlock(start: Position, document: TextDocument): CompletionItem[] | false {
    for (let i = start.line; i > 0; i--) {
      const line = document.lineAt(i);
      if (/^ *@mixin/.test(line.text)) {
        const firstSplit = line.text.split('(');
        if (firstSplit[1] !== undefined) {
          const resVar: CompletionItem[] = [];
          const mixinName = firstSplit[0].replace('@mixin', '').trim();
          firstSplit[1].split('$').forEach(variable => {
            if (variable) {
              const rep = '$'.concat(variable.split(/[,: \)]/)[0]);
              const completionItem = new CompletionItem(rep);
              completionItem.insertText = new SnippetString(rep.replace('$', '\\$'));
              completionItem.detail = `@mixin ${mixinName}\n(${rep.replace(
                '$',
                ''
              )}) - Local Variable`;
              completionItem.kind = CompletionItemKind.Variable;
              resVar.push(completionItem);
            }
          });
          return resVar;
        } else {
          return [];
        }
      } else if (/^\S.*/.test(line.text)) {
        return false;
      }
    }
    return false;
  }
  static getDocumentClassesAndIds(document: TextDocument) {
    const classesAndIds: string[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (isClassOrId(line.text)) {
        classesAndIds.push(line.text.trim());
      }
    }
    return classesAndIds;
  }

  static ImportsLoop(
    imports: ImportsItem[],
    document: TextDocument,
    context: ExtensionContext,
    callback: (element: StateElement, namespace: string | undefined) => void
  ) {
    imports.forEach(item => {
      let importPath = item.path;

      const state: State = context.workspaceState.get(
        normalize(join(document.fileName, '../', importPath))
      );

      if (state) {
        for (const key in state) {
          if (state.hasOwnProperty(key)) {
            callback(state[key], item.namespace);
          }
        }
      }
    });
  }
  static mergeNamespace(text: string, namespace: string | undefined) {
    return `${namespace ? namespace.concat('.') : ''}${text}`;
  }
}
