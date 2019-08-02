'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import FormattingProvider from './format/format.provider';
import { Scanner } from './autocomplete/scan/autocomplete.scan';
import SassCompletion from './autocomplete/autocomplete';
import { TreeSnippetProvider, SnippetProviderUtility } from './tree/tree.provider';
import { TreeUtility } from './tree/tree.utility';

export interface STATE {
  [name: string]: { item: STATEItem; type: 'Mixin' | 'Variable' };
}
export type STATEItem = { title: string; insert: string; detail: string; kind: vscode.CompletionItemKind };

export function activate(context: vscode.ExtensionContext) {
  setSassLanguageConfiguration();
  const SassFormatter = new FormattingProvider(context);
  const SassFormatterRegister = vscode.languages.registerDocumentFormattingEditProvider(
    [{ language: 'sass', scheme: 'file' }, { language: 'sass', scheme: 'untitled' }],
    SassFormatter
  );

  // Events
  const scan = new Scanner(context);
  // const changeDisposable = vscode.workspace.onDidChangeTextDocument(l => setTimeout(() => scan.scanLine(l), 0));
  // const saveDisposable = vscode.workspace.onDidSaveTextDocument(doc => setTimeout(() => scan.scanFile(doc), 0));
  let previouslyActiveEditor: vscode.TextEditor = vscode.window.activeTextEditor;
  let activeEditor: vscode.TextEditor = vscode.window.activeTextEditor;
  const activeDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (previouslyActiveEditor !== undefined) {
      setTimeout(() => scan.scanFile(activeEditor.document), 0);
    }
    if (activeEditor !== undefined) {
      previouslyActiveEditor = activeEditor;
      setTimeout(() => scan.scanFile(activeEditor.document), 0);
    }
  });

  const sassCompletion = new SassCompletion(context);
  const sassCompletionDisposable = vscode.languages.registerCompletionItemProvider(
    [{ language: 'sass', scheme: 'file' }, { language: 'sass', scheme: 'untitled' }],
    sassCompletion,
    '\\.',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '@',
    '/',
    '?',
    '?.',
    '&'
  );

  // Tree SECTION
  let TreeDisposables: vscode.Disposable[] = [];
  const TreeProvider = new TreeSnippetProvider(context);
  SnippetProviderUtility.setProvider(TreeProvider);
  TreeDisposables[0] = vscode.window.registerTreeDataProvider('snippets', TreeProvider);
  TreeDisposables[1] = vscode.commands.registerCommand('sass.tree.refreshEntry', () => {
    TreeProvider.refresh(true);
  });
  TreeDisposables[2] = vscode.commands.registerCommand('sass.tree.addFromSelection', item => {
    TreeUtility.addFromSelection(item);
  });
  TreeDisposables[3] = vscode.commands.registerCommand('sass.tree.delete', item => {
    TreeUtility.delete(item);
  });
  TreeDisposables[4] = vscode.commands.registerCommand('sass.tree.edit', item => {
    TreeUtility.edit(item);
  });
  TreeDisposables[5] = vscode.commands.registerCommand('sass.tree.moveUp', item => {
    TreeUtility.move(item, 'up');
  });
  TreeDisposables[6] = vscode.commands.registerCommand('sass.tree.moveDown', item => {
    TreeUtility.move(item, 'down');
  });
  TreeDisposables[7] = vscode.commands.registerCommand('sass.tree.copy', item => {
    TreeUtility.copy(item);
  });
  TreeDisposables[8] = vscode.commands.registerCommand('sass.tree.paste', item => {
    TreeUtility.paste(item);
  });
  TreeDisposables[9] = vscode.commands.registerCommand('sass.tree.addFolder', item => {
    TreeUtility.addFolder(item);
  });
  TreeDisposables[10] = vscode.commands.registerCommand('sass.tree.insert', item => {
    TreeUtility.insert(item);
  });
  TreeDisposables[11] = vscode.commands.registerCommand('sass.tree.openFile', item => {
    TreeUtility.openFile(item);
  });
  // - !SECTION

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((config: vscode.ConfigurationChangeEvent) => {
      if (config.affectsConfiguration('sass')) {
        setSassLanguageConfiguration();
      }
    })
  );
  context.subscriptions.push(...TreeDisposables);
  context.subscriptions.push(sassCompletionDisposable);
  context.subscriptions.push(SassFormatterRegister);
  context.subscriptions.push(activeDisposable);

  // context.subscriptions.push(changeDisposable);
  // context.subscriptions.push(saveDisposable);
}

function setSassLanguageConfiguration() {
  const config = vscode.workspace.getConfiguration();
  const disableAutoIndent: boolean = config.get('sass.disableAutoIndent');

  vscode.languages.setLanguageConfiguration('sass', {
    wordPattern: /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g,
    onEnterRules: [
      {
        beforeText: /^((?!^(\/n|\s+|.*: .*|.*@.*|.*,|\s+\+.*)$).*|.*@media(?!^\s+$).*)$/,
        action: {
          indentAction: disableAutoIndent ? vscode.IndentAction.None : vscode.IndentAction.Indent
        }
      }
    ]
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
