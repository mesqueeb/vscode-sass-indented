import { DocumentFormattingEditProvider, ExtensionContext, TextDocument, ProviderResult, TextEdit, Range, Position } from 'vscode';
// TODO SassFormatter
class SassFormattingProvider implements DocumentFormattingEditProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideDocumentFormattingEdits(document: TextDocument): ProviderResult<TextEdit[]> {
    let result: ProviderResult<TextEdit[]> = [];
    return result;
  }
}

export default SassFormattingProvider;
