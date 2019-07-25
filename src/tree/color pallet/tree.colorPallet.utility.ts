import { PalletItem } from './tree.colorPallet.Item';
import { TreeItemCollapsibleState as colState, workspace, ExtensionContext, window, SnippetString, TextDocument } from 'vscode';
import { TreeColorPalletProvider } from './tree.colorPallet.provider';
import { basename } from 'path';
import { Scanner } from '../../autocomplete/scan/autocomplete.scan';

export interface ColorPalletFolder {
  colors: { [color: string]: { label: string; value: string; folder: string } };
}
interface ColorPalletSTATE {
  [folder: string]: ColorPalletFolder;
}
export const ColorPalletUtility = {
  getFolders(context: ExtensionContext) {
    const items: PalletItem[] = [];
    const folders: ColorPalletSTATE = context.globalState.get('folders');
    for (const key in folders) {
      if (folders.hasOwnProperty(key)) {
        const folder = folders[key];
        items.push(new PalletItem(key, '', colState.Collapsed, true, folder));
      }
    }
    return items;
  },
  getColors(data: ColorPalletFolder) {
    const items: PalletItem[] = [];
    for (const key in data.colors) {
      if (data.colors.hasOwnProperty(key)) {
        const colorItem = data.colors[key];
        items.push(new PalletItem(colorItem.label, colorItem.value, colState.None, false, ...[,], colorItem.folder));
      }
    }
    return items;
  },
  addFolderItem(data: PalletItem, context: ExtensionContext, provider: TreeColorPalletProvider) {
    const folders: ColorPalletSTATE = context.globalState.get('folders');
    if (folders[data.label] !== undefined) {
      const inputBox = window.showInputBox({
        prompt: '"Name Color"'
      });

      inputBox.then(value => {
        if (value) {
          const split = value.split(' ');
          if (folders[data.label].colors[split[0]]) {
            window.showWarningMessage(`Item ${split[0]} already Exits`);
          } else {
            folders[data.label].colors[split[0]] = { label: split[0], value: split[1], folder: data.label };
            context.globalState.update('folders', folders);
            provider.refresh();
          }
        }
      });
    }
  },
  addFolder(context: ExtensionContext, provider: TreeColorPalletProvider) {
    const folders: ColorPalletSTATE = context.globalState.get('folders');
    const inputBox = window.showInputBox();
    if (folders === undefined) {
      inputBox.then(value => {
        const folderState: ColorPalletSTATE = { [value]: { colors: {} } };
        context.globalState.update('folders', folderState);
        provider.refresh();
      });
    } else {
      inputBox.then(value => {
        if (folders[value] === undefined) {
          folders[value] = { colors: {} };
          context.globalState.update('folders', folders);
          provider.refresh();
        } else {
          window.showWarningMessage(`Folder ${value} already Exits`);
        }
      });
    }
  },
  delete(data: PalletItem, context: ExtensionContext, provider: TreeColorPalletProvider) {
    const folders: ColorPalletSTATE = context.globalState.get('folders');
    if (data.isFolder) {
      delete folders[data.label];
      context.globalState.update('folders', folders);
      provider.refresh();
    } else {
      delete folders[data.parentFolder].colors[data.label];
      context.globalState.update('folders', folders);
      provider.refresh();
    }
  },
  edit(data: PalletItem, context: ExtensionContext, provider: TreeColorPalletProvider) {
    const inputBox = window.showInputBox();
    const folders: ColorPalletSTATE = context.globalState.get('folders');

    inputBox.then(value => {
      if (value) {
        if (folders[value] === undefined) {
          const folderData = ColorPalletUtility.editFolderData(folders[data.label], value);
          delete folders[data.label];
          folders[value] = folderData;
          context.globalState.update('folders', folders);
          provider.refresh();
        } else {
          window.showWarningMessage('Folder Name Already Taken.');
        }
      }
    });
  },
  editFolderData(folder: ColorPalletFolder, newFolderName: string) {
    let newFolder: ColorPalletFolder = { colors: {} };
    for (const key in folder.colors) {
      if (folder.colors.hasOwnProperty(key)) {
        const color = folder.colors[key];
        color.folder = newFolderName;
        newFolder.colors[key] = color;
      }
    }
    return newFolder;
  },
  addToFile(data: PalletItem, context: ExtensionContext) {
    const folders: ColorPalletSTATE = context.globalState.get('folders');
    if (window.activeTextEditor && window.activeTextEditor.document) {
      const editor = window.activeTextEditor;
      if (data && data.isFolder !== undefined) {
        if (data.isFolder) {
          editor.insertSnippet(new SnippetString(ColorPalletUtility.getSnippetTextFromFolder(data.data)));
        } else {
          editor.insertSnippet(new SnippetString(`\\$${data.label}: ${data.color}`));
        }
      } else {
        const quickPickItems: string[] = [];
        for (const key in folders) {
          if (folders.hasOwnProperty(key)) {
            quickPickItems.push(key);
          }
        }
        window.showQuickPick(quickPickItems).then(res => {
          if (res) {
            editor.insertSnippet(new SnippetString(ColorPalletUtility.getSnippetTextFromFolder(folders[res])));
          }
        });
      }
    }
  },
  getSnippetTextFromFolder(folder: ColorPalletFolder) {
    let text = '';
    for (const key in folder.colors) {
      if (folder.colors.hasOwnProperty(key)) {
        const colorItem = folder.colors[key];
        text = text.concat(`\\$${colorItem.label}: ${colorItem.value}\n`);
      }
    }
    return text;
  },
  scanColors(context: ExtensionContext, provider: TreeColorPalletProvider) {
    const folders: ColorPalletSTATE = context.globalState.get('folders');
    if (window.activeTextEditor && window.activeTextEditor.document) {
      const document = window.activeTextEditor.document;
      const baseName = basename(document.fileName);
      if (folders[baseName] === undefined) {
        folders[baseName] = ColorPalletUtility.getColorVars(document, baseName);
        context.globalState.update('folders', folders);
        provider.refresh();
      } else {
        window.showWarningMessage('Folder Already Exists.');
      }
    }
  },
  getColorVars(document: TextDocument, folder: string): ColorPalletFolder {
    const text = document.getText();
    const vars: ColorPalletFolder['colors'] = {};
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
    return { colors: vars };
  }
};
