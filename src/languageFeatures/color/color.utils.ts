import { Color } from 'vscode';
import { RGBToHEX } from 's.color';
export class ColorUtilities {
  static convertColorToString(color: Color, type: 'hex' | 'rgb') {
    switch (type) {
      case 'hex':
        if (color.alpha === 1) {
          return RGBToHEX({ r: color.red, b: color.blue, g: color.green, a: color.alpha }, 'hex-without-alpha');
        }
        return RGBToHEX({ r: color.red, b: color.blue, g: color.green, a: color.alpha });

      case 'rgb':
        return `rgb${color.alpha === 1 ? '' : 'a'}(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(
          color.blue * 255
        )}${color.alpha === 1 ? '' : ', '.concat(color.alpha.toString())})`;
    }
  }
}
