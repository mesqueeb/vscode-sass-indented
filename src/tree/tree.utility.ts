import { workspace, TreeItemCollapsibleState as ColState } from 'vscode';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SassTreeItemData, SassTreeItem, SassTreeItemType } from './tree.item';

interface SassTreeItemDataRaw {
  insert?: string;
  type: SassTreeItemType;
  desc?: string;
}

interface TreeData {
  [item: string]: { data: SassTreeItemDataRaw; children: TreeData };
}

export class TreeUtility {
  private static _DATA: TreeData;
  private constructor() {}
  static getLocalSassSnippets() {
    this._DATA = {};
    const folders = workspace.workspaceFolders;
    if (folders !== undefined && folders.length > 1) {
      folders.forEach(folderPath => {
        const path = join(folderPath.uri.fsPath, '.vscode', 'sass.snippets.json');
        if (existsSync(path)) {
          const rawData = readFileSync(path);
          this._DATA = { ...this._DATA, ...{ [folderPath.name]: { children: JSON.parse(rawData.toString()), data: { type: 'folder' } } } };
        }
      });
      // console.log('RAW-Multiple', this._DATA);
    } else if (folders !== undefined) {
      const path = join(folders[0].uri.fsPath, '.vscode', 'sass.snippets.json');
      if (existsSync(path)) {
        const rawData = readFileSync(path);
        this._DATA = JSON.parse(rawData.toString());
      }
      // console.log('RAW', this._DATA);
    }

    return this._DATA;
  }
  static getItems(data: TreeData, path?: string[]): SassTreeItem[] {
    const items: SassTreeItem[] = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const item = data[key];
        let isFolder = false;
        if (item.data.type === 'folder') {
          isFolder = true;
        }
        items.push(
          new SassTreeItem(
            key,
            new SassTreeItemData(item.data.insert, item.data.type, this._GET_PATH(key, path), item.data.desc),
            isFolder ? ColState.Collapsed : ColState.None
          )
        );
      }
    }
    return items;
  }
  static getData(path?: string[]) {
    if (path !== undefined) {
      let tempData: TreeData = null;
      for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (tempData === null) {
          if (this._DOES_KEY_EXIST(this._DATA, key)) {
            tempData = this._DATA[key].children;
          } else {
            tempData = {};
            break;
          }
        } else {
          if (this._DOES_KEY_EXIST(tempData, key)) {
            tempData = tempData[key].children;
          } else {
            tempData = {};
            break;
          }
        }
      }
      if (tempData === null) {
        tempData = {};
      }
      return tempData;
    } else {
      return this._DATA;
    }
  }
  private static _DOES_KEY_EXIST(data: any, key: string) {
    if (data === undefined || data[key] === undefined) {
      return false;
    }
    return true;
  }
  private static _GET_PATH(key: string, path?: string[]): string[] {
    if (path !== undefined) {
      return path.concat(key);
    } else {
      return [key];
    }
  }
}
