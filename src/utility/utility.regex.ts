export function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Check whether text is class, id or placeholder
 */
export function isVar(text: string): boolean {
  return /^ *?.*:/.test(text);
}
/**
 * Check whether text is class, id or placeholder
 */
export function isStar(text: string): boolean {
  return /^ *?\*/.test(text);
}
/**
 * Check whether text is class, id or placeholder
 */
export function isClassOrId(text: string): boolean {
  return /^ *?#/.test(text) || /^ *\./.test(text) || /^ *%/.test(text);
}
/**
 * Check whether text is a property
 */
export function isProperty(text: string): boolean {
  return /^ *.*:/.test(text);
}
/**
 * Check whether text is a property
 */
export function isInclude(text: string): boolean {
  return /^ *@include/.test(text);
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
 * Check whether currentWord is at rule
 */
export function isAtRule(currentWord: string): boolean {
  return /^ *@/.test(currentWord);
}
/**
 * checks if currentWord last char is a number
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function isNumber(currentWord: string): boolean {
  const reg = /[0-9]$/;
  return reg.test(currentWord) && !currentWord.includes('#');
}
