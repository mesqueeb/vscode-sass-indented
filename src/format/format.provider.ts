import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  TextDocument,
  ProviderResult,
  TextEdit,
  Range,
  FormattingOptions,
  workspace
} from 'vscode';
import { isMixin, isAnd, isClassOrId, isProperty, isAtRule, isInclude } from '../utility/utility.regex';
import { getCLassOrIdIndentationOffset, replaceWithOffset, getIndentationOffset } from './format.utility';
import { getDistanceReversed, isHtmlTag } from '../utility/utility';
class FormattingProvider implements DocumentFormattingEditProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions): ProviderResult<TextEdit[]> {
    const config = workspace.getConfiguration('sass.format');
    if (config.get('enabled') === true) {
      const enableDebug = config.get('debug');
      if (enableDebug) {
        console.log('FORMAT');
      }

      let result: ProviderResult<TextEdit[]> = [];
      let tabs = 0;
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const indentation = getIndentationOffset(line.text, tabs);
        if (isClassOrId(line.text) || isMixin(line.text) || isAnd(line.text) || isHtmlTag(line.text.trim())) {
          const offset = getCLassOrIdIndentationOffset(indentation.distance, options.tabSize);

          if (offset !== 0) {
            if (enableDebug) {
              console.log('NEW TAB', i + 1);
            }

            result.push(new TextEdit(line.range, replaceWithOffset(line.text, offset).trimRight()));
          } else if (getDistanceReversed(line.text) > 0 && config.get('deleteWhitespace')) {
            if (enableDebug) {
              console.log('TRAIL', i + 1);
            }
            result.push(new TextEdit(line.range, line.text.trimRight()));
          }
          tabs = Math.max(0, indentation.distance + offset + options.tabSize);
        } else if (isProperty(line.text) || isInclude(line.text)) {
          if (indentation.offset !== 0) {
            if (enableDebug) {
              console.log('MOVE', 'Offset:', indentation.offset, 'Row:', i + 1);
            }

            result.push(new TextEdit(line.range, replaceWithOffset(line.text, indentation.offset).trimRight()));
          } else if (getDistanceReversed(line.text) > 0 && config.get('deleteWhitespace')) {
            if (enableDebug) {
              console.log('TRAIL', i + 1);
            }

            result.push(new TextEdit(line.range, line.text.trimRight()));
          }
        } else if (line.isEmptyOrWhitespace) {
          let pass = true;
          if (document.lineCount - 1 > i) {
            const nextLine = document.lineAt(i + 1);
            const compact = config.get('deleteCompact') ? true : !isProperty(nextLine.text);
            if (
              !isClassOrId(nextLine.text) &&
              !isAtRule(nextLine.text) &&
              compact &&
              !isAnd(nextLine.text) &&
              !isHtmlTag(nextLine.text.trim()) &&
              config.get('deleteEmptyRows')
            ) {
              if (enableDebug) {
                console.log('DEL', i + 1);
              }

              pass = false;
              result.push(new TextEdit(new Range(line.range.start, nextLine.range.start), ''));
            }
          }
          if (line.text.length > 0 && pass && config.get('deleteWhitespace')) {
            if (enableDebug) {
              console.log('WHITESPACE', i + 1);
            }

            result.push(new TextEdit(line.range, ''));
          }
        } else if (getDistanceReversed(line.text) > 0 && config.get('deleteWhitespace')) {
          if (enableDebug) {
            console.log('TRAIL', i + 1);
          }

          result.push(new TextEdit(line.range, line.text.trimRight()));
        }
      }

      return result;
    } else {
      return [];
    }
  }
}

export default FormattingProvider;
