export const charCompletion = {
  appendDirection(secondKey: string, base: string) {
    switch (secondKey) {
      case 'l':
        return `${base}-left:`;
      case 't':
        return `${base}-top:`;
      case 'r':
        return `${base}-right:`;
      case 'b':
        return `${base}-bottom:`;
      default:
        return `${base}:`;
    }
  },
  getA(secondKey: string) {
    switch (secondKey) {
      case 'l':
        return `all:`;
      case 'c':
        return `align-content:`;
      case 's':
        return `align-self:`;
      case 'i':
        return `align-items:`;
      default:
        return `animation:`;
    }
  },
  getB(secondKey: string, base: string) {
    switch (secondKey) {
      case 'l':
        return `${base}-left:`;
      case 't':
        return `${base}-top:`;
      case 'r':
        return `${base}-right:`;
      case 'b':
        return `${base}-bottom:`;
      case 'g':
        return `background:`;
      case 'u':
        return `bottom:`;
      case 's':
        return `box-shadow:`;
      case 'z':
        return `box-sizing:`;
      case 'd':
        return `box-decoration-break:`;
      case 'v':
        return `backface-visibility:`;
      default:
        return `${base}:`;
    }
  },
  getC(secondKey: string) {
    switch (secondKey) {
      case 'l':
        return `clip:`;
      case 's':
        return `columns:`;
      case 'o':
        return `column-`;
      case 't':
        return `content:`;
      case 'i':
        return `counter-increment:`;
      case 'r':
        return `counter-reset:`;
      case 'c':
        return `cursor:`;
      default:
        return `color:`;
    }
  },
  getD(secondKey: string) {
    switch (secondKey) {
      case 'r':
        return `direction:`;
      default:
        return `display:`;
    }
  },
  getFilter(secondKey: string) {
    switch (secondKey) {
      case 'b':
        return `filter: blur()`;
      case 'r':
        return `filter: brightness()`;
      case 'c':
        return `filter: contrast()`;
      case 'd':
        return `filter: drop-shadow()`;
      case 'g':
        return `filter: grayscale()`;
      case 'h':
        return `filter: hue-rotate()`;
      case 'i':
        return `filter: invert()`;
      case 'o':
        return `filter: opacity()`;
      case 's':
        return `filter: saturate()`;
      case 'e':
        return `filter: sepia()`;
      case 'u':
        return `filter: url()`;
      default:
        return `filter:`;
    }
  }
};
