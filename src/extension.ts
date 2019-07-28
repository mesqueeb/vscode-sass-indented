'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import FormattingProvider from './format/format.provider';
import { Scanner } from './autocomplete/scan/autocomplete.scan';
import SassCompletion from './autocomplete/autocomplete';
import { TreeColorPalletProvider } from './tree/color pallet/tree.colorPallet.provider';
import { SassTreeUtility } from './tree/tree.utility';
import { TreeMixinsProvider } from './tree/mixins/tree.mixins.provider';
import { SassTreeItem } from './tree/tree.item';
import { ColorPalletUtility } from './tree/color pallet/tree.colorPallet.utility';

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
  // color pallet
  const colorPalletProvider = new TreeColorPalletProvider(context);
  const treeDisposable = vscode.window.registerTreeDataProvider('colorPallet', colorPalletProvider);
  vscode.commands.registerCommand('colorPallet.refreshEntry', () => colorPalletProvider.refresh());

  vscode.commands.registerCommand('colorPallet.addFolder', () => SassTreeUtility.addFolder(context, colorPalletProvider, 'pallet'));
  vscode.commands.registerCommand('colorPallet.addFolderItem', (node: SassTreeItem) =>
    SassTreeUtility.addFolderItem(node, context, colorPalletProvider, 'pallet')
  );
  vscode.commands.registerCommand('colorPallet.editEntry', (node: SassTreeItem) =>
    SassTreeUtility.edit(node, context, colorPalletProvider, 'pallet')
  );
  vscode.commands.registerCommand('colorPallet.deleteEntry', (node: SassTreeItem) =>
    SassTreeUtility.delete(node, context, colorPalletProvider, 'pallet')
  );
  vscode.commands.registerCommand('colorPallet.addToFile', (node: SassTreeItem) => SassTreeUtility.addToFile(node, context, 'pallet'));
  vscode.commands.registerCommand('colorPallet.scanColors', () => ColorPalletUtility.scanColors(context, colorPalletProvider, 'pallet'));

  // mixins
  const b = new TreeMixinsProvider(context);
  const a = vscode.window.registerTreeDataProvider('mixins', b);

  // - !SECTION

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((config: vscode.ConfigurationChangeEvent) => {
      if (config.affectsConfiguration('sass')) {
        setSassLanguageConfiguration();
      }
    })
  );
  context.subscriptions.push(sassCompletionDisposable);
  context.subscriptions.push(SassFormatterRegister);
  context.subscriptions.push(activeDisposable);
  context.subscriptions.push(treeDisposable);
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
