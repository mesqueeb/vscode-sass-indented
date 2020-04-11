import { config } from '../webpack.config';

module.exports = config({
  entry: {
    server: './src/server.ts',
  },
});
