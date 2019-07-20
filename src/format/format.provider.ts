import { DocumentFormattingEditProvider, ExtensionContext, TextDocument, ProviderResult, TextEdit, Range, FormattingOptions } from 'vscode';
import { isMixin, isAnd, isClassOrId, isProperty, isAtRule, isInclude } from '../utility/utility.regex';
import { getCLassOrIdIndentationOffset, replaceWithOffset, getIndentationOffset } from './format.utility';
import { getDistanceReversed } from '../utility/utility';
// TODO SassFormatter
class SassFormattingProvider implements DocumentFormattingEditProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions): ProviderResult<TextEdit[]> {
    console.log('FORMAT');
    let result: ProviderResult<TextEdit[]> = [];
    let tabs = 0;
    let lastDeletedLine = -1;
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const indentation = getIndentationOffset(line.text, tabs);
      if (isClassOrId(line.text) || isMixin(line.text) || isAnd(line.text)) {
        const offset = getCLassOrIdIndentationOffset(indentation.distance, options.tabSize);

        if (offset !== 0) {
          console.log('NEW TAB');
          result.push(new TextEdit(line.range, replaceWithOffset(line.text, offset).trimRight()));
        }
        tabs = Math.max(0, indentation.distance + offset + options.tabSize);
      } else if (isProperty(line.text) || isInclude(line.text)) {
        if (indentation.offset !== 0) {
          console.log('MOVE', indentation.offset);
          result.push(new TextEdit(line.range, replaceWithOffset(line.text, indentation.offset).trimRight()));
        } else if (getDistanceReversed(line.text) > 0) {
          console.log('TRAIL', i + 1);
          result.push(new TextEdit(line.range, line.text.trimRight()));
        }
      } else if (line.isEmptyOrWhitespace) {
        let pass = true;
        if (document.lineCount - 1 > i) {
          const nextLine = document.lineAt(i + 1);
          if (!isClassOrId(nextLine.text) && !isAtRule(nextLine.text) && !isProperty(nextLine.text) && !isAnd(line.text)) {
            console.log('DEL', i + 1);
            lastDeletedLine = i + 1;
            pass = false;

            if (nextLine.isEmptyOrWhitespace) {
              result.push(new TextEdit(new Range(line.range.start, nextLine.range.end), ''));
            } else {
              result.push(new TextEdit(new Range(line.range.start, nextLine.range.start), ''));
            }
          }
        }
        if (line.text.length > 0 && pass && line.lineNumber !== lastDeletedLine) {
          console.log('WHITESPACE');
          result.push(new TextEdit(line.range, ''));
        }
      } else if (getDistanceReversed(line.text) > 0) {
        console.log('TRAIL', i + 1);
        result.push(new TextEdit(line.range, line.text.trimRight()));
      }
    }

    return result;
  }
}

export default SassFormattingProvider;
