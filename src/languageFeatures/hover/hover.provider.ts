import {
  TextDocument,
  Position,
  CancellationToken,
  HoverProvider,
  ProviderResult,
  Hover,
  TextLine
} from 'vscode';

import { AutocompleteUtilities } from '../../autocomplete/autocomplete.utility';
import { isProperty } from 'suf-regex';
import { GetPropertyDescription } from '../../utilityFunctions';
import { generatedPropertyData } from '../../autocomplete/schemas/autocomplete.generatedData';

export class SassHoverProvider implements HoverProvider {
  constructor() {}
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    const line = document.lineAt(position.line);
    const currentWord = SassHoverProvider._GET_CURRENT_WORD(line, position);
    const name = currentWord.replace(/:/g, '');
    if (isProperty(line.text)) {
      const propData = AutocompleteUtilities.findPropertySchema(name);
      if (propData) {
        return {
          contents: [
            `\`\`\`sass\n${SassHoverProvider.capitalizeFirstLetter(name)} (css property)\n\`\`\``,
            `${GetPropertyDescription(name, propData, true)}`
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
}
