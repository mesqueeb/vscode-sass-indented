import { TreeItemCollapsibleState as colState, ExtensionContext, window, SnippetString } from 'vscode';
import { TreeColorPalletProvider } from './color pallet/tree.colorPallet.provider';
import { SassTreeItem } from './tree.item';

export interface SassTreeFolder {
  data: { [key: string]: { label: string; value: string; folder: string } };
}
export interface SassSidebarSTATE {
  [folder: string]: SassTreeFolder;
}

export const SassTreeUtility = {
  getFolders(context: ExtensionContext, type: 'pallet' | 'mixin') {
    const items: SassTreeItem[] = [];
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));
    for (const key in folders) {
      if (folders.hasOwnProperty(key)) {
        const folder = folders[key];
        items.push(new SassTreeItem(key, '', '', colState.Collapsed, true, folder));
      }
    }
    return items;
  },

  addFolderItem(data: SassTreeItem, context: ExtensionContext, provider: TreeColorPalletProvider, type: 'pallet' | 'mixin') {
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));
    if (folders[data.label] !== undefined) {
      const inputBox = window.showInputBox({
        prompt: '"Name Color"'
      });

      inputBox.then(value => {
        if (value) {
          const split = value.split(' ');
          if (folders[data.label].data[split[0]]) {
            window.showWarningMessage(`Item ${split[0]} already Exits`);
          } else {
            folders[data.label].data[split[0]] = { label: split[0], value: split[1], folder: data.label };
            context.globalState.update(type.concat('-', 'folders'), folders);
            provider.refresh();
          }
        }
      });
    }
  },
  addFolder(context: ExtensionContext, provider: TreeColorPalletProvider, type: 'pallet' | 'mixin') {
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));
    const inputBox = window.showInputBox();
    if (folders === undefined) {
      inputBox.then(value => {
        const folderState: SassSidebarSTATE = { [value]: { data: {} } };
        context.globalState.update(type.concat('-', 'folders'), folderState);
        provider.refresh();
      });
    } else {
      inputBox.then(value => {
        if (folders[value] === undefined) {
          folders[value] = { data: {} };
          context.globalState.update(type.concat('-', 'folders'), folders);
          provider.refresh();
        } else {
          window.showWarningMessage(`Folder ${value} already Exits`);
        }
      });
    }
  },
  delete(data: SassTreeItem, context: ExtensionContext, provider: TreeColorPalletProvider, type: 'pallet' | 'mixin') {
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));
    if (data.isFolder) {
      delete folders[data.label];
      context.globalState.update(type.concat('-', 'folders'), folders);
      provider.refresh();
    } else {
      delete folders[data.parentFolder].data[data.label];
      context.globalState.update(type.concat('-', 'folders'), folders);
      provider.refresh();
    }
  },
  edit(data: SassTreeItem, context: ExtensionContext, provider: TreeColorPalletProvider, type: 'pallet' | 'mixin') {
    const inputBox = window.showInputBox();
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));

    inputBox.then(value => {
      if (value) {
        if (folders[value] === undefined) {
          const folderData = SassTreeUtility.editFolderData(folders[data.label], value);
          delete folders[data.label];
          folders[value] = folderData;
          context.globalState.update(type.concat('-', 'folders'), folders);
          provider.refresh();
        } else {
          window.showWarningMessage('Folder Name Already Taken.');
        }
      }
    });
  },
  editFolderData(folder: SassTreeFolder, newFolderName: string) {
    let newFolder: SassTreeFolder = { data: {} };
    for (const key in folder.data) {
      if (folder.data.hasOwnProperty(key)) {
        const color = folder.data[key];
        color.folder = newFolderName;
        newFolder.data[key] = color;
      }
    }
    return newFolder;
  },
  addToFile(data: SassTreeItem, context: ExtensionContext, type: 'pallet' | 'mixin') {
    const folders: SassSidebarSTATE = context.globalState.get(type.concat('-', 'folders'));
    if (window.activeTextEditor && window.activeTextEditor.document) {
      const editor = window.activeTextEditor;
      if (data && data.isFolder !== undefined) {
        if (data.isFolder) {
          editor.insertSnippet(new SnippetString(SassTreeUtility.getSnippetTextFromFolder(data.data)));
        } else {
          editor.insertSnippet(new SnippetString(`\\$${data.label}: ${data.data}`));
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
            editor.insertSnippet(new SnippetString(SassTreeUtility.getSnippetTextFromFolder(folders[res])));
          }
        });
      }
    }
  },
  getSnippetTextFromFolder(folder: SassTreeFolder) {
    let text = '';
    for (const key in folder.data) {
      if (folder.data.hasOwnProperty(key)) {
        const data = folder.data[key];
        text = text.concat(`\\$${data.label}: ${data.value}\n`);
      }
    }
    return text;
  }
};
