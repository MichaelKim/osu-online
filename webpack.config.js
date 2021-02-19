/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const config = {
  entry: {
    main: './src/index.tsx'
  },
  output: {
    path: path.resolve('./build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: '>1%, not ie 11, not op_mini all'
                }
              ],
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            plugins: ['@babel/plugin-proposal-class-properties', 'const-enum']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./src/index.html')
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'public' }]
    }),
    new ESLintPlugin({
      extensions: ['js', 'ts', 'tsx']
    })
  ],
  stats: {
    colors: true
  }
};

module.exports = async (env, argv) => {
  if (argv.mode === 'production') {
    config.mode = 'production';
    // Basic options, except ignore console statements
    config.optimization = {
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: {
              drop_console: true
            }
          }
        })
      ]
    };
    config.plugins.push(new CleanWebpackPlugin());
  } else {
    config.mode = 'development';
    config.devtool = 'cheap-module-source-map';
    config.devServer = {
      contentBase: path.resolve('./build'),
      host: 'localhost',
      port: '8080',
      hot: true,
      overlay: true
    };
  }

  return config;
};
