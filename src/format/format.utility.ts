import { getDistance, splitOnce } from '../utility/utility';
import {
  isCssPseudo,
  isCssOneLiner,
  escapeRegExp,
  isBracketSelector,
  isPseudoWithParenthesis,
  isClassOrId,
  isMoreThanOneClassOrId
} from '../utility/utility.regex';
import { randomBytes } from 'crypto';

/**
 * returns the relative distance that the class or id should be at.
 */
export function getCLassOrIdIndentationOffset(distance: number, tabSize: number, current: number, ignoreCurrent: boolean) {
  if (distance === 0) {
    return 0;
  }
  if (tabSize * Math.round(distance / tabSize - 0.1) > current && !ignoreCurrent) {
    return current - distance;
  }
  return tabSize * Math.round(distance / tabSize - 0.1) - distance;
}
/**
 * adds or removes whitespace based on the given offset, a positive value adds whitespace a negative value removes it.
 */
export function replaceWithOffset(text: string, offset: number) {
  if (offset < 0) {
    text = text.replace(new RegExp(`^ {${Math.abs(offset)}}`), '');
  } else {
    let space = '';
    for (let i = 0; i < offset; i++) {
      space = space.concat(' ');
    }
    text = text.replace(/^/, space);
  }
  return text;
}
/**
 * returns the difference between the current indentation and the indentation of the given text.
 */
export function getIndentationOffset(text: string, indentation: number): { offset: number; distance: number } {
  let distance = getDistance(text);
  return { offset: indentation - distance, distance };
}
/**
 *
 */
export function isKeyframePoint(text: string, isAtKeyframe: boolean) {
  if (isAtKeyframe === false) {
    return false;
  }
  return /^ *\d+%/.test(text) || /^ *from|^ *to/.test(text);
}
/**
 * if the Property Value Space is none or more that one, this function returns false, else true;
 */
export function hasPropertyValueSpace(text: string) {
  const split = text.split(':');
  return split[1] === undefined
    ? true
    : split[1][0] === undefined
    ? true
    : split[1].startsWith(' ')
    ? split[1][1] === undefined
      ? true
      : !split[1][1].startsWith(' ')
    : false;
}
/**
 * converts scss/css to sass.
 */
export function convertScssOrCss(
  text: string,
  tabSize: number,
  lastSelector: string
): { text: string; increaseTabSize: boolean; lastSelector: string } {
  const isMultiple = isMoreThanOneClassOrId(text);
  if (lastSelector && new RegExp('^.*' + escapeRegExp(lastSelector)).test(text)) {
    let newText = text.replace(lastSelector, '');
    if (isPseudoWithParenthesis(text)) {
      newText = newText.split('(')[0].trim() + '(&' + ')';
    } else if (text.trim().startsWith(lastSelector)) {
      newText = text.replace(lastSelector, '&');
    } else {
      newText = newText.replace(/ /g, '') + ' &';
    }
    return {
      lastSelector,
      increaseTabSize: true,
      text: replaceWithOffset(removeInvalidChars(newText).trimRight(), tabSize)
    };
  } else if (isCssOneLiner(text)) {
    const split = text.split('{');
    return {
      increaseTabSize: false,
      lastSelector: split[0].trim(),
      text: removeInvalidChars(split[0].trim().concat('\n', replaceWithOffset(split[1].trim(), tabSize))).trimRight()
    };
  } else if (isCssPseudo(text) && !isMultiple) {
    const split = text.split(':');
    return {
      increaseTabSize: true,
      lastSelector: split[0].trim(),
      text: removeInvalidChars(split[0].trim().concat('\n', replaceWithOffset('&:' + split[1].trim(), tabSize))).trimRight()
    };
  } else if (isClassOrId(text)) {
    lastSelector = removeInvalidChars(text).trimRight();
  }
  return { text: removeInvalidChars(text).trimRight(), increaseTabSize: false, lastSelector };
}

function removeInvalidChars(text: string) {
  let newText = '';
  let isInQuotes = false;
  let isInComment = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (!isInQuotes && char === '/' && text[i + 1] === '/') {
      isInComment = true;
    } else if (/['"]/.test(char)) {
      isInQuotes = !isInQuotes;
    }
    if (!/[;\{\}]/.test(char) || isInQuotes || isInComment) {
      newText += char;
    }
  }
  return newText;
}
