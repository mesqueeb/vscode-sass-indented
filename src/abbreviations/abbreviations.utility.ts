export const abbreviationsUtility = {
  getTabs(chars: number) {
    let tabs = '';
    for (let i = 0; i < chars; i++) {
      tabs = tabs.concat(' ');
    }
    return tabs;
  },

  directionalPropRegex(firstLetter: string) {
    return new RegExp(`^ ?${firstLetter}{1}[lrtb]?`);
  },
  propRegex(firstLetter: string, secondary?: string) {
    let additional = '';
    if (secondary !== undefined) {
      additional = `[${secondary}]?`;
    }
    return new RegExp(`^ ?${firstLetter}{1}${additional}`);
  }
};
