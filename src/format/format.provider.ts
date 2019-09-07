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
  isReset,
  isSassSpace,
  isScssOrCss,
  isBracketSelector,
  isComment,
  isBlockCommentStart,
  isBlockCommentEnd,
  isEach,
  isIgnore
} from '../utility/utility.regex';
import { getCLassOrIdIndentationOffset, getIndentationOffset, convertScssOrCss, LogFormatInfo } from './format.utility';
import { getDistanceReversed } from '../utility/utility';
import { FormatHandleBlockHeader, FormatHandleProperty, FormatHandleLocalContext } from './format.handlers';

export interface FormatContext {
  convert: {
    lastSelector: string;
    wasLastLineCss: boolean;
  };
  keyframes: {
    is: boolean;
    tabs: number;
  };
  tabs: number;
  currentTabs: number;
  // lastHeader: { offset: number; endedWithComma: boolean };
}
export interface FormatLocalContext {
  ResetTabs: boolean;
  isAnd_: boolean;
  isProp: boolean;
  indentation: {
    offset: number;
    distance: number;
  };
  isClassOrIdSelector: boolean;
  isIfOrElse: boolean;
  isIfOrElseAProp: boolean;
  isKeyframes: boolean;
  isKeyframesPoint: boolean;
}

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

      let AllowSpace = false;
      let isInBlockComment = false;
      let ignoreLine = false;

      let Context: FormatContext = {
        convert: {
          lastSelector: '',
          wasLastLineCss: false
        },
        keyframes: {
          is: false,
          tabs: 0
        },
        tabs: 0,
        currentTabs: 0
        // lastHeader: { endedWithComma: false, offset: 0 }
      };
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);

        if (isBlockCommentStart(line.text)) {
          isInBlockComment = true;
        }
        if (isBlockCommentEnd(line.text)) {
          isInBlockComment = false;
        }

        if (ignoreLine || isInBlockComment) {
          ignoreLine = false;
        } else {
          if (isIgnore(line.text)) {
            ignoreLine = true;
          } else {
            if (isSassSpace(line.text)) {
              AllowSpace = true;
            }

            // ####### Empty Line #######
            if (line.isEmptyOrWhitespace) {
              // Context.lastHeader.endedWithComma = false;
              let pass = true; // its not useless, trust me.
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
                    LogFormatInfo(enableDebug, line.lineNumber, { title: 'DELETE' });
                  }

                  pass = false;
                  result.push(new TextEdit(new Range(line.range.start, nextLine.range.start), ''));
                }
              }
              if (line.text.length > 0 && pass && config.get('deleteWhitespace')) {
                LogFormatInfo(enableDebug, line.lineNumber, { title: 'WHITESPACE' });

                result.push(new TextEdit(line.range, ''));
              }
            } else {
              const LocalContext: FormatLocalContext = {
                ...FormatHandleLocalContext(line, Context, options),
                ResetTabs: isReset(line.text),
                isAnd_: isAnd(line.text),
                isProp: isProperty(line.text),
                indentation: getIndentationOffset(line.text, Context.tabs, options.tabSize),
                isClassOrIdSelector: isClassOrId(line.text)
              };
              //####### Block Header #######
              if (
                LocalContext.isClassOrIdSelector ||
                isMixin(line.text) ||
                isHtmlTag(line.text.trim().split(' ')[0]) ||
                isStar(line.text) ||
                LocalContext.isIfOrElse ||
                LocalContext.ResetTabs ||
                LocalContext.isAnd_ ||
                isBracketSelector(line.text) ||
                isPseudo(line.text) ||
                LocalContext.isKeyframes ||
                isEach(line.text)
              ) {
                const offset = getCLassOrIdIndentationOffset(
                  LocalContext.indentation.distance,
                  options.tabSize,
                  Context.currentTabs,
                  LocalContext.ResetTabs
                );

                Context.keyframes.is = LocalContext.isKeyframes || LocalContext.isKeyframesPoint;
                AllowSpace = false;

                const formatRes = FormatHandleBlockHeader({
                  line,
                  options,
                  config,
                  enableDebug,
                  LocalContext,
                  offset,
                  Context
                });
                if (formatRes.edit !== null) {
                  result.push(formatRes.edit);
                }
                Context = formatRes.context;
              }
              // ####### Properties #######
              else if (LocalContext.isProp || isInclude(line.text) || LocalContext.isKeyframesPoint || LocalContext.isIfOrElseAProp) {
                const formatRes = FormatHandleProperty({
                  config,
                  enableDebug,
                  LocalContext,
                  Context,
                  line,
                  options
                });
                if (formatRes.edit !== null) {
                  result.push(formatRes.edit);
                }
                Context = formatRes.context;
              }
              // ####### Convert #######
              else if (config.get('convert') && isScssOrCss(line.text, Context.convert.wasLastLineCss) && !isComment(line.text)) {
                const convertRes = convertScssOrCss(line.text, options, Context.convert.lastSelector);
                // Set Context Vars
                // Context.lastHeader.endedWithComma = false;
                Context.convert.wasLastLineCss = true;
                LogFormatInfo(enableDebug, line.lineNumber, { title: 'CONVERT', convert: true });
                result.push(new TextEdit(line.range, convertRes.text));
              } else if (getDistanceReversed(line.text, options.tabSize) > 0 && config.get('deleteWhitespace')) {
                let lineText = line.text;
                let convert = false;
                if (config.get('convert') && isScssOrCss(line.text, Context.convert.wasLastLineCss) && !isComment(line.text)) {
                  const convert_Res = convertScssOrCss(lineText, options, Context.convert.lastSelector);
                  lineText = convert_Res.text;
                  convert = true;
                }
                // Set Context Vars
                // Context.lastHeader.endedWithComma = false;
                Context.convert.wasLastLineCss = convert;
                LogFormatInfo(enableDebug, line.lineNumber, { title: 'TRAIL', convert });

                result.push(new TextEdit(line.range, lineText.trimRight()));
              }
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
