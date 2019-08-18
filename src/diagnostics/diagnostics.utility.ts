import { Range, Position } from 'vscode';

export class DiagnosticUtility {
  static ruleMessages = {
    property: ['Empty Property', 'Property should have one space Between the prop and value'],
    invalid: ['Semicolons Are Not Allowed', 'Curly Brackets Are Not Allowed'],
    variable: ['Variable Declared more than once']
  };

  static getPropertySpaceRange(text: string, range: Range) {
    let start = 0;
    let end = 0;
    let started = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ':') {
        start = i;
        started = true;
      } else if (started && char !== ' ') {
        end = i;
        break;
      }
    }
    if (end === start) {
      end += 1;
    }
    return new Range(new Position(range.start.line, start), new Position(range.end.line, end));
  }
}
