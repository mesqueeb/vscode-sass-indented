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
import { getImports, getUnits, isValue, isNumber, getValues, getProperties } from './functions/sassUtils';
import { sassAt } from './schemas/sassAt';
import { sassPseudo } from './schemas/sassPseudo';
import { scanImports } from './functions/scanImports';
import { Abbreviations } from './sassAbbreviations';

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
    // also get current file from the workspace State.
    imports.push(path.basename(document.fileName));

    let completions: CompletionItem[] = [];

    if (currentWord.startsWith('?')) {
      Abbreviations(document, start);
      return;
    }

    if (/^@import/.test(currentWord)) {
      completions = scanImports(document, currentWord);
      block = true;
    }

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
