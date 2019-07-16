import { CompletionItem, TextDocument, CompletionItemKind } from 'vscode';
import { readdirSync, statSync } from 'fs';
import { join, normalize, basename } from 'path';

export function scanImports(document: TextDocument, currentWord: string): CompletionItem[] {
  const suggestions: CompletionItem[] = [];
  const path = normalize(join(document.fileName, '../', currentWord.replace('@import', '').trim()));

  const dir = readdirSync(path);
  for (const file of dir) {
    if (/.sass$/.test(file) && file !== basename(document.fileName)) {
      const rep = file.replace('.sass', '');
      const item = new CompletionItem(rep);
      item.insertText = rep;
      item.detail = `Import - ${rep}`;
      item.kind = CompletionItemKind.Reference;
      suggestions.push(item);
    } else if (statSync(path + '/' + file).isDirectory()) {
      const item = new CompletionItem(file);
      item.insertText = file;
      item.detail = `Folder - ${file}`;
      item.kind = CompletionItemKind.Folder;
      suggestions.push(item);
    }
  }
  return suggestions;
}
