import { isScssOrCss, isHtmlTag } from '../utility/utility.regex';

test('isScssOrCss', () => {
  expect(isScssOrCss('$test: 10px;')).toEqual(true);
  expect(isScssOrCss('svg {')).toEqual(true);
});
test('isHtmlTag', () => {
  expect(isHtmlTag('svg, h1, h2, h3')).toEqual(true);
  expect(isHtmlTag('   i.test#{$test}')).toEqual(true);
  expect(isHtmlTag('   i:not(:first-child),')).toEqual(true);
  expect(isHtmlTag('b')).toEqual(true);
});
