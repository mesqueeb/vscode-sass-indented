import { Configuration } from 'webpack';
import { resolve } from 'path';
// const WebpackBundleAnalyzer = require('webpack-bundle-analyzer');

export const config = ({
  entry,
  custom,
}: {
  entry: { [key: string]: string };
  custom?: Configuration;
}): Configuration => {
  return {
    target: 'node',
    entry,
    cache: true,
    output: {
      path: resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    // plugins: [new WebpackBundleAnalyzer.BundleAnalyzerPlugin()],
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
      ],
    },
    ...custom,
  };
};
