import { SnippetString, window, workspace, WorkspaceEdit, TextDocument, Position, Range } from 'vscode';
import { getDistance } from '../utility/utility';
import { generateSnippetText } from './abbreviations.getSnippetText';
import { getCharInfo } from './abbreviations.info';
import { charCompletion as CharComp } from './abbreviations.charCompletion';
import { abbreviationsUtility as Utility } from './abbreviations.utility';

export function Abbreviations(document: TextDocument, start: Position, currentWord: string) {
  const inputBox = window.createInputBox();
  inputBox.title = 'SASS Abbreviations';
  // inputBox.ignoreFocusOut = true;
  inputBox.show();
  console.log('SASS Abbreviations');
  const initialEmptySpace = Utility.getTabs(getDistance(currentWord));
  let previousText = initialEmptySpace.concat('?');
  let endLine = start.line;
  inputBox.onDidChangeValue(value => {
    let commands = value.split(',');
    inputBox.prompt = getCharInfo(commands[commands.length - 1][0]);
    let tabs = initialEmptySpace;

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
          command = command.replace(Utility.propRegex('a', 'lcsi'), CharComp.getA(secondKey));
          break;
        case 'b':
          command = command.replace(Utility.propRegex('b', 'lrtbgvdbszu'), CharComp.getB(secondKey, 'border'));
          break;
        case 'c':
          command = command.replace(Utility.propRegex('c', 'lostirc'), CharComp.getC(secondKey));
          break;
        case 'd':
          command = command.replace(Utility.propRegex('d', 'r'), CharComp.getD(secondKey));
          break;
        case 'e':
          command = command.replace(Utility.propRegex('e'), 'empty-cells:');
          break;
        case 'f':
          command = command.replace(Utility.propRegex('f', 'fl'), 'empty-cells:');
          break;
        case 'F':
          command = command.replace(Utility.propRegex('F', 'brcdghioseu'), CharComp.getFilter(secondKey));
          break;
        case 'm':
          command = command.replace(Utility.directionalPropRegex('m'), CharComp.appendDirection(secondKey, 'margin'));
          break;
        case 'p':
          command = command.replace(Utility.directionalPropRegex('p'), CharComp.appendDirection(secondKey, 'padding'));
          break;

        case 'z':
          command = command.replace(Utility.propRegex('z'), 'z-index:');
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
    }
    const edit = new WorkspaceEdit();

    edit.replace(document.uri, new Range(start, new Position(endLine, previousText.length)), '');
    workspace.applyEdit(edit).then(() => window.activeTextEditor.insertSnippet(new SnippetString(previousText), start));
  });
  inputBox.onDidHide(() => {
    inputBox.dispose();
    const edit = new WorkspaceEdit();
    edit.replace(document.uri, new Range(start, new Position(endLine, previousText.length)), '');
    workspace.applyEdit(edit);
  });
}
