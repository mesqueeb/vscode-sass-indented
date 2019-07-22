[![](https://vsmarketplacebadge.apphb.com/version-short/syler.sass-indented.svg)](https://marketplace.visualstudio.com/items?itemName=syler.sass-indented)
[![](https://vsmarketplacebadge.apphb.com/installs-short/syler.sass-indented.svg)](https://marketplace.visualstudio.com/items?itemName=syler.sass-indented)
<!-- [![](https://vsmarketplacebadge.apphb.com/rating-short/syler.sass-indented.svg)](https://marketplace.visualstudio.com/items?itemName=syler.sass-indented)
[![GitHub stars](https://img.shields.io/github/stars/TheRealSyler/vscode-sass-indented.svg?style=social&label=Star%20on%20Github)](https://github.com/TheRealSyler/vscode-sass-indented) -->


# Indented Sass syntax highlighting, autocomplete & snippets for VSCode
VSCode only has built in support for SCSS syntax so I have put this together for people who prefer to use the indented syntax.

![Highlighting Example](https://raw.githubusercontent.com/TheRealSyler/vscode-sass-indented/master/resources/images/screenshot.png)

## Installing
Search for Sass from the extension installer within VSCode or put this into the command palette.
```npm
ext install sass-indented
```

## Configuration

Configuration options can be set in the `Sass (Indented)` section of VSCode settings or by editing your `settings.json` directly.

| Option                       | Type    | Default | Description                                                         |
| ---------------------------- | ------- | ------- | ------------------------------------------------------------------- |
| `sass.disableAutoIndent`     | boolean | false   | Stop the extension from automatically indenting when pressing Enter |
| `sass.disableUnitCompletion` | boolean | true    | adds units to the intellisense completions if false.                |

## Property/Value Autocompletion & Emmet
Autocompletion for css properties and built in language functions _(@warn, @at-root, lighten(), darken() etc)_ is built in. As of version 1.3 VSCode supports Emmet in .sass files, the original snippets for css properties have been removed.

## Snippets
Snippets have been reduced to a few time savers.

`var` - declare a new variable   
`mixin` - declare a new mixin   
`if` - base for an @if statement   
`for` - base for a @for loop   
`each` - base for a @each loop   
`while` - base for a @while loop   

## Contributing
The source for this extension is available on [github](https://github.com/TheRealSyler/vscode-sass-indented). If anyone feels that there is something missing or would like to suggest improvements please [open a new issue](https://github.com/TheRealSyler/vscode-sass-indented/issues) or send a pull request! Instructions for running/debugging extensions locally [here](https://code.visualstudio.com/docs/extensions/overview).

## Credits

- Thanks to [@robinbentley](https://github.com/robinbentley) for creating and maintaining the project until version 1.5.1.
- Property/Value Autocompletion - [Stanislav Sysoev (@d4rkr00t)](https://github.com/d4rkr00t) for his work on [language-stylus](https://github.com/d4rkr00t/language-stylus) extension
- Syntax highlighting - [https://github.com/P233/Syntax-highlighting-for-Sass](https://github.com/P233/Syntax-highlighting-for-Sass)
- Sass seal logo - [http://sass-lang.com/styleguide/brand](http://sass-lang.com/styleguide/brand)

## Changelog
The full changelog is available here: [changelog](CHANGELOG.md).

## License
[MIT - https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)