export function generateSnippetText(text: string): string {
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
          `${item} $\{${(pos++, pos)}:1px} $\{${(pos++, pos)}|solid,none,dotted,double,groove,ridge,inset,outset,hidden|} $\{${(pos++,
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
      case 'padding:':
      case 'padding-left:':
      case 'padding-right:':
      case 'padding-top:':
      case 'padding-bottom:':
        newArr.push(`${item} $\{${(pos++, pos)}:1px}`);
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
