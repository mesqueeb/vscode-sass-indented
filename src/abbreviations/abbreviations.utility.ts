export const abbreviationsUtility = {
  getTabs(chars: number) {
    let tabs = '';
    for (let i = 0; i < chars; i++) {
      tabs = tabs.concat(' ');
    }
    return tabs;
  },

  propRegex(firstLetter: string, secondary?: string, tertiary?: string) {
    let additional = '';
    if (secondary !== undefined) {
      additional = additional.concat(`[${secondary}]?`);
    }
    if (tertiary !== undefined) {
      additional = additional.concat(`[${tertiary}]?`);
    }
    return new RegExp(`^ ?${firstLetter}{1}${additional}`);
  }
};
