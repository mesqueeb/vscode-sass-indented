'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import FormattingProvider from './format/format.provider';
import { Scanner } from './autocomplete/scan/autocomplete.scan';
import SassCompletion from './autocomplete/autocomplete';
import { TreeSnippetProvider } from './tree/tree.provider';
import { SassTreeItem } from './tree/tree.item';

export interface STATE {
  [name: string]: { item: STATEItem; type: 'Mixin' | 'Variable' };
}
export type STATEItem = { title: string; insert: string; detail: string; kind: vscode.CompletionItemKind };
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
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
  const activeDisposable = vscode.window.onDidChangeActiveTextEditor(activeEditor => {
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
  TreeDisposables[0] = vscode.window.registerTreeDataProvider('snippets', TreeProvider);
  TreeDisposables[1] = vscode.commands.registerCommand('tree.sass.refreshEntry', () => {
    TreeProvider.refresh(true);
  });
  TreeDisposables[2] = vscode.commands.registerCommand('tree.sass.addFromSelection', () => {
    console.log('ADD');
    console.log(vscode.window.activeTextEditor);
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
  const disableEmmet = config.get('sass.disableEmmet');
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
  if (disableEmmet) {
    const emmetSettings: string[] = config.get('emmet.excludeLanguages');
    if (emmetSettings.find(value => value === 'sass') === undefined) {
      emmetSettings.push('sass');
      config.update('emmet.excludeLanguages', emmetSettings);
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
