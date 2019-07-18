import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  TextDocument,
  ProviderResult,
  TextEdit,
  window,
  Range,
  DecorationOptions,
  TextEditor,
  FormattingOptions
} from 'vscode';
import {
  isClassOrId,
  detectTabOffset as detectTabIndentation,
  detectCLassOrIdOffset,
  replaceWithOffset,
  isProperty,
  isEmpty,
  isAtRule,
  isMixin,
  isAnd
} from '../functions/sassUtils';
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
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      console.log(line.range.start.line);
      const indentation = detectTabIndentation(line.text, tabs);
      if (isClassOrId(line.text) || isMixin(line.text) || isAnd(line.text)) {
        const offset = detectCLassOrIdOffset(indentation.distance, options.tabSize);

        if (offset !== 0) {
          console.log('NEW TAB');
          result.push(new TextEdit(line.range, replaceWithOffset(line.text, offset)));
        }
        tabs = Math.max(0, indentation.distance + offset + options.tabSize);
      } else if (isProperty(line.text)) {
        if (indentation.offset !== 0) {
          console.log('MOVE', indentation.offset);
          result.push(new TextEdit(line.range, replaceWithOffset(line.text, indentation.offset)));
        }
      } else if (isEmpty(line.text)) {
        let pass = true;
        if (document.lineCount >= i + 1) {
          const nextLine = document.lineAt(i + 1);
          if (!isClassOrId(nextLine.text) && !isAtRule(nextLine.text) && !isProperty(nextLine.text) && !isAnd(line.text)) {
            console.log('DEL', i + 1);
            pass = false;
            result.push(new TextEdit(new Range(line.range.start, nextLine.range.start), ''));
          }
        }
        if (line.text.length > 0 && pass) {
          console.log('WHITESPACE');
          result.push(new TextEdit(line.range, ''));
        }
      }
    }

    return result;
  }
}

export default SassFormattingProvider;
