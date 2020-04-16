import { SassFile, SassASTOptions } from './utils';
import { StingKeyObj } from '../utils';
import { ASTParser } from './parse';

export class AbstractSyntaxTree {
  files: StingKeyObj<SassFile> = {};

  addFile(text: string, uri: string, options: SassASTOptions) {
    const file: SassFile = {
      body: new ASTParser(uri).parse(text, options),
    };
    console.log(JSON.stringify(file.body, null, 2));
    this.files[uri] = file;
  }
}
