import { BasicRawCompletion } from '../autocomplete.interfaces';
import { CompletionItem, SnippetString, CompletionItemKind } from 'vscode';

const CommentsArray: BasicRawCompletion[] = [{ name: '/Reset Tabs', body: '//R', desc: '' }, { name: '/Space', body: '//S', desc: '' }];
export const sassCommentCompletions = () => {
  const comments: CompletionItem[] = CommentsArray.map(item => {
    const completionItem = new CompletionItem(item.name);
    completionItem.insertText = new SnippetString(`${item.body}\n$0`);
    completionItem.detail = `${item.desc}\n ${item.browsers ? 'Browser Support: ' + item.browsers : ''}`;
    completionItem.kind = CompletionItemKind.Property;

    return completionItem;
  });
  return comments;
};
