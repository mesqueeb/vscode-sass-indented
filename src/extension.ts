'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import FormattingProvider from './format/format.provider';
import { Scanner } from './autocomplete/scan/autocomplete.scan';
import SassCompletion from './autocomplete/autocomplete';
import { TreeColorPalletProvider } from './tree/color pallet/tree.colorPallet.provider';
import { PalletItem } from './tree/color pallet/tree.colorPallet.Item';
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
  const colorPalletProvider = new TreeColorPalletProvider(context);
  const treeDisposable = vscode.window.registerTreeDataProvider('colorPallet', colorPalletProvider);
  vscode.commands.registerCommand('colorPallet.refreshEntry', () => colorPalletProvider.refresh());

  vscode.commands.registerCommand('colorPallet.addFolder', () => ColorPalletUtility.addFolder(context, colorPalletProvider));
  vscode.commands.registerCommand('colorPallet.addFolderItem', (node: PalletItem) =>
    ColorPalletUtility.addFolderItem(node, context, colorPalletProvider)
  );
  vscode.commands.registerCommand('colorPallet.editEntry', (node: PalletItem) =>
    ColorPalletUtility.edit(node, context, colorPalletProvider)
  );
  vscode.commands.registerCommand('colorPallet.deleteEntry', (node: PalletItem) =>
    ColorPalletUtility.delete(node, context, colorPalletProvider)
  );
  vscode.commands.registerCommand('colorPallet.addToFile', (node: PalletItem) => ColorPalletUtility.addToFile(node, context));
  vscode.commands.registerCommand('colorPallet.scanColors', () => ColorPalletUtility.scanColors(context, colorPalletProvider));
  // - !SECTION
  context.subscriptions.push(treeDisposable);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((config: vscode.ConfigurationChangeEvent) => {
      if (config.affectsConfiguration('sass')) {
        setSassLanguageConfiguration();
      }
    })
  );
  context.subscriptions.push(sassCompletionDisposable);
  context.subscriptions.push(SassFormatterRegister);
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
