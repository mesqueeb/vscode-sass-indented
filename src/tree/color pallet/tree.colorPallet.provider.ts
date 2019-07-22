import { TreeDataProvider, TreeItemCollapsibleState, TreeItem, EventEmitter, Event, ExtensionContext } from 'vscode';

import { PalletItem } from './tree.colorPallet.Item';
import { ColorPalletUtility as Utility } from './tree.colorPallet.utility';

export class TreeColorPalletProvider implements TreeDataProvider<PalletItem> {
  private _onDidChangeTreeData: EventEmitter<PalletItem | undefined> = new EventEmitter<PalletItem | undefined>();
  readonly onDidChangeTreeData: Event<PalletItem | undefined> = this._onDidChangeTreeData.event;

  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PalletItem): TreeItem {
    return element;
  }

  getChildren(element?: PalletItem): Thenable<PalletItem[]> {
    if (element) {
      return Promise.resolve(Utility.getColors(element.data));
    } else {
      return Promise.resolve(Utility.getFolders(this.context));
    }
  }
}
