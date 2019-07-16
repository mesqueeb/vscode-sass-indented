import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  TextDocument,
  ProviderResult,
  TextEdit,
  window,
  Range,
  DecorationOptions,
  TextEditor
} from 'vscode';
// TODO SassFormatter
class SassFormattingProvider implements DocumentFormattingEditProvider {
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  provideDocumentFormattingEdits(document: TextDocument): ProviderResult<TextEdit[]> {
    const text = document.getText();
    const activeEditor = window.activeTextEditor;
    const tabSize = activeEditor.options.tabSize;
    if (!activeEditor && activeEditor.document === undefined) {
      return [];
    }
    console.log('FORMAT');
    let result: ProviderResult<TextEdit[]> = [];

    function updateDecorations() {
      if (!activeEditor) {
        return;
      }
      const regEx = /\d+/g;
      const text = activeEditor.document.getText();
      const smallNumbers: DecorationOptions[] = [];
      const largeNumbers: DecorationOptions[] = [];
      let match;
      while ((match = regEx.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index);
        const endPos = activeEditor.document.positionAt(match.index + match[0].length);
        const decoration = { range: new Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
        if (match[0].length < 3) {
          smallNumbers.push(decoration);
        } else {
          largeNumbers.push(decoration);
        }
      }
    }

    return result;
  }
}

export default SassFormattingProvider;

function test(activeEditor: TextEditor, tabSize: number) {
  const regEx = /\d+/g;
  const text = activeEditor.document.getText();

  let match;
  while ((match = regEx.exec(text))) {
    const startPos = activeEditor.document.positionAt(match.index);
    const endPos = activeEditor.document.positionAt(match.index + match[0].length);
    const decoration = { range: new Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
  }
}
