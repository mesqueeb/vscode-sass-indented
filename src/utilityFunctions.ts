import { BasicRawCompletion } from './autocomplete/autocomplete.interfaces';
import { MarkdownString } from 'vscode';

export function GetPropertyDescription(name: string, prop: BasicRawCompletion, asString?: boolean) {
  const desc =
    (prop.desc
      ? `${getPropStatus(prop.status)}${prop.desc}${prop.mdn_url ? `\n\n[MDN](${prop.mdn_url})` : ''}`
      : getPropStatus(prop.status)) +
    `\n\n${GoogleLink(name)}\n\n` +
    ConvertPropertyValues(prop.values);
  if (asString) {
    return desc;
  }
  return new MarkdownString(desc);
}

function ConvertPropertyValues(values: BasicRawCompletion['values']) {
  if (values === undefined) {
    return '';
  }

  let text = '**Values**';
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    text = text.concat(
      '\n* ',
      value.name !== undefined ? '**`' + value.name + '`**' : '',
      value.desc !== undefined ? ' *' + value.desc + '*' : ''
    );
  }
  return text;
}

function getPropStatus(status?: string) {
  switch (status) {
    case 'standard':
      return '';
    case 'nonstandard':
      return '⚠️ **Attention** this Property is **`nonStandard`**.\n\n';
    case 'experimental':
      return '⚠️ **Attention** this Property is **`Experimental`**.\n\n';
    case 'obsolete':
      return '⛔️ **Attention** this Property is **`Obsolete`**.\n\n';
    default:
      return 'No Status Data Available.\n\n';
  }
}
function GoogleLink(search: string) {
  return `[Google](https://www.google.com/search?q=css+${search})`;
}
