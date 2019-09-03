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
  isElse,
  isScssOrCss,
  isBracketSelector,
  isComment,
  isBlockCommentStart,
  isBlockCommentEnd,
  isEach,
  isIgnore
} from '../utility/utility.regex';
import {
  getCLassOrIdIndentationOffset,
  replaceWithOffset,
  getIndentationOffset,
  isKeyframePoint,
  hasPropertyValueSpace,
  convertScssOrCss
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
      let enableDebug: boolean = config.get('debug');

      if (enableDebug) {
        console.log('FORMAT');
      }
      let result: ProviderResult<TextEdit[]> = [];
      let tabs = 0;
      let currentTabs = 0;
      let keyframes_tabs = 0;
      let keyframes_is = false;
      let AllowSpace = false;
      let convert_additionalTabs = 0;
      let convert_lastSelector = '';
      let convert = false;
      let convert_wasLastLineCss = false;
      let isInBlockComment = false;
      let ignoreLine = false;
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);

        if (ignoreLine) {
          ignoreLine = false;
        } else {
          if (isIgnore(line.text)) {
            ignoreLine = true;
          } else {
            const keyframes_isPointCheck = isKeyframePoint(line.text, keyframes_is);
            if (keyframes_is && keyframes_isPointCheck) {
              tabs = Math.max(0, keyframes_tabs);
            }
            const isKeyframesCheck = isKeyframes(line.text);

            let isIfOrElse_ = isIfOrElse(line.text);
            let keyframes_isIfOrElseAProp = false;
            if (keyframes_is && isIfOrElse_) {
              isIfOrElse_ = false;
              keyframes_isIfOrElseAProp = true;
              tabs = keyframes_tabs + options.tabSize;
            }
            if (isIfOrElse_ && !keyframes_is && isElse(line.text)) {
              keyframes_isIfOrElseAProp = true;
              isIfOrElse_ = false;
              tabs = Math.max(0, currentTabs - options.tabSize);
            }
            convert_additionalTabs = 0;
            convert = false;
            const ResetTabs = isReset(line.text);
            const isAnd_ = isAnd(line.text);
            const isProp = isProperty(line.text);
            const indentation = getIndentationOffset(line.text, tabs);
            const isClassOrIdSelector = isClassOrId(line.text);
            if (isSassSpace(line.text)) {
              AllowSpace = true;
            }
            if (isBlockCommentStart(line.text)) {
              isInBlockComment = true;
            }
            if (isBlockCommentEnd(line.text)) {
              isInBlockComment = false;
            }

            if (!isInBlockComment) {
              //####### Block Header #######
              if (
                isClassOrIdSelector ||
                isMixin(line.text) ||
                isHtmlTag(line.text.trim().split(' ')[0]) ||
                isStar(line.text) ||
                isIfOrElse_ ||
                ResetTabs ||
                isAnd_ ||
                isBracketSelector(line.text) ||
                isPseudo(line.text) ||
                isKeyframesCheck ||
                isEach(line.text)
              ) {
                const offset = getCLassOrIdIndentationOffset(indentation.distance, options.tabSize, currentTabs, ResetTabs);

                keyframes_is = isKeyframesCheck || keyframes_isPointCheck;

                AllowSpace = false;
                let lineText = line.text;

                if (config.get('convert') && isScssOrCss(line.text, convert_wasLastLineCss) && !isComment(line.text)) {
                  const convert_Res = convertScssOrCss(lineText, options.tabSize, convert_lastSelector, enableDebug);
                  convert_lastSelector = convert_Res.lastSelector;
                  if (convert_Res.increaseTabSize) {
                    convert_additionalTabs = options.tabSize;
                  }
                  lineText = convert_Res.text;
                  convert = true;
                }
                if (!convert && isClassOrIdSelector) {
                  convert_lastSelector = '';
                }

                if (offset !== 0) {
                  if (enableDebug) {
                    console.log('NEW TAB', i + 1, 'CONVERT', convert);
                  }
                  result.push(new TextEdit(line.range, replaceWithOffset(lineText, offset).trimRight()));
                } else if (getDistanceReversed(line.text) > 0 && config.get('deleteWhitespace')) {
                  if (enableDebug) {
                    console.log('TRAIL', i + 1, 'CONVERT', convert);
                  }
                  result.push(new TextEdit(line.range, lineText.trimRight()));
                } else if (convert) {
                  if (enableDebug) {
                    console.log('CONVERT', i + 1);
                  }
                  result.push(new TextEdit(line.range, lineText));
                }
                //§ set Tabs
                if (isKeyframesCheck) {
                  keyframes_tabs = Math.max(0, indentation.distance + offset + options.tabSize);
                }
                if (ResetTabs) {
                  tabs = Math.max(0, indentation.distance + offset);
                  currentTabs = tabs;
                } else {
                  tabs = Math.max(0, indentation.distance + offset + options.tabSize + convert_additionalTabs);
                  currentTabs = tabs;
                }
              }
              // ####### Properties #######
              else if (isProp || isInclude(line.text) || keyframes_isPointCheck || keyframes_isIfOrElseAProp) {
                let lineText = line.text;
                let setSpace = false;
                if (!isHtmlTag && !hasPropertyValueSpace(line.text) && isProp && config.get('setPropertySpace')) {
                  lineText = lineText.replace(/(^ *[\$\w-]+:) */, '$1 ');
                  setSpace = true;
                }
                if (config.get('convert') && isScssOrCss(line.text, convert_wasLastLineCss) && !isComment(line.text)) {
                  const convert_Res = convertScssOrCss(lineText, options.tabSize, convert_lastSelector, enableDebug);
                  lineText = convert_Res.text;
                  convert = true;
                }
                if (indentation.offset !== 0 && !isComment(line.text)) {
                  if (enableDebug) {
                    console.log('MOVE', 'Offset:', indentation.offset, 'Row:', i + 1, 'space', setSpace, 'CONVERT', convert);
                  }

                  result.push(new TextEdit(line.range, replaceWithOffset(lineText, indentation.offset).trimRight()));
                } else if (getDistanceReversed(line.text) > 0 && config.get('deleteWhitespace')) {
                  if (enableDebug) {
                    console.log('TRAIL', i + 1, 'space', setSpace, 'CONVERT', convert);
                  }

                  result.push(new TextEdit(line.range, lineText.trimRight()));
                } else if (setSpace) {
                  if (enableDebug) {
                    console.log('SPACE', i + 1, 'CONVERT', convert);
                  }
                  result.push(new TextEdit(line.range, lineText));
                } else if (convert) {
                  if (enableDebug) {
                    console.log('CONVERT', i + 1, 'SET SPACE', setSpace);
                  }
                  result.push(new TextEdit(line.range, lineText));
                }
                // § set Tabs
                if (keyframes_is && keyframes_isPointCheck) {
                  tabs = Math.max(0, keyframes_tabs + options.tabSize);
                }
                if (keyframes_isIfOrElseAProp && keyframes_is) {
                  tabs = keyframes_tabs + options.tabSize * 2;
                } else if (keyframes_isIfOrElseAProp && !keyframes_is) {
                  tabs = currentTabs;
                }
              }
              // ####### Convert #######
              else if (config.get('convert') && isScssOrCss(line.text, convert_wasLastLineCss) && !isComment(line.text)) {
                let lineText = line.text;
                const convert_Res = convertScssOrCss(lineText, options.tabSize, convert_lastSelector, enableDebug);
                lineText = convert_Res.text;
                convert = true;
                if (enableDebug) {
                  console.log('CONVERT', i + 1);
                }
                result.push(new TextEdit(line.range, lineText));
              }
              // ####### Empty Line #######
              else if (line.isEmptyOrWhitespace) {
                let pass = true;
                if (document.lineCount - 1 > i) {
                  const nextLine = document.lineAt(i + 1);
                  const compact = config.get('deleteCompact') ? true : !isProperty(nextLine.text);
                  if (
                    config.get('deleteEmptyRows') &&
                    !isClassOrId(nextLine.text) &&
                    !isAtRule(nextLine.text) &&
                    compact &&
                    !isAnd(nextLine.text) &&
                    !isHtmlTag(nextLine.text) &&
                    !isStar(nextLine.text) &&
                    !isBracketSelector(nextLine.text) &&
                    !AllowSpace &&
                    !isComment(nextLine.text) &&
                    !isPseudo(nextLine.text)
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
                let lineText = line.text;

                if (config.get('convert') && isScssOrCss(line.text, convert_wasLastLineCss) && !isComment(line.text)) {
                  const convert_Res = convertScssOrCss(lineText, options.tabSize, convert_lastSelector, enableDebug);
                  lineText = convert_Res.text;
                  convert = true;
                }

                if (enableDebug) {
                  console.log('TRAIL', i + 1, 'CONVERT', convert);
                }

                result.push(new TextEdit(line.range, lineText.trimRight()));
              }
            }
            if (!line.isEmptyOrWhitespace) {
              convert_wasLastLineCss = convert;
            }
          }
        }
      }
      return result;
    } else {
      return [];
    }
  }
}

export default FormattingProvider;
