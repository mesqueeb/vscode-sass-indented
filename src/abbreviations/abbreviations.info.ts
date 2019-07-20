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
    case 'f':
      return '(f = flex, b = flex-basis, d = flex-direction, o = flex-flow, g = flex-grow, h = flex-shrink, r = flex-wrap, l = float, a = font-family, k = font-kerning, s = font-size, j = font-size-adjust, t = font-stretch, y = font-style, v = font-variant, w = font-weight)';
    case 'g':
      return 'grid-(a = area, u = auto-columns, f = auto-flow, w = auto-rows, l = column, n = column-, g = gap, o = row, i = row-, t = template, s = template-areas, c = template-columns, r = template-rows)';
    case 'h':
      return '(a = hanging-punctuation, y = hyphens)';
    case 'l':
      return '(p = letter-spacing, h = line-height, s = list-style, i = list-style-image, o = list-style-position, t list-style-type)';
    case 'm':
      return `h = max-height, w = max-width, e = min-height, i = min-width, m = mix-blend-mode, ${directionSuggestions('margin')}`;
    case 'o':
      return `f = object-fit, p = object-position, a = opacity, r = order, u = outline, c = outline-color, o = outline-offset, s = outline-style, w = outline-width, y = overflow-y, x = overflow-x, w = overflow-wrap`;
    case 'p':
      return `(o = position, e = pointer-events, r = perspective, i = perspective-origin, a = page-break-after, b = page-break-before, s = page-break-inside ${directionSuggestions(
        'padding'
      )})`;
    case 'r':
      return '(e = resize)';
    case 't':
      return '(s = tab-size, a = text-align, d = text-decoration, i = text-indent, j = text-justify, h = text-shadow, r = text-transform, t = transition, o = text-overflow)';
    case 'T':
      return '(m = matrix, t = transform, s = scale, r = rotate, k = skew, p = perspective) - (3 = 3d, x = X, y = Y, z = Z)';
    case 'r':
      return '(u = unicode-bidi)';
    case 'v':
      return '(a = vertical-align)';
    case 'v':
      return '(s = white-space, b = word-break, p = word-spacing, w = word-wrap, m = writing-mode)';
    default:
      return '';
  }
}
function directionSuggestions(base: string) {
  return `l = ${base}-left, t = ${base}-top, r = ${base}-right, b = ${base}-bottom`;
}
