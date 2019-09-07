import { TextLine, FormattingOptions, WorkspaceConfiguration, TextEdit } from 'vscode';

import { isScssOrCss, isComment as isComment_, isHtmlTag, isKeyframes as isKeyframes_, isIfOrElse, isElse } from '../utility/utility.regex';

import {
  convertScssOrCss,
  replaceSpacesOrTabs,
  replaceWithOffset,
  hasPropertyValueSpace,
  LogFormatInfo,
  isKeyframePoint
} from './format.utility';

import { getDistanceReversed } from '../utility/utility';
import { FormatLocalContext, FormatContext } from './format.provider';

export function FormatHandleBlockHeader(i: {
  line: TextLine;
  options: FormattingOptions;
  config: WorkspaceConfiguration;
  enableDebug: boolean;
  LocalContext: FormatLocalContext;
  offset: number;
  Context: FormatContext;
}) {
  let replaceSpaceOrTabs = false;
  let convert = false;
  let lineText = i.line.text;
  let additionalTabs = 0;
  let edit = null;
  if (i.config.get('convert') && isScssOrCss(i.line.text, i.Context.convert.wasLastLineCss) && !isComment_(i.line.text)) {
    const convert_Res = convertScssOrCss(lineText, i.options, i.Context.convert.lastSelector);
    i.Context.convert.lastSelector = convert_Res.lastSelector;
    if (convert_Res.increaseTabSize) {
      additionalTabs = i.options.tabSize;
    }
    lineText = convert_Res.text;
    convert = true;
  }

  if (!convert && i.LocalContext.isClassOrIdSelector) {
    i.Context.convert.lastSelector = '';
  }

  if (i.config.get('replaceSpacesOrTabs') && i.options.insertSpaces ? /\t/g.test(lineText) : / /g.test(lineText)) {
    lineText = replaceSpacesOrTabs(lineText, i.options.insertSpaces, i.options.tabSize);
    replaceSpaceOrTabs = true;
  }
  // if (i.Context.lastHeader.endedWithComma) {
  //   // additionalTabs -= i.options.tabSize;
  //   i.offset = i.Context.lastHeader.offset;
  // }
  // Set Context Vars
  // i.Context.convert.wasLastLineCss = convert;
  // if (lineText.trim().endsWith(',')) {
  //   i.Context.lastHeader.endedWithComma = true;
  // } else {
  //   i.Context.lastHeader.endedWithComma = false;
  // }

  // Return
  if (i.offset !== 0) {
    LogFormatInfo(i.enableDebug, i.line.lineNumber, { title: 'SET NEW TAB', convert, replaceSpaceOrTabs });
    edit = new TextEdit(i.line.range, replaceWithOffset(lineText, i.offset, i.options).trimRight());
  } else if (getDistanceReversed(i.line.text, i.options.tabSize) > 0 && i.config.get('deleteWhitespace')) {
    LogFormatInfo(i.enableDebug, i.line.lineNumber, { title: 'TRAIL', convert, replaceSpaceOrTabs });
    edit = new TextEdit(i.line.range, lineText.trimRight());
  } else if (convert || replaceSpaceOrTabs) {
    LogFormatInfo(i.enableDebug, i.line.lineNumber, { title: 'CHANGE', convert, replaceSpaceOrTabs });
    edit = new TextEdit(i.line.range, lineText);
  }
  i.Context = FormatHandleSetTabs(i.Context, i.LocalContext, i.options, { additionalTabs, offset: i.offset });
  return { edit, context: i.Context, additionalTabs };
}

export function FormatHandleProperty(i: {
  line: TextLine;
  options: FormattingOptions;
  config: WorkspaceConfiguration;
  enableDebug: boolean;
  LocalContext: FormatLocalContext;
  Context: FormatContext;
}) {
  let lineText = i.line.text;
  let setSpace = false;
  let convert = false;
  let replaceSpaceOrTabs = false;
  let edit = null;
  const isComment = isComment_(i.line.text);
  if (!isHtmlTag(i.line.text) && !hasPropertyValueSpace(i.line.text) && i.LocalContext.isProp && i.config.get('setPropertySpace')) {
    lineText = lineText.replace(/(^[\t ]*[\$\w-]+:)[\t ]*/, '$1 ');
    setSpace = true;
  }
  if (i.config.get('convert') && isScssOrCss(i.line.text, i.Context.convert.wasLastLineCss) && !isComment) {
    const convert_Res = convertScssOrCss(lineText, i.options, i.Context.convert.lastSelector);
    lineText = convert_Res.text;
    convert = true;
  }
  // Set Context Vars
  // i.Context.lastHeader.endedWithComma = false;
  i.Context.convert.wasLastLineCss = convert;
  const Move = i.LocalContext.indentation.offset !== 0 && !isComment;
  if (
    i.config.get('replaceSpacesOrTabs') &&
    !Move &&
    (i.options.insertSpaces ? /\t/g.test(lineText) : new RegExp(' '.repeat(i.options.tabSize), 'g').test(lineText))
  ) {
    lineText = replaceSpacesOrTabs(lineText, i.options.insertSpaces, i.options.tabSize);
    replaceSpaceOrTabs = true;
  }
  // Return
  if (Move) {
    LogFormatInfo(i.enableDebug, i.line.lineNumber, {
      title: 'MOVE',
      convert,
      setSpace,
      offset: i.LocalContext.indentation.offset,
      replaceSpaceOrTabs
    });

    edit = new TextEdit(i.line.range, replaceWithOffset(lineText, i.LocalContext.indentation.offset, i.options).trimRight());
  } else if (getDistanceReversed(i.line.text, i.options.tabSize) > 0 && i.config.get('deleteWhitespace')) {
    LogFormatInfo(i.enableDebug, i.line.lineNumber, { title: 'TRAIL', convert, setSpace, replaceSpaceOrTabs });

    edit = new TextEdit(i.line.range, lineText.trimRight());
  } else if (setSpace || convert || replaceSpaceOrTabs) {
    LogFormatInfo(i.enableDebug, i.line.lineNumber, { title: 'CHANGE', convert, setSpace, replaceSpaceOrTabs });
    edit = new TextEdit(i.line.range, lineText);
  }

  i.Context = FormatHandleSetTabs(i.Context, i.LocalContext, i.options);

  return { edit, context: i.Context };
}
export function FormatHandleLocalContext(line: TextLine, Context: FormatContext, options: FormattingOptions) {
  const isPointCheck = isKeyframePoint(line.text, Context.keyframes.is);
  if (Context.keyframes.is && isPointCheck) {
    Context.tabs = Math.max(0, Context.keyframes.tabs);
  }
  const isKeyframes = isKeyframes_(line.text);

  let isIfOrElse_ = isIfOrElse(line.text);
  let isIfOrElseAProp = false;
  if (Context.keyframes.is && isIfOrElse_) {
    isIfOrElse_ = false;
    isIfOrElseAProp = true;
    Context.tabs = Context.keyframes.tabs + options.tabSize;
  }
  if (isIfOrElse_ && !Context.keyframes.is && isElse(line.text)) {
    isIfOrElseAProp = true;
    isIfOrElse_ = false;
    Context.tabs = Math.max(0, Context.currentTabs - options.tabSize);
  }
  return {
    isIfOrElse: isIfOrElse_,
    isIfOrElseAProp,
    isKeyframes,
    isKeyframesPoint: isPointCheck
  };
}
function FormatHandleSetTabs(
  Context: FormatContext,
  LocalContext: FormatLocalContext,
  options: FormattingOptions,
  headerStuff?: { offset: number; additionalTabs: number }
) {
  if (headerStuff === undefined) {
    // § set Tabs Property
    if (Context.keyframes.is && LocalContext.isKeyframesPoint) {
      Context.tabs = Math.max(0, Context.keyframes.tabs + options.tabSize);
    }
    if (LocalContext.isIfOrElseAProp && Context.keyframes.is) {
      Context.tabs = Context.keyframes.tabs + options.tabSize * 2;
    } else if (LocalContext.isIfOrElseAProp && !Context.keyframes.is) {
      Context.tabs = Context.currentTabs;
    }
  } else {
    //§ set Tabs Header Block
    if (LocalContext.isKeyframes) {
      Context.keyframes.tabs = Math.max(0, LocalContext.indentation.distance + headerStuff.offset + options.tabSize);
    }
    if (LocalContext.ResetTabs) {
      Context.tabs = Math.max(0, LocalContext.indentation.distance + headerStuff.offset);
      Context.currentTabs = Context.tabs;
    } else {
      Context.tabs = Math.max(0, LocalContext.indentation.distance + headerStuff.offset + options.tabSize + headerStuff.additionalTabs);

      Context.currentTabs = Context.tabs;
    }
  }
  return Context;
}
