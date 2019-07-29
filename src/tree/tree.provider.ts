import { TreeDataProvider, EventEmitter, Event, ExtensionContext, TreeItem, TreeItemCollapsibleState as ColState } from 'vscode';
import { SassTreeItem, SassTreeItemData } from './tree.item';
import { TreeUtility } from './tree.utility';

export class TreeSnippetProvider implements TreeDataProvider<SassTreeItem> {
  private _onDidChangeTreeData: EventEmitter<SassTreeItem | undefined> = new EventEmitter<SassTreeItem | undefined>();
  readonly onDidChangeTreeData: Event<SassTreeItem | undefined> = this._onDidChangeTreeData.event;
  private ReadFromFiles = true;
  context: ExtensionContext;
  constructor(context: ExtensionContext) {
    this.context = context;
  }

  refresh(force?: boolean): void {
    if (force) {
      this.ReadFromFiles = true;
    }
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SassTreeItem): TreeItem {
    return element;
  }

  getChildren(element?: SassTreeItem): Thenable<SassTreeItem[]> {
    if (element) {
      return Promise.resolve(TreeUtility.getItems(TreeUtility.getData(element.data.path), element.data.path));
    } else {
      if (this.ReadFromFiles) {
        this.ReadFromFiles = false;
        return Promise.resolve(TreeUtility.getItems(TreeUtility.getLocalSassSnippets()));
      } else {
        return Promise.resolve(TreeUtility.getItems(TreeUtility.getData()));
      }
    }
  }
}
