import { TextDocument, Position, CancellationToken, Range, HoverProvider, ProviderResult, Hover, TextLine, MarkdownString } from 'vscode';

import * as cssSchema from '../../autocomplete/schemas/autocomplete.cssSchema';

import { AutocompleteUtilities } from '../../autocomplete/autocomplete.utility';
import { BasicRawCompletion } from '../../autocomplete/autocomplete.interfaces';
import { isProperty } from 'suf-regex';

export class SassHoverProvider implements HoverProvider {
  constructor() {}
  provideHover(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover> {
    const line = document.lineAt(position.line);
    const currentWord = SassHoverProvider._GET_CURRENT_WORD(line, position);
    if (isProperty(line.text)) {
      const propData = AutocompleteUtilities.findPropertySchema(cssSchema, currentWord.replace(/:/g, ''));
      if (propData) {
        return {
          contents: [
            `\`\`\`sass\n${SassHoverProvider.capitalizeFirstLetter(propData.name)} (css property)\n\`\`\``,
            `${propData.desc !== undefined ? propData.desc : ''}`,
            `${SassHoverProvider._GET_PROPERTY_VALUES(propData.values)}`
          ]
        };
      } else {
        return { contents: [] };
      }
    }
    return {
      contents: []
    };
  }
  private static _GET_CURRENT_WORD(line: TextLine, position: Position) {
    let firstHalfArr = [];
    for (let i = position.character - 1; i > 0; i--) {
      const char = line.text[i];
      if (char === ' ') {
        if (i <= position.character) {
          break;
        } else {
          firstHalfArr = [];
        }
      } else {
        firstHalfArr.unshift(char);
      }
    }
    let firstHalf = firstHalfArr.join('');
    let secondHalf = '';
    for (let i = position.character; i < line.text.length; i++) {
      const char = line.text[i];
      if (char === ' ') {
        if (i >= position.character) {
          break;
        } else {
          secondHalf = '';
        }
      } else {
        secondHalf = secondHalf + char;
      }
    }
    return firstHalf + secondHalf;
  }

  private static capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }
  private static _GET_PROPERTY_VALUES(values: BasicRawCompletion['values']) {
    if (values === undefined) {
      return '';
    } else {
      let text = '**Values**';
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        text = text.concat(
          '\n* ',
          value.name !== undefined ? '**`' + value.name + '`**' : '',
          value.desc !== undefined ? ' *' + value.desc + '*' : ''
        );
      }
      return text;
    }
  }
}
