'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import SassCompletion from './sassAutocomplete';
import SassFormattingProvider from './format/sassFormattingProvider';
import { ScanForVarsAndMixin } from './schemas/sassUtils';

export interface STATE {
  [name: string]: { item: vscode.CompletionItem; type: 'Mixin' | 'Variable' };
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  setSassLanguageConfiguration();
  // TODO SassFormatter
  const SassFormatter = new SassFormattingProvider(context);
  const SassFormatterRegister = vscode.languages.registerDocumentFormattingEditProvider(
    [{ language: 'sass', scheme: 'file' }, { language: 'sass', scheme: 'untitled' }],
    SassFormatter
  );

  // Events
  const scan = new ScanForVarsAndMixin(context);
  setTimeout(() => startUp(scan), 0);

  const changeDisposable = vscode.workspace.onDidChangeTextDocument(l => setTimeout(() => scan.scanLine(l), 0));
  const saveDisposable = vscode.workspace.onDidSaveTextDocument(doc => setTimeout(() => scan.scanFile(doc), 0));

  const activeDisposable = vscode.window.onDidChangeActiveTextEditor(activeEditor => {
    if (activeEditor !== undefined) {
      setTimeout(() => scan.scanFile(activeEditor.document), 0);
    }
  });

  const sassCompletion = new SassCompletion(context);
  const sassCompletionRegister = vscode.languages.registerCompletionItemProvider(
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
    '&'
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((config: vscode.ConfigurationChangeEvent) => {
      if (config.affectsConfiguration('sass')) {
        setSassLanguageConfiguration();
      }
    })
  );
  context.subscriptions.push(sassCompletionRegister);
  context.subscriptions.push(SassFormatterRegister);
  context.subscriptions.push(activeDisposable);
  context.subscriptions.push(changeDisposable);
  context.subscriptions.push(saveDisposable);
}

function setSassLanguageConfiguration() {
  const disableAutoIndent: boolean = vscode.workspace.getConfiguration('sass').get('disableAutoIndent');

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

function startUp(scan: ScanForVarsAndMixin) {
  const openEditor = vscode.window.activeTextEditor;
  if (openEditor !== undefined) {
    scan.scanFile(openEditor.document);
  }
}
