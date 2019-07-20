export function getCharInfo(char: string) {
  if (char === undefined) {
    return '';
  }
  switch (char) {
    case 'a':
      return '(l = all, c = align-content, s = align-self, i = align-items)';
    case 'b':
      return `(g = background, u = bottom, s = box-shadow, z = box-sizing, ${directionSuggestions(
        'border'
      )}, d = box-decoration-break, f = backface-visibility)`;
    case 'c':
      return '(l = clip, o = column-, s = columns, t = content, c = cursor, i = counter-increment, r = counter-reset)';
    case 'd':
      return '(r = direction)';
    case 'F':
      return '(b = blur, r = brightness, c = contrast, d = drop-shadow, g = grayscale, h = hue-rotate, i = invert, o = opacity, s = saturate, e = sepia, u = url';
    default:
      return '';
  }
}
function directionSuggestions(base: string) {
  return `l = ${base}-left, t = ${base}-top, r = ${base}-right, b = ${base}-bottom`;
}
