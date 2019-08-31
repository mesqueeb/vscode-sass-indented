'use strict';
import * as vscode from 'vscode';
import FormattingProvider from './format/format.provider';
import { Scanner } from './autocomplete/scan/autocomplete.scan';
import SassCompletion from './autocomplete/autocomplete';
import { SassHoverProvider } from './languageFeatures/hover/hover.provider';
import { SassColorProvider } from './languageFeatures/color/color.provider';
import { DiagnosticsProvider } from './diagnostics/diagnostics.provider';

export interface STATE {
  [name: string]: { item: STATEItem; type: 'Mixin' | 'Variable' };
}
export type STATEItem = { title: string; insert: string; detail: string; kind: vscode.CompletionItemKind };

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration();
  setSassLanguageConfiguration(config);
  const SassFormatter = new FormattingProvider(context);
  const SassFormatterRegister = vscode.languages.registerDocumentFormattingEditProvider(
    [{ language: 'sass', scheme: 'file' }, { language: 'sass', scheme: 'untitled' }],
    SassFormatter
  );

  // Events
  const scan = new Scanner(context);

  // const saveDisposable = vscode.workspace.onDidSaveTextDocument(doc => setTimeout(() => scan.scanFile(doc), 0));
  let previousDocument: vscode.TextDocument = vscode.window.activeTextEditor.document;
  const activeDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (previousDocument !== undefined) {
      scan.scanFile(previousDocument);
    }
    if (editor !== undefined) {
      previousDocument = editor.document;
      scan.scanFile(editor.document);
    }
  });

  const hover = new SassHoverProvider();
  const hoverDisposable = vscode.languages.registerHoverProvider(
    [{ language: 'sass', scheme: 'file' }, { language: 'sass', scheme: 'untitled' }],
    {
      provideHover: hover.provideHover
    }
  );

  const color = new SassColorProvider();
  const colorDisposable = vscode.languages.registerColorProvider(
    [{ language: 'sass', scheme: 'file' }, { language: 'sass', scheme: 'untitled' }],
    {
      provideColorPresentations: color.provideColorPresentations,
      provideDocumentColors: color.provideDocumentColors
    }
  );

  const sassCompletion = new SassCompletion(context);
  const sassCompletionDisposable = vscode.languages.registerCompletionItemProvider(
    [
      { language: 'sass', scheme: 'file' },
      { language: 'sass', scheme: 'untitled' },
      { language: 'vue', scheme: 'file' },
      { language: 'vue', scheme: 'untitled' }
    ],
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

  const diagnostics = new DiagnosticsProvider();
  const diagnosticsCollection = vscode.languages.createDiagnosticCollection('sass');

  if (vscode.window.activeTextEditor) {
    if (config.get('sass.lint.enable')) {
      diagnostics.update(vscode.window.activeTextEditor.document, diagnosticsCollection);
    }
  }

  const changeDisposable = vscode.workspace.onDidChangeTextDocument(l => {
    if (config.get('sass.lint.enable')) {
      // diagnostics.updateLine(l.document, l.contentChanges, diagnosticsCollection)

      diagnostics.update(l.document, diagnosticsCollection);
    }
  });

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        if (config.get('sass.lint.enable')) {
          diagnostics.update(editor.document, diagnosticsCollection);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((configEvent: vscode.ConfigurationChangeEvent) => {
      if (configEvent.affectsConfiguration('sass')) {
        setSassLanguageConfiguration(config, diagnosticsCollection);
      }
    })
  );

  context.subscriptions.push(changeDisposable);

  context.subscriptions.push(hoverDisposable);
  context.subscriptions.push(colorDisposable);
  context.subscriptions.push(sassCompletionDisposable);
  context.subscriptions.push(SassFormatterRegister);
  context.subscriptions.push(activeDisposable);

  // context.subscriptions.push(saveDisposable);
}

function setSassLanguageConfiguration(config: vscode.WorkspaceConfiguration, diagnosticsCollection?: vscode.DiagnosticCollection) {
  const disableAutoIndent: boolean = config.get('sass.disableAutoIndent');

  if (!config.get('sass.lint.enable') && diagnosticsCollection !== undefined) {
    diagnosticsCollection.clear();
  }

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

export function deactivate() {}
