import { BasicRawCompletion } from '../autocomplete.interfaces';
import { AutocompleteUtils as Utility } from '../autocomplete.utility';
import { CompletionItem, SnippetString, CompletionItemKind } from 'vscode';

const modules: { [key: string]: BasicRawCompletion[] } = require('./autocomplete.modules.json');

export function getSassModule(
  type: 'MATH' | 'COLOR' | 'STRING' | 'LIST' | 'MAP' | 'SELECTOR' | 'META',
  namespace: string
) {
  return modules[type].map((item) => {
    const completionItem = new CompletionItem(Utility.mergeNamespace(item.name, namespace));
    completionItem.insertText = new SnippetString(Utility.mergeNamespace(item.body, namespace));
    completionItem.detail = item.desc;
    completionItem.kind = CompletionItemKind.Function;
    return completionItem;
  });
}
