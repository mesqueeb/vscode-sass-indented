import { workspace, TreeItemCollapsibleState as ColState, window, SnippetString, Uri } from 'vscode';
import { readFileSync, existsSync, writeFile, writeFileSync } from 'fs';
import { join } from 'path';
import { SassTreeItemData, SassTreeItem, SassTreeItemType } from './tree.item';
import { SnippetProviderUtility as provider } from './tree.provider';

class SassTreeItemDataRaw {
  constructor(
    public type: SassTreeItemType,
    public position: number,
    public insert?: string,
    public desc?: string,
    public isOpen?: boolean
  ) {}
}

interface TreeData {
  [item: string]: { data: SassTreeItemDataRaw; children: TreeData };
}
interface FileLocation {
  path: string;
}

export class TreeUtility {
  private static _FILE_LOCATIONS: { [name: string]: FileLocation } = {};
  private static _DATA: TreeData;
  private static _COPY: { data: TreeData['any']; name: string };
  private static _INITIALIZED = false;
  private constructor() {}
  static getDataFromFile() {
    this._DATA = {};
    const folders = workspace.workspaceFolders;
    if (folders !== undefined) {
      folders.forEach((folderPath, i) => {
        const path = join(folderPath.uri.fsPath, '.vscode', 'sass.snippets.json');
        if (existsSync(path)) {
          const rawData = readFileSync(path);
          this._FILE_LOCATIONS[folderPath.name] = { path };
          this._DATA = {
            ...this._DATA,
            ...{ [folderPath.name]: { children: JSON.parse(rawData.toString()), data: { type: 'root', isOpen: true, position: i + 1 } } }
          };
        }
      });
    }
    const globalPath: string = workspace.getConfiguration().get('sass.snippets.path');
    if (globalPath && globalPath !== 'none') {
      if (existsSync(globalPath)) {
        const rawData = readFileSync(globalPath);
        this._FILE_LOCATIONS['Global'] = { path: globalPath };
        this._DATA = {
          ...this._DATA,
          ...{ ['Global']: { children: JSON.parse(rawData.toString()), data: { type: 'root', isOpen: true, position: 0 } } }
        };
      } else {
        window.showWarningMessage(`${globalPath} does not exist!`, 'Create new File', 'Reset Setting').then(value => {
          switch (value) {
            case 'Create new File':
              if (/.json/.test(globalPath)) {
                writeFileSync(globalPath, '{}');
              } else {
                window.showErrorMessage('Path Has to end with .json', 'Chose New Path').then(value => {
                  if (value === 'Chose New Path') {
                    this._GET_GLOBAL_PATH(true);
                  }
                });
              }
              break;
            case 'Reset Setting':
              workspace.getConfiguration().update('sass.snippets.path', 'none', true);
              break;

            default:
              break;
          }
        });
      }
    } else {
      this._GET_GLOBAL_PATH();
    }
    this._INITIALIZED = true;
    return this._DATA;
  }

  static getItems(data: TreeData, path?: string[]): SassTreeItem[] {
    const items: SassTreeItem[] = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const item = data[key];
        let isFolder = false;
        if (item.data.type === 'folder' || item.data.type === 'root') {
          isFolder = true;
        }
        items.push(
          new SassTreeItem(
            key,
            new SassTreeItemData(item.data.insert, item.data.type, this._CREATE_PATH(key, path), item.data.position, item.data.desc),
            isFolder ? (item.data.isOpen ? ColState.Expanded : ColState.Collapsed) : ColState.None
          )
        );
      }
    }
    items.sort((a, b) => a.data.position - b.data.position);
    return items;
  }
  static getData(path?: string[]) {
    if (path !== undefined) {
      return this._DOES_PATH_EXIST(path).data;
    } else {
      return this._DATA;
    }
  }

  static addFromSelection(item: SassTreeItem) {
    if (window.activeTextEditor !== undefined && window.activeTextEditor.document !== undefined) {
      if (!this._INITIALIZED) {
        this.getDataFromFile();
      }
      const document = window.activeTextEditor.document;
      const selections = window.activeTextEditor.selections;
      let newItems: SassTreeItemDataRaw[] = [];
      for (let i = 0; i < selections.length; i++) {
        const selection = document.getText(selections[i]);
        newItems.push(new SassTreeItemDataRaw('snippet', 0, selection));
      }
      for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];

        let itemName = `Selection${i === 0 ? '' : '-'.concat(i.toString())}`;
        let path: string[];
        let counter = 0;
        if (item && item.data !== undefined) {
          path = item.data.path;
        } else {
          const config = workspace.getConfiguration().get('sass.snippets.path');
          if (config !== '' && config !== 'none') {
            path = ['Global'];
          } else {
            path = [workspace.getWorkspaceFolder(document.uri).name];
          }
        }
        while (this._DOES_PATH_EXIST(path.concat([itemName])).exists === true) {
          counter++;
          itemName = `Selection-${i + counter}`;
        }

        newItem.position = Object.keys(this.getData(path)).length;

        this._INSERT_DATA(path, { [itemName]: { data: newItem, children: {} } });
        this._WRITE_DATA_TO_FILES({ location: this._FILE_LOCATIONS[path[0]], baseName: path[0] });
        provider.Refresh();
      }
    } else {
      console.warn('addFromSelection', 'activeTextEditor or activeTextEditor.document is', undefined);
    }
  }
  static delete(item: SassTreeItem) {
    this._DELETE_DATA(item.data.path, this._DATA);
    provider.Refresh();
    this._WRITE_DATA_TO_FILES({ location: this._FILE_LOCATIONS[item.data.path[0]], baseName: item.data.path[0] });
  }
  static edit(item: SassTreeItem) {
    window.showInputBox({ placeHolder: 'newName' }).then(value => {
      if (value) {
        const newPath = item.data.path.slice(0, item.data.path.length - 1).concat(value);
        if (!this._DOES_PATH_EXIST(newPath).exists) {
          let deletedData = this._DELETE_DATA(item.data.path, this._DATA);
          provider.Refresh();
          this._INSERT_DATA(item.data.path.slice(0, item.data.path.length - 1), { [value]: deletedData });
          this._WRITE_DATA_TO_FILES({ location: this._FILE_LOCATIONS[item.data.path[0]], baseName: item.data.path[0] });
        } else {
          window.showWarningMessage(`name: ${value} already in use.`);
        }
      }
    });
  }

  static move(item: SassTreeItem, direction: 'up' | 'down') {
    if (direction === 'up' ? item.data.position + 1 >= 0 : true) {
      const path = item.data.path.slice(0, item.data.path.length - 1);
      const itemData = this.getData(path)[item.label].data;
      const write = this._UPDATE_ITEM_POSITIONS(path, { data: itemData, name: item.label }, direction);
      if (write) {
        this._WRITE_DATA_TO_FILES({ location: this._FILE_LOCATIONS[item.data.path[0]], baseName: item.data.path[0] });
        provider.Refresh();
      }
    }
  }
  static copy(item: SassTreeItem) {
    this._COPY = { data: this.getData(item.data.path.slice(0, item.data.path.length - 1))[item.label], name: item.label };
    window.showInformationMessage(`${item.label} copied!`);
  }

  static paste(item: SassTreeItem) {
    if (!this._DOES_PATH_EXIST(item.data.path.concat(this._COPY.name)).exists) {
      this._PASTE(item);
    } else {
      window.showWarningMessage(`item: ${this._COPY.name} already exists, do you want to overwrite it?`, 'Yes', 'No').then(value => {
        if (value === 'Yes') {
          this._PASTE(item);
        }
      });
    }
  }

  static addFolder(item: SassTreeItem) {
    window.showInputBox({ placeHolder: 'Folder Name' }).then(value => {
      if (value) {
        const newPath = item.data.path.concat(value);
        if (!this._DOES_PATH_EXIST(newPath).exists) {
          this._INSERT_DATA(item.data.path, {
            [value]: { children: {}, data: { type: 'folder', position: Object.keys(this.getData(item.data.path)).length } }
          });
          provider.Refresh();
          this._WRITE_DATA_TO_FILES({ location: this._FILE_LOCATIONS[item.data.path[0]], baseName: item.data.path[0] });
        } else {
          window.showWarningMessage(`folder: ${value} already exists.`);
        }
      }
    });
  }
  static insert(item: SassTreeItem) {
    if (window.activeTextEditor) {
      window.activeTextEditor.insertSnippet(new SnippetString(item.data.insert));
    }
  }
  static openFile(item: SassTreeItem) {
    window.showTextDocument(Uri.file(this._FILE_LOCATIONS[item.data.path[0]].path));
  }
  private static _PASTE(item: SassTreeItem) {
    this._INSERT_DATA(item.data.path, {
      [this._COPY.name]: {
        children: this._COPY.data.children,
        data: {
          type: this._COPY.data.data.type,
          position: Object.keys(this.getData(item.data.path)).length,
          desc: this._COPY.data.data.desc,
          insert: this._COPY.data.data.insert,
          isOpen: this._COPY.data.data.isOpen
        }
      }
    });

    this._WRITE_DATA_TO_FILES({ location: this._FILE_LOCATIONS[item.data.path[0]], baseName: item.data.path[0] });
    provider.Refresh();
  }

  private static _GET_GLOBAL_PATH(skipQuestion?: boolean) {
    if (skipQuestion) {
      window.showOpenDialog({ openLabel: 'Set Snippet Path', canSelectFiles: false, canSelectFolders: true }).then(res => {
        if (res) {
          workspace.getConfiguration().update('sass.snippets.path', res[0].fsPath.concat('/sass-snippets.json'), true);
          writeFileSync(res[0].fsPath.concat('/sass-snippets.json'), '{}');
          provider.Refresh(true);
        }
      });
    } else {
      window.showInformationMessage('Global Snippet path Not set, would you like to set it now?', 'Yes', 'No').then(value => {
        if (value === 'Yes') {
          window.showOpenDialog({ openLabel: 'Set Snippet Path', canSelectFiles: false, canSelectFolders: true }).then(res => {
            if (res) {
              workspace.getConfiguration().update('sass.snippets.path', res[0].fsPath.concat('/sass-snippets.json'), true);
              writeFileSync(res[0].fsPath.concat('/sass-snippets.json'), '{}');
              provider.Refresh(true);
            }
          });
        }
      });
    }
  }

  private static _INSERT_DATA(path: string[], data: TreeData) {
    let level = 0;

    path.reduce((lastReturnValue, currentKey) => {
      level++;
      if (level === path.length) {
        lastReturnValue[currentKey].children = { ...lastReturnValue[currentKey].children, ...data };
        return data;
      } else {
        return lastReturnValue[currentKey].children;
      }
    }, this._DATA);
  }

  private static _UPDATE_ITEM_POSITIONS(path: string[], itemToMove: { name: string; data: SassTreeItemDataRaw }, direction: 'up' | 'down') {
    let level = 0;
    let canChangePos = false;
    path.reduce((lastReturnValue, currentKey) => {
      level++;
      if (level === path.length) {
        for (const key in lastReturnValue[currentKey].children) {
          if (lastReturnValue[currentKey].children.hasOwnProperty(key)) {
            const currentItemDataRef = lastReturnValue[currentKey].children[key].data;
            if (!(key === itemToMove.name)) {
              if (direction === 'up' && itemToMove.data.position - 1 === currentItemDataRef.position) {
                canChangePos = true;
                lastReturnValue[currentKey].children[key].data.position = currentItemDataRef.position + 1;
              } else if (direction === 'down' && itemToMove.data.position + 1 === currentItemDataRef.position) {
                canChangePos = true;
                lastReturnValue[currentKey].children[key].data.position = currentItemDataRef.position - 1;
              }
            }
          }
        }
        if (canChangePos) {
          lastReturnValue[currentKey].children[itemToMove.name].data.position =
            direction === 'up'
              ? lastReturnValue[currentKey].children[itemToMove.name].data.position - 1
              : lastReturnValue[currentKey].children[itemToMove.name].data.position + 1;
        }
        return lastReturnValue;
      } else {
        return lastReturnValue[currentKey].children;
      }
    }, this._DATA);
    return canChangePos;
  }

  private static _DELETE_DATA(path: string[], _DATA: TreeData) {
    let level = 0;
    let deletedData: TreeData['any'] = undefined;
    path.reduce((lastReturnValue, currentKey) => {
      level++;
      if (level === path.length) {
        deletedData = lastReturnValue[currentKey];
        delete lastReturnValue[currentKey];
        return;
      } else {
        return lastReturnValue[currentKey].children;
      }
    }, _DATA);
    return deletedData;
  }
  private static _WRITE_DATA_TO_FILES(single?: { location: FileLocation; baseName: string }) {
    if (single !== undefined) {
      writeFile(single.location.path, JSON.stringify(this._DATA[single.baseName].children), err => {
        throw err;
      });
    } else {
      for (const key in this._FILE_LOCATIONS) {
        if (this._FILE_LOCATIONS.hasOwnProperty(key)) {
          const location = this._FILE_LOCATIONS[key];
          writeFile(location.path, JSON.stringify(this._DATA[key].children), err => {
            throw err;
          });
        }
      }
    }
  }
  private static _DOES_PATH_EXIST(path: string[]) {
    let tempData: TreeData = null;
    let exists = true;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (tempData === null) {
        if (this._DOES_KEY_EXIST(this._DATA, key)) {
          tempData = this._DATA[key].children;
        } else {
          exists = false;
          tempData = {};
          break;
        }
      } else {
        if (this._DOES_KEY_EXIST(tempData, key)) {
          tempData = tempData[key].children;
        } else {
          exists = false;
          tempData = {};
          break;
        }
      }
    }
    return { data: tempData, exists };
  }
  private static _DOES_KEY_EXIST(data: any, key: string) {
    if (data === undefined || data[key] === undefined) {
      return false;
    }
    return true;
  }
  private static _CREATE_PATH(key: string, path?: string[]): string[] {
    if (path !== undefined) {
      return path.concat(key);
    } else {
      return [key];
    }
  }
}
