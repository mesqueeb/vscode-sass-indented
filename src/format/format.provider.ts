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
import {
  isMixin,
  isAnd,
  isClassOrId,
  isProperty,
  isAtRule,
  isInclude,
  isStar,
  isHtmlTag,
  isPseudo,
  isKeyframes,
  isIfOrElse,
  isReset,
  isSassSpace,
  isElse
} from '../utility/utility.regex';
import {
  getCLassOrIdIndentationOffset,
  replaceWithOffset,
  getIndentationOffset,
  isKeyframePoint,
  getPropertyValueSpace
} from './format.utility';
import { getDistanceReversed } from '../utility/utility';
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
      let keyframesTabs = 0;
      let currentTabs = 0;
      let isAtKeyframes = false;
      let AllowSpace = false;
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const isKeyframesPointCheck = isKeyframePoint(line.text, isAtKeyframes);
        if (isAtKeyframes && isKeyframesPointCheck) {
          tabs = Math.max(0, keyframesTabs);
        }
        const isKeyframesCheck = isKeyframes(line.text);

        let isIfOrElse_ = isIfOrElse(line.text);
        let isIfOrElseAProp = false;
        if (isAtKeyframes && isIfOrElse_) {
          isIfOrElse_ = false;
          isIfOrElseAProp = true;
          tabs = keyframesTabs + options.tabSize;
        }
        if (isIfOrElse_ && !isAtKeyframes && isElse(line.text)) {
          isIfOrElseAProp = true;
          isIfOrElse_ = false;
          tabs = Math.max(0, currentTabs - options.tabSize);
        }

        const ResetTabs = isReset(line.text);
        const isAnd_ = isAnd(line.text);
        const isProp = isProperty(line.text);
        const indentation = getIndentationOffset(line.text, tabs);
        if (isSassSpace(line.text)) {
          AllowSpace = true;
        }
        //####### Block Header #######
        if (
          isClassOrId(line.text) ||
          isMixin(line.text) ||
          isHtmlTag(line.text.trim()) ||
          isStar(line.text) ||
          isIfOrElse_ ||
          ResetTabs ||
          isAnd_ ||
          isPseudo(line.text) ||
          isKeyframesCheck
        ) {
          const offset = getCLassOrIdIndentationOffset(indentation.distance, options.tabSize, currentTabs, ResetTabs);

          isAtKeyframes = isKeyframesCheck || isKeyframesPointCheck;

          AllowSpace = false;

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
          if (isKeyframesCheck) {
            keyframesTabs = Math.max(0, indentation.distance + offset + options.tabSize);
          }
          if (ResetTabs) {
            tabs = Math.max(0, indentation.distance + offset);
            currentTabs = tabs;
          } else {
            tabs = Math.max(0, indentation.distance + offset + options.tabSize);
            currentTabs = tabs;
          }
        }
        // ####### Properties #######
        else if (isProp || isInclude(line.text) || isKeyframesPointCheck || isIfOrElseAProp) {
          let lineText = line.text;
          let setSpace = false;
          if (!getPropertyValueSpace(line.text) && isProp && config.get('setPropertySpace')) {
            lineText = lineText.replace(/(^ *[\$\w-]+:) */, '$1 ');
            setSpace = true;
          }
          if (indentation.offset !== 0) {
            if (enableDebug) {
              console.log('MOVE', 'Offset:', indentation.offset, 'Row:', i + 1, 'space', setSpace);
            }

            result.push(new TextEdit(line.range, replaceWithOffset(lineText, indentation.offset).trimRight()));
          } else if (getDistanceReversed(line.text) > 0 && config.get('deleteWhitespace')) {
            if (enableDebug) {
              console.log('TRAIL', i + 1, 'space', setSpace);
            }

            result.push(new TextEdit(line.range, lineText.trimRight()));
          } else if (setSpace) {
            if (enableDebug) {
              console.log('SPACE', i + 1);
            }
            result.push(new TextEdit(line.range, lineText));
          }

          if (isAtKeyframes && isKeyframesPointCheck) {
            tabs = Math.max(0, keyframesTabs + options.tabSize);
          }
          if (isIfOrElseAProp && isAtKeyframes) {
            tabs = keyframesTabs + options.tabSize * 2;
          } else if (isIfOrElseAProp && !isAtKeyframes) {
            tabs = currentTabs;
          }
        }
        // ####### Empty Line #######
        else if (line.isEmptyOrWhitespace) {
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
              !isStar(nextLine.text) &&
              !AllowSpace &&
              !isPseudo(nextLine.text) &&
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
