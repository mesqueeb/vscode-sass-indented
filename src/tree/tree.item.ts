import { TreeItemCollapsibleState as colState, TreeItem, Command, TreeItemCollapsibleState } from 'vscode';
import { join } from 'path';
import { SassTreeFolder } from './tree.utility';

export class SassTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly data: any,
    public readonly desc: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly isFolder: boolean,
    public readonly subFolder?: SassTreeFolder,
    public readonly parentFolder?: string,
    public readonly command?: Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return this.isFolder ? this.label : `${this.label}-${this.desc}`;
  }

  get description(): string {
    return this.desc;
  }

  iconPath = this.isFolder
    ? {
        light: join(__filename, '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: join(__filename, '..', '..', '..', 'resources', 'dark', 'folder.svg')
      }
    : null;
  get contextValue(): string {
    return this.isFolder ? 'folder' : 'item';
  }
}
