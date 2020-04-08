import { BasicRawCompletion } from '../autocomplete.interfaces';
import { CompletionItem, SnippetString, CompletionItemKind } from 'vscode';

const CommentsArray: BasicRawCompletion[] = [
  { name: '/Reset Tabs', body: '//R', desc: '' },
  { name: '/Ignore Next line', body: '//I', desc: '' },
  {
    name: '*/Import Css Variables',
    body: '/import css-variables from $1',
    desc:
      'Import Css variables from, this will import all css variables from the given file,variable scopes are currently not supported.',
  },
  { name: '/Space', body: '//S', desc: '' },
];
export const sassCommentCompletions = () => {
  const comments: CompletionItem[] = CommentsArray.map((item) => {
    const completionItem = new CompletionItem(item.name);
    completionItem.insertText = new SnippetString(`${item.body}\n$0`);
    completionItem.detail = item.desc;
    completionItem.kind = CompletionItemKind.Property;

    return completionItem;
  });
  return comments;
};
