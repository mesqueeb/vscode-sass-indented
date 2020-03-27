import {
  TextDocument,
  Range,
  CancellationToken,
  CodeActionProvider,
  Selection,
  CodeActionContext,
  ProviderResult,
  CodeAction,
  CodeActionKind,
  WorkspaceEdit,
  Position,
  commands,
  window,
  TextEditor
} from 'vscode';
import { Command, CommandManager } from '../../utils/commandManager';

export class SassCodeActionProvider implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [CodeActionKind.RefactorExtract];

  constructor(commandManager: CommandManager) {
    commandManager.register(new ExtractToMixinCommand());
  }

  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    token: CancellationToken
  ): ProviderResult<CodeAction[]> {
    if (range.isEmpty) {
      return;
    }

    const extractToMixin = this.extractToMixin(document, range);
    return [extractToMixin];
  }

  private extractToMixin(document: TextDocument, range: Range): CodeAction {
    const action = new CodeAction('Extract to Mixin', CodeActionKind.RefactorExtract);

    action.edit = new WorkspaceEdit();

    const editor = window.activeTextEditor;
    if (editor) {
      const options = editor.options;
      const tab = options.insertSpaces ? ' '.repeat(options.tabSize as number) : '\t';

      action.edit.delete(document.uri, range);
      action.edit.insert(
        document.uri,
        new Position(document.lineCount, 0),
        `
@mixin name
${document.getText(range).replace(/^/gm, tab)}
      `
      );

      action.command = {
        title: 'test',
        command: 'sass.refactor.extractToMixin',
        arguments: [document.lineCount - (range.end.line - range.start.line), editor]
      };
    }
    return action;
  }
}

class ExtractToMixinCommand implements Command {
  id = 'sass.refactor.extractToMixin';

  public async execute(line: number, editor: TextEditor) {
    if (editor) {
      editor.selection = new Selection(new Position(line, 7), new Position(line, 11));
      editor.revealRange(new Range(new Position(line, 0), new Position(line + 40, 0)));
    }
  }
}
