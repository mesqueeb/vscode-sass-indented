import { CompletionItem, SnippetString, CompletionItemKind, window, workspace, WorkspaceEdit, TextDocument, Position, Range } from 'vscode';
export function Abbreviations(document: TextDocument, start: Position) {
  const inputBox = window.createInputBox();
  inputBox.title = 'SASS Abbreviations';
  inputBox.ignoreFocusOut = true;
  inputBox.show();

  let previousText = '?';
  let endLine = start.line;
  inputBox.onDidChangeValue(value => {
    let commands = value.split(',');
    inputBox.prompt = getSuggestions(commands[commands.length - 1][0]);
    let tabs = '';

    for (let i = 0; i < commands.length; i++) {
      let command = commands[i];
      let key = command[0];
      let secondKey = command[1];
      let addTab = false;
      let resetTab = false;
      if (command.startsWith(' ')) {
        key = command[1];
        secondKey = command[2];
      }
      switch (key) {
        // SECTION Special.
        case 'M':
          addTab = true;
          command = command.replace(/^ ?M{1}/, '@mixin');
          break;
        case '#':
          addTab = true;
          break;
        case '.':
          addTab = true;
          break;
        case 'I':
          command = command.replace(/^ ?I{1}/, '');
          command = '@include'.concat(command);
          break;
        case 'R':
          resetTab = true;
          command = command.replace(/^ ?R{1}$/, '');
          break;
        // - !SECTION
        // SECTION properties
        case 'a':
          command = command.replace(propRegex('a', 'lcsi'), getA(secondKey));
          break;
        case 'b':
          command = command.replace(propRegex('b', 'lrtbgvdbszu'), getB(secondKey, 'border'));
          break;
        case 'c':
          command = command.replace(propRegex('c', 'lostirc'), getC(secondKey));
          break;
        case 'd':
          command = command.replace(propRegex('d', 'r'), getD(secondKey));
          break;
        case 'e':
          command = command.replace(propRegex('e'), 'empty-cells:');
          break;
        case 'f':
          command = command.replace(propRegex('f', 'fl'), 'empty-cells:');
          break;
        case 'F':
          command = command.replace(propRegex('F', 'brcdghioseu'), getFilter(secondKey));
          break;
        case 'm':
          command = command.replace(directionalPropRegex('m'), getDirections(secondKey, 'margin'));
          break;
        case 'p':
          command = command.replace(directionalPropRegex('p'), getDirections(secondKey, 'padding'));
          break;

        case 'z':
          command = command.replace(propRegex('z'), 'z-index:');
          break;
        // - !SECTION
      }

      command = tabs.concat(command);
      commands[i] = command;

      if (resetTab) {
        tabs = '';
      }

      if (addTab) {
        tabs = tabs.concat('\t');
      }
    }

    const insertText = commands.join('\n');
    const edit = new WorkspaceEdit();
    edit.replace(document.uri, new Range(start, new Position(endLine, previousText.length)), insertText);
    workspace.applyEdit(edit);
    endLine = start.line + commands.length - 1;
    previousText = insertText;
  });
  inputBox.onDidAccept(() => {
    inputBox.dispose();

    if (previousText === '?') {
      previousText = '';
    } else {
      previousText = generateSnippetText(previousText);
      console.log(previousText, 'TEXT');
    }
    const edit = new WorkspaceEdit();
    edit.replace(document.uri, new Range(start, new Position(endLine, previousText.length)), '');
    workspace.applyEdit(edit).then(a => {
      window.activeTextEditor.insertSnippet(new SnippetString(previousText), start);
    });
  });
  inputBox.onDidHide(() => {
    inputBox.dispose();
    const edit = new WorkspaceEdit();
    edit.replace(document.uri, new Range(start, new Position(endLine, previousText.length)), '');
    workspace.applyEdit(edit);
  });
}
function generateSnippetText(text: string): string {
  const arr = text.split('\n');
  const newArr = [];
  let pos = 1;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    switch (item.trim()) {
      case 'animation:':
        newArr.push(
          `${item} $\{${(pos++, pos)}:name} $\{${(pos++, pos)}:250ms} $\{${(pos++,
          pos)}|linear,ease,ease-in,ease-out,ease-in-out,step-start,step-end,steps(),cubic-bezier(),initial,inherit|} $\{${(pos++,
          pos)}:delay} $\{${(pos++, pos)}:iteration-count} $\{${(pos++, pos)}:direction} $\{${(pos++, pos)}:fill-mode} $\{${(pos++,
          pos)}:play-state}`
        );
        break;
      case 'all:':
        newArr.push(`${item} $\{${(pos++, pos)}|initial,inherit,unset|}`);
        break;
      case 'align-self:':
        newArr.push(`${item} $\{${(pos++, pos)}|auto,stretch,center,flex-start,flex-end,baseline,initial,inherit|}`);
        break;
      case 'align-content:':
        newArr.push(`${item} $\{${(pos++, pos)}|stretch,center,flex-start,flex-end,space-between,space-around,initial,inherit|}`);
        break;
      case 'align-items:':
        newArr.push(`${item} $\{${(pos++, pos)}|stretch,center,flex-start,flex-end,baseline,initial,inherit,}`);
        break;
      case 'border:':
      case 'border-left:':
      case 'border-right:':
      case 'border-top:':
      case 'border-bottom:':
        newArr.push(
          `${item} $\{${(pos++, pos)}: 1px} $\{${(pos++, pos)}|solid,none,dotted,double,groove,ridge,inset,outset,hidden|} $\{${(pos++,
          pos)}: red}`
        );
        break;

      case 'box-shadow:':
        newArr.push(
          `${item} $\{${(pos++, pos)}:h-offset} $\{${(pos++, pos)}:v-offset} $\{${(pos++, pos)}:blur} $\{${(pos++,
          pos)}:spread} $\{${(pos++, pos)}:color}`
        );
        break;
      case 'box-sizing:':
        newArr.push(`${item} $\{${(pos++, pos)}|content-box,border-box,initial,inherit|}`);
        break;
      case 'cursor:':
        newArr.push(
          `${item} $\{${(pos++,
          pos)}|pointer,none,default,auto,text,vertical-text,no-drop,alias,URL,all-scroll,cell,context-menu,col-resize,copy,crosshair,grab,grabbing,help,move,e-resize,ew-resize,n-resize,ne-resize,nesw-resize,ns-resize,nw-resize,nwse-resize,not-allowed,progress,row-resize,s-resize,se-resize,w-resize,wait,zoom-in,zoom-out,initial,inherit|}`
        );
        break;
      case 'column-':
        newArr.push(`${item}$\{${(pos++, pos)}|fill: ,gap: ,rule: ,rule-color: ,rule-style: ,rule-width: ,span: ,width: |}`);
        break;
      case 'columns:':
        newArr.push(`${item} $\{${(pos++, pos)}|auto,10px|} $\{${(pos++, pos)}:column-count}`);
        break;
      case 'display:':
        newArr.push(
          `${item} $\{${(pos++,
          pos)}|flex,none,block,inline,inline-block,grid,inline-flex,inline-grid,inline-table,list-item,run-in,table,initial,inherit,contents,table-caption,table-column-group,table-header-group,table-footer-group,table-row-group,table-cell,table-column,table-row|}`
        );
        break;
      case 'direction:':
        newArr.push(`${item} $\{${(pos++, pos)}|ltr,rtl|}`);
        break;
      case 'empty-cells:':
        newArr.push(`${item} $\{${(pos++, pos)}|show,hide|}`);
        break;
      case 'filter: blur()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:10px} )`);
        break;
      case 'filter: brightness()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:120%} )`);
        break;
      case 'filter: contrast()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:120%} )`);
        break;
      case 'filter: drop-shadow()':
        newArr.push(
          `${item.replace(')', '')} $\{${(pos++, pos)}:h-shadow} $\{${(pos++, pos)}:v-shadow} $\{${(pos++, pos)}:blur} $\{${(pos++,
          pos)}:spread} $\{${(pos++, pos)}:color} )`
        );
        break;
      case 'filter: grayscale()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:100%} )`);
        break;
      case 'filter: hue-rotate()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:180deg} )`);
        break;
      case 'filter: opacity()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:50%} )`);
        break;
      case 'filter: saturate()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:120%} )`);
        break;
      case 'filter: sepia()':
        newArr.push(`${item.replace(')', '')} $\{${(pos++, pos)}:50%} )`);
        break;
      case 'filter: url()':
        newArr.push(`${item.replace(')', '')} $${(pos++, pos)} )`);
        break;
      case 'margin:':
      case 'margin-left:':
      case 'margin-right:':
      case 'margin-top:':
      case 'margin-bottom:':
        newArr.push(`${item} $\{${(pos++, pos)}: 1px}`);
        break;
      case 'padding:':
      case 'padding-left:':
      case 'padding-right:':
      case 'padding-top:':
      case 'padding-bottom:':
        newArr.push(`${item} $\{${(pos++, pos)}: 1px}`);
        break;

      case 'z-index:':
      case 'background:':
      case 'clip:':
      case 'color:':
      case 'content:':
      case 'counter-increment:':
      case 'counter-reset:':
      case 'filter:':
      case 'box-decoration-break:':
      case 'backface-visibility:':
      case 'bottom':
        newArr.push(`${item} $${(pos++, pos)}`);
        break;
      default:
        newArr.push(item);
        break;
    }
  }
  return newArr.join('\n').concat('\n$0');
}
function getDirections(secondKey: string, base: string) {
  switch (secondKey) {
    case 'l':
      return `${base}-left:`;
    case 't':
      return `${base}-top:`;
    case 'r':
      return `${base}-right:`;
    case 'b':
      return `${base}-bottom:`;
    default:
      return `${base}:`;
  }
}
function getA(secondKey: string) {
  switch (secondKey) {
    case 'l':
      return `all:`;
    case 'c':
      return `align-content:`;
    case 's':
      return `align-self:`;
    case 'i':
      return `align-items:`;
    default:
      return `animation:`;
  }
}
function getB(secondKey: string, base: string) {
  switch (secondKey) {
    case 'l':
      return `${base}-left:`;
    case 't':
      return `${base}-top:`;
    case 'r':
      return `${base}-right:`;
    case 'b':
      return `${base}-bottom:`;
    case 'g':
      return `background:`;
    case 'u':
      return `bottom:`;
    case 's':
      return `box-shadow:`;
    case 'z':
      return `box-sizing:`;
    case 'd':
      return `box-decoration-break:`;
    case 'v':
      return `backface-visibility:`;
    default:
      return `${base}:`;
  }
}
function getC(secondKey: string) {
  switch (secondKey) {
    case 'l':
      return `clip:`;
    case 's':
      return `columns:`;
    case 'o':
      return `column-`;
    case 't':
      return `content:`;
    case 'i':
      return `counter-increment:`;
    case 'r':
      return `counter-reset:`;
    case 'c':
      return `cursor:`;
    default:
      return `color:`;
  }
}
function getD(secondKey: string) {
  switch (secondKey) {
    case 'r':
      return `direction:`;
    default:
      return `display:`;
  }
}
function getFilter(secondKey: string) {
  switch (secondKey) {
    case 'b':
      return `filter: blur()`;
    case 'r':
      return `filter: brightness()`;
    case 'c':
      return `filter: contrast()`;
    case 'd':
      return `filter: drop-shadow()`;
    case 'g':
      return `filter: grayscale()`;
    case 'h':
      return `filter: hue-rotate()`;
    case 'i':
      return `filter: invert()`;
    case 'o':
      return `filter: opacity()`;
    case 's':
      return `filter: saturate()`;
    case 'e':
      return `filter: sepia()`;
    case 'u':
      return `filter: url()`;
    default:
      return `filter:`;
  }
}
function directionalPropRegex(firstLetter: string) {
  return new RegExp(`^ ?${firstLetter}{1}[lrtb]?`);
}
function propRegex(firstLetter: string, secondary?: string) {
  let additional = '';
  if (secondary !== undefined) {
    additional = `[${secondary}]?`;
  }
  return new RegExp(`^ ?${firstLetter}{1}${additional}`);
}

function getSuggestions(char: string) {
  if (char === undefined) {
    return '';
  }
  switch (char) {
    case 'a':
      return '(l = all, c = align-content, s = align-self, i = align-items)';
    case 'b':
      return `(g = background, u = bottom, s = box-shadow, z = box-sizing, ${directionSuggestions(
        'border'
      )}, d = box-decoration-break, f = backface-visibility)`;
    case 'c':
      return '(l = clip, o = column-, s = columns, t = content, c = cursor, i = counter-increment, r = counter-reset)';
    case 'd':
      return '(r = direction)';
    case 'F':
      return '(b = blur, r = brightness, c = contrast, d = drop-shadow, g = grayscale, h = hue-rotate, i = invert, o = opacity, s = saturate, e = sepia, u = url';
    default:
      return '';
  }
}
function directionSuggestions(base: string) {
  return `l = ${base}-left, t = ${base}-top, r = ${base}-right, b = ${base}-bottom`;
}
