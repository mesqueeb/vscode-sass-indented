import { isClassOrId, isAtRule } from '../utility/utility.regex';
import { CompletionItem, CompletionItemKind, SnippetString, TextDocument } from 'vscode';
import sassSchemaUnits from './schemas/autocomplete.units';
import { readdirSync, statSync } from 'fs';
import { join, normalize, basename } from 'path';

export const autocompleteUtilities = {
  /**
   * Naive check whether currentWord is value for given property
   * @param {Object} cssSchema
   * @param {String} currentWord
   * @return {Boolean}
   */
  isValue(cssSchema, currentWord: string): boolean {
    const property = autocompleteUtilities.getPropertyName(currentWord);

    return property && Boolean(autocompleteUtilities.findPropertySchema(cssSchema, property));
  },

  /**
   * Formats property name
   * @param {String} currentWord
   * @return {String}
   */
  getPropertyName(currentWord: string): string {
    return currentWord
      .trim()
      .replace(':', ' ')
      .split(' ')[0];
  },
  /**
   * Search for property in cssSchema
   * @param {Object} cssSchema
   * @param {String} property
   * @return {Object}
   */
  findPropertySchema(cssSchema, property: string) {
    return cssSchema.data.css.properties.find(item => item.name === property);
  },

  /**
   * Returns property list for completion
   * @param {Object} cssSchema
   * @param {String} currentWord
   * @return {CompletionItem}
   */
  getProperties(cssSchema, currentWord: string): CompletionItem[] {
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
  },

  /**
   * Returns values for current property for completion list
   * @param {Object} cssSchema
   * @param {String} currentWord
   * @return {CompletionItem}
   */
  getValues(cssSchema, currentWord: string): CompletionItem[] {
    const property = autocompleteUtilities.getPropertyName(currentWord);
    const values = autocompleteUtilities.findPropertySchema(cssSchema, property).values;

    if (!values) {
      return [];
    }

    return values.map(property => {
      const completionItem = new CompletionItem(property.name);

      completionItem.detail = property.desc;
      completionItem.kind = CompletionItemKind.Value;

      return completionItem;
    });
  },

  /**
   * Get the imports.
   * @param text text of the current File.
   */
  getImports(text: string) {
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
  },

  /**
   * gets unit completions.
   * @param currentword
   */
  getUnits(currentword: string) {
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
  },

  getImportFromCurrentWord(document: TextDocument, currentWord: string): CompletionItem[] {
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
};
