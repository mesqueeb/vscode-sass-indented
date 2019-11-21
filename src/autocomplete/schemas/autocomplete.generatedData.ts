import { CompletionItem, CompletionItemKind } from 'vscode';
import { GetPropertyDescription } from '../../utilityFunctions';
export const dataProps = require('./generatedData/autocomplete.data.dataProps.json');
export const generatedData: CompletionItem[] = mapProps();

function mapProps(): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (const key in dataProps) {
    if (dataProps.hasOwnProperty(key)) {
      const prop = dataProps[key];
      const item = new CompletionItem(key, CompletionItemKind.Property);
      item.insertText = key.concat(': ');
      item.tags = prop.status === 'obsolete' ? [1] : [];
      item.documentation = GetPropertyDescription(key, prop);
      items.push(item);
    }
  }
  return items;
}
