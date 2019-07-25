import { getDistance } from '../utility/utility';

/**
 * returns the relative distance that the class or id should be at.
 */
export function getCLassOrIdIndentationOffset(distance: number, tabSize: number) {
  if (distance === 0) {
    return 0;
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
export function isKeyframePoint(text: string, isAtKeyframe: boolean) {
  if (isAtKeyframe === false) {
    return false;
  }
  return /^ *\d+%/.test(text) || /^ *from|to/.test(text);
}
