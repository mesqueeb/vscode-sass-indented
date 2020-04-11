import { config } from '../webpack.config';

module.exports = config({
  entry: {
    extension: './src/extension.ts',
  },
  custom: {
    externals: {
      vscode: 'commonjs vscode',
    },
  },
});
