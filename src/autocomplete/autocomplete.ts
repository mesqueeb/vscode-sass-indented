/*
  The core functionality of the autocomplete is work done by Stanislav Sysoev (@d4rkr00t)
  in his stylus extension and been adjusted to account for the slight differences between
  the languages.

  Original stylus version: https://github.com/d4rkr00t/language-stylus
*/
import {
  CancellationToken,
  CompletionItem,
  CompletionItemProvider,
  Position,
  Range,
  TextDocument,
  workspace,
  ExtensionContext,
  SnippetString
} from 'vscode';

import * as cssSchema from './schemas/autocomplete.cssSchema';
import sassSchema from './schemas/autocomplete.schema';

import * as path from 'path';
import { STATE } from '../extension';
import { sassAt } from './schemas/autocomplete.at';
import { sassPseudo } from './schemas/autocomplete.pseudo';
import { isNumber } from 'util';
import { Abbreviations } from '../abbreviations/abbreviations';
import { AutocompleteUtilities as Utility } from './autocomplete.utility';
import { Scanner } from './scan/autocomplete.scan';
import { sassCommentCompletions } from './schemas/autocomplete.commentCompletions';
import { isPath } from '../utility/utility.regex';

class SassCompletion implements CompletionItemProvider {
  context: ExtensionContext;
  scan: Scanner;
  constructor(context: ExtensionContext) {
    this.context = context;
    this.scan = new Scanner(context);
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const start = new Position(position.line, 0);
    const range = new Range(start, position);
    const currentWord = document.getText(range).trim();
    const currentWordUT = document.getText(range);
    const text = document.getText();
    const value = Utility.isValue(cssSchema, currentWord);
    const config = workspace.getConfiguration();
    const disableUnitCompletion: boolean = config.get('sass.disableUnitCompletion');
    let block = false;
    let atRules = [];
    let Units = [],
      properties = [],
      values = [],
      classesAndIds = [],
      functions = [],
      imports = Utility.getImports(text),
      variables: CompletionItem[] = [];
    // also get current file from the workspace State.
    imports.push(path.basename(document.fileName));

    if (document.languageId === 'vue') {
      block = Utility.isInVueStyleBlock(start, document);
    }

    let completions: CompletionItem[] = [];

    if (currentWord.startsWith('?') && !block) {
      Abbreviations(document, start, currentWordUT);
      return;
    }

    if (/^@import/.test(currentWord) && !block) {
      completions = Utility.getImportFromCurrentWord(document, currentWord);
      block = true;
    }

    if (currentWord.startsWith('&') && !block) {
      completions = sassPseudo(config.get('sass.andStared'));
      block = true;
    }

    if (isNumber(currentWordUT) && !disableUnitCompletion && !block) {
      Units = Utility.getUnits(currentWord);
    }
    if (currentWord.startsWith('/') && !block) {
      completions = sassCommentCompletions();
      block = true;
    }
    if (!block && isPath(currentWord)) {
      block = true;
    }
    if (!block) {
      this.scan.scanFile(document);
    }

    if (value && !block) {
      values = Utility.getValues(cssSchema, currentWord);
      imports.forEach(item => {
        const state: STATE = this.context.workspaceState.get(path.normalize(path.join(document.fileName, '../', item)));
        if (state) {
          for (const key in state) {
            if (state.hasOwnProperty(key)) {
              const element = state[key];
              if (element.type === 'Variable') {
                const completionItem = new CompletionItem(element.item.title);
                completionItem.insertText = element.item.insert;
                completionItem.detail = element.item.detail;
                completionItem.kind = element.item.kind;
                variables.push(completionItem);
              }
            }
          }
        }
      });
      functions = sassSchema;
    } else if (!block) {
      variables = [];
      imports.forEach(item => {
        const state: STATE = this.context.workspaceState.get(path.normalize(path.join(document.fileName, '../', item)));
        if (state) {
          for (const key in state) {
            if (state.hasOwnProperty(key)) {
              const element = state[key];
              if (element.type === 'Mixin') {
                const completionItem = new CompletionItem(element.item.title);
                completionItem.insertText = new SnippetString(element.item.insert);
                completionItem.detail = element.item.detail;
                completionItem.kind = element.item.kind;
                variables.push(completionItem);
              }
            }
          }
        }
      });

      classesAndIds = Utility.getHtmlClassOrIdCompletions(document);
      atRules = sassAt;
      properties = Utility.getProperties(cssSchema, currentWord);
    }
    if (!block) {
      completions = [].concat(properties, values, functions, Units, variables, atRules, classesAndIds);
    }

    return completions;
  }
}

export default SassCompletion;
