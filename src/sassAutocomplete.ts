/*
  The core functionality of the autocomplete is work done by Stanislav Sysoev (@d4rkr00t)
  in his stylus extension and been adjusted to account for the slight differences between
  the languages.

  Original stylus version: https://github.com/d4rkr00t/language-stylus
*/
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Position,
  Range,
  TextDocument,
  workspace,
  ExtensionContext
} from 'vscode';

import * as cssSchema from './schemas/cssSchema';
import sassSchema from './schemas/sassSchema';

import * as path from 'path';
import { STATE } from './extension';
import { getImports, getUnits } from './schemas/sassUtils';
import { sassAt } from './schemas/sassAt';
import { sassPseudo } from './schemas/sassPseudo';

/**
 * Naive check whether currentWord is class, id or placeholder
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isClassOrId(currentWord: string): boolean {
  return currentWord.startsWith('.') || currentWord.startsWith('#') || currentWord.startsWith('%');
}

export function isSelector(currentWord: string): boolean {
  return currentWord === 'section' || currentWord === 'div';
}

/**
 * Naive check whether currentWord is at rule
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isAtRule(currentWord: string): boolean {
  return currentWord.startsWith('@');
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

export let importData: string;
class SassCompletion implements CompletionItemProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const start = new Position(position.line, 0);
    const range = new Range(start, position);
    const currentWord = document.getText(range).trim();
    const currentWordUT = document.getText(range);
    const text = document.getText();
    const value = isValue(cssSchema, currentWord);
    const config = workspace.getConfiguration();
    const disableUnitCompletion: boolean = config.get('sass.disableUnitCompletion');
    let block = false;
    let atRules = [];
    let Units = [],
      properties = [],
      values = [],
      imports = getImports(text),
      variables: CompletionItem[] = [];

    let completions: CompletionItem[] = [];
    if (currentWord.startsWith('&')) {
      completions = sassPseudo(config.get('sass.andStared'));
      block = true;
    }

    if (isNumber(currentWordUT) && !disableUnitCompletion && !block) {
      Units = getUnits(currentWord);
    }
    if (value && !block) {
      values = getValues(cssSchema, currentWord);
      imports.forEach(item => {
        const state: STATE = this.context.workspaceState.get(path.normalize(path.join(document.fileName, '../', item)));
        if (state) {
          for (const key in state) {
            if (state.hasOwnProperty(key)) {
              const element = state[key];
              if (element.type === 'Variable') {
                variables.push(element.item);
              }
            }
          }
        }
      });
    } else if (!block) {
      variables = [];
      imports.forEach(item => {
        const state: STATE = this.context.workspaceState.get(path.normalize(path.join(document.fileName, '../', item)));
        if (state) {
          for (const key in state) {
            if (state.hasOwnProperty(key)) {
              const element = state[key];
              if (element.type === 'Mixin') {
                variables.push(element.item);
              }
            }
          }
        }
      });

      atRules = sassAt;
      properties = getProperties(cssSchema, currentWord, config.get('useSeparator', true));
    }
    if (!block) {
      completions = [].concat(properties, values, sassSchema, Units, variables, atRules);
    }

    return completions;
  }
}

export default SassCompletion;
