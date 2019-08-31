import { htmlTags, voidHtmlTags } from '../autocomplete/schemas/autocomplete.html';

export function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Check whether text is a variable.
 */
export function isVar(text: string): boolean {
  return /^ *?\$.*:.*/.test(text);
}
/**
 * Check whether text is a *
 */
export function isStar(text: string): boolean {
  return /^ *?\*/.test(text);
}
/**
 * Check whether text is class, id or placeholder
 */
export function isClassOrId(text: string): boolean {
  return /^ *[#\.%]/.test(text);
}
/**
 * Check whether text is a property
 */
export function isProperty(text: string, empty?: boolean): boolean {
  if (empty) {
    return !/^ *[\w\-]+: *\S+/.test(text);
  }
  return /^ *[\w\-]+:/.test(text);
}
/**
 * Check whether text is a include
 */
export function isInclude(text: string): boolean {
  return /^ *@include/.test(text);
}
/**
 * Check whether text is a keyframe
 */
export function isKeyframes(text: string): boolean {
  return /^ *@keyframes/.test(text);
}
/**
 * Check whether text is a mixin
 */
export function isMixin(text: string): boolean {
  return /^ *@mixin/.test(text);
}
/**
 * Check whether text starts with &
 */
export function isAnd(text: string): boolean {
  return /^ *&/.test(text);
}
/**
 * Check whether text is at rule
 */
export function isAtRule(text: string): boolean {
  return /^ *@/.test(text);
}
/**
 * Check whether text is bracket selector
 */
export function isBracketSelector(text: string): boolean {
  return /^ *\[[\w=\- ]*\]/.test(text);
}
/**
 * checks if text last char is a number
 * @param {String} text
 * @return {CompletionItem}
 */
export function isNumber(text: string): boolean {
  const reg = /[0-9]$/;
  return reg.test(text) && !text.includes('#');
}
/**
 * Check whether text starts with an html tag.
 */
export function isHtmlTag(text: string) {
  let isTag = false;
  for (let i = 0; i < htmlTags.length; i++) {
    const tag = htmlTags[i];
    if (new RegExp(`^ *${tag}$|^ *${tag}\\[.*\\].*$`).test(text)) {
      isTag = true;
      break;
    }
  }
  return isTag;
}
/**
 * Check whether text starts with a self closing html tag.
 */
export function isVoidHtmlTag(text: string) {
  let isTag = false;
  for (let i = 0; i < voidHtmlTags.length; i++) {
    const tag = voidHtmlTags[i];
    if (new RegExp(`^ *${tag}$|^ *${tag}\\[.*\\].*$`).test(text)) {
      isTag = true;
      break;
    }
  }
  return isTag;
}
/**
 * Check whether text starts with ::.
 */
export function isPseudo(text: string) {
  return /^ *::?/.test(text);
}
/**
 * Check whether text starts with @if.
 */
export function isIfOrElse(text: string) {
  return /^ *@if|^ *@else/.test(text);
}
/**
 * Check whether text starts with @else.
 */
export function isElse(text: string) {
  return /^ *@else/.test(text);
}
/**
 * Check whether text starts with //R.
 */
export function isReset(text: string) {
  return /^ *\/?\/\/ *R *$/.test(text);
}
/**
 * Check whether text starts with //S.
 */
export function isSassSpace(text: string) {
  return /^ *\/?\/\/ *S *$/.test(text);
}
/**
 *
 */
export function isPath(text: string) {
  return /^.*['"]\.?[\.\/]$/.test(text);
}
/**
 *
 */
export function isScssOrCss(text: string, wasLastLineCss: boolean = false) {
  if (wasLastLineCss && text.endsWith(',') && isClassOrId(text)) {
    return true;
  }
  return /[;\{\}] *(\/\/.*)?$/.test(text);
}
/**
 *
 */
export function isCssPseudo(text: string) {
  return /^ *[&.#%].*:/.test(text);
}
/**
 *
 */
export function isCssOneLiner(text: string) {
  return /^ *[&.#%].*\{.*[;\}]$/.test(text);
}
/**
 *
 */
export function isPseudoWithParenthesis(text: string) {
  return /^ *::?[\w\-]+\(.*\)/.test(text);
}
/**
 *
 */
export function isComment(text: string) {
  return /^ *\/\/|^ *\/\*/.test(text);
}
/**
 *
 */
export function isBlockCommentStart(text: string) {
  return /^ *(\/\*)/.test(text);
}
/**
 *
 */
export function isBlockCommentEnd(text: string) {
  return / *\*\/|(?=^[a-zA-Z0-9#.%$@\\[=*+])/.test(text);
}
/**
 *
 */
export function isMoreThanOneClassOrId(text: string) {
  return /^ *[\.#%].* ?, *[\.#%].*/.test(text);
}
/**
 *
 */
export function hasColor(text: string) {
  return /^.*#[a-fA-F\d]{3,4}\b|^.*#[a-fA-F\d]{6}\b|^.*#[a-fA-F\d]{8}\b|rgba?\([\w. ]+,[\w. ]+,[\w. ]+(,[\w. ]+)?\)/.test(text);
}
