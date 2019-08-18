import {
  DocumentColorProvider,
  Color,
  TextDocument,
  Range,
  CancellationToken,
  ColorPresentation,
  ColorInformation,
  Position
} from 'vscode';
import { hasColor } from '../../utility/utility.regex';

import ColorMeme = require('color');

export class SassColorProvider implements DocumentColorProvider {
  constructor() {}
  provideColorPresentations(
    color: Color,
    context: { document: TextDocument; range: Range },
    token: CancellationToken
  ): ColorPresentation[] {
    const rgba = ColorMeme.rgb([color.red * 255, color.green * 255, color.blue * 255, color.alpha]);
    return [
      //@ts-ignore
      new ColorPresentation(rgba.hexa().toLowerCase()),
      new ColorPresentation(rgba.rgb().toString())
    ];
  }
  provideDocumentColors(document: TextDocument, token: CancellationToken): ColorInformation[] {
    const colors: ColorInformation[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (hasColor(line.text)) {
        const colorsPositions = SassColorProvider._GET_COLOR_POS(line.text);
        for (let j = 0; j < colorsPositions.length; j++) {
          const colorPos = colorsPositions[j];
          const rgba = ColorMeme(colorPos.text)
            .rgb()
            .unitArray();
          colors.push(
            new ColorInformation(
              new Range(new Position(line.range.start.line, colorPos.start), new Position(line.range.start.line, colorPos.end)),
              new Color(rgba[0], rgba[1], rgba[2], rgba[3] !== undefined ? rgba[3] : 1)
            )
          );
        }
      }
    }
    return colors;
  }
  private static _GET_COLOR_POS(text: string) {
    let colors: { text: string; start: number; end: number }[] = [];
    let add = false;
    let type: 'hex' | 'rgb' = 'hex';
    let currentColor = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '#') {
        add = true;
        colors[currentColor] = { text: '', start: 0, end: 0 };
        colors[currentColor].start = i;
        colors[currentColor].text = colors[currentColor].text.concat(char);
        type = 'hex';
      } else if (/r/i.test(char) && /g/i.test(text[i + 1]) && /b/i.test(text[i + 2])) {
        type = 'rgb';
        add = true;
        colors[currentColor] = { text: '', start: 0, end: 0 };
        colors[currentColor].start = i;
        colors[currentColor].text = colors[currentColor].text.concat(char);
      } else if (add && char === ' ' && type === 'hex') {
        colors[currentColor].end = i;
        add = false;
        currentColor += 1;
      } else if (add && char === ')' && type === 'rgb') {
        colors[currentColor].text = colors[currentColor].text.concat(char);
        colors[currentColor].end = i + 1;
        add = false;
        currentColor += 1;
      } else if (add) {
        if (/[a-fA-F\d]/.test(char) && type === 'hex') {
          colors[currentColor].text = colors[currentColor].text.concat(char);
        } else if (type === 'rgb') {
          colors[currentColor].text = colors[currentColor].text.concat(char);
        } else {
          colors[currentColor].end = i;
          add = false;
          currentColor += 1;
        }
      }
      if (add && i + 1 === text.length) {
        colors[currentColor].end = i + 1;
      }
    }
    return colors;
  }
}
