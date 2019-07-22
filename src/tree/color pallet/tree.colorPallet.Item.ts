import { TreeItem, TreeItemCollapsibleState, Command } from 'vscode';
import { join } from 'path';
import { ColorPalletFolder } from './tree.colorPallet.utility';

export class PalletItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly color: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly isFolder: boolean,
    public readonly data?: ColorPalletFolder,
    public readonly parentFolder?: string,
    public readonly command?: Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return this.isFolder ? this.label : `${this.label}-${this.color}`;
  }

  get description(): string {
    return this.color;
  }

  iconPath = this.isFolder
    ? {
        light: join(__filename, '..', '..', '..', '..', 'resources', 'light', 'folder.svg'),
        dark: join(__filename, '..', '..', '..', '..', 'resources', 'dark', 'folder.svg')
      }
    : null;
  get contextValue(): string {
    return this.isFolder ? 'folder' : 'item';
  }
}
