import { SassTreeFolder, SassSidebarSTATE } from '../tree.utility';
import { SassTreeItem } from '../tree.item';
import { TreeItemCollapsibleState as colState, ExtensionContext, window, TextDocument } from 'vscode';
import { TreeColorPalletProvider } from './tree.colorPallet.provider';
import { basename } from 'path';

export const ColorPalletUtility = {
  getColors(subFolder: SassTreeFolder) {
    const items: SassTreeItem[] = [];
    for (const key in subFolder.data) {
      if (subFolder.data.hasOwnProperty(key)) {
        const colorItem = subFolder.data[key];
        items.push(new SassTreeItem(colorItem.label, colorItem.value, colorItem.value, colState.None, false, ...[,], colorItem.folder));
      }
    }
    return items;
  },
  scanColors(context: ExtensionContext, provider: TreeColorPalletProvider, type: 'pallet' | 'mixin') {
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));
    if (window.activeTextEditor && window.activeTextEditor.document) {
      const document = window.activeTextEditor.document;
      const baseName = basename(document.fileName);
      if (folders[baseName] === undefined) {
        folders[baseName] = ColorPalletUtility.getColorVars(document, baseName);
        context.globalState.update(type.concat('-', 'folders'), folders);
        provider.refresh();
      } else {
        window.showWarningMessage('Folder Already Exists.');
      }
    }
  },
  getColorVars(document: TextDocument, folder: string): SassTreeFolder {
    const text = document.getText();
    const vars: SassTreeFolder['data'] = {};
    const varRegex = /\${1}\S*: *#.*/g;
    let varMatches: RegExpExecArray;
    while ((varMatches = varRegex.exec(text)) !== null) {
      if (varMatches.index === varRegex.lastIndex) {
        varRegex.lastIndex++;
      }
      varMatches.forEach((match: string) => {
        const split = match.split(':');
        vars[split[0].replace('$', '').trim()] = { folder, label: split[0].replace('$', '').trim(), value: split[1].trim() };
      });
    }
    return { data: vars };
  }
};
