import { isClassOrId, isAtRule } from '../utility/utility.regex';

import { CompletionItem, CompletionItemKind, SnippetString, TextDocument, Position } from 'vscode';

import sassSchemaUnits from './schemas/autocomplete.units';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, normalize, basename } from 'path';
import { BasicRawCompletion } from './autocomplete.interfaces';

export class AutocompleteUtilities {
  /**
   * Naive check whether currentWord is value for given property
   * @param {Object} cssSchema
   * @param {String} currentWord
   * @return {Boolean}
   */

  static isValue(cssSchema, currentWord: string): boolean {
    const property = AutocompleteUtilities.getPropertyName(currentWord);
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
  static findPropertySchema(cssSchema, property: string): BasicRawCompletion {
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
  static getValues(cssSchema, currentWord: string): CompletionItem[] {
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

  static getImportSuggestionsForCurrentWord(document: TextDocument, currentWord: string): CompletionItem[] {
    const suggestions: CompletionItem[] = [];
    const path = normalize(join(document.fileName, '../', currentWord.replace('@import', '').trim()));

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
        const text = readFileSync(normalize(document.fileName).replace('.sass', '.html')).toString();
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
              completionItem.detail = `@mixin ${mixinName}\n(${rep.replace('$', '')}) - Local Variable`;
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
}
