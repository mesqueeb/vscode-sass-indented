import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  TextDocument,
  ProviderResult,
  TextEdit,
  Range,
  FormattingOptions,
  workspace,
  Position
} from 'vscode';

import { SassFormatter } from 'sass-formatter';

class FormattingProvider implements DocumentFormattingEditProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions): ProviderResult<TextEdit[]> {
    const config = workspace.getConfiguration('sass.format');
    return [
      new TextEdit(
        document.validateRange(new Range(new Position(0, 0), new Position(document.lineCount + 1, 10))),
        SassFormatter.Format(document, options, {
          convert: config.get('convert'),
          debug: config.get('debug'),
          deleteCompact: config.get('deleteCompact'),
          deleteEmptyRows: config.get('deleteEmptyRows'),
          deleteWhitespace: config.get('deleteWhitespace'),
          enabled: config.get('enabled'),
          replaceSpacesOrTabs: config.get('replaceSpacesOrTabs'),
          setPropertySpace: config.get('setPropertySpace'),
          ignoreBackslash: config.get('ignoreBackslash')
        })
      )
    ];
  }
}

export default FormattingProvider;
